package com.vinilos.controller;

import com.vinilos.dto.request.ProductRequest;
import com.vinilos.dto.response.ApiResponse;
import com.vinilos.dto.response.ProductResponse;
import com.vinilos.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * Controlador REST para el catálogo de vinilos.
 *
 * GET    /api/products              → Listar con paginación
 * GET    /api/products/search       → Buscar por texto
 * GET    /api/products/genres       → Géneros disponibles
 * GET    /api/products/{id}         → Detalle de un vinilo
 * POST   /api/products              → Crear (ADMIN)
 * PUT    /api/products/{id}         → Actualizar (ADMIN)
 * DELETE /api/products/{id}         → Desactivar (ADMIN)
 */
@Tag(name = "Productos", description = "Catálogo de vinilos musicales")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /** Lista blanca de campos permitidos para ordenar (evita Sort Injection) */
    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("name", "price", "artist", "genre", "createdAt", "releaseYear");

    // ─── Listar todos (paginado) ──────────────────────────────────────
    @Operation(summary = "Obtener todos los vinilos activos con paginación")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc")  String direction) {

        // Validar campo de ordenamiento contra lista blanca (evita Sort Injection)
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "name";
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    // ─── Búsqueda ─────────────────────────────────────────────────────
    @Operation(summary = "Buscar vinilos por nombre, artista o género")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ProductResponse> results = productService.searchProducts(q, pageable);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    // ─── Filtrar por género ───────────────────────────────────────────
    @Operation(summary = "Filtrar vinilos por género musical")
    @GetMapping("/genre/{genre}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getByGenre(
            @PathVariable String genre,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ProductResponse> products = productService.getProductsByGenre(genre, pageable);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    // ─── Géneros disponibles ──────────────────────────────────────────
    @Operation(summary = "Obtener lista de géneros musicales disponibles")
    @GetMapping("/genres")
    public ResponseEntity<ApiResponse<List<String>>> getGenres() {
        List<String> genres = productService.getAllGenres();
        return ResponseEntity.ok(ApiResponse.ok(genres));
    }

    // ─── Detalle por ID ───────────────────────────────────────────────
    @Operation(summary = "Obtener detalle de un vinilo por su ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok(product));
    }

    // ─── Crear (ADMIN) ────────────────────────────────────────────────
    @Operation(summary = "Crear nuevo vinilo en el catálogo (ADMIN)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Producto creado exitosamente", created));
    }

    // ─── Actualizar (ADMIN) ───────────────────────────────────────────
    @Operation(summary = "Actualizar vinilo existente (ADMIN)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Producto actualizado exitosamente", updated));
    }

    // ─── Eliminar/Desactivar (ADMIN) ──────────────────────────────────
    @Operation(summary = "Desactivar vinilo del catálogo (ADMIN)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Producto desactivado exitosamente", null));
    }
}
