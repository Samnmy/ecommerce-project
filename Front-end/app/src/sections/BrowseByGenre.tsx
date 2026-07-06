import { genres } from '@/data/albums';
import { useStore } from '@/hooks/useStore';
import type { Genre } from '@/types';

const genreImages: Record<string, string> = {
  Jazz: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop',
  Rock: 'https://www.rockaxis.com/img/newsList/6806718.jpg',
  Soul: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSISVv_ECK2HE6fRYz_J2G7JyLhXdjH-ztFTIYse3FYhTpDwpeNGl3CaYc&s=10',
  Metal: 'https://i.pinimg.com/736x/26/55/b3/2655b3b0ff890ee9680b8a20543167cc.jpg',
  'Hip Hop': 'https://fahrenheitmagazine.b-cdn.net/sites/default/files/styles/xl/public/field/image/heabbi.jpeg',
  Classical: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=300&fit=crop',
};

export function BrowseByGenre() {
  const { setCurrentView, setSelectedGenre } = useStore();

  const handleGenreClick = (genre: Genre) => {
    setSelectedGenre(genre);
    setCurrentView('catalog');
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-amber-900/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-amber-50 mb-3">
            Browse by Genre
          </h2>
          <p className="text-amber-100/60">
            Find your sound
          </p>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres.filter(g => g !== 'All').map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre as Genre)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-amber-900/20 hover:border-amber-500/40 transition-all"
            >
              {/* Background Image */}
              <img
                src={genreImages[genre]}
                alt={genre}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1510] via-[#1a1510]/60 to-transparent group-hover:from-[#1a1510]/90 transition-colors" />
              
              {/* Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-amber-100 group-hover:text-amber-400 transition-colors">
                  {genre}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
