import { Disc, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useStore } from '@/hooks/useStore';

const shopLinks = ['All Records', 'Jazz', 'Rock', 'New Arrivals'];
const companyLinks = ['About Us', 'Contact', 'Shipping', 'Returns'];

export function Footer() {
  const [email, setEmail] = useState('');
  const { setCurrentView, setSelectedGenre } = useStore();

  const handleShopClick = (link: string) => {
    if (link === 'All Records') {
      setSelectedGenre('All');
    } else if (link === 'Jazz' || link === 'Rock') {
      setSelectedGenre(link);
    }
    setCurrentView('catalog');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    setEmail('');
  };

  return (
    <footer className="bg-[#1a1510] border-t border-amber-900/20 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Disc className="w-6 h-6 text-[#1a1510]" />
              </div>
              <span className="text-xl font-bold text-amber-100">
                The Wizard's <span className="text-amber-500">Lair</span>
              </span>
            </div>
            <p className="text-amber-100/60 text-sm leading-relaxed">
              Curating the finest vinyl records for audiophiles and music lovers since 1975.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-amber-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              Shop
            </h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link}>
                  <button
                    onClick={() => handleShopClick(link)}
                    className="text-amber-100/60 hover:text-amber-100 transition-colors text-sm"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-amber-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link}>
                  <button className="text-amber-100/60 hover:text-amber-100 transition-colors text-sm">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-amber-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              Connect
            </h4>
            <p className="text-amber-100/60 text-sm mb-4">
              Subscribe to our newsletter for exclusive drops and vinyl picks.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-amber-900/20 border border-amber-900/30 rounded-lg text-sm text-amber-100 placeholder:text-amber-100/40 focus:outline-none focus:border-amber-500/50"
              />
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-semibold px-4"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-amber-900/20 text-center">
          <p className="text-amber-100/40 text-sm">
            &copy; {new Date().getFullYear()} The Wizard's Lair. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
