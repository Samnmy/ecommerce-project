package com.vinilos.entity;

/**
 * Estado posible de una orden de compra.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
