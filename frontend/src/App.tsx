import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config/wagmi';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MarketplacePage } from './pages/MarketplacePage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { ConvertPage } from './pages/ConvertPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AdminPage } from './pages/AdminPage';
import { ActivityPage } from './pages/ActivityPage';
import { Campaign } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 5000,
    },
  },
});

export function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('marketplace');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentPage('detail');
  };

  const handleBackToMarketplace = () => {
    setSelectedCampaign(null);
    setCurrentPage('marketplace');
  };

  const handleNavigate = (page: string) => {
    setSelectedCampaign(null);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {currentPage === 'marketplace' && (
          <MarketplacePage
            onSelectCampaign={handleSelectCampaign}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'detail' && selectedCampaign && (
          <CampaignDetailPage
            campaign={selectedCampaign}
            onBack={handleBackToMarketplace}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'convert' && (
          <ConvertPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'portfolio' && (
          <PortfolioPage
            onSelectCampaign={handleSelectCampaign}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage />
        )}

        {currentPage === 'activity' && (
          <ActivityPage />
        )}
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
