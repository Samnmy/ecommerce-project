# 🎵 Guía para gestionar el catálogo de álbumes

Este archivo te explica cómo **agregar**, **modificar** y **eliminar** álbumes de vinilo
en la tienda. Todos los cambios se hacen en un único archivo:

📄 **`src/data/albums.ts`**

---

## 📋 Estructura de un álbum

Cada álbum es un objeto con los siguientes campos:

```ts
{
  id: '1',                    // Número único (no repitas IDs)
  title: 'Kind of Blue',      // Nombre del álbum
  artist: 'Miles Davis',      // Artista o banda
  price: 34.99,               // Precio en dólares
  rating: 5,                  // Calificación del 1 al 5 (acepta decimales, ej: 4.7)
  reviews: 128,               // Número de reseñas mostradas
  genre: 'Jazz',              // Género (ver géneros disponibles más abajo)
  image: 'https://...',       // URL de la imagen de portada
  isBestSeller: true,         // (Opcional) Muestra la insignia "Best Seller"
  isNew: true,                // (Opcional) Muestra la insignia "New"
  description: 'Texto...',   // Descripción del álbum (se muestra en el detalle)
  tracklist: ['Canción 1', 'Canción 2'],  // Lista de canciones
  spotifyId: 'xxxxxxxxxxxxxx',            // (Opcional) Embed de Spotify — ver sección más abajo
}
```

> Los campos `isBestSeller`, `isNew` y `spotifyId` son **opcionales**.
> Si no los necesitas, simplemente no los incluyas.

---

## 🎸 Géneros disponibles

Los géneros válidos actualmente son:

| Género      | Código a usar  |
|-------------|----------------|
| Todos       | `'All'`        |
| Rock        | `'Rock'`       |
| Jazz        | `'Jazz'`       |
| Soul        | `'Soul'`       |
| Metal       | `'Metal'`      |
| Hip Hop     | `'Hip Hop'`    |
| Classical   | `'Classical'`  |

> El campo `genre` de cada álbum **debe usar exactamente uno de estos valores**.

---

## ➕ Cómo agregar un nuevo álbum

1. Abre el archivo `src/data/albums.ts`.
2. Busca el final del array `albums` (antes del `];` del cierre).
3. Agrega tu álbum siguiendo la estructura de arriba.

**Ejemplo — agregar un álbum de Metal:**

```ts
{
  id: '13',                        // Pon el siguiente número disponible
  title: 'Master of Puppets',
  artist: 'Metallica',
  price: 32.99,
  rating: 5,
  reviews: 512,
  genre: 'Metal',
  image: 'https://images.unsplash.com/photo-XXXXXXXX?w=400&h=400&fit=crop',
  isBestSeller: true,
  description: 'El álbum definitivo del thrash metal. Producción masiva y composiciones épicas.',
  tracklist: ['Battery', 'Master of Puppets', 'The Thing That Should Not Be', 'Orion'],
},
```

**¿De dónde saco la imagen?**

