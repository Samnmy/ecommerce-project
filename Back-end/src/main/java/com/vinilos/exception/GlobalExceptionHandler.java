package com.vinilos.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para toda la API REST.
 * Centraliza el formato de error y los códigos HTTP de respuesta.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── Estructura de error estandarizada ───────────────────────────
    private record ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String message,
            Object details
    ) {}

    private ResponseEntity<ErrorResponse> buildError(HttpStatus status,
                                                      String error,
                                                      String message,
                                                      Object details) {
        return ResponseEntity.status(status).body(
                new ErrorResponse(LocalDateTime.now(), status.value(), error, message, details)
        );
    }

    // ─── 404: Recurso no encontrado ───────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Recurso no encontrado: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), null);
    }

    // ─── 400: Petición inválida ───────────────────────────────────────
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        log.warn("Petición inválida: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), null);
    }

    // ─── 400: Validación de campos ────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.warn("Error de validación: {}", fieldErrors);
        return buildError(HttpStatus.BAD_REQUEST, "Validation Error",
                "Los datos proporcionados no son válidos", fieldErrors);
    }

    // ─── 401: Credenciales incorrectas ───────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Credenciales incorrectas: {}", ex.getMessage());
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Email o contraseña incorrectos", null);
    }

    // ─── 403: Acceso denegado ─────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Acceso denegado: {}", ex.getMessage());
        return buildError(HttpStatus.FORBIDDEN, "Forbidden",
                "No tienes permisos para realizar esta acción", null);
    }

    // ─── 500: Error interno del servidor ─────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Error interno inesperado: ", ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Ocurrió un error inesperado. Por favor intenta nuevamente.", null);
    }
}
