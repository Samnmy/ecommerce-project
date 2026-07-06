import { Search, Heart, ShoppingCart, Disc, ChevronDown, Music2, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import type { Genre, View } from '@/types';
import { useState, useRef, useEffect } from 'react';

function requireAuth(isAuthenticated: boolean, action: () => void) {
  if (!isAuthenticated) {
    window.dispatchEvent(new CustomEvent('auth:openLogin'));
    return;
  }
  action();
}

const genres: { label: string; emoji: string }[] = [
  { label: 'All',       emoji: '🎵' },
  { label: 'Jazz',      emoji: '🎷' },
  { label: 'Rock',      emoji: '🎸' },
  { label: 'Soul',      emoji: '🎙️' },
  { label: 'Metal',      emoji: '🎤' },
  { label: 'Hip Hop',   emoji: '🎧' },
  { label: 'Classical', emoji: '🎻' },
];

const staticNavItems: { label: string; view: View }[] = [
  { label: 'Home',    view: 'home'    },
  { label: 'Catalog', view: 'catalog' },
];

export function Navbar() {
  const { 
    currentView, 
    setCurrentView, 
    setSelectedGenre,
    cartCount,
    favorites,
    setIsCartOpen,
    setIsFavoritesOpen,
    setSearchQuery,
    searchQuery,
  } = useStore();
  
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setGenreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenreSelect = (genre: string) => {
    setCurrentView('catalog');
    setSelectedGenre(genre as Genre);
    setGenreMenuOpen(false);
  };

  return (
    <>
      {/* Dropdown backdrop blur overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 pointer-events-none ${
          genreMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backdropFilter: genreMenuOpen ? 'blur(2px)' : 'none' }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1510]/95 backdrop-blur-md border-b border-amber-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setCurrentView('home')}
            >
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Disc className="w-6 h-6 text-[#1a1510]" />
              </div>
              <span className="text-xl font-bold text-amber-100">
                The Wizard's <span className="text-amber-500">Lair</span>
              </span>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {staticNavItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setCurrentView(item.view);
                    if (item.view === 'catalog') setSelectedGenre('All');
                  }}
                  className={`text-sm font-medium transition-colors ${
                    currentView === item.view
                      ? 'text-amber-500'
                      : 'text-amber-100/70 hover:text-amber-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Musical Styles Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setGenreMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 select-none ${
                    genreMenuOpen ? 'text-amber-500' : 'text-amber-100/70 hover:text-amber-100'
                  }`}
                >
                  <Music2 className="w-4 h-4" />
                  <span>Musical Styles</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      genreMenuOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                {/* Dropdown panel */}
                <div
                  className={`absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-52
                    bg-[#1e1a13]/95 backdrop-blur-xl border border-amber-900/30 rounded-2xl
                    shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden
                    transition-all duration-300 origin-top
                    ${genreMenuOpen
                      ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-y-75 -translate-y-3 pointer-events-none'
                    }`}
                  style={{ transformOrigin: 'top center' }}
                >
                  {/* Decorative top line */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

                  <div className="py-2">
                    {genres.map((g, i) => (
                      <button
                        key={g.label}
                        onClick={() => handleGenreSelect(g.label)}
                        className={`group w-full flex items-center gap-3 px-4 py-2.5 text-sm
                          transition-all duration-150 relative
                          ${currentView === 'catalog'
                            ? 'text-amber-500 font-semibold'
                            : 'text-amber-100/75 hover:text-amber-100 font-medium'
                          }`}
                        style={{
                          transitionDelay: genreMenuOpen ? `${i * 35}ms` : '0ms',
                          transform: genreMenuOpen ? 'translateX(0)' : 'translateX(-8px)',
                          opacity: genreMenuOpen ? 1 : 0,
                        }}
                      >
                        {/* Hover background */}
                        <span className="absolute inset-x-2 inset-y-0.5 rounded-lg bg-amber-900/0 group-hover:bg-amber-900/30 transition-colors duration-200" />
                        {/* Left accent bar */}
                        <span className="absolute left-2 inset-y-1.5 w-0.5 rounded-full bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                        <span className="relative text-base leading-none">{g.emoji}</span>
                        <span className="relative">{g.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Decorative bottom line */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/50" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 lg:w-56 pl-9 pr-4 py-2 bg-amber-900/20 border border-amber-900/30 rounded-full text-sm text-amber-100 placeholder:text-amber-100/40 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Favorites */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Favoritos"
                className="relative text-amber-100/70 hover:text-amber-100 hover:bg-amber-900/20"
                onClick={() => requireAuth(isAuthenticated, () => setIsFavoritesOpen(true))}
              >
                <Heart className="w-5 h-5" />
                {isAuthenticated && favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-[#1a1510] text-xs font-bold rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Carrito de compras"
                className="relative text-amber-100/70 hover:text-amber-100 hover:bg-amber-900/20"
                onClick={() => requireAuth(isAuthenticated, () => setIsCartOpen(true))}
              >
                <ShoppingCart className="w-5 h-5" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-[#1a1510] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Auth: User menu or Login button */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="btn-user-menu"
                    onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 hover:bg-amber-900/20 rounded-full p-1 transition-colors"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border-2 border-amber-500/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <span className="text-[#1a1510] text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <ChevronDown className={`w-3 h-3 text-amber-100/60 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User dropdown */}
                  <div
                    className={`absolute right-0 top-[calc(100%+10px)] w-56
                      bg-[#1e1a13]/95 backdrop-blur-xl border border-amber-900/30 rounded-2xl
                      shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden
                      transition-all duration-200 origin-top-right
                      ${userMenuOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                  >
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
                    <div className="px-4 py-3 border-b border-amber-900/20">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-amber-500/30" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1a1510] font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-amber-100 text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-amber-100/40 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        id="btn-navbar-profile"
                        className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-100/75 hover:text-amber-100 transition-colors relative"
                      >
                        <span className="absolute inset-x-2 inset-y-0.5 rounded-lg bg-amber-900/0 group-hover:bg-amber-900/30 transition-colors duration-200" />
                        <UserIcon className="relative w-4 h-4" />
                        <span className="relative">Mi perfil</span>
                      </button>
                      <button
                        id="btn-navbar-logout"
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 transition-colors relative"
                      >
                        <span className="absolute inset-x-2 inset-y-0.5 rounded-lg bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-200" />
                        <LogOut className="relative w-4 h-4" />
                        <span className="relative">Cerrar sesión</span>
                      </button>
                    </div>
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                  </div>
                </div>
              ) : (
                <button
                  id="btn-navbar-login"
                  onClick={() => window.dispatchEvent(new CustomEvent('auth:openLogin'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-amber-100/70 hover:text-amber-100 transition-colors px-3 py-1.5 rounded-full hover:bg-amber-900/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>
    </>
  );
}

