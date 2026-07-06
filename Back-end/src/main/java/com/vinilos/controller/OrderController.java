package com.vinilos.controller;

import com.vinilos.dto.request.OrderRequest;
import com.vinilos.dto.response.ApiResponse;
import com.vinilos.dto.response.OrderResponse;
import com.vinilos.entity.OrderStatus;
import com.vinilos.entity.User;
import com.vinilos.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para la gestión de órdenes de compra.
 *
 * POST /api/orders                       → Crear orden desde el carrito
 * GET  /api/orders                       → Historial de órdenes del usuario
 * GET  /api/orders/{id}                  → Detalle de una orden
 * GET  /api/admin/orders                 → Todas las órdenes (ADMIN)
 * PUT  /api/admin/orders/{id}/status     → Cambiar estado de orden (ADMIN)
 */
@Tag(name = "Órdenes", description = "Creación y consulta de órdenes de compra")
@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    // ─── Crear orden ──────────────────────────────────────────────────
    @Operation(summary = "Crear una nueva orden desde el carrito actual")
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody OrderRequest request) {
        OrderResponse order = orderService.createOrder(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Orden creada exitosamente", order));
    }

    // ─── Historial del usuario ────────────────────────────────────────
    @Operation(summary = "Obtener historial de órdenes del usuario autenticado")
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getUserOrders(currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    // ─── Detalle de orden ─────────────────────────────────────────────
    @Operation(summary = "Obtener detalle de una orden específica")
    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(currentUser, id);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    // ─── Admin: todas las órdenes ─────────────────────────────────────
    @Operation(summary = "Listar todas las órdenes del sistema (ADMIN)")
    @GetMapping("/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    // ─── Admin: actualizar estado ─────────────────────────────────────
    @Operation(summary = "Actualizar el estado de una orden (ADMIN)")
    @PutMapping("/admin/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        OrderResponse updated = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Estado de orden actualizado", updated));
    }
}
