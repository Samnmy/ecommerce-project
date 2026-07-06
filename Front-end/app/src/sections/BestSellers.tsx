import { ArrowRight } from 'lucide-react';
import { albums } from '@/data/albums';
import { AlbumCard } from '@/components/AlbumCard';
import { useStore } from '@/hooks/useStore';

export function BestSellers() {
  const { setCurrentView, setSelectedGenre } = useStore();
  const bestSellers = albums.filter(album => album.isBestSeller);

  const handleViewAll = () => {
    setCurrentView('catalog');
    setSelectedGenre('All');
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-50 mb-2">
              Best Sellers
            </h2>
            <p className="text-amber-100/60">
              Our most beloved records, handpicked for audiophiles
            </p>
          </div>
          <button
            onClick={handleViewAll}
            className="hidden sm:flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center sm:hidden">
          <button
            onClick={handleViewAll}
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
