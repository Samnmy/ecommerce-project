package com.vinilos.service;

import com.vinilos.dto.request.PaymentRequest;
import com.vinilos.dto.response.PaymentResponse;
import com.vinilos.entity.Order;
import com.vinilos.entity.PaymentOrder;
import com.vinilos.entity.PaymentStatus;
import com.vinilos.entity.User;
import com.vinilos.exception.BadRequestException;
import com.vinilos.exception.ResourceNotFoundException;
import com.vinilos.messaging.PaymentMessage;
import com.vinilos.messaging.PaymentProducer;
import com.vinilos.repository.OrderRepository;
import com.vinilos.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio central de la pasarela de pago simulada.
 *
 * Orquesta el flujo completo:
 * 1. Validar que la orden pertenece al usuario y está en estado PENDING
 * 2. Crear el registro PaymentOrder en BD con estado PROCESSING
 * 3. Publicar el mensaje en RabbitMQ para procesamiento asíncrono
 * 4. Devolver la respuesta inicial al frontend (polling comenzará desde aquí)
 *
 * El resultado real del pago lo determina {@link com.vinilos.messaging.PaymentConsumer}
 * de forma asíncrona, actualizando la BD tras 2-4 segundos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentProducer paymentProducer;

    /**
     * Inicia el proceso de pago para una orden.
     *
     * @param user    Usuario autenticado que realiza el pago
     * @param request Datos del formulario de checkout
     * @return PaymentResponse con estado inicial PROCESSING y transactionId para polling
     */
    @Transactional
    public PaymentResponse initiatePayment(User user, PaymentRequest request) {
        // 1. Verificar que la orden existe y pertenece al usuario
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Orden", request.getOrderId()));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("No tienes permisos para pagar esta orden.");
        }

        // 2. Verificar que no haya ya un pago aprobado para esta orden
        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(existingPayment -> {
            if (existingPayment.getStatus() == PaymentStatus.APPROVED) {
                throw new BadRequestException("Esta orden ya fue pagada exitosamente.");
            }
        });

        // 3. Validar fecha de vencimiento de tarjeta si es pago con CARD
        validateCardExpiry(request);

        // 4. Extraer últimos 4 dígitos de la tarjeta
        String lastFour = extractLastFour(request);

        // 5. Generar ID único de transacción
        String transactionId = UUID.randomUUID().toString();

        // 6. Crear registro de pago en BD con estado PROCESSING
        PaymentOrder paymentOrder = PaymentOrder.builder()
                .orderId(order.getId())
                .userId(user.getId())
                .amount(order.getTotalAmount())
                .status(PaymentStatus.PROCESSING)
                .paymentMethod(request.getPaymentMethod())
                .cardLastFour(lastFour)
                .cardHolder(request.getCardHolder())
                .transactionId(transactionId)
                .build();

        paymentOrder = paymentRepository.save(paymentOrder);

        log.info("[PaymentService] Pago iniciado → PaymentOrder #{} | Orden: #{} | Usuario: {} | Monto: ${}",
                paymentOrder.getId(), order.getId(), user.getEmail(), order.getTotalAmount());

        // 7. Publicar mensaje en RabbitMQ para procesamiento asíncrono
        PaymentMessage message = PaymentMessage.builder()
                .paymentOrderId(paymentOrder.getId())
                .orderId(order.getId())
                .userId(user.getId())
                .amount(order.getTotalAmount())
                .cardLastFour(lastFour)
                .paymentMethod(request.getPaymentMethod())
                .transactionId(transactionId)
                .build();

        paymentProducer.sendPaymentRequest(message);

        // 8. Retornar respuesta inicial (el cliente hará polling para saber el resultado)
        return toResponse(paymentOrder, "Pago en procesamiento. Por favor espera...");
    }

    /**
     * Consulta el estado actual de un pago (usado por el frontend en polling).
     *
     * @param transactionId ID único de transacción retornado por initiatePayment
     * @param user          Usuario autenticado (validación de propiedad)
     * @return PaymentResponse con el estado actual
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentStatus(String transactionId, User user) {
        PaymentOrder payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago con transactionId: " + transactionId));

        if (!payment.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("Pago con transactionId: " + transactionId);
        }

        String message = switch (payment.getStatus()) {
            case PROCESSING -> "Procesando pago...";
            case APPROVED   -> "¡Pago aprobado! Tu pedido está confirmado. 🎵";
            case FAILED     -> payment.getErrorMessage() != null
                    ? payment.getErrorMessage()
                    : "El pago fue rechazado. Intenta con otro método.";
            case REFUNDED   -> "Pago reembolsado exitosamente.";
        };

        return toResponse(payment, message);
    }

    /**
     * Historial de pagos del usuario autenticado.
     */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getMyPayments(User user) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(p -> toResponse(p, null))
                .collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────

    /**
     * Valida que la tarjeta no esté vencida usando la fecha actual del sistema.
     * Solo aplica cuando el método de pago es CARD y se proporcionan los datos de expiración.
     */
    private void validateCardExpiry(PaymentRequest request) {
        if (!"CARD".equals(request.getPaymentMethod())) return;
        if (request.getExpiryYear() == null || request.getExpiryMonth() == null) return;

        LocalDate now = LocalDate.now();
        int currentYear  = now.getYear();
        int currentMonth = now.getMonthValue();

        boolean expired = request.getExpiryYear() < currentYear
                || (request.getExpiryYear().equals(currentYear)
                    && request.getExpiryMonth() < currentMonth);

        if (expired) {
            throw new BadRequestException(
                    String.format("La tarjeta está vencida (venció: %02d/%d). " +
                            "Por favor usa una tarjeta vigente.",
                            request.getExpiryMonth(), request.getExpiryYear()));
        }
    }

    private String extractLastFour(PaymentRequest request) {
        if ("CARD".equals(request.getPaymentMethod()) && request.getCardNumber() != null) {
            String cardNumber = request.getCardNumber().replaceAll("\\s", "");
            return cardNumber.length() >= 4
                    ? cardNumber.substring(cardNumber.length() - 4)
                    : cardNumber;
        }
        return null;
    }

    private PaymentResponse toResponse(PaymentOrder payment, String message) {
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .cardLastFour(payment.getCardLastFour())
                .cardHolder(payment.getCardHolder())
                .message(message)
                .createdAt(payment.getCreatedAt())
                .processedAt(payment.getProcessedAt())
                .build();
    }
}
