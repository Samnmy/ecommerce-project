package com.vinilos.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para crear una orden de compra desde el carrito actual del usuario.
 */
@Data
public class OrderRequest {

    @Size(max = 400, message = "La dirección no puede superar 400 caracteres")
    private String shippingAddress;
}
