import React, { useState } from 'react';
import { formatUnits } from 'viem';
import {
  Sparkles,
  Layers,
  Search,
  Clock,
  Users,
  Coins,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Flame
} from 'lucide-react';
import { useAirdropVault } from '../hooks/useAirdropVault';
import { StatusBadge, CategoryBadge } from '../components/StatusBadge';
import { TransactionModal } from '../components/TransactionModal';
import type { Campaign } from '../types';
import { CampaignCategory, CampaignStatus } from '../types';

interface MarketplacePageProps {
  onSelectCampaign: (campaign: Campaign) => void;
  onNavigate: (page: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onSelectCampaign, onNavigate }) => {
  const {
    isConnected,
    campaigns,
    isCampaignsLoading,
    protocolStatsData,
    isStatsLoading,
    botPoolBalance,
    claimReward,
    txHash,
    isTxSubmitting,
    isTxWaiting,
    isTxSuccess,
    txError,
    resetWrite,
    refetchAll,
  } = useAirdropVault();

  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<number | 'ALL'>('ALL');
  const [claimingCampaignId, setClaimingCampaignId] = useState<bigint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Protocol Stats unpacking
  const stats = protocolStatsData as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] | undefined;
  const totalCampaigns = stats ? Number(stats[0]) : campaigns.length;
  const activeCampaigns = stats ? Number(stats[1]) : campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length;
  const totalAirClaimed = stats ? Number(formatUnits(stats[2], 18)) : 0;
  const botPoolFormatted = Number(formatUnits(botPoolBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 3 });

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleQuickClaim = async (e: React.MouseEvent, campaign: Campaign) => {
    e.stopPropagation();
    if (!isConnected) {
      onSelectCampaign(campaign);
      return;
    }

    try {
      setClaimingCampaignId(campaign.campaignId);
      setErrorMessage('');
      setModalOpen(true);
      await claimReward(campaign.campaignId);
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Claim failed');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetWrite();
    setClaimingCampaignId(null);
  };

  const categories = [
    { id: 'ALL', label: 'All Campaigns' },
    { id: CampaignCategory.DAILY, label: 'Daily' },
    { id: CampaignCategory.COMMUNITY, label: 'Community' },
    { id: CampaignCategory.LEARNING, label: 'Learning' },
    { id: CampaignCategory.REFERRAL, label: 'Referral' },
    { id: CampaignCategory.ON_CHAIN, label: 'On-Chain' },
    { id: CampaignCategory.FREE_DROP, label: 'Free Drops' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0">

      {/* Hero Header Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-vault-card via-vault-darker to-vault-dark p-5 sm:p-8 md:p-12 border border-vault-border shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 sm:w-96 sm:h-96 bg-vault-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 sm:w-96 sm:h-96 bg-vault-purple/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-accent/10 border border-vault-accent/30 text-vault-accent text-xs font-semibold mb-4 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>On-Chain Reward Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 break-words">
            Discover Verified Campaigns, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-vault-accent via-cyan-300 to-vault-purple bg-clip-text text-transparent">
              Earn & Convert Real AIR
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed mb-6 sm:mb-8 max-w-2xl">
            AirdropVault bridges authorized task campaigns with transparent smart contract accounting. Complete tasks, claim genuine ERC-20 AIR tokens, and convert eligible AIR to native Bohr BOT tokens.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('convert')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-vault-accent to-vault-purple text-vault-darker font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-vault-accent/20 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>AIR → BOT Conversion Vault</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('portfolio')}
              className="px-6 py-3 rounded-xl bg-vault-dark border border-vault-border text-white text-sm font-semibold hover:border-vault-accent/40 transition-colors flex items-center justify-center w-full sm:w-auto"
            >
              View My Rewards
            </button>
          </div>
        </div>

        {/* Live Protocol Stats Bar (2 cols on mobile/tablet, 4 cols on desktop) */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-vault-border/60 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-1 min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-vault-accent shrink-0" />
              <span className="truncate">Total Campaigns</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white truncate">
              {isStatsLoading ? "..." : totalCampaigns}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">
              {activeCampaigns} Active Now
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Total AIR Claimed</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white truncate">
              {isStatsLoading ? "..." : totalAirClaimed.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Minted on-claim
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Coins className="w-3.5 h-3.5 text-vault-purple shrink-0" />
              <span className="truncate">BOT Conversion Pool</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white truncate">
              {botPoolFormatted} <span className="text-xs text-emerald-400 font-sans">BOT</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Real Bohr Liquidity
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Conversion Rate</span>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-white">
              1,000 <span className="text-xs text-vault-accent">AIR</span> → 0.1 <span className="text-xs text-emerald-400">BOT</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Configurable on-chain
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Controls */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-vault-accent text-vault-darker shadow-md shadow-vault-accent/20'
                    : 'bg-vault-card border border-vault-border text-slate-300 hover:text-white hover:border-vault-borderHover'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-vault-card border border-vault-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-accent/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-vault-card border border-vault-border text-xs text-slate-300 focus:outline-none focus:border-vault-accent/50 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value={CampaignStatus.ACTIVE}>Active</option>
                <option value={CampaignStatus.UPCOMING}>Upcoming</option>
                <option value={CampaignStatus.EXHAUSTED}>Exhausted</option>
                <option value={CampaignStatus.ENDED}>Ended</option>
              </select>

              <button
                onClick={() => refetchAll()}
                className="p-2 rounded-xl bg-vault-card border border-vault-border text-slate-400 hover:text-white hover:border-vault-accent/30 transition-colors shrink-0"
                title="Refresh Campaigns"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section>
        {isCampaignsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-vault-card border border-vault-border animate-pulse" />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-vault-card border border-vault-border px-4">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No campaigns found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchQuery || selectedCategory !== 'ALL'
                ? "No campaigns match your selected filter or search criteria."
                : "No active campaigns currently deployed in the vault."}
            </p>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredCampaigns.map((campaign) => {
              const rewardFormatted = Number(formatUnits(campaign.rewardPerUser, 18)).toLocaleString();
              const remainingFormatted = Number(formatUnits(campaign.remainingAllocation, 18)).toLocaleString();
              const totalAllocFormatted = Number(formatUnits(campaign.totalAllocation, 18)).toLocaleString();
              const maxParts = Number(campaign.maximumParticipants);
              const currentParts = Number(campaign.currentParticipants);
              const progressPct = maxParts > 0 ? Math.min(100, Math.round((currentParts / maxParts) * 100)) : 0;

              const nowSec = Math.floor(Date.now() / 1000);
              const deadlineSec = Number(campaign.claimDeadline);
              const daysLeft = Math.max(0, Math.ceil((deadlineSec - nowSec) / 86400));

              return (
                <div
                  key={campaign.campaignId.toString()}
                  onClick={() => onSelectCampaign(campaign)}
                  className="group relative flex flex-col justify-between rounded-2xl bg-vault-card hover:bg-vault-cardHover border border-vault-border hover:border-vault-borderHover transition-all duration-300 p-5 sm:p-6 cursor-pointer shadow-xl hover:shadow-vault-accent/5 hover:-translate-y-1 min-w-0"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <CategoryBadge category={campaign.category} />
                      <StatusBadge status={campaign.status ?? 1} />
                    </div>

                    {/* Campaign Title & Description */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-vault-accent transition-colors line-clamp-1 mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6">
                      {campaign.description}
                    </p>

                    {/* Reward Pill */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-vault-dark border border-vault-border/80 flex items-center justify-between mb-5 sm:mb-6">
                      <span className="text-xs text-slate-400 font-medium">Reward Per User</span>
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-vault-accent shrink-0" />
                        <span className="font-mono text-base sm:text-lg font-extrabold text-white">{rewardFormatted}</span>
                        <span className="text-xs font-bold text-vault-accent">AIR</span>
                      </div>
                    </div>

                    {/* Allocation & Participants Progress */}
                    <div className="space-y-3 mb-5 sm:mb-6">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          Participants
                        </span>
                        <span className="font-mono text-slate-200">
                          {currentParts} / {maxParts} ({progressPct}%)
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-vault-dark overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-vault-accent to-vault-purple rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                        <span>Remaining: <strong className="font-mono text-slate-300">{remainingFormatted} AIR</strong></span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-4 border-t border-vault-border/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 font-mono truncate max-w-[130px]">
                      {campaign.verificationType}
                    </span>

                    <button
                      onClick={(e) => handleQuickClaim(e, campaign)}
                      disabled={campaign.status !== CampaignStatus.ACTIVE}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        campaign.status === CampaignStatus.ACTIVE
                          ? 'bg-vault-accent/15 text-vault-accent border border-vault-accent/30 hover:bg-vault-accent hover:text-vault-darker'
                          : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{campaign.status === CampaignStatus.ACTIVE ? "Claim / View" : "Ended"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        isPending={isTxSubmitting}
        isWaiting={isTxWaiting}
        isSuccess={isTxSuccess}
        txHash={txHash}
        errorMessage={errorMessage || txError?.message}
        title="Claiming AIR Reward"
      />
    </div>
  );
};
