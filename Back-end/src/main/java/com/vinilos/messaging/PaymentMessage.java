package com.vinilos.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Mensaje serializado que viaja a través de las colas de RabbitMQ.
 *
 * Este objeto es publicado por {@link PaymentProducer} en la cola
 * "payment.requests" y consumido por {@link PaymentConsumer}.
 *
 * Implementa Serializable para la serialización JSON con Jackson.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMessage implements Serializable {

    /** ID del registro PaymentOrder en la base de datos */
    private Long paymentOrderId;

    /** ID de la orden de compra */
    private Long orderId;

    /** ID del usuario dueño de la orden */
    private Long userId;

    /** Monto a cobrar */
    private BigDecimal amount;

    /** Últimos 4 dígitos de la tarjeta (para la lógica de simulación) */
    private String cardLastFour;

    /** Método de pago: CARD | PSE | NEQUI */
    private String paymentMethod;

    /** ID único de transacción */
    private String transactionId;
}
