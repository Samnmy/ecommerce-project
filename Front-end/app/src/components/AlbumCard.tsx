/**
 * AlbumCard — Catalog card with Framer Motion hover (scale + shadow glow)
 * Clicking the cover opens the AlbumModal with the 3D vinyl viewer.
 */
import { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlbumModal } from '@/components/AlbumModal';
import { useStore } from '@/hooks/useStore';
import type { Album } from '@/types';

interface AlbumCardProps {
  album: Album;
  showBadge?: boolean;
}

export function AlbumCard({ album, showBadge = true }: AlbumCardProps) {
  const { toggleFavorite, isFavorite, addToCart, setCurrentTrack } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const favorite = isFavorite(album.id);

  return (
    <>
      {/* ── Card ───────────────────────────────────────────────────────── */}
      <motion.div
        className="group relative bg-gradient-to-b from-amber-900/10 to-amber-900/5
                   rounded-2xl overflow-hidden border border-amber-900/20
                   hover:border-amber-500/30 cursor-pointer"
        whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(217, 119, 6, 0.18)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${album.title} by ${album.artist}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalOpen(true); }}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={album.image}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1510] via-transparent to-transparent opacity-60" />

          {/* Badges */}
          {showBadge && (
            <div className="absolute top-3 left-3 flex gap-2">
              {album.isBestSeller && (
                <Badge className="bg-amber-500 text-[#1a1510] font-semibold text-xs">
                  Best Seller
                </Badge>
              )}
              {album.isNew && (
                <Badge className="bg-emerald-500 text-white font-semibold text-xs">
                  New
                </Badge>
              )}
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(album.id); }}
            aria-label={favorite ? `Remove ${album.title} from favorites` : `Add ${album.title} to favorites`}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center
                        justify-center transition-all z-10 ${
              favorite
                ? 'bg-amber-500 text-[#1a1510]'
                : 'bg-[#1a1510]/60 text-amber-100 hover:bg-[#1a1510]/80'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Play Button (hover overlay) */}
          <div
            className="absolute inset-0 flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentTrack(album); }}
              aria-label={`Play ${album.title}`}
              className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center
                              justify-center backdrop-blur-sm hover:scale-110 transition-transform pointer-events-auto">
                <svg className="w-8 h-8 text-[#1a1510] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
            </button>
          </div>

          {/* "View details" hint on hover */}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-center
                       bg-gradient-to-t from-amber-900/60 to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <span className="text-xs text-amber-200/80 font-medium tracking-wide">
              View Details
            </span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-amber-100/60 mb-1">{album.artist}</p>
          <h3 className="text-lg font-semibold text-amber-100 mb-2 line-clamp-1">{album.title}</h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(album.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-amber-100/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-amber-100/50">{album.rating}</span>
          </div>

          {/* Price and Cart */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">${album.price.toFixed(2)}</span>
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); addToCart(album); }}
              aria-label={`Add ${album.title} to cart`}
              className="bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-[#1a1510] transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <AlbumModal
        album={modalOpen ? album : null}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
