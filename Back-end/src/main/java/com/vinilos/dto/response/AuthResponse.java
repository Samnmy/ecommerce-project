package com.vinilos.dto.response;

import com.vinilos.entity.Role;
import com.vinilos.entity.User;
import lombok.Builder;
import lombok.Data;

/**
 * DTO de respuesta para autenticación exitosa.
 * Contiene el token JWT y datos básicos del usuario.
 */
@Data
@Builder
public class AuthResponse {

    private String token;
    private String type;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String provider;
    private String avatarUrl;

    public static AuthResponse of(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
