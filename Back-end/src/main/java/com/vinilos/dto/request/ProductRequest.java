package com.vinilos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO para crear o actualizar un producto (vinilo) en el catálogo.
 */
@Data
public class ProductRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
    private String name;

    @NotBlank(message = "El artista es obligatorio")
    @Size(max = 150, message = "El artista no puede superar 150 caracteres")
    private String artist;

    @NotBlank(message = "El género es obligatorio")
    @Size(max = 100, message = "El género no puede superar 100 caracteres")
    private String genre;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2, message = "Formato de precio inválido")
    private BigDecimal price;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;

    @Size(max = 500, message = "La URL de imagen no puede superar 500 caracteres")
    private String imageUrl;

    private String description;

    @Min(value = 1900, message = "El año de lanzamiento no puede ser anterior a 1900")
    @Max(value = 2100, message = "El año de lanzamiento no es válido")
    private Integer releaseYear;

    @Size(max = 150, message = "El sello no puede superar 150 caracteres")
    private String label;
}
