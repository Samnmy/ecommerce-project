-- ============================================================
-- Schema de la base de datos: Vinilos Store
-- Ejecutado automáticamente por Spring Boot al arrancar
--
-- NOTA: Los comandos CREATE DATABASE y USE son MySQL-específicos.
-- En producción (MySQL) la DB se crea via JDBC URL con
-- createDatabaseIfNotExist=true. En desarrollo (H2) Hibernate
-- maneja el esquema directamente. Por eso esos comandos se omiten
-- aquí para mantener compatibilidad con ambos motores.
-- ============================================================

-- ─── Tabla usuarios ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'ROLE_USER',
    provider    VARCHAR(50)   NOT NULL DEFAULT 'local',
    provider_id VARCHAR(255)  DEFAULT NULL,
    avatar_url  VARCHAR(500)  DEFAULT NULL,
    enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabla productos (vinilos) ───────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200)    NOT NULL,
    artist        VARCHAR(150)    NOT NULL,
    genre         VARCHAR(100)    NOT NULL,
    price         DECIMAL(10, 2)  NOT NULL,
    stock         INT             NOT NULL DEFAULT 0,
    image_url     VARCHAR(500),
    description   TEXT,
    release_year  INT,
    label         VARCHAR(150),
    active        BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_genre  (genre),
    INDEX idx_products_artist (artist),
    INDEX idx_products_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabla carritos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT  NOT NULL UNIQUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabla ítems del carrito ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id     BIGINT NOT NULL,
    product_id  BIGINT NOT NULL,
    quantity    INT    NOT NULL DEFAULT 1,
    UNIQUE KEY uq_cart_product (cart_id, product_id),
    FOREIGN KEY (cart_id)    REFERENCES carts(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabla órdenes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT          NOT NULL,
    total_amount     DECIMAL(12, 2)  NOT NULL,
    status           VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    shipping_address VARCHAR(400),
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_orders_user   (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabla ítems de orden ────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT         NOT NULL,
    product_id  BIGINT         NOT NULL,
    quantity    INT            NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
