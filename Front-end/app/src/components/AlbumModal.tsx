/**
 * AlbumModal — Full-screen backdrop modal with:
 *  - Lazy-loaded Vinyl3D component
 *  - Album info, tracklist, price, Add-to-Cart
 *  - Framer Motion animations (fade + scale)
 *  - Focus trap & keyboard close (Escape)
 *  - Accessible: role="dialog", aria-modal, aria-label
 */
import { lazy, Suspense, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Music2, Disc3 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import type { Album } from '@/types';

// Lazy-load the heavy 3D scene
const VinylAlbum3D = lazy(() =>
  import('@/components/Vinyl3D').then((m) => ({ default: m.VinylAlbum3D }))
);

interface AlbumModalProps {
  album: Album | null;
  onClose: () => void;
}

export function AlbumModal({ album, onClose }: AlbumModalProps) {
  const { addToCart } = useStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus close button when modal opens
  useEffect(() => {
    if (album) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [album]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (album) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [album]);

  // Focus trap — keep Tab inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  };

  return (
    <AnimatePresence>
      {album && (
        // ── Backdrop ──────────────────────────────────────────────────────
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          role="presentation"
        >
          {/* Blur layer */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* ── Modal panel ────────────────────────────────────────────── */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${album.title} by ${album.artist}`}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] lg:h-[80vh] lg:max-h-[80vh]
                       overflow-y-auto lg:overflow-hidden
                       bg-gradient-to-br from-[#1e1811] via-[#1a1510] to-[#110f0a]
                       border border-amber-900/30 rounded-3xl shadow-2xl
                       shadow-amber-900/20 flex flex-col lg:flex-row"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 32 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full
                         bg-amber-900/30 hover:bg-amber-500/30 text-amber-100/70
                         hover:text-amber-100 flex items-center justify-center
                         transition-all focus:outline-none focus:ring-2
                         focus:ring-amber-500"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── LEFT: 3D viewer ──────────────────────────────────── */}
            <div className="relative w-full lg:w-1/2 h-56 lg:h-auto min-h-[220px] lg:min-h-[280px] flex-shrink-0 overflow-hidden rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none">
              {/* Subtle glow behind the canvas */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent" />

              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 rounded-full border-2 border-amber-500/40 border-t-amber-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                }
              >
                <VinylAlbum3D frontCover={album.image} albumTitle={album.title} />
              </Suspense>
            </div>

            {/* ── RIGHT: Info panel ──────────────────────────────────── */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col gap-4 overflow-y-auto">
              {/* Genre badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold
                                 bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  {album.genre}
                </span>
                {album.isBestSeller && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold
                                   bg-amber-500 text-[#1a1510] uppercase tracking-wider">
                    Best Seller
                  </span>
                )}
                {album.isNew && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold
                                   bg-emerald-500/80 text-white uppercase tracking-wider">
                    New
                  </span>
                )}
              </div>

              {/* Title + Artist */}
              <div>
                <motion.h2
                  className="text-2xl lg:text-3xl font-bold text-amber-50 leading-tight"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {album.title}
                </motion.h2>
                <motion.p
                  className="text-amber-400 text-base mt-1 font-medium"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {album.artist}
                </motion.p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(album.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-amber-100/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-amber-100/60">
                  {album.rating} · {album.reviews} reviews
                </span>
              </div>

              {/* Description */}
              {album.description && (
                <motion.p
                  className="text-amber-100/70 text-sm leading-relaxed border-l-2
                             border-amber-500/30 pl-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  {album.description}
                </motion.p>
              )}

              {/* Tracklist */}
              {album.tracklist && album.tracklist.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Disc3 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      Tracklist
                    </span>
                  </div>
                  <ol className="max-h-36 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
                    {album.tracklist.map((track, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-3 text-sm text-amber-100/70
                                   hover:text-amber-100 transition-colors cursor-default group"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.04 }}
                      >
                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-amber-900/40
                                         text-xs text-amber-500/70 flex items-center justify-center
                                         group-hover:bg-amber-500/20 transition-colors font-mono">
                          {i + 1}
                        </span>
                        <Music2 className="w-3 h-3 text-amber-500/40 flex-shrink-0" />
                        <span>{track}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Spotify Embed Preview */}
              {album.spotifyId && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl overflow-hidden flex-shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1DB954" aria-hidden="true">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span className="text-xs font-semibold text-[#1DB954] uppercase tracking-widest">
                      Escuchar en Spotify
                    </span>
                  </div>
                  <iframe
                    title={`Spotify — ${album.title}`}
                    src={`${
                      album.spotifyId.startsWith('http')
                        ? album.spotifyId.split('?')[0]
                        : `https://open.spotify.com/embed/album/${album.spotifyId}`
                    }?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="eager"
                    className="rounded-xl border-0 w-full"
                    style={{ borderRadius: '12px', display: 'block' }}
                  />
                </motion.div>
              )}


              {/* Price + CTA */}
              <div className="mt-auto pt-4 border-t border-amber-900/20 flex
                              items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-amber-100/40 uppercase tracking-wider">Price</p>
                  <p className="text-3xl font-bold text-amber-400">
                    ${album.price.toFixed(2)}
                  </p>
                </div>

                <motion.button
                  aria-label={`Add ${album.title} to cart`}
                  onClick={() => { addToCart(album); onClose(); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-amber-500 hover:bg-amber-400 active:bg-amber-600
                             text-[#1a1510] font-semibold text-sm shadow-lg
                             shadow-amber-500/25 transition-all focus:outline-none
                             focus:ring-2 focus:ring-amber-300"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
