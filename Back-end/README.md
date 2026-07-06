# 🎵 Vinilos Store — Backend API

Backend REST completo para una tienda online de vinilos musicales, desarrollado con **Spring Boot 3**, **Spring Security + JWT** y **MySQL**.

---

## 🛠️ Stack Tecnológico

| Tecnología              | Versión  | Uso                          |
|-------------------------|----------|------------------------------|
| Java                    | 17       | Lenguaje principal           |
| Spring Boot             | 3.2.4    | Framework base               |
| Spring Security         | 6.x      | Autenticación y autorización |
| Spring Data JPA         | 3.x      | ORM y acceso a datos         |
| MySQL                   | 8.0      | Base de datos relacional     |
| JWT (jjwt)              | 0.11.5   | Tokens de autenticación      |
| Lombok                  | Latest   | Reducción de boilerplate     |
| SpringDoc OpenAPI       | 2.4.0    | Documentación Swagger UI     |
| Docker + Compose        | Latest   | Contenedorización            |
| Maven                   | 3.9.6    | Gestión de dependencias      |

---

## 📁 Estructura del Proyecto

```
Back-end/
├── src/main/java/com/vinilos/
│   ├── VinilosStoreApplication.java     # Punto de entrada
│   ├── config/
│   │   ├── SecurityConfig.java          # Spring Security + JWT
│   │   ├── CorsConfig.java              # CORS para React frontend
│   │   └── OpenApiConfig.java           # Swagger UI
│   ├── security/
│   │   ├── JwtTokenProvider.java        # Generación/validación JWT
│   │   ├── JwtAuthenticationFilter.java # Filtro por petición
│   │   └── UserDetailsServiceImpl.java  # Carga usuario por email
│   ├── entity/                          # Entidades JPA
│   │   ├── User.java
│   │   ├── Role.java (enum)
│   │   ├── Product.java
│   │   ├── Cart.java / CartItem.java
│   │   ├── Order.java / OrderItem.java
│   │   └── OrderStatus.java (enum)
│   ├── dto/
│   │   ├── request/                     # DTOs de entrada
│   │   └── response/                    # DTOs de salida
│   ├── repository/                      # Interfaces JPA Repository
│   ├── service/                         # Lógica de negocio
│   │   ├── AuthService.java
│   │   ├── ProductService.java
│   │   ├── CartService.java
│   │   └── OrderService.java
│   ├── controller/                      # Endpoints REST
│   │   ├── AuthController.java
│   │   ├── ProductController.java
│   │   ├── CartController.java
│   │   └── OrderController.java
│   └── exception/                       # Manejo global de errores
│       ├── GlobalExceptionHandler.java
│       ├── ResourceNotFoundException.java
│       └── BadRequestException.java
├── src/main/resources/
│   ├── application.yml                  # Configuración principal
│   └── db/
│       ├── schema.sql                   # DDL de la base de datos
│       └── data.sql                     # Datos iniciales (seeds)
├── Dockerfile                           # Imagen Docker multi-stage
├── docker-compose.yml                   # Backend + MySQL
├── .env.example                         # Variables de entorno
└── pom.xml
```

---

## 🚀 Inicio Rápido

### Prerequisitos
- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- MySQL 8.0 (si ejecutas sin Docker)

### ▶️ Opción 1: Con Docker (recomendado)

```bash
# 1. Entrar al directorio del backend
cd Back-end

# 2. Crear el archivo de variables de entorno
copy .env.example .env
# Edita .env con tus valores

# 3. Levantar todos los servicios
docker-compose up --build -d

# 4. Ver logs
docker-compose logs -f backend

# 5. Detener servicios
docker-compose down
```

La API estará disponible en: **http://localhost:8080/api**

### ▶️ Opción 2: Local con Maven

```bash
# 1. Asegúrate de tener MySQL corriendo con la base de datos creada
# 2. Configura las variables en application.yml o crea un .env

# 3. Compilar
mvn clean install -DskipTests

# 4. Ejecutar
mvn spring-boot:run

# O directamente con el JAR:
java -jar target/vinilos-store-1.0.0.jar
```

---

## 📡 Endpoints de la API

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint           | Auth     | Descripción                     |
|--------|--------------------|----------|---------------------------------|
| POST   | `/auth/register`   | Pública  | Registrar nuevo usuario         |
| POST   | `/auth/login`      | Pública  | Iniciar sesión (obtener JWT)    |
| GET    | `/auth/profile`    | JWT      | Ver perfil del usuario actual   |
| GET    | `/admin/users`     | ADMIN    | Listar todos los usuarios       |

**Registro:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan García",
    "email": "juan@ejemplo.com",
    "password": "miPassword123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "miPassword123"
  }'
