-- ============================================================
-- Datos iniciales: Vinilos Store
-- Usuario ADMIN + 12 vinilos de ejemplo
-- ============================================================

-- ─── Usuario ADMIN ───────────────────────────────────────────
-- Contraseña: Admin1234!
-- Hash generado con BCrypt cost 10 para: Admin1234!
-- ⚠️  CAMBIAR en producción (genera uno propio con BCryptPasswordEncoder)
INSERT IGNORE INTO users (name, email, password, role, enabled) VALUES
('Administrador', 'admin@vinilosstore.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: Admin1234!
 'ROLE_ADMIN', TRUE);

-- ─── Usuario de prueba ───────────────────────────────────────
-- Contraseña: User1234!
INSERT IGNORE INTO users (name, email, password, role, enabled) VALUES
('Usuario Demo', 'user@vinilosstore.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: Admin1234!
 'ROLE_USER', TRUE);

-- ─── Carritos iniciales ──────────────────────────────────────
INSERT IGNORE INTO carts (user_id)
SELECT id FROM users WHERE email = 'admin@vinilosstore.com';

INSERT IGNORE INTO carts (user_id)
SELECT id FROM users WHERE email = 'user@vinilosstore.com';

-- ─── Catálogo de vinilos ─────────────────────────────────────
INSERT IGNORE INTO products
    (name, artist, genre, price, stock, image_url, description, release_year, label) VALUES

-- Rock Clásico
('The Dark Side of the Moon',
 'Pink Floyd', 'Rock Psicodélico', 34.99, 50,
 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
 'El álbum más vendido de Pink Floyd. Una obra maestra del rock progresivo con temas que exploran el tiempo, el dinero y la locura.',
 1973, 'Harvest Records'),

('Rumours',
 'Fleetwood Mac', 'Rock', 29.99, 40,
 'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG',
 'Uno de los álbumes más vendidos de todos los tiempos. Grabado en medio de tensiones entre los miembros de la banda.',
 1977, 'Warner Bros. Records'),

('Led Zeppelin IV',
 'Led Zeppelin', 'Rock', 32.99, 35,
 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg',
 'Incluye la legendaria "Stairway to Heaven". El cuarto álbum del cuarteto británico sin título oficial.',
 1971, 'Atlantic Records'),

-- Jazz
('Kind of Blue',
 'Miles Davis', 'Jazz', 27.99, 60,
 'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg',
 'El álbum de jazz más vendido de la historia. Pionero del jazz modal con una formación estelar.',
 1959, 'Columbia Records'),

('A Love Supreme',
 'John Coltrane', 'Jazz', 25.99, 45,
 'https://upload.wikimedia.org/wikipedia/en/0/09/John_Coltrane_-_A_Love_Supreme.jpg',
 'La obra cumbre de Coltrane, una suite en cuatro partes dedicada a Dios. Jazz espiritual en estado puro.',
 1965, 'Impulse! Records'),

-- Pop / Soul
('Thriller',
 'Michael Jackson', 'Pop', 36.99, 80,
 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
 'El álbum más vendido de la historia con más de 70 millones de copias. Define el pop de los 80s.',
 1982, 'Epic Records'),

('Purple Rain',
 'Prince', 'Funk / Soul', 31.99, 30,
 'https://upload.wikimedia.org/wikipedia/en/9/9c/Purplerain.png',
 'La banda sonora de la película homónima. Fusión única de rock, pop, funk y R&B.',
 1984, 'Warner Bros. Records'),

-- Hip-Hop
('To Pimp a Butterfly',
 'Kendrick Lamar', 'Hip-Hop', 33.99, 55,
 'https://upload.wikimedia.org/wikipedia/en/f/f6/To_Pimp_a_Butterfly.png',
 'Obra conceptual que fusiona hip-hop con jazz y funk. Considerado uno de los mejores álbumes del siglo XXI.',
 2015, 'Aftermath Entertainment'),

('Illmatic',
 'Nas', 'Hip-Hop', 26.99, 40,
 'https://upload.wikimedia.org/wikipedia/en/2/2a/Illmatic.png',
 'El debut de Nas a los 20 años. Generalmente citado como el mejor álbum de hip-hop de la historia.',
 1994, 'Columbia Records'),

-- Electrónica
('Random Access Memories',
 'Daft Punk', 'Electrónica', 38.99, 25,
 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
 'Ganador del Grammy al Álbum del Año. Homenaje a la música disco y funk con colaboraciones estelares.',
 2013, 'Columbia Records'),

-- Clásico Latino
('Buena Vista Social Club',
 'Buena Vista Social Club', 'Son Cubano', 28.99, 35,
 'https://upload.wikimedia.org/wikipedia/en/7/7b/Buena_Vista_Social_Club_%28album%29.jpg',
 'Celebración de la música tradicional cubana con músicos legendarios. Produjo un documental de Wim Wenders.',
 1997, 'World Circuit Records'),

-- Rock Alternativo
('OK Computer',
 'Radiohead', 'Rock Alternativo', 30.99, 45,
 'https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png',
 'Álbum conceptual sobre la alienación tecnológica. Influyó en una generación entera de músicos.',
 1997, 'Parlophone');
