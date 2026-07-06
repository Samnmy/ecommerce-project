package com.vinilos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO de entrada para iniciar un proceso de pago.
 *
 * Recibe los datos del formulario de checkout del frontend.
 * Los datos de tarjeta NUNCA se persisten completos en BD;
 * solo se guarda el último cuarteto de dígitos para el recibo.
 *
 * Nota: La validación de fecha de vencimiento de tarjeta (expiryMonth/expiryYear)
 * se realiza dinámicamente en {@link com.vinilos.service.PaymentService}
 * para evitar valores hardcodeados de año.
 */
@Data
public class PaymentRequest {

    /** ID de la orden de compra a pagar */
    @NotNull(message = "El ID de la orden es requerido")
    private Long orderId;

    /** Método de pago seleccionado: CARD | PSE | NEQUI */
    @NotBlank(message = "El método de pago es requerido")
    @Pattern(regexp = "CARD|PSE|NEQUI", message = "Método de pago inválido")
    private String paymentMethod;

    // ─── Datos de tarjeta (solo requeridos si paymentMethod = CARD) ───

    /** Número de tarjeta completo (16 dígitos, sin espacios) */
    @Pattern(regexp = "^[0-9]{16}$", message = "Número de tarjeta inválido (16 dígitos)")
    private String cardNumber;

    /** Nombre del titular tal como aparece en la tarjeta */
    @Size(min = 2, max = 100, message = "Nombre del titular inválido")
    private String cardHolder;

    /** Mes de expiración (01-12) */
    @Min(value = 1, message = "Mes inválido")
    @Max(value = 12, message = "Mes inválido")
    private Integer expiryMonth;

    /**
     * Año de expiración (4 dígitos).
     * La validación de si está vencida se hace dinámicamente en PaymentService.
     */
    @Min(value = 2000, message = "Año de expiración inválido")
    @Max(value = 2099, message = "Año de expiración inválido")
    private Integer expiryYear;

    /** Código de seguridad CVV (3-4 dígitos) */
    @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV inválido")
    private String cvv;
}
