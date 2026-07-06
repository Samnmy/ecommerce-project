package com.vinilos.service;

import com.vinilos.dto.request.CartItemRequest;
import com.vinilos.dto.response.CartResponse;
import com.vinilos.entity.Cart;
import com.vinilos.entity.CartItem;
import com.vinilos.entity.Product;
import com.vinilos.entity.User;
import com.vinilos.exception.BadRequestException;
import com.vinilos.exception.ResourceNotFoundException;
import com.vinilos.repository.CartItemRepository;
import com.vinilos.repository.CartRepository;
import com.vinilos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión del carrito de compras.
 * Agregar, actualizar cantidad, eliminar ítems y vaciar carrito.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    /**
     * Obtiene el carrito del usuario con todos sus ítems y el total calculado.
     */
    @Transactional(readOnly = true)
    public CartResponse getCart(User user) {
        Cart cart = getOrCreateCart(user);
        return toCartResponse(cart);
    }

    /**
     * Agrega un producto al carrito. Si ya existe, suma la cantidad.
     */
    @Transactional
    public CartResponse addItem(User user, CartItemRequest request) {
        Cart cart = getOrCreateCart(user);
        Product product = findProductById(request.getProductId());

        validateStock(product, request.getQuantity());

        Optional<CartItem> existingItem =
                cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            validateStock(product, newQty);
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        log.info("Ítem agregado al carrito. Usuario: {}, Producto: {}",
                user.getEmail(), product.getName());

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return toCartResponse(updatedCart);
    }

    /**
     * Actualiza la cantidad de un ítem en el carrito.
     * Si quantity=0, elimina el ítem.
     */
    @Transactional
    public CartResponse updateItemQuantity(User user, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ítem no encontrado en el carrito para el producto ID: " + productId));

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            validateStock(item.getProduct(), quantity);
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return toCartResponse(updatedCart);
    }

    /**
     * Elimina un producto específico del carrito.
     */
    @Transactional
    public CartResponse removeItem(User user, Long productId) {
        Cart cart = getOrCreateCart(user);
        cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ítem no encontrado en el carrito para el producto ID: " + productId));

        cartItemRepository.deleteByCartIdAndProductId(cart.getId(), productId);
        log.info("Ítem eliminado del carrito. Usuario: {}, ProductoId: {}",
                user.getEmail(), productId);

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return toCartResponse(updatedCart);
    }

    /**
     * Vacía completamente el carrito del usuario.
     */
    @Transactional
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
        log.info("Carrito vaciado. Usuario: {}", user.getEmail());
    }

    // ─── Helpers públicos (usados por OrderService) ───────────────────
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });
    }

    // ─── Helpers privados ─────────────────────────────────────────────
    private Product findProductById(Long productId) {
        return productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", productId));
    }

    private void validateStock(Product product, int requestedQty) {
        if (product.getStock() < requestedQty) {
            throw new BadRequestException(
                    String.format("Stock insuficiente para '%s'. Disponible: %d, Solicitado: %d",
                            product.getName(), product.getStock(), requestedQty));
        }
    }

    public CartResponse toCartResponse(Cart cart) {
        List<CartResponse.CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> {
                    BigDecimal subtotal = item.getProduct().getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));
                    return CartResponse.CartItemResponse.builder()
                            .cartItemId(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productArtist(item.getProduct().getArtist())
                            .productImageUrl(item.getProduct().getImageUrl())
                            .unitPrice(item.getProduct().getPrice())
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal total = itemResponses.stream()
                .map(CartResponse.CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemResponses)
                .totalAmount(total)
                .totalItems(totalItems)
                .build();
    }
}
