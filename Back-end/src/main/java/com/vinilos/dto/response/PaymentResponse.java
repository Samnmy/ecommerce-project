package com.vinilos.dto.response;

import com.vinilos.entity.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de respuesta para operaciones de pago.
 *
 * Devuelto en:
 * - POST /api/payments/initiate   → estado inicial PROCESSING
 * - GET  /api/payments/{id}/status → estado actual (polling del frontend)
 * - GET  /api/payments/my-payments → historial
 */
@Data
@Builder
public class PaymentResponse {

    /** ID interno del registro de pago */
    private Long paymentId;

    /** ID de la orden asociada */
    private Long orderId;

    /** ID único de transacción generado por la pasarela simulada */
    private String transactionId;

    /** Estado actual: PROCESSING | APPROVED | FAILED | REFUNDED */
    private PaymentStatus status;

    /** Monto total del pago */
    private BigDecimal amount;

    /** Método de pago usado */
    private String paymentMethod;

    /** Últimos 4 dígitos (para mostrar en recibo) */
    private String cardLastFour;

    /** Nombre del titular */
    private String cardHolder;

    /** Mensaje descriptivo del resultado */
    private String message;

    /** Timestamp de creación del pago */
    private LocalDateTime createdAt;

    /** Timestamp de procesamiento (null si aún está PROCESSING) */
    private LocalDateTime processedAt;
}
