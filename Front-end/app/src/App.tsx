import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { FavoritesDrawer } from '@/components/FavoritesDrawer';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Hero } from '@/sections/Hero';
import { BestSellers } from '@/sections/BestSellers';
import { BrowseByGenre } from '@/sections/BrowseByGenre';
import { NewArrivals } from '@/sections/NewArrivals';
import { Stats } from '@/sections/Stats';
import { Footer } from '@/sections/Footer';
import { Catalog } from '@/sections/Catalog';
import { LoginPage } from '@/sections/LoginPage';
import { RegisterPage } from '@/sections/RegisterPage';
import { useStore } from '@/hooks/useStore';
import './App.css';

type AppView = 'main' | 'login' | 'register';

function HomePage() {
  return (
    <>
      <Hero />
      <BestSellers />
      <BrowseByGenre />
      <NewArrivals />
      <Stats />
      <Footer />
    </>
  );
}

function AppContent() {
  const { currentView } = useStore();
  const [appView, setAppView] = useState<AppView>('main');

  // Listen for login event from Navbar button
  useEffect(() => {
    const handleOpenLogin = () => setAppView('login');
    window.addEventListener('auth:openLogin', handleOpenLogin);
    return () => window.removeEventListener('auth:openLogin', handleOpenLogin);
  }, []);

  if (appView === 'login') {
    return (
      <LoginPage
        onNavigateToRegister={() => setAppView('register')}
        onLoginSuccess={() => setAppView('main')}
      />
    );
  }

  if (appView === 'register') {
    return (
      <RegisterPage
        onNavigateToLogin={() => setAppView('login')}
        onRegisterSuccess={() => setAppView('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1510]">
      <Navbar />
      <main>
        {currentView === 'home' ? <HomePage /> : <Catalog />}
      </main>
      <CartDrawer />
      <FavoritesDrawer />
      <MusicPlayer />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
