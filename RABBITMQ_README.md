# 🐇 RabbitMQ en Vinilos Store — Guía Completa

> Documentación completa sobre cómo se integra RabbitMQ en la pasarela de pago simulada del ecommerce de vinilos musicales.

---

## 📌 ¿Qué es RabbitMQ?

**RabbitMQ** es un **message broker** de código abierto basado en el protocolo **AMQP (Advanced Message Queuing Protocol)**. Actúa como intermediario entre aplicaciones, permitiendo que los sistemas se comuniquen de forma **asíncrona y desacoplada**.

### Analogía Simple

Imagina RabbitMQ como el sistema de correo interno de un banco:

```
Cliente (tú)         →  Deposita carta en el buzón     →  Recepcionista la procesa
Frontend React       →  Publica mensaje en la cola     →  Backend Consumer lo procesa
```

### ¿Por qué es importante en eCommerce?

En sistemas de pago reales (Stripe, PayPal, Redeban), el procesamiento nunca es inmediato. Intervienen:
- Redes bancarias
- Sistemas antifraude
- Verificaciones de saldo
- Autorizaciones internacionales

Todo esto puede tomar entre 1 y 30 segundos. **RabbitMQ permite que el usuario reciba una respuesta inmediata** ("procesando...") mientras el sistema trabaja en segundo plano, mejorando enormemente la experiencia de usuario.

---

## 🏗️ Arquitectura de Colas Implementada

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         VINILOS STORE — SISTEMA DE PAGOS                   │
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   Frontend   │                                                           │
│  │  React/Vite  │                                                           │
│  └──────┬───────┘                                                           │
│         │ 1. POST /api/payments/initiate                                    │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │             PaymentService (Spring Boot)              │                  │
│  │                                                       │                  │
│  │  - Crea PaymentOrder (status: PROCESSING) en BD      │                  │
│  │  - Genera UUID transactionId único                   │                  │
│  │  - Llama a PaymentProducer.sendPaymentRequest()      │                  │
│  └──────────────────────┬───────────────────────────────┘                  │
│                         │ 2. Publica mensaje JSON                           │
│                         ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │           payment.exchange (Direct Exchange)          │                  │
│  │                                                       │                  │
│  │  Routing Key: "payment.process"                      │                  │
│  └──────────────┬────────────────────────────────────────┘                  │
│                 │                                                            │
│                 ▼ Binding: payment.process                                  │
│  ┌──────────────────────────────────┐                                       │
│  │   📬 payment.requests (Queue)    │  ← Cola principal                    │
│  │                                  │                                       │
│  │  Características:                │                                       │
│  │  • Durable (sobrevive reinicios) │                                       │
│  │  • TTL: 5 minutos               │                                       │
│  │  • Dead Letter → payment.dlq    │                                       │
│  └──────────────┬───────────────────┘                                       │
│                 │ 3. @RabbitListener consume el mensaje                     │
│                 ▼                                                            │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │           PaymentConsumer (Spring Component)          │                  │
│  │                                                       │                  │
│  │  1. Recibe el PaymentMessage del queue               │                  │
│  │  2. Simula latencia bancaria (2-4 segundos)          │                  │
│  │  3. Aplica reglas de simulación (ver tabla abajo)    │                  │
│  │  4. Actualiza PaymentOrder en BD: APPROVED/FAILED    │                  │
│  │  5. Publica resultado en payment.results (auditoría) │                  │
│  └──────────────┬───────────────────────────────────────┘                  │
│                 │ 4. Publica en cola de resultados                          │
│                 ▼                                                            │
│  ┌──────────────────────────────────┐                                       │
│  │   📋 payment.results (Queue)     │  ← Cola de auditoría                 │
│  └──────────────────────────────────┘                                       │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │   🔄 Polling (Frontend cada 2 segundos)                            │    │
│  │                                                                    │    │
│  │   GET /api/payments/{transactionId}/status                         │    │
│  │       ↳ PROCESSING → sigue esperando                              │    │
│  │       ↳ APPROVED   → muestra éxito + confetti dorado             │    │
│  │       ↳ FAILED     → muestra error + opción de reintento         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌──────────────────────────────────┐                                       │
│  │   ☠️  payment.dlq (Dead Letter)  │  ← Mensajes que fallaron 3x         │
│  └──────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Conceptos Clave de RabbitMQ

