import React, { useState } from 'react';
import { formatUnits } from 'viem';
import {
  Wallet,
  Sparkles,
  Coins,
  ArrowRightLeft,
  Flame,
  PlusCircle,
  Send
} from 'lucide-react';
import { useAirdropVault } from '../hooks/useAirdropVault';
import { StatusBadge, CategoryBadge } from '../components/StatusBadge';
import { AIRDROP_VAULT_ADDRESS } from '../config/constants';
import type { Campaign } from '../types';

interface PortfolioPageProps {
  onSelectCampaign: (campaign: Campaign) => void;
  onNavigate: (page: string) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectCampaign, onNavigate }) => {
  const {
    address,
    isConnected,
    userAirBalance,
    userStatsData,
    campaigns,
  } = useAirdropVault();

  const [addedToken, setAddedToken] = useState(false);

  // User Stats unpacking
  const userStats = userStatsData as [bigint, bigint, bigint, bigint] | undefined;
  const airBalanceFormatted = Number(formatUnits(userAirBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const totalClaimedFormatted = userStats ? Number(formatUnits(userStats[1], 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00";
  const totalConvertedFormatted = userStats ? Number(formatUnits(userStats[2], 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00";
  const totalBotReceivedFormatted = userStats ? Number(formatUnits(userStats[3], 18)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0.0000";

  const addAirToWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: AIRDROP_VAULT_ADDRESS,
              symbol: 'AIR',
              decimals: 18,
              image: 'https://avatars.githubusercontent.com/u/179229932',
            },
          },
        });
        setAddedToken(true);
        setTimeout(() => setAddedToken(false), 3000);
      } catch (err) {
        console.error('Failed to add token to wallet', err);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-vault-card border border-vault-border flex items-center justify-center mx-auto text-vault-accent">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-xs text-slate-400">Connect your Web3 wallet to view your AIR portfolio, claim history, and conversion earnings.</p>
        </div>
        <div className="flex justify-center">
          <appkit-button />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vault-accent/10 border border-vault-accent/30 text-vault-accent text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>My Reward Portfolio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Rewards & Holdings</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Connected: {address}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addAirToWallet}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vault-accent/15 border border-vault-accent/40 text-vault-accent text-xs font-bold hover:bg-vault-accent hover:text-vault-darker transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{addedToken ? "Added to Wallet!" : "Add AIR to MetaMask"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Current AIR Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-vault-card to-vault-dark border border-vault-border space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current AIR Balance</span>
            <div className="p-2 rounded-xl bg-vault-accent/10 text-vault-accent">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-mono text-white">{airBalanceFormatted}</div>
            <div className="text-[11px] text-vault-accent font-semibold">ERC-20 AIR In Wallet</div>
          </div>
        </div>

        {/* Total AIR Earned */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-vault-card to-vault-dark border border-vault-border space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Lifetime AIR Claimed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-mono text-white">{totalClaimedFormatted}</div>
            <div className="text-[11px] text-emerald-400 font-semibold">Earned from Campaigns</div>
          </div>
        </div>

        {/* Total AIR Converted */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-vault-card to-vault-dark border border-vault-border space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total AIR Converted</span>
            <div className="p-2 rounded-xl bg-vault-purple/10 text-vault-purple">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-mono text-white">{totalConvertedFormatted}</div>
            <div className="text-[11px] text-slate-400 font-semibold">Burned on Conversion</div>
          </div>
        </div>

        {/* Total Native BOT Received */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-vault-card to-vault-dark border border-vault-border space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Native BOT Received</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-mono text-white">{totalBotReceivedFormatted}</div>
            <div className="text-[11px] text-emerald-400 font-semibold">Bohr Native Gas Asset</div>
          </div>
        </div>
      </div>

      {/* Convert Call to Action Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-vault-accent/15 via-vault-darker to-vault-purple/15 border border-vault-accent/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Convert Your AIR into Native BOT</h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Eligible AIR can be converted into Bohr Testnet native BOT at the protocol rate of 1,000 AIR → 0.1 BOT. Converted AIR is burned and BOT is transferred directly to your wallet.
          </p>
        </div>

        <button
          onClick={() => onNavigate('convert')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-vault-accent to-vault-purple text-vault-darker font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-vault-accent/20"
        >
          <span>Open Conversion Vault</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Campaigns Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Explore Available Campaigns</h3>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs text-vault-accent font-semibold hover:underline"
          >
            View All in Marketplace
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.slice(0, 3).map((campaign) => (
            <div
              key={campaign.campaignId.toString()}
              onClick={() => onSelectCampaign(campaign)}
              className="p-5 rounded-2xl bg-vault-card hover:bg-vault-cardHover border border-vault-border hover:border-vault-borderHover transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <CategoryBadge category={campaign.category} />
                <StatusBadge status={campaign.status ?? 1} />
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{campaign.title}</h4>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Reward:</span>
                <span className="font-mono text-vault-accent font-bold">
                  {Number(formatUnits(campaign.rewardPerUser, 18)).toLocaleString()} AIR
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
