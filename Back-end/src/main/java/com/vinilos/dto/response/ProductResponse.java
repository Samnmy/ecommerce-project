package com.vinilos.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de respuesta con datos completos de un producto (vinilo).
 */
@Data
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String artist;
    private String genre;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private String description;
    private Integer releaseYear;
    private String label;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
