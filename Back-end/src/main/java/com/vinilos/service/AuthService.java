package com.vinilos.service;

import com.vinilos.dto.request.LoginRequest;
import com.vinilos.dto.request.RegisterRequest;
import com.vinilos.dto.response.AuthResponse;
import com.vinilos.dto.response.UserResponse;
import com.vinilos.entity.Cart;
import com.vinilos.entity.Role;
import com.vinilos.entity.User;
import com.vinilos.exception.BadRequestException;
import com.vinilos.repository.CartRepository;
import com.vinilos.repository.UserRepository;
import com.vinilos.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio de autenticación y gestión de usuarios.
 * Maneja registro, login con email/password, y login con Google OAuth2.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifierService googleTokenVerifier;

    // ─── Registro local ───────────────────────────────────────────
    /**
     * Registra un nuevo usuario con rol USER y crea su carrito vacío.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Ya existe una cuenta con el email: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .provider("local")
                .enabled(true)
                .build();

        user = userRepository.save(user);

        // Crear carrito vacío automáticamente al registrarse
        Cart cart = Cart.builder().user(user).build();
        cartRepository.save(cart);

        log.info("Nuevo usuario registrado: {}", user.getEmail());

        String token = jwtTokenProvider.generateToken(user);
        return AuthResponse.of(token, user);
    }

    // ─── Login local ──────────────────────────────────────────────
    /**
     * Autentica un usuario y retorna un token JWT válido.
     */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase(),
                        request.getPassword()
                )
        );

        User user = (User) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(user);

        log.info("Usuario autenticado: {}", user.getEmail());
        return AuthResponse.of(token, user);
    }

    // ─── Google OAuth2 ────────────────────────────────────────────
    /**
     * Autentica o registra un usuario usando un access_token de Google.
     *
     * Flujo:
     *  1. Verificar el access_token consultando /oauth2/v3/userinfo de Google.
     *  2. Buscar el usuario por email.
     *  3. Si existe → retornar JWT (login).
     *  4. Si no existe → registrar y retornar JWT (auto-registro).
     */
    @Transactional
    public AuthResponse loginWithGoogle(String accessToken) {
        // 1. Verificar access_token con Google y obtener datos del usuario
        GoogleTokenVerifierService.GoogleUserInfo googleUser =
                googleTokenVerifier.verifyAccessToken(accessToken);

        String email    = googleUser.email.toLowerCase();
        String name     = googleUser.name;
        String picture  = googleUser.picture;
        String googleId = googleUser.sub;

        // 2. Validar que el email de Google esté verificado
        if (!googleUser.emailVerified) {
            throw new BadRequestException("El email de Google no está verificado. " +
                    "Por favor verifica tu cuenta de Google antes de continuar.");
        }

        // 3. Buscar usuario existente
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            // Login: actualizar datos de Google si cambiaron
            user = existingUser.get();
            if (name != null && !name.isBlank()) user.setName(name);
            user.setAvatarUrl(picture);
            user.setProviderId(googleId);
            user = userRepository.save(user);
            log.info("Login con Google - usuario existente: {}", email);
        } else {
            // Auto-registro con Google
            user = User.builder()
                    .name(name != null && !name.isBlank() ? name : email)
                    .email(email)
                    .password(null)
                    .role(Role.ROLE_USER)
                    .provider("google")
                    .providerId(googleId)
                    .avatarUrl(picture)
                    .enabled(true)
                    .build();

            user = userRepository.save(user);

            // Carrito automático
            Cart cart = Cart.builder().user(user).build();
            cartRepository.save(cart);

            log.info("Nuevo usuario registrado vía Google: {}", email);
        }

        String token = jwtTokenProvider.generateToken(user);
        return AuthResponse.of(token, user);
    }

    // ─── Perfil ───────────────────────────────────────────────────
    /**
     * Retorna el perfil del usuario autenticado actualmente.
     */
    @Transactional(readOnly = true)
    public UserResponse getProfile(User currentUser) {
        return toUserResponse(currentUser);
    }

    // ─── Admin ────────────────────────────────────────────────────
    /**
     * Retorna todos los usuarios (solo ADMIN).
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper ───────────────────────────────────────────────────
    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
