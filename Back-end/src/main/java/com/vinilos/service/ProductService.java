package com.vinilos.service;

import com.vinilos.dto.request.ProductRequest;
import com.vinilos.dto.response.ProductResponse;
import com.vinilos.entity.Product;
import com.vinilos.exception.ResourceNotFoundException;
import com.vinilos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para la gestión del catálogo de vinilos.
 * CRUD completo con soporte de paginación, búsqueda y filtrado por género.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * Obtiene todos los productos activos con paginación.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable)
                .map(this::toProductResponse);
    }

    /**
     * Busca productos por nombre, artista o género con paginación.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable)
                .map(this::toProductResponse);
    }

    /**
     * Filtra productos por género con paginación.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByGenre(String genre, Pageable pageable) {
        return productRepository.findByGenreIgnoreCaseAndActiveTrue(genre, pageable)
                .map(this::toProductResponse);
    }

    /**
     * Obtiene un producto por su ID.
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = findActiveProductById(id);
        return toProductResponse(product);
    }

    /**
     * Retorna todos los géneros disponibles en el catálogo.
     */
    @Transactional(readOnly = true)
    public List<String> getAllGenres() {
        return productRepository.findDistinctGenreByActiveTrue();
    }

    /**
     * Crea un nuevo producto (solo ADMIN).
     */
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = toProduct(request);
        product = productRepository.save(product);
        log.info("Producto creado: {} - {}", product.getId(), product.getName());
        return toProductResponse(product);
    }

    /**
     * Actualiza un producto existente (solo ADMIN).
     */
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findActiveProductById(id);

        product.setName(request.getName());
        product.setArtist(request.getArtist());
        product.setGenre(request.getGenre());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setDescription(request.getDescription());
        product.setReleaseYear(request.getReleaseYear());
        product.setLabel(request.getLabel());

        product = productRepository.save(product);
        log.info("Producto actualizado: {} - {}", product.getId(), product.getName());
        return toProductResponse(product);
    }

    /**
     * Desactiva (soft delete) un producto (solo ADMIN).
     */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findActiveProductById(id);
        product.setActive(false);
        productRepository.save(product);
        log.info("Producto desactivado: {} - {}", product.getId(), product.getName());
    }

    // ─── Helpers privados ─────────────────────────────────────────────
    private Product findActiveProductById(Long id) {
        return productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
    }

    private Product toProduct(ProductRequest r) {
        return Product.builder()
                .name(r.getName())
                .artist(r.getArtist())
                .genre(r.getGenre())
                .price(r.getPrice())
                .stock(r.getStock())
                .imageUrl(r.getImageUrl())
                .description(r.getDescription())
                .releaseYear(r.getReleaseYear())
                .label(r.getLabel())
                .active(true)
                .build();
    }

    private ProductResponse toProductResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .artist(p.getArtist())
                .genre(p.getGenre())
                .price(p.getPrice())
                .stock(p.getStock())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .releaseYear(p.getReleaseYear())
                .label(p.getLabel())
                .active(p.isActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
