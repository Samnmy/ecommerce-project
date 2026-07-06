package com.vinilos.controller;

import com.vinilos.dto.request.PaymentRequest;
import com.vinilos.dto.response.ApiResponse;
import com.vinilos.dto.response.PaymentResponse;
import com.vinilos.entity.User;
import com.vinilos.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la pasarela de pago simulada con RabbitMQ.
 *
 * Endpoints:
 *   POST /api/payments/initiate             → Inicia el proceso de pago
 *   GET  /api/payments/{transactionId}/status → Estado actual (para polling)
 *   GET  /api/payments/my-payments          → Historial de pagos del usuario
 *
 * Flujo de uso desde el frontend:
 *   1. Llamar a POST /initiate → obtener transactionId
 *   2. Hacer polling a GET /{transactionId}/status cada 2 segundos
 *   3. Cuando status != PROCESSING, mostrar resultado final
 */
@Tag(name = "Pasarela de Pago", description = "Simulación de procesamiento de pagos con RabbitMQ")
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Inicia el proceso de pago de forma asíncrona.
     * Publica el pago en RabbitMQ y retorna inmediatamente con estado PROCESSING.
     */
    @Operation(
        summary = "Iniciar pago",
        description = "Recibe los datos del checkout, crea un PaymentOrder en estado PROCESSING " +
                      "y publica el mensaje en RabbitMQ para procesamiento asíncrono. " +
                      "El cliente debe hacer polling al endpoint /status para conocer el resultado."
    )
    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody PaymentRequest request) {

        PaymentResponse response = paymentService.initiatePayment(currentUser, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Pago en procesamiento", response));
    }

    /**
     * Consulta el estado actual de un pago (endpoint de polling).
     * El frontend llama a este endpoint cada 2 segundos hasta que el status
     * cambia de PROCESSING a APPROVED o FAILED.
     */
    @Operation(
        summary = "Consultar estado de pago",
        description = "Endpoint de polling para obtener el estado actual de un pago. " +
                      "Retorna PROCESSING mientras RabbitMQ procesa el mensaje, " +
                      "luego APPROVED o FAILED con el mensaje descriptivo."
    )
    @GetMapping("/{transactionId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(
            @AuthenticationPrincipal User currentUser,
            @Parameter(description = "ID único de transacción retornado por /initiate")
            @PathVariable String transactionId) {

        PaymentResponse response = paymentService.getPaymentStatus(transactionId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Historial de pagos del usuario autenticado.
     */
    @Operation(summary = "Historial de mis pagos")
    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal User currentUser) {

        List<PaymentResponse> payments = paymentService.getMyPayments(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }
}
