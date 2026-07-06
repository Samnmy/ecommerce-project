package com.vinilos.entity;

/**
 * Estados posibles de un pago en la pasarela simulada.
 *
 * Ciclo normal:  PROCESSING → APPROVED
 * Ciclo fallido: PROCESSING → FAILED
 * Post-venta:    APPROVED   → REFUNDED
 */
public enum PaymentStatus {

    /** El pago fue recibido y está siendo procesado por RabbitMQ consumer */
    PROCESSING,

    /** El pago fue aprobado exitosamente */
    APPROVED,

    /** El pago fue rechazado (fondos insuficientes, tarjeta inválida, etc.) */
    FAILED,

    /** El pago fue reembolsado (post-compra) */
    REFUNDED
}
