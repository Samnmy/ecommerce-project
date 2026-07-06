package com.vinilos.controller;

import com.vinilos.dto.request.GoogleAuthRequest;
import com.vinilos.dto.request.LoginRequest;
import com.vinilos.dto.request.RegisterRequest;
import com.vinilos.dto.response.ApiResponse;
import com.vinilos.dto.response.AuthResponse;
import com.vinilos.dto.response.UserResponse;
import com.vinilos.entity.User;
import com.vinilos.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para autenticación y gestión de usuarios.
 *
 * POST /api/auth/register  → Registro de nuevo usuario
 * POST /api/auth/login     → Inicio de sesión (retorna JWT)
 * POST /api/auth/google    → Login / Registro con Google OAuth2
 * GET  /api/auth/profile   → Perfil del usuario autenticado
 * GET  /api/admin/users    → Lista de usuarios (solo ADMIN)
 */
@Tag(name = "Autenticación", description = "Registro, login, Google OAuth2 y gestión de perfil")
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── Registro ─────────────────────────────────────────────────────
    @Operation(summary = "Registrar nuevo usuario")
    @PostMapping("/auth/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuario registrado exitosamente", response));
    }

    // ─── Login ────────────────────────────────────────────────────────
    @Operation(summary = "Iniciar sesión y obtener token JWT")
    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Sesión iniciada correctamente", response));
    }

    // ─── Google OAuth2 ────────────────────────────────────────────────
    @Operation(summary = "Iniciar sesión o registrarse con Google OAuth2")
    @PostMapping("/auth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(ApiResponse.ok("Sesión iniciada con Google", response));
    }

    // ─── Perfil ───────────────────────────────────────────────────────
    @Operation(summary = "Ver perfil del usuario autenticado",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/auth/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal User currentUser) {
        UserResponse profile = authService.getProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    // ─── Admin: listar usuarios ───────────────────────────────────────
    @Operation(summary = "Listar todos los usuarios (ADMIN)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }
}
