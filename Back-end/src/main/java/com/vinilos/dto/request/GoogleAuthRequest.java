package com.vinilos.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO para el login con Google OAuth2.
 * El frontend envía el ID token obtenido de Google tras el login.
 */
@Data
public class GoogleAuthRequest {

    @NotBlank(message = "El ID token de Google es obligatorio")
    private String idToken;
}
