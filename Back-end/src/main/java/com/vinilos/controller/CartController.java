package com.vinilos.controller;

import com.vinilos.dto.request.CartItemRequest;
import com.vinilos.dto.response.ApiResponse;
import com.vinilos.dto.response.CartResponse;
import com.vinilos.entity.User;
import com.vinilos.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para el carrito de compras del usuario autenticado.
 *
 * GET    /api/cart                        → Ver carrito actual
 * POST   /api/cart/items                  → Agregar ítem al carrito
 * PUT    /api/cart/items/{productId}      → Actualizar cantidad de un ítem
 * DELETE /api/cart/items/{productId}      → Eliminar ítem del carrito
 * DELETE /api/cart                        → Vaciar todo el carrito
 */
@Tag(name = "Carrito", description = "Gestión del carrito de compras")
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    // ─── Ver carrito ──────────────────────────────────────────────────
    @Operation(summary = "Obtener el carrito actual del usuario autenticado")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal User currentUser) {
        CartResponse cart = cartService.getCart(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    // ─── Agregar ítem ─────────────────────────────────────────────────
    @Operation(summary = "Agregar un producto al carrito (suma si ya existe)")
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CartItemRequest request) {
        CartResponse cart = cartService.addItem(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Producto agregado al carrito", cart));
    }

    // ─── Actualizar cantidad ──────────────────────────────────────────
    @Operation(summary = "Actualizar cantidad de un producto en el carrito (0 = eliminar)")
    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        CartResponse cart = cartService.updateItemQuantity(currentUser, productId, quantity);
        return ResponseEntity.ok(ApiResponse.ok("Cantidad actualizada", cart));
    }

    // ─── Eliminar ítem ────────────────────────────────────────────────
    @Operation(summary = "Eliminar un producto específico del carrito")
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long productId) {
        CartResponse cart = cartService.removeItem(currentUser, productId);
        return ResponseEntity.ok(ApiResponse.ok("Producto eliminado del carrito", cart));
    }

    // ─── Vaciar carrito ───────────────────────────────────────────────
    @Operation(summary = "Vaciar completamente el carrito")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal User currentUser) {
        cartService.clearCart(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Carrito vaciado", null));
    }
}
