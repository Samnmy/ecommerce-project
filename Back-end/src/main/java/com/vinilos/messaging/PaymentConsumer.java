package com.vinilos.messaging;

import com.vinilos.config.RabbitMQConfig;
import com.vinilos.entity.PaymentOrder;
import com.vinilos.entity.PaymentStatus;
import com.vinilos.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Random;

/**
 * Consumidor de mensajes RabbitMQ — Procesador de pagos simulado.
 *
 * Este componente simula el comportamiento de una pasarela de pago real
 * (Stripe, PayPal, Redeban, etc.) procesando pagos de forma asíncrona.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │                   LÓGICA DE SIMULACIÓN                               │
 * │                                                                      │
 * │  Tarjeta termina en "0000"  → SIEMPRE falla (fondos insuficientes)   │
 * │  Tarjeta termina en "9999"  → SIEMPRE falla (tarjeta bloqueada)      │
 * │  Tarjeta termina en "1111"  → Falla aleatoria (20% de probabilidad)  │
 * │  Cualquier otro número      → SIEMPRE aprobado                       │
 * │                                                                      │
 * │  PSE / NEQUI                → SIEMPRE aprobado (sin validación)      │
 * │                                                                      │
 * │  Delay simulado: 2-4 segundos (como una red bancaria real)           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Tarjetas de prueba:
 *   4242 4242 4242 4242 → Aprobada ✅
 *   4000 0000 0000 0000 → Rechazada (fondos insuficientes) ❌
 *   4111 1111 1111 1111 → Resultado aleatorio (~20% fallo) ⚠️
 *   4000 0000 0000 9999 → Rechazada (tarjeta bloqueada) ❌
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentConsumer {

    private final PaymentRepository paymentRepository;
    private final PaymentProducer paymentProducer;
    private final Random random = new Random();

    /**
     * Escucha la cola payment.requests y procesa cada pago recibido.
     * El método es invocado automáticamente por Spring AMQP cuando
     * llega un mensaje en la cola.
     *
     * @param message Datos del pago enviados por PaymentProducer
     */
    @RabbitListener(queues = RabbitMQConfig.PAYMENT_REQUEST_QUEUE)
    public void processPayment(@Payload PaymentMessage message) {
        log.info("[RabbitMQ Consumer] ⬇️  Recibido pago de cola | TransactionId: {} | Orden: #{} | Monto: ${}",
                message.getTransactionId(),
                message.getOrderId(),
                message.getAmount());

        // 1. Simular latencia de red bancaria (2-4 segundos)
        simulateProcessingDelay();

        // 2. Determinar el resultado del pago según reglas de simulación
        PaymentResult result = evaluatePayment(message);

        // 3. Actualizar el estado en la base de datos
        updatePaymentStatus(message.getPaymentOrderId(), result);

        // 4. Publicar resultado en la cola de auditoría
        paymentProducer.sendPaymentResult(message);

        log.info("[RabbitMQ Consumer] ✅ Pago procesado | TransactionId: {} | Resultado: {}",
                message.getTransactionId(), result.status);
    }

    // ─── Lógica de simulación de aprobación/rechazo ──────────────

    private PaymentResult evaluatePayment(PaymentMessage message) {
        String method = message.getPaymentMethod();
        String lastFour = message.getCardLastFour();

        // PSE y Nequi siempre se aprueban en la simulación
        if ("PSE".equals(method) || "NEQUI".equals(method)) {
            return new PaymentResult(PaymentStatus.APPROVED,
                    "Pago por " + method + " procesado exitosamente");
        }

        // Lógica de tarjeta basada en últimos 4 dígitos
        if (lastFour == null) lastFour = "4242";

        return switch (lastFour) {
            case "0000" -> new PaymentResult(PaymentStatus.FAILED,
                    "Fondos insuficientes. Verifica tu saldo e intenta de nuevo.");
            case "9999" -> new PaymentResult(PaymentStatus.FAILED,
                    "Tarjeta bloqueada. Contacta a tu entidad bancaria.");
            case "1111" -> {
                // 20% de probabilidad de fallo
                if (random.nextInt(100) < 20) {
                    yield new PaymentResult(PaymentStatus.FAILED,
                            "Error temporal del banco. Intenta de nuevo.");
                }
                yield new PaymentResult(PaymentStatus.APPROVED,
                        "Pago aprobado exitosamente.");
            }
            default -> new PaymentResult(PaymentStatus.APPROVED,
                    "Pago aprobado exitosamente. ¡Gracias por tu compra!");
        };
    }

    private void updatePaymentStatus(Long paymentOrderId, PaymentResult result) {
        paymentRepository.findById(paymentOrderId).ifPresent(payment -> {
            payment.setStatus(result.status);
            payment.setErrorMessage(result.status == PaymentStatus.FAILED ? result.message : null);
            payment.setProcessedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.debug("[RabbitMQ Consumer] DB actualizada → PaymentOrder #{}: {}", paymentOrderId, result.status);
        });
    }

    private void simulateProcessingDelay() {
        try {
            // Delay aleatorio entre 2 y 4 segundos
            long delay = 2000L + (long)(random.nextInt(2000));
            log.debug("[RabbitMQ Consumer] Simulando procesamiento bancario: {}ms", delay);
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[RabbitMQ Consumer] Procesamiento interrumpido");
        }
    }

    // ─── Record auxiliar para el resultado ───────────────────────

    private record PaymentResult(PaymentStatus status, String message) {}
}
