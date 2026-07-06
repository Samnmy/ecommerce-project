package com.vinilos.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Servicio para verificar tokens de Google OAuth2.
 * <p>
 * Soporta dos modalidades:
 * <ul>
 *   <li><b>ID Token</b>: verifica con la API tokeninfo de Google.</li>
 *   <li><b>Access Token</b>: consulta el endpoint userinfo de Google.</li>
 * </ul>
 * El frontend usa el flujo implícito (@react-oauth/google useGoogleLogin),
 * que retorna un access_token. Este servicio lo valida consultando userinfo.
 */
@Slf4j
@Service
public class GoogleTokenVerifierService {

    private static final String USERINFO_URL =
            "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String TOKENINFO_URL =
            "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Payload simple con los datos del usuario de Google.
     */
    public static class GoogleUserInfo {
        public String sub;       // ID único de Google
        public String email;
        public String name;
        public String picture;
        public boolean emailVerified;
    }

    /**
     * Verifica un access_token de Google consultando el endpoint userinfo.
     * Este es el flujo principal usado por @react-oauth/google.
     *
     * @param accessToken token devuelto por useGoogleLogin()
     * @return GoogleUserInfo con los datos del usuario
     */
    public GoogleUserInfo verifyAccessToken(String accessToken) {
        try {
            URL url = new URL(USERINFO_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                throw new IllegalArgumentException(
                        "Google userinfo retornó código: " + responseCode);
            }

            BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            br.close();

            JsonNode node = objectMapper.readTree(sb.toString());
            GoogleUserInfo info = new GoogleUserInfo();
            info.sub = node.path("sub").asText();
            info.email = node.path("email").asText();
            info.name = node.path("name").asText();
            info.picture = node.path("picture").asText();
            info.emailVerified = node.path("email_verified").asBoolean(false);

            if (info.email == null || info.email.isBlank()) {
                throw new IllegalArgumentException("No se pudo obtener el email de Google");
            }

            log.debug("Google access_token verificado para: {}", info.email);
            return info;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error verificando access_token de Google: {}", e.getMessage());
            throw new IllegalArgumentException(
                    "Token de Google inválido: " + e.getMessage());
        }
    }
}
