# ─── Stage 1: Build ───────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copiar solo el POM primero para cachear dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup -S vinilos && adduser -S vinilos -G vinilos
USER vinilos

# Copiar el JAR compilado
COPY --from=builder /app/target/vinilos-store-*.jar app.jar

# Exponer el puerto de la aplicación
EXPOSE 8080

# Variables de entorno con valores por defecto
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080

# Opciones JVM optimizadas para contenedores
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