### 1. Producer (Productor)
El componente que **crea y envía mensajes** al broker.

```java
// PaymentProducer.java
rabbitTemplate.convertAndSend(
    "payment.exchange",   // Exchange destino
    "payment.process",    // Routing key
    message               // Payload (serializado a JSON por Jackson)
);
```

### 2. Exchange (Intercambiador)
El exchange **recibe el mensaje del producer** y decide a qué cola(s) enviarlo basándose en el tipo y las routing keys.

| Tipo de Exchange | Comportamiento |
|------------------|----------------|
| **Direct**       | Envía al queue cuya binding key = routing key (lo que usamos) |
| **Fanout**       | Envía a TODOS los queues conectados (broadcast) |
| **Topic**        | Envía por patrones con wildcards (`*.process.#`) |
| **Headers**      | Envía por atributos del header del mensaje |

En este proyecto usamos **Direct Exchange** porque queremos enrutar exactamente al queue correcto.

### 3. Queue (Cola)
El **almacén de mensajes** donde esperan hasta ser consumidos.

```java
// RabbitMQConfig.java
QueueBuilder.durable("payment.requests")       // Persiste en disco
    .withArgument("x-dead-letter-exchange", "payment.dlx")  // DLQ config
    .withArgument("x-message-ttl", 300000)     // TTL: 5 minutos
    .build();
```

**Propiedades importantes:**
- `durable: true` → el queue sobrevive reinicios del broker
- `x-dead-letter-exchange` → dónde van los mensajes que no se pueden procesar
- `x-message-ttl` → tiempo máximo que un mensaje puede esperar en la cola

### 4. Consumer (Consumidor)
El componente que **escucha la cola y procesa mensajes**.

```java
// PaymentConsumer.java
@RabbitListener(queues = "payment.requests")
public void processPayment(@Payload PaymentMessage message) {
    // Spring AMQP invoca este método por cada mensaje recibido
    // El mensaje se elimina automáticamente de la cola al procesar
}
```

### 5. Binding (Enlace)
La **regla de enrutamiento** que conecta un exchange con una queue.

```
payment.exchange --[routing: payment.process]--> payment.requests (queue)
payment.exchange --[routing: payment.result]---> payment.results  (queue)
payment.dlx      --[routing: payment.dead]-----> payment.dlq      (queue)
```

### 6. Dead Letter Queue (DLQ)
Cola especial donde van los mensajes que **no pudieron ser procesados** (después de reintentos o si superan el TTL).

```
payment.requests → (falla 3 veces) → payment.dlq
```

Esto permite monitorear pagos que fallaron por errores del sistema (no por lógica de negocio).

### 7. Message Acknowledgement (ACK)
Por defecto con Spring AMQP, cuando el consumer procesa exitosamente el mensaje, se envía un **ACK automático** al broker para que elimine el mensaje de la cola. Si el consumer lanza una excepción, se envía un **NACK** y el mensaje puede ser re-encolado.

---

## 🚀 Arrancar RabbitMQ con Docker

### Opción 1: Docker (recomendado)

```bash
# Levantar RabbitMQ con Management UI en el puerto 15672
docker run -d \
  --name rabbitmq-vinilos \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Verificar que está corriendo
docker ps | grep rabbitmq
```

### Opción 2: Docker Compose (ya incluido en el proyecto)

```bash
# Desde la raíz del proyecto Back-end/
docker-compose up rabbitmq -d
```

### Acceder al Management UI

Una vez corriendo, accede en tu navegador a:

```
http://localhost:15672
Usuario:    guest
Contraseña: guest
```

Desde el **Management UI** puedes:
- 👀 Ver las colas en tiempo real
- 📊 Monitorear mensajes publicados/consumidos por segundo
- 📬 Ver mensajes pendientes en cada cola
- 🔍 Inspeccionar el contenido de mensajes individuales
- ⚙️ Crear/eliminar colas y exchanges manualmente

---

## ⚙️ Variables de Entorno

Añade estas variables a tu archivo `.env` del backend:

