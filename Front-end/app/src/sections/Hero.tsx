import { ArrowRight, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';

export function Hero() {
  const { setCurrentView, setSelectedGenre } = useStore();

  const handleBrowseCollection = () => {
    setCurrentView('catalog');
    setSelectedGenre('All');
  };

  const handleNewArrivals = () => {
    setCurrentView('catalog');
    setSelectedGenre('All');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=1920&h=1080&fit=crop)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510]/70 via-[#1a1510]/50 to-[#1a1510]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-8">
          <Disc3 className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-sm font-medium text-amber-400 tracking-widest uppercase">
            Premium Vinyl Collection
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-amber-50 mb-6">
          Where Music{' '}
          <span className="text-amber-400 italic">Lives Forever</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-amber-100/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover handpicked vinyl records from legendary artists. 
          Each record tells a story, and every groove carries a memory.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleBrowseCollection}
            className="w-full sm:w-auto px-8 py-6 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-semibold rounded-xl transition-all group"
          >
            Browse Collection
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={handleNewArrivals}
            variant="outline"
            className="w-full sm:w-auto px-8 py-6 border-amber-500/50 text-amber-100 hover:bg-amber-500/10 hover:border-amber-500 font-semibold rounded-xl transition-all"
          >
            New Arrivals
          </Button>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1510] to-transparent" />
    </section>
  );
}
