package com.vinilos.entity;

/**
 * Enum que define los roles disponibles en el sistema.
 * ADMIN: acceso total a todos los endpoints.
 * USER: acceso a catálogo, carrito y órdenes propias.
 */
public enum Role {
    ROLE_USER,
    ROLE_ADMIN
}
