package com.vinilos.dto.response;

import com.vinilos.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO de respuesta con datos públicos del usuario.
 * Nunca expone la contraseña.
 */
@Data
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
