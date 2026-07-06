package com.vinilos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada principal de la aplicación Vinilos Store.
 * eCommerce de vinilos musicales con Spring Boot + JWT + MySQL.
 */
@SpringBootApplication
public class VinilosStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(VinilosStoreApplication.class, args);
    }
}
