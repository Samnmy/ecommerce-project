package com.vinilos.messaging;

import com.vinilos.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Productor de mensajes RabbitMQ para el sistema de pagos.
 *
 * Responsabilidad: publicar mensajes en el exchange de pagos
 * para que sean procesados de forma asíncrona por {@link PaymentConsumer}.
 *
 * Flujo:
 *   PaymentService.initiatePayment()
 *     → PaymentProducer.sendPaymentRequest(msg)
 *       → RabbitMQ: payment.exchange → payment.requests (queue)
 *         → PaymentConsumer.processPayment(msg)
 *           (o procesado en memoria si RabbitMQ no está disponible)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Inyección con @Lazy para romper ciclo circular:
     * PaymentProducer → PaymentConsumer → PaymentProducer (fallback en memoria).
     * Solo se usa cuando RabbitMQ no está disponible.
     */
    @Autowired
    @Lazy
    private PaymentConsumer paymentConsumer;

    /**
     * Publica una solicitud de pago en la cola payment.requests.
     *
     * @param message Objeto PaymentMessage con todos los datos del pago
     */
    public void sendPaymentRequest(PaymentMessage message) {
        log.info("[RabbitMQ] Publicando solicitud de pago → Queue: {} | TransactionId: {} | Monto: {}",
                RabbitMQConfig.PAYMENT_REQUEST_QUEUE,
                message.getTransactionId(),
                message.getAmount());

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_EXCHANGE,
                    RabbitMQConfig.ROUTING_PAYMENT_PROCESS,
                    message
            );
            log.debug("[RabbitMQ] Mensaje enviado exitosamente para orden #{}", message.getOrderId());
        } catch (Exception e) {
            log.warn("[RabbitMQ Fallback] No se pudo conectar a RabbitMQ ({}). Procesando pago en memoria...", e.getMessage());
            // Procesar asíncronamente de forma local
            CompletableFuture.runAsync(() -> {
                try {
                    paymentConsumer.processPayment(message);
                } catch (Exception ex) {
                    log.error("[RabbitMQ Fallback Error] Error al procesar el pago en memoria", ex);
                }
            });
        }
    }

    /**
     * Publica el resultado de un pago en la cola payment.results (auditoría).
     *
     * @param message Objeto PaymentMessage con el resultado final
     */
    public void sendPaymentResult(PaymentMessage message) {
        log.info("[RabbitMQ] Publicando resultado de pago → Queue: {} | TransactionId: {}",
                RabbitMQConfig.PAYMENT_RESULT_QUEUE,
                message.getTransactionId());

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_EXCHANGE,
                    RabbitMQConfig.ROUTING_PAYMENT_RESULT,
                    message
            );
        } catch (Exception e) {
            log.warn("[RabbitMQ Fallback] No se pudo enviar resultado a RabbitMQ (auditoría). Omitiendo.");
        }
    }
}
