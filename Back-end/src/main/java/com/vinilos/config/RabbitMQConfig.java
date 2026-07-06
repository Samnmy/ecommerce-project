package com.vinilos.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de RabbitMQ para la simulación de pasarela de pago.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    ARQUITECTURA DE COLAS                        │
 * │                                                                 │
 * │  [PaymentService]                                               │
 * │       │ publica                                                 │
 * │       ▼                                                         │
 * │  payment.exchange (Direct Exchange)                             │
 * │       │                                                         │
 * │       ├──[routing: payment.process]──► payment.requests (Queue) │
 * │       │                                    │                    │
 * │       │                              [PaymentConsumer]          │
 * │       │                                    │ procesa y          │
 * │       │                                    │ actualiza BD       │
 * │       └──[routing: payment.result]──► payment.results  (Queue)  │
 * │                                           (auditoría / logs)    │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Dead Letter Queue: payment.dlq captura mensajes que fallan
 * repetidamente (max 3 intentos).
 */
@Configuration
public class RabbitMQConfig {

    // ─── Nombres de colas ─────────────────────────────────────────

    /** Cola principal: recibe solicitudes de pago pendientes */
    public static final String PAYMENT_REQUEST_QUEUE  = "payment.requests";

    /** Cola de resultados: auditoría de pagos procesados */
    public static final String PAYMENT_RESULT_QUEUE   = "payment.results";

    /** Dead Letter Queue: mensajes que fallaron tras reintentos */
    public static final String PAYMENT_DLQ            = "payment.dlq";

    // ─── Exchange ─────────────────────────────────────────────────

    /** Exchange de tipo Direct para el sistema de pagos */
    public static final String PAYMENT_EXCHANGE       = "payment.exchange";

    /** Dead Letter Exchange */
    public static final String PAYMENT_DLX            = "payment.dlx";

    // ─── Routing Keys ─────────────────────────────────────────────

    public static final String ROUTING_PAYMENT_PROCESS = "payment.process";
    public static final String ROUTING_PAYMENT_RESULT  = "payment.result";

    // ─── Declaración de Colas ─────────────────────────────────────

    /**
     * Cola principal con Dead Letter Exchange configurado.
     * Si un mensaje falla 3 veces, se envía a payment.dlq.
     */
    @Bean
    public Queue paymentRequestQueue() {
        return QueueBuilder.durable(PAYMENT_REQUEST_QUEUE)
                .withArgument("x-dead-letter-exchange", PAYMENT_DLX)
                .withArgument("x-dead-letter-routing-key", "payment.dead")
                .withArgument("x-message-ttl", 300000)  // TTL: 5 minutos
                .build();
    }

    @Bean
    public Queue paymentResultQueue() {
        return QueueBuilder.durable(PAYMENT_RESULT_QUEUE).build();
    }

    @Bean
    public Queue paymentDeadLetterQueue() {
        return QueueBuilder.durable(PAYMENT_DLQ).build();
    }

    // ─── Declaración de Exchanges ─────────────────────────────────

    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(PAYMENT_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange paymentDeadLetterExchange() {
        return new DirectExchange(PAYMENT_DLX, true, false);
    }

    // ─── Bindings (Exchange → Cola) ───────────────────────────────

    @Bean
    public Binding bindingPaymentRequest(Queue paymentRequestQueue,
                                          DirectExchange paymentExchange) {
        return BindingBuilder
                .bind(paymentRequestQueue)
                .to(paymentExchange)
                .with(ROUTING_PAYMENT_PROCESS);
    }

    @Bean
    public Binding bindingPaymentResult(Queue paymentResultQueue,
                                         DirectExchange paymentExchange) {
        return BindingBuilder
                .bind(paymentResultQueue)
                .to(paymentExchange)
                .with(ROUTING_PAYMENT_RESULT);
    }

    @Bean
    public Binding bindingDeadLetter(Queue paymentDeadLetterQueue,
                                      DirectExchange paymentDeadLetterExchange) {
        return BindingBuilder
                .bind(paymentDeadLetterQueue)
                .to(paymentDeadLetterExchange)
                .with("payment.dead");
    }

    // ─── Serialización JSON ───────────────────────────────────────

    /**
     * Convierte los mensajes de/para JSON usando Jackson.
     * Sin esto, Spring AMQP usaría serialización Java binaria.
     */
    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * RabbitTemplate configurado con el convertidor JSON.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          MessageConverter jacksonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter);
        return template;
    }
}
