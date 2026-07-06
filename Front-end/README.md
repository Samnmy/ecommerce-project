# 🎵 Ecommerce Front-end

Aplicación de comercio electrónico orientada a la venta de música (álbumes y géneros), construida con una stack moderna de React.

## 🚀 Cómo correr el proyecto localmente

```bash
# Entrar a la carpeta de la app
cd Front-end/app

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El servidor estará disponible en: **http://localhost:5173**

---

## 🛠️ Tecnologías utilizadas

### Core

| Tecnología | Versión | Descripción |
|---|---|---|
| [React](https://react.dev/) | `^19.2.0` | Librería principal de UI. Maneja el árbol de componentes, el estado y el renderizado de la SPA. |
| [React DOM](https://react.dev/) | `^19.2.0` | Sirve de puente entre React y el DOM del navegador. Renderiza la app dentro de `<div id="root">`. |
| [TypeScript](https://www.typescriptlang.org/) | `~5.9.3` | Superset de JavaScript con tipado estático. Aporta seguridad en tiempo de compilación a toda la codebase. |
| [Vite](https://vitejs.dev/) | `^7.2.4` | Bundler y servidor de desarrollo ultrarrápido. Reemplaza a Webpack/CRA y gestiona el HMR y el build de producción. |

### Estilos

| Tecnología | Versión | Descripción |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com/) | `^3.4.19` | Framework de CSS basado en utilidades. Permite estilizar directamente en el JSX sin CSS custom. |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | `^3.4.0` | Fusiona clases de Tailwind de forma inteligente para evitar conflictos de estilos en componentes reutilizables. |
| [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) | `^1.0.7` | Plugin de Tailwind que añade utilidades de animación CSS optimizadas para acordeones, diálogos, etc. |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | `^1.4.0` | Complementa `tailwindcss-animate` con más clases de animación compatibles con Tailwind v4+. |
| [class-variance-authority (CVA)](https://cva.style/docs) | `^0.7.1` | Genera variantes de clases CSS de forma tipada. Utilizado por ShadCN para crear variantes de botones, badges, etc. |
| [clsx](https://github.com/lukeed/clsx) | `^2.1.1` | Concatena nombres de clases de forma condicional. Muy usado junto con `tailwind-merge` en el helper `cn()`. |
| [PostCSS](https://postcss.org/) | `^8.5.6` | Procesador de CSS. Actúa como capa intermedia entre Tailwind y el CSS final que consume el navegador. |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | `^10.4.23` | Plugin de PostCSS que agrega automáticamente prefijos de vendedor (`-webkit-`, etc.) para compatibilidad cross-browser. |

### Componentes UI (ShadCN + Radix UI)

| Tecnología | Versión | Descripción |
|---|---|---|
| [ShadCN UI](https://ui.shadcn.com/) | (CLI, sin versión de paquete) | Sistema de componentes copy-paste construido sobre Radix UI + Tailwind. Provee los componentes de `src/components/ui/`. |
| [@radix-ui/react-*](https://www.radix-ui.com/) | Varias (`^1.x` – `^2.x`) | Primitivas de UI accesibles y sin estilos: `accordion`, `dialog`, `dropdown-menu`, `select`, `tabs`, `tooltip`, `checkbox`, `slider`, `switch`, `progress`, y más. Forman la base de los componentes ShadCN. |
| [Lucide React](https://lucide.dev/) | `^0.562.0` | Librería de íconos SVG en formato de componentes React. Usada como librería de íconos oficial del proyecto (configurada en `components.json`). |
| [cmdk](https://cmdk.paco.me/) | `^1.1.1` | Componente de paleta de comandos / búsqueda tipo _Command+K_. |
| [Embla Carousel React](https://www.embla-carousel.com/) | `^8.6.0` | Carousel/slider ligero y extensible para las secciones de álbumes o productos destacados. |
| [Vaul](https://vaul.emilkowal.ski/) | `^1.1.2` | Drawer (cajón deslizante) accesible. Usado en `CartDrawer.tsx` y `FavoritesDrawer.tsx`. |
| [Sonner](https://sonner.emilkowal.ski/) | `^2.0.7` | Sistema de notificaciones toast moderno y animado. |
| [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | `^4.2.2` | Paneles divisorios redimensionables por el usuario. |
| [input-otp](https://input-otp.rodz.dev/) | `^1.4.2` | Componente de entrada OTP (One-Time Password) de varias celdas. |
| [next-themes](https://github.com/pacocoursey/next-themes) | `^0.4.6` | Gestión de tema claro/oscuro con soporte a `localStorage` y SSR. |

### Formularios y Validación

| Tecnología | Versión | Descripción |
|---|---|---|
| [React Hook Form](https://react-hook-form.com/) | `^7.70.0` | Gestión de formularios sin re-renders innecesarios. Maneja registro de campos, validación y errores. |
| [@hookform/resolvers](https://github.com/react-hook-form/resolvers) | `^5.2.2` | Adaptadores para integrar React Hook Form con librerías de validación como Zod. |
| [Zod](https://zod.dev/) | `^4.3.5` | Librería de validación de esquemas con tipado TypeScript inferido. Define y valida schemas de formularios. |

### Datos y Gráficas

| Tecnología | Versión | Descripción |
|---|---|---|
| [Recharts](https://recharts.org/) | `^2.15.4` | Librería de gráficas declarativas construida sobre D3 y React. Usada probablemente en la sección `Stats`. |
| [date-fns](https://date-fns.org/) | `^4.1.0` | Utilidades de manipulación y formateo de fechas, sin mutar objetos `Date`. |
| [react-day-picker](https://react-day-picker.js.org/) | `^9.13.0` | Componente de selector de fechas (calendario). |

### DevDependencies (Desarrollo)

| Tecnología | Versión | Descripción |
|---|---|---|
| [ESLint](https://eslint.org/) | `^9.39.1` | Linter para detectar errores y malas prácticas en el código TypeScript/React. |
| [typescript-eslint](https://typescript-eslint.io/) | `^8.46.4` | Plugin de ESLint con reglas específicas para TypeScript. |
| [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) | `^7.0.1` | Reglas de ESLint para validar el uso correcto de los Hooks de React. |
| [eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh) | `^0.4.24` | Reglas de ESLint para HMR (Hot Module Replacement) de Vite. |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | `^5.1.1` | Plugin oficial de Vite para soporte de JSX y Fast Refresh de React. |
| [kimi-plugin-inspect-react](https://www.npmjs.com/package/kimi-plugin-inspect-react) | `^1.0.3` | Plugin de inspección visual de componentes React en el dev server de Vite. |
| [@types/react](https://www.npmjs.com/package/@types/react) | `^19.2.5` | Tipos TypeScript para React. |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom) | `^19.2.3` | Tipos TypeScript para React DOM. |
| [@types/node](https://www.npmjs.com/package/@types/node) | `^24.10.1` | Tipos TypeScript para las APIs de Node.js (usado en `vite.config.ts` con `path`). |

---

## 🗂️ Estructura del proyecto

```
Front-end/app/
├── public/                  # Archivos estáticos servidos directamente
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              # Componentes ShadCN (Button, Card, Dialog, etc.)
│   │   ├── Navbar.tsx       # Barra de navegación superior
│   │   ├── MusicPlayer.tsx  # Reproductor de música persistente
│   │   ├── CartDrawer.tsx   # Drawer lateral del carrito de compras
│   │   ├── FavoritesDrawer.tsx # Drawer lateral de favoritos
│   │   └── AlbumCard.tsx    # Tarjeta individual de álbum/producto
│   ├── sections/            # Secciones de página completa
│   │   ├── Hero.tsx         # Sección principal/banner
│   │   ├── BestSellers.tsx  # Álbumes más vendidos
│   │   ├── BrowseByGenre.tsx# Navegación por género musical
│   │   ├── NewArrivals.tsx  # Nuevos lanzamientos
│   │   ├── Stats.tsx        # Estadísticas (gráficas con Recharts)
│   │   ├── Catalog.tsx      # Vista completa del catálogo con filtros
│   │   └── Footer.tsx       # Pie de página
│   ├── hooks/
│   │   └── useStore.ts      # Hook de estado global (store de la app)
│   ├── data/                # Datos estáticos (álbumes, géneros, etc.)
│   ├── types/               # Tipos e interfaces TypeScript
│   ├── lib/
│   │   └── utils.ts         # Helper `cn()` (clsx + tailwind-merge)
│   ├── App.tsx              # Componente raíz. Orquesta vistas y drawers
│   ├── main.tsx             # Punto de entrada. Monta React en el DOM
│   └── index.css            # Variables CSS globales y estilos base de Tailwind
├── components.json          # Configuración de ShadCN CLI
├── tailwind.config.js       # Configuración de Tailwind (colores, bordes, animaciones)
├── vite.config.ts           # Configuración de Vite (alias `@/`, plugins)
├── tsconfig.json            # Configuración base de TypeScript
└── package.json             # Dependencias y scripts del proyecto
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Compila TypeScript y genera el bundle de producción en `/dist` |
| `npm run preview` | Sirve localmente el bundle de producción para previsualización |
| `npm run lint` | Ejecuta ESLint sobre toda la codebase |
