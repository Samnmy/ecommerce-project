import { X, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MusicPlayer — Minimal floating card in the bottom-right corner.
 * Clicking the Spotify button toggles a compact embed popup above the card.
 */
export function MusicPlayer() {
  const { currentTrack, setCurrentTrack } = useStore();
  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  const getEmbedUrl = () => {
    if (!currentTrack.spotifyId) return null;
    const sid = currentTrack.spotifyId;
    const base = sid.startsWith('http')
      ? sid.split('?')[0]
      : `https://open.spotify.com/embed/album/${sid}`;
    return `${base}?utm_source=generator&theme=0`;
  };

  const embedUrl = getEmbedUrl();

  const spotifyOpenUrl = currentTrack.spotifyId?.startsWith('http')
    ? currentTrack.spotifyId.replace('/embed/', '/').split('?')[0]
    : `https://open.spotify.com/album/${currentTrack.spotifyId}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 select-none">

      {/* ── Spotify embed popup ───────────────────────────────── */}
      <AnimatePresence>
        {embedUrl && expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="w-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60
                       border border-white/10 backdrop-blur-sm"
          >
            <iframe
              title={`Spotify — ${currentTrack.title}`}
              src={embedUrl}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="eager"
              className="border-0 block"
              style={{ display: 'block' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating player card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-2xl
                   bg-[#1a1510]/90 backdrop-blur-xl
                   border border-amber-900/30
                   shadow-2xl shadow-black/50
                   w-72"
      >
        {/* Album art */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-amber-500/10 shadow-lg">
          <img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-100 truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-xs text-amber-100/50 truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {embedUrl && (
            <>
              {/* Toggle Spotify embed */}
              <button
                onClick={() => setExpanded(prev => !prev)}
                title={expanded ? 'Cerrar reproductor' : 'Abrir en Spotify'}
                className="w-8 h-8 rounded-xl flex items-center justify-center
                           bg-[#1DB954]/10 hover:bg-[#1DB954]/25
                           text-[#1DB954] transition-all hover:scale-110 active:scale-95"
                aria-label={expanded ? 'Cerrar reproductor Spotify' : 'Reproducir en Spotify'}
              >
                {expanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronUp className="w-4 h-4" />
                }
              </button>

              {/* Open in Spotify app */}
              <a
                href={spotifyOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir en Spotify"
                className="w-8 h-8 rounded-xl flex items-center justify-center
                           text-amber-100/30 hover:text-amber-100/80
                           hover:bg-amber-900/30 transition-all hover:scale-110 active:scale-95"
                aria-label="Abrir en Spotify"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          {/* Close */}
          <button
            onClick={() => { setCurrentTrack(null); setExpanded(false); }}
            title="Cerrar"
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       text-amber-100/30 hover:text-amber-100/80
                       hover:bg-amber-900/30 transition-all hover:scale-110 active:scale-95"
            aria-label="Cerrar reproductor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
