export interface Album {
  id: string;
  title: string;
  artist: string;
  price: number;
  rating: number;
  reviews: number;
  genre: string;
  image: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  description?: string;
  tracklist?: string[];
  spotifyId?: string;
}


export interface CartItem extends Album {
  quantity: number;
}

export type Genre = 'All' | 'Jazz' | 'Rock' | 'Soul' | 'Hip Hop' | 'Classical';

export type View = 'home' | 'catalog' | 'favorites';