```env
# ─── RabbitMQ ─────────────────────────────────────────────────────────
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# ─── Configuración de simulación de pagos ─────────────────────────────
# Delay de procesamiento en ms (por defecto: 2500ms = 2.5 segundos)
PAYMENT_DELAY_MS=2500

# Porcentaje de fallo para tarjetas de resultado aleatorio (0-100)
PAYMENT_FAILURE_RATE=20
```

---

## 💳 Tarjetas de Prueba

| Número de Tarjeta         | Últimos 4 | Resultado          |
|---------------------------|-----------|--------------------|
| `4242 4242 4242 4242`     | `4242`    | ✅ Siempre aprobada |
| `4000 0000 0000 0000`     | `0000`    | ❌ Fondos insuficientes |
| `4000 0000 0000 9999`     | `9999`    | ❌ Tarjeta bloqueada |
| `4111 1111 1111 1111`     | `1111`    | ⚠️ ~20% de probabilidad de fallo |
| Cualquier otra Visa       | otro      | ✅ Siempre aprobada |
| PSE / Nequi               | N/A       | ✅ Siempre aprobados |

> **CVV/Fecha:** Cualquier valor válido funciona (el sistema solo valida formato).

---

## 🔄 Flujo Completo de un Pago — Paso a Paso

```
1. Usuario llena el carrito y hace clic en "Proceed to Checkout"
   └─ CartDrawer.tsx → setIsCheckoutOpen(true)

2. CheckoutModal se abre (Paso 1: Resumen)
   └─ El usuario revisa los items y llena la dirección de envío

3. El usuario hace clic en "Continuar al pago"
   └─ Se llama a POST /api/orders → se crea la Order en BD (status: PENDING)
   └─ Se avanza al Paso 2: Formulario de pago

4. El usuario selecciona método de pago y llena el formulario
   └─ La tarjeta se voltea en 3D cuando el usuario hace clic en el campo CVV
   └─ Se puede hacer clic en las tarjetas de prueba para autocompletar

5. El usuario hace clic en "Pagar $XX.XX"
   └─ Frontend llama a POST /api/payments/initiate

6. Backend: PaymentService.initiatePayment()
   └─ Valida que la orden pertenece al usuario
   └─ Extrae últimos 4 dígitos de la tarjeta
   └─ Genera un UUID como transactionId
   └─ Crea PaymentOrder en BD con status: PROCESSING
   └─ Llama a PaymentProducer.sendPaymentRequest(message)

7. RabbitMQ: PaymentProducer publica el mensaje
   └─ Exchange: payment.exchange
   └─ Routing Key: payment.process
   └─ Queue destino: payment.requests

8. El frontend recibe la respuesta HTTP 202 Accepted con el transactionId
   └─ Muestra el paso "Procesando..." con animación
   └─ Inicia el polling: llama a GET /payments/{transactionId}/status cada 2 segundos

9. RabbitMQ: PaymentConsumer recibe el mensaje de la cola
   └─ Simula latencia bancaria (Thread.sleep de 2-4 segundos)
   └─ Evalúa los últimos 4 dígitos de la tarjeta según reglas de simulación
   └─ Actualiza PaymentOrder en BD: status → APPROVED o FAILED
   └─ Publica resultado en payment.results (auditoría)

10. Frontend (polling) detecta status !== PROCESSING
    └─ Si APPROVED: muestra animación de confetti dorado + recibo
    └─ Si FAILED: muestra error con opción de reintentar
    └─ Si el pago fue APPROVED: clearCart() limpia el carrito local
```

---

## 📦 Estructura de Archivos Añadidos

### Backend

```
Back-end/src/main/java/com/vinilos/
├── config/
│   └── RabbitMQConfig.java         ← Declaración de colas, exchanges y bindings
├── entity/
│   ├── PaymentOrder.java           ← Entidad JPA del registro de pago
│   └── PaymentStatus.java          ← Enum: PROCESSING | APPROVED | FAILED | REFUNDED
├── repository/
│   └── PaymentRepository.java      ← Spring Data JPA repository
├── dto/
│   ├── request/
│   │   └── PaymentRequest.java     ← DTO de entrada del formulario de checkout
│   └── response/
│       └── PaymentResponse.java    ← DTO de respuesta (incluye transactionId para polling)
├── messaging/
│   ├── PaymentMessage.java         ← DTO serializable que viaja por RabbitMQ
│   ├── PaymentProducer.java        ← Publica mensajes en el exchange
│   └── PaymentConsumer.java        ← Escucha la cola y procesa pagos
├── service/
│   └── PaymentService.java         ← Orquesta el flujo: BD + RabbitMQ
└── controller/
    └── PaymentController.java      ← Endpoints REST de la pasarela
```

