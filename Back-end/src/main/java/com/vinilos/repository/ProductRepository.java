package com.vinilos.repository;

import com.vinilos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA para la entidad Product (vinilos).
 * Incluye búsqueda por nombre, artista y género con paginación.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByGenreIgnoreCaseAndActiveTrue(String genre, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(p.artist) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(p.genre) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    List<String> findDistinctGenreByActiveTrue();
}
