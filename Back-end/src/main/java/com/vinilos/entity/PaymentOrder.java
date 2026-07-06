package com.vinilos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa una transacción de pago simulada.
 *
 * Cada PaymentOrder está asociada a una Order del sistema y pasa
 * por los estados definidos en {@link PaymentStatus} de forma asíncrona
 * a través de las colas de RabbitMQ.
 */
@Entity
@Table(name = "payment_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID de la orden de compra asociada */
    @Column(nullable = false)
    private Long orderId;

    /** ID del usuario que realizó el pago */
    @Column(nullable = false)
    private Long userId;

    /** Monto total cobrado */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Estado actual del pago */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PROCESSING;

    /** Método de pago utilizado: CARD, PSE, NEQUI */
    @Column(nullable = false, length = 20)
    private String paymentMethod;

    /** Últimos 4 dígitos de la tarjeta (para mostrar en recibo) */
    @Column(length = 4)
    private String cardLastFour;

    /** Nombre del titular de la tarjeta */
    @Column(length = 100)
    private String cardHolder;

    /** Mensaje de error en caso de fallo */
    @Column(length = 500)
    private String errorMessage;

    /** ID único de transacción generado por la pasarela simulada */
    @Column(unique = true, length = 36)
    private String transactionId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp cuando el Consumer procesó y resolvió el pago */
    private LocalDateTime processedAt;
}
