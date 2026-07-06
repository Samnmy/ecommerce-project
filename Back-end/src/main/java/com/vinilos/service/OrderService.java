package com.vinilos.service;

import com.vinilos.dto.request.OrderRequest;
import com.vinilos.dto.response.OrderResponse;
import com.vinilos.entity.*;
import com.vinilos.exception.BadRequestException;
import com.vinilos.exception.ResourceNotFoundException;
import com.vinilos.repository.OrderRepository;
import com.vinilos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de órdenes de compra.
 * Crea órdenes desde el carrito, descuenta stock y guarda historial.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    /**
     * Crea una nueva orden desde el carrito activo del usuario.
     * Descuenta stock de cada producto y vacía el carrito al finalizar.
     */
    @Transactional
    public OrderResponse createOrder(User user, OrderRequest request) {
        Cart cart = cartService.getOrCreateCart(user);

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("El carrito está vacío. Agrega productos antes de hacer un pedido.");
        }

        // Validar stock para todos los ítems antes de procesar
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new BadRequestException(
                        String.format("Stock insuficiente para '%s'. Disponible: %d",
                                product.getName(), product.getStock()));
            }
        }

        // Crear la orden
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .totalAmount(BigDecimal.ZERO)
                .build();

        // Crear ítems de la orden y descontar stock
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();

            order.getItems().add(orderItem);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));

            // Descontar stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);
        }

        order.setTotalAmount(total);
        order = orderRepository.save(order);

        // Vaciar el carrito después de la compra
        cartService.clearCart(user);

        log.info("Orden creada: {} para usuario: {}, total: {}",
                order.getId(), user.getEmail(), total);

        return toOrderResponse(order);
    }

    /**
     * Obtiene el historial de órdenes del usuario con paginación.
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(User user, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toOrderResponse);
    }

    /**
     * Obtiene una orden específica del usuario por su ID.
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId));

        // Un USER solo puede ver sus propias órdenes
        if (user.getRole() == Role.ROLE_USER && !order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Orden", orderId);
        }

        return toOrderResponse(order);
    }

    /**
     * Actualiza el estado de una orden (solo ADMIN).
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId));

        order.setStatus(newStatus);
        order = orderRepository.save(order);
        log.info("Estado de orden {} actualizado a {}", orderId, newStatus);
        return toOrderResponse(order);
    }

    /**
     * Obtiene todas las órdenes (solo ADMIN) con paginación.
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toOrderResponse);
    }

    // ─── Mapper ───────────────────────────────────────────────────────
    private OrderResponse toOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .orderItemId(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productArtist(item.getProduct().getArtist())
                        .productImageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getId())
                .userId(order.getUser().getId())
                .userName(order.getUser().getName())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
