package com.vinilos;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Test de carga del contexto de Spring Boot.
 * Verifica que toda la configuración y beans se inicializan correctamente.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "app.jwt.secret=TestSecretKeyThatIsLongEnoughForHS512Algorithm1234567890",
        "app.jwt.expiration=86400000",
        "app.cors.allowed-origins=http://localhost:5173"
})
class VinilosStoreApplicationTests {

    @Test
    void contextLoads() {
        // Verifica que el contexto de Spring Boot carga sin errores
    }
}
