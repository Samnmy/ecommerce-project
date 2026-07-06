package com.vinilos.repository;

import com.vinilos.entity.PaymentOrder;
import com.vinilos.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para PaymentOrder.
 * Permite consultar pagos por usuario, orden y estado.
 */
public interface PaymentRepository extends JpaRepository<PaymentOrder, Long> {

    /** Historial de pagos de un usuario ordenado por fecha descendente */
    List<PaymentOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Busca un pago por su transactionId único */
    Optional<PaymentOrder> findByTransactionId(String transactionId);

    /** Busca el pago asociado a una orden específica */
    Optional<PaymentOrder> findByOrderId(Long orderId);

    /** Pagos en estado PROCESSING (útil para monitoreo) */
    List<PaymentOrder> findByStatus(PaymentStatus status);
}