```
> Respuesta: `{ "token": "eyJhbGci...", "type": "Bearer", ... }`

---

### 🎵 Productos (`/api/products`)

| Método | Endpoint                  | Auth    | Descripción                        |
|--------|---------------------------|---------|------------------------------------|
| GET    | `/products`               | Pública | Listar vinilos (paginado)          |
| GET    | `/products/search?q=rock` | Pública | Buscar por nombre/artista/género   |
| GET    | `/products/genres`        | Pública | Géneros disponibles                |
| GET    | `/products/genre/{genre}` | Pública | Filtrar por género                 |
| GET    | `/products/{id}`          | Pública | Detalle de un vinilo               |
| POST   | `/products`               | ADMIN   | Crear vinilo                       |
| PUT    | `/products/{id}`          | ADMIN   | Actualizar vinilo                  |
| DELETE | `/products/{id}`          | ADMIN   | Desactivar vinilo (soft delete)    |

**Listar productos con paginación:**
```bash
curl "http://localhost:8080/api/products?page=0&size=12&sortBy=price&direction=asc"
```

**Buscar vinilos:**
```bash
curl "http://localhost:8080/api/products/search?q=pink+floyd"
```

**Crear producto (ADMIN):**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Abbey Road",
    "artist": "The Beatles",
    "genre": "Rock",
    "price": 29.99,
    "stock": 20,
    "releaseYear": 1969,
    "label": "Apple Records",
    "description": "El penúltimo álbum de estudio de The Beatles."
  }'
```

---

### 🛒 Carrito (`/api/cart`) — Requiere JWT

| Método | Endpoint                     | Descripción                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/cart`                      | Ver carrito actual                   |
| POST   | `/cart/items`                | Agregar ítem al carrito              |
| PUT    | `/cart/items/{productId}`    | Actualizar cantidad (0 = eliminar)   |
| DELETE | `/cart/items/{productId}`    | Eliminar ítem específico             |
| DELETE | `/cart`                      | Vaciar todo el carrito               |

**Agregar al carrito:**
```bash
curl -X POST http://localhost:8080/api/cart/items \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "productId": 1, "quantity": 2 }'
```

---

### 📦 Órdenes (`/api/orders`) — Requiere JWT

| Método | Endpoint                       | Auth  | Descripción                     |
|--------|--------------------------------|-------|---------------------------------|
| POST   | `/orders`                      | JWT   | Crear orden desde el carrito    |
| GET    | `/orders`                      | JWT   | Historial de mis órdenes        |
| GET    | `/orders/{id}`                 | JWT   | Detalle de una orden            |
| GET    | `/admin/orders`                | ADMIN | Todas las órdenes del sistema   |
| PUT    | `/admin/orders/{id}/status`    | ADMIN | Cambiar estado de orden         |

**Crear orden:**
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "shippingAddress": "Calle 123, Ciudad, País" }'
```

**Estados de orden:** `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` / `CANCELLED`

---

## 📚 Documentación Swagger UI

Con la aplicación corriendo, accede a:
```
http://localhost:8080/api/swagger-ui.html
```

Allí puedes probar todos los endpoints interactivamente.

---

## 👤 Credenciales de Prueba

| Rol   | Email                       | Password   |
|-------|-----------------------------|------------|
| ADMIN | `admin@vinilosstore.com`    | `password` |
| USER  | `user@vinilosstore.com`     | `password` |

> ⚠️ **Cambiar en producción.** La contraseña `password` está hasheada con BCrypt en `data.sql`.

---

## ☁️ Despliegue en AWS

### Opción A: AWS Elastic Beanstalk (recomendado)

```bash
# 1. Instalar AWS CLI y EB CLI
pip install awsebcli

# 2. Inicializar Elastic Beanstalk
eb init vinilos-store --region us-east-1 --platform java-17

# 3. Crear entorno con RDS
eb create vinilos-prod \
  --database.engine mysql \
  --database.version 8.0 \
  --database.instance db.t3.micro

# 4. Configurar variables de entorno en la consola AWS o con:
eb setenv \
  DB_HOST=<RDS_ENDPOINT> \
  DB_NAME=vinilos_db \
  DB_USER=admin \
  DB_PASSWORD=<RDS_PASSWORD> \
  JWT_SECRET=<SECRET_LARGO_Y_SEGURO> \
  CORS_ORIGINS=https://tu-frontend.com

# 5. Desplegar
mvn clean package -DskipTests
eb deploy
```

### Opción B: AWS EC2 + Docker

```bash
# En la instancia EC2 (Ubuntu 22.04):
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Clonar el repositorio
git clone <tu-repo> /opt/vinilos-store
cd /opt/vinilos-store/Back-end

# Configurar variables
cp .env.example .env
nano .env  # Ajustar valores de producción

# Levantar con Docker Compose
docker compose up --build -d

# Configurar Nginx como reverse proxy (opcional)
# sudo apt install nginx
# Apuntar puerto 80/443 → 8080
```

### Variables de entorno requeridas en AWS

```
DB_HOST          → Endpoint de RDS MySQL
DB_PORT          → 3306
DB_NAME          → vinilos_db
DB_USER          → usuario de la base de datos
DB_PASSWORD      → contraseña segura
JWT_SECRET       → mínimo 64 caracteres aleatorios
JWT_EXPIRATION   → 86400000 (24h en ms)
CORS_ORIGINS     → URL del frontend en producción
PORT             → 8080 (o el que use Beanstalk)
```

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con **BCrypt**
- ✅ Autenticación stateless con **JWT HS512**
- ✅ Roles `ROLE_USER` y `ROLE_ADMIN` con protección por endpoint
- ✅ Filtro JWT en cada petición HTTP
- ✅ CORS configurado por variables de entorno
- ✅ Soft delete en productos (no se eliminan datos)
- ✅ Snapshot de precio en órdenes (inmutable histórico)
- ✅ Imagen Docker con usuario no-root

---

## 🧪 Tests

```bash
# Ejecutar tests unitarios e integración
mvn test

# Ejecutar con reporte de cobertura
mvn verify
```

---

## 📝 Licencia

MIT © Vinilos Store Team
