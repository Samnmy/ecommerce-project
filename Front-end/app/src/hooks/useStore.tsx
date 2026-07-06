import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Album, CartItem, Genre, View } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// ─── Helpers de persistencia por usuario ──────────────────────────────────────

function getCartKey(userId: number | string) {
  return `cart_${userId}`;
}

function getFavoritesKey(userId: number | string) {
  return `favorites_${userId}`;
}

function loadCartFromStorage(userId: number | string): CartItem[] {
  try {
    const raw = localStorage.getItem(getCartKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadFavoritesFromStorage(userId: number | string): string[] {
  try {
    const raw = localStorage.getItem(getFavoritesKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(userId: number | string, cart: CartItem[]) {
  localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
}

function saveFavoritesToStorage(userId: number | string, favorites: string[]) {
  localStorage.setItem(getFavoritesKey(userId), JSON.stringify(favorites));
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StoreContextType {
  // Cart
  cart: CartItem[];
  addToCart: (album: Album) => void;
  removeFromCart: (albumId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Favorites
  favorites: string[];
  toggleFavorite: (albumId: string) => void;
  isFavorite: (albumId: string) => boolean;

  // Navigation
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedGenre: Genre;
  setSelectedGenre: (genre: Genre) => void;

  // Music Player
  currentTrack: Album | null;
  isPlaying: boolean;
  togglePlay: () => void;
  setCurrentTrack: (album: Album | null) => void;

  // UI
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isFavoritesOpen: boolean;
  setIsFavoritesOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Helper: abre el modal de login
function requestLogin() {
  window.dispatchEvent(new CustomEvent('auth:openLogin'));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // Cart state — iniciamos vacío; se cargará del localStorage al detectar usuario
  const [cart, setCart] = useState<CartItem[]>([]);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);

  // Navigation state
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');

  // Music player state
  const [currentTrack, setCurrentTrackState] = useState<Album | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Cargar/limpiar carrito y favoritos cuando cambia el usuario ────────────
  useEffect(() => {
    if (user) {
      // Usuario acaba de iniciar sesión: cargar su carrito y favoritos
      setCart(loadCartFromStorage(user.userId));
      setFavorites(loadFavoritesFromStorage(user.userId));
    } else {
      // Sin sesión: limpiar carrito y favoritos en memoria
      setCart([]);
      setFavorites([]);
    }
  }, [user?.userId]);

  // ── Persistir carrito en localStorage cuando cambia (solo con sesión) ──────
  useEffect(() => {
    if (user) {
      saveCartToStorage(user.userId, cart);
    }
  }, [cart, user]);

  // ── Persistir favoritos en localStorage cuando cambian (solo con sesión) ───
  useEffect(() => {
    if (user) {
      saveFavoritesToStorage(user.userId, favorites);
    }
  }, [favorites, user]);

  // ── Cart actions ──────────────────────────────────────────────────────────

  const addToCart = useCallback((album: Album) => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === album.id);
      if (existing) {
        return prev.map(item =>
          item.id === album.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...album, quantity: 1 }];
    });
  }, [isAuthenticated]);

  const removeFromCart = useCallback((albumId: string) => {
    setCart(prev => prev.filter(item => item.id !== albumId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Favorites actions ─────────────────────────────────────────────────────

  const toggleFavorite = useCallback((albumId: string) => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    setFavorites(prev =>
      prev.includes(albumId)
        ? prev.filter(id => id !== albumId)
        : [...prev, albumId]
    );
  }, [isAuthenticated]);

  const isFavorite = useCallback((albumId: string) => {
    return favorites.includes(albumId);
  }, [favorites]);

  // ── Music player actions ──────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const setCurrentTrack = useCallback((album: Album | null) => {
    setCurrentTrackState(album);
    if (album === null) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, []);

  return (
    <StoreContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      cartCount,
      favorites,
      toggleFavorite,
      isFavorite,
      currentView,
      setCurrentView,
      selectedGenre,
      setSelectedGenre,
      currentTrack,
      isPlaying,
      togglePlay,
      setCurrentTrack,
      isCartOpen,
      setIsCartOpen,
      isFavoritesOpen,
      setIsFavoritesOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      searchQuery,
      setSearchQuery,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
