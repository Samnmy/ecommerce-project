import { Heart, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { albums } from '@/data/albums';

export function FavoritesDrawer() {
  const { 
    favorites, 
    isFavoritesOpen, 
    setIsFavoritesOpen, 
    toggleFavorite, 
    addToCart,
    setCurrentView,
    setSelectedGenre,
  } = useStore();

  const favoriteAlbums = albums.filter(album => favorites.includes(album.id));

  const handleBrowse = () => {
    setIsFavoritesOpen(false);
    setCurrentView('catalog');
    setSelectedGenre('All');
  };

  return (
    <Sheet open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen}>
      <SheetContent className="w-full sm:max-w-md bg-[#1a1510] border-l border-amber-900/30">
        <SheetHeader className="border-b border-amber-900/20 pb-4">
          <SheetTitle className="flex items-center gap-2 text-amber-100">
            <Heart className="w-5 h-5 text-amber-500" />
            Your Favorites ({favorites.length})
          </SheetTitle>
        </SheetHeader>

        {favoriteAlbums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-amber-100/30" />
            </div>
            <p className="text-amber-100/60 mb-2">No favorites yet</p>
            <p className="text-amber-100/40 text-sm mb-6">Save your favorite records here</p>
            <Button
              onClick={handleBrowse}
              className="bg-amber-500 hover:bg-amber-400 text-[#1a1510]"
            >
              Browse Records
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-200px)] mt-4">
              <div className="space-y-4 pr-4">
                {favoriteAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="flex gap-4 p-3 bg-amber-900/10 rounded-xl border border-amber-900/20 group"
                  >
                    <img
                      src={album.image}
                      alt={album.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-amber-100 truncate">
                        {album.title}
                      </h4>
                      <p className="text-xs text-amber-100/60 mb-1">{album.artist}</p>
                      <p className="text-lg font-bold text-amber-400">
                        ${album.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => toggleFavorite(album.id)}
                        className="p-1.5 text-amber-500 hover:text-red-400 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <Button
                        size="sm"
                        onClick={() => addToCart(album)}
                        className="bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-[#1a1510]"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-amber-900/20 bg-[#1a1510]">
              <Button
                className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-semibold"
                onClick={handleBrowse}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