Puedes usar cualquier URL de imagen pública. Recomendaciones:
- [Unsplash.com](https://unsplash.com) — Busca la portada o algo relacionado al género
- Sube la imagen a [imgur.com](https://imgur.com) y usa el enlace directo
- Usa la URL directa de la portada en Wikipedia

---

## 🎧 Cómo agregar el reproductor de Spotify

Cada álbum puede mostrar un **reproductor embebido de Spotify** dentro de su ficha de detalle.
Para agregarlo necesitas el `spotifyId`, que puedes obtener en dos formatos:

### Formato A — Solo el ID (recomendado)

1. Ve a Spotify (web o app) y busca el álbum.
2. Haz clic en los tres puntos `···` del álbum → **Compartir** → **Copiar enlace del álbum**.
3. El enlace tendrá esta forma:
   ```
   https://open.spotify.com/album/3wNTH6hg5KKjRtLJZHxhB9
   ```
4. Copia **solo la parte final** (el ID), que es la cadena de letras y números:
   ```
   3wNTH6hg5KKjRtLJZHxhB9
   ```
5. Úsalo en `albums.ts`:
   ```ts
   spotifyId: '3wNTH6hg5KKjRtLJZHxhB9',
   ```

### Formato B — URL de embed completa (también funciona)

Si en Spotify haces clic en `···` → **Compartir** → **Copiar código de incorporación**,
obtienes un `<iframe>` como este:

```html
<iframe src="https://open.spotify.com/embed/album/3wNTH6hg5KKjRtLJZHxhB9?utm_source=generator&si=..."
  width="100%" height="352" ...></iframe>
```

Puedes pegar **toda la URL del `src`** directamente en el campo `spotifyId`:

```ts
spotifyId: 'https://open.spotify.com/embed/album/3wNTH6hg5KKjRtLJZHxhB9?utm_source=generator&si=6d793984e0ee4052',
```

> La tienda detecta automáticamente si pusiste el ID corto o la URL completa y muestra el reproductor correctamente en ambos casos.

## ✏️ Cómo modificar un álbum existente

1. Abre `src/data/albums.ts`.
2. Encuentra el álbum por su `title` o `id`.
3. Cambia el campo que quieras.

**Ejemplo — cambiar el precio y la descripción de "Rumours":**

```ts
// ANTES
price: 27.99,
description: 'Recorded amid band members crumbling relationships...',

// DESPUÉS
price: 24.99,
description: 'Mi álbum favorito de Fleetwood Mac. Puro clásico.',
```

---

## 🗑️ Cómo eliminar un álbum

1. Abre `src/data/albums.ts`.
2. Encuentra el álbum que quieres eliminar.
3. Borra **todo el bloque** del objeto, desde la llave `{` de apertura hasta la `},` de cierre.

**Ejemplo — eliminar el álbum con id '9':**

```ts
// Borra este bloque completo:
  {
    id: '9',
    title: 'Lady in Satin',
    artist: 'Billie Holiday',
    price: 36.99,
    ...
    spotifyId: '7jzW1YhPYqxomkTx6aXGbz',
  },
```

> Asegúrate de no dejar comas sueltas ni llaves incompletas al borrar.

---

## 🏷️ Cómo agregar un nuevo género

Si quieres un género que no existe (por ejemplo `'Reggae'`), necesitas modificar
**tres archivos**:

### 1. `src/data/albums.ts` — agregar el género a la lista

```ts
// Busca esta línea al final del archivo y agrega tu género:
export const genres = ['All', 'Rock', 'Jazz', 'Soul', 'Metal', 'Hip Hop', 'Classical', 'Reggae'] as const;
```

### 2. `src/sections/BrowseByGenre.tsx` — agregar imagen para el género

```ts
// Busca el objeto genreImages y añade tu entrada:
const genreImages: Record<string, string> = {
  // ... géneros existentes ...
  Reggae: 'https://images.unsplash.com/photo-XXXXXXXX?w=400&h=300&fit=crop',
};
```

### 3. `src/components/Navbar.tsx` — agregar emoji en el menú de navegación

```ts
// Busca el array de géneros en el Navbar y añade:
const genres = [
  // ... géneros existentes ...
  { label: 'Reggae', emoji: '🌴' },
];
```

---

## ✅ Resumen rápido

| Acción           | Archivo(s) a editar                                       |
|------------------|-----------------------------------------------------------|
| Agregar álbum    | `src/data/albums.ts`                                      |
| Modificar álbum  | `src/data/albums.ts`                                      |
| Eliminar álbum   | `src/data/albums.ts`                                      |
| Agregar género   | `albums.ts` + `BrowseByGenre.tsx` + `Navbar.tsx`          |

---

> **Tip final:** Después de guardar cualquier cambio, Vite recarga la página
> automáticamente en el navegador. No necesitas reiniciar el servidor.
