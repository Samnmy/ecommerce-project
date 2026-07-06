import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { albums, genres } from '@/data/albums';
import { AlbumCard } from '@/components/AlbumCard';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Genre } from '@/types';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating';

export function Catalog() {
  const { selectedGenre, setSelectedGenre, searchQuery, setSearchQuery } = useStore();
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [priceRange, setPriceRange] = useState(50);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredAlbums = useMemo(() => {
    let result = [...albums];

    // Filter by genre
    if (selectedGenre !== 'All') {
      result = result.filter(album => album.genre === selectedGenre);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        album =>
          album.title.toLowerCase().includes(query) ||
          album.artist.toLowerCase().includes(query)
      );
    }

    // Filter by price
    result = result.filter(album => album.price <= priceRange);

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Featured - keep original order
        break;
    }

    return result;
  }, [selectedGenre, searchQuery, sortBy, priceRange]);

  const getTitle = () => {
    if (selectedGenre === 'All') return 'All Records';
    return `${selectedGenre} Records`;
  };

  const clearFilters = () => {
    setSelectedGenre('All');
    setSearchQuery('');
    setPriceRange(50);
    setSortBy('featured');
  };

  return (
    <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-50 mb-2">
            {getTitle()}
          </h1>
          <p className="text-amber-100/60">
            {filteredAlbums.length} records found
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-100/40" />
            <input
              type="text"
              placeholder="Search albums or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-amber-900/10 border border-amber-900/30 rounded-xl text-amber-100 placeholder:text-amber-100/40 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-100/40 hover:text-amber-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48 bg-amber-900/10 border-amber-900/30 text-amber-100">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1510] border-amber-900/30">
              <SelectItem value="featured" className="text-amber-100">Featured</SelectItem>
              <SelectItem value="price-low" className="text-amber-100">Price: Low to High</SelectItem>
              <SelectItem value="price-high" className="text-amber-100">Price: High to Low</SelectItem>
              <SelectItem value="rating" className="text-amber-100">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-[#1a1510] p-4' : 'hidden'} lg:block lg:static lg:w-64 lg:p-0 flex-shrink-0`}>
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6 lg:mb-4">
                <h3 className="text-lg font-semibold text-amber-100">Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-400 hover:text-amber-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="lg:hidden p-2"
                  >
                    <X className="w-5 h-5 text-amber-100" />
                  </button>
                </div>
              </div>

              {/* Genre Filter */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-4">
                  Genre
                </h4>
                <div className="space-y-2">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre as Genre)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                        selectedGenre === genre
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-amber-100/70 hover:bg-amber-900/10 hover:text-amber-100'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-4">
                  Price Range
                </h4>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-2 bg-amber-900/30 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between mt-2 text-sm text-amber-100/60">
                    <span>$0</span>
                    <span>${priceRange}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              className="lg:hidden mb-4 w-full border-amber-900/30 text-amber-100"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {filteredAlbums.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-amber-100/60 text-lg mb-2">No records found</p>
                <p className="text-amber-100/40 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