### Frontend

```
Front-end/app/src/
├── lib/
│   └── paymentApi.ts               ← Cliente axios con polling automático
├── components/
│   └── CheckoutModal.tsx           ← Modal completo: resumen + tarjeta 3D + resultado
└── hooks/
    └── useStore.tsx                ← + isCheckoutOpen / setIsCheckoutOpen
```

---

## 🔐 Endpoints de la API

| Método | Endpoint                          | Auth | Descripción                              |
|--------|-----------------------------------|------|------------------------------------------|
| POST   | `/api/payments/initiate`          | JWT  | Inicia el pago (publica en RabbitMQ)     |
| GET    | `/api/payments/{txId}/status`     | JWT  | Estado actual del pago (para polling)    |
| GET    | `/api/payments/my-payments`       | JWT  | Historial de pagos del usuario           |

### Ejemplo de uso con curl

```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@vinilosstore.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Iniciar pago
RESPONSE=$(curl -s -X POST http://localhost:8080/api/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "paymentMethod": "CARD",
    "cardNumber": "4242424242424242",
    "cardHolder": "Juan Perez",
    "expiryMonth": 12,
    "expiryYear": 2026,
    "cvv": "123"
  }')

TX_ID=$(echo $RESPONSE | jq -r '.data.transactionId')

# 3. Hacer polling hasta que el pago se resuelva
while true; do
  STATUS=$(curl -s "http://localhost:8080/api/payments/$TX_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    | jq -r '.data.status')
  echo "Estado: $STATUS"
  [ "$STATUS" != "PROCESSING" ] && break
  sleep 2
done
```

---

## 📊 Monitoreo en Management UI

Para ver el flujo de mensajes en tiempo real:

1. Abre http://localhost:15672
2. Ve a la pestaña **"Queues"**
3. Haz clic en **"payment.requests"**
4. En la sección **"Get messages"** puedes ver el contenido de los mensajes

Cada pago que se procese aparecerá momentáneamente en la cola y luego desaparecerá cuando el Consumer lo consuma.

---

## ❓ Preguntas Frecuentes

**¿Qué pasa si RabbitMQ no está corriendo cuando inicio el backend?**
> Spring Boot intentará conectarse al arrancar. Si falla, el backend no iniciará. Siempre inicia RabbitMQ primero con `docker run`.

**¿Los mensajes se pierden si el Consumer falla?**
> No. Las colas son `durable`, lo que significa que los mensajes persisten en disco. Cuando el Consumer vuelva a conectarse, los mensajes pendientes serán procesados.

**¿Qué pasa con un mensaje que falla repetidamente?**
> Tras 3 fallos, el mensaje se envía a la Dead Letter Queue (`payment.dlq`). Desde allí, un administrador puede investigar qué salió mal.

**¿Por qué usar polling en lugar de WebSockets?**
> El polling es más simple de implementar y suficiente para este caso de uso (resolución en ~3 segundos). En producción real, WebSockets o Server-Sent Events serían preferibles para mayor eficiencia.

**¿Puedo ver los mensajes JSON que viajan por RabbitMQ?**
> Sí. En el Management UI → Queues → payment.requests → "Get messages". Los mensajes se ven en formato JSON gracias al `Jackson2JsonMessageConverter`.

---

## 📚 Referencias

- [Documentación oficial RabbitMQ](https://www.rabbitmq.com/documentation.html)
- [Spring AMQP Reference](https://docs.spring.io/spring-amqp/docs/current/reference/html/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [AMQP 0-9-1 Protocol](https://www.rabbitmq.com/tutorials/amqp-concepts)

---

*Documentación generada para Vinilos Store — Sistema de pagos con RabbitMQ*
