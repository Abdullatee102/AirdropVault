import React, { useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle2,
  ExternalLink,
  Flame,
  Lock,
  UserCheck,
  Send,
  ShieldCheck
} from 'lucide-react';
import { AIRDROP_VAULT_ABI } from '../abi/AirdropVaultAbi';
import { AIRDROP_VAULT_ADDRESS, BOHR_EXPLORER_URL } from '../config/constants';
import { useAirdropVault } from '../hooks/useAirdropVault';
import { StatusBadge, CategoryBadge } from '../components/StatusBadge';
import { TransactionModal } from '../components/TransactionModal';
import type { Campaign } from '../types';
import { CampaignStatus } from '../types';

interface CampaignDetailPageProps {
  campaign: Campaign;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaign, onBack, onNavigate }) => {
  const {
    address,
    isConnected,
    isVerifier,
    claimReward,
    approveUserEligibility,
    txHash,
    isTxSubmitting,
    isTxWaiting,
    isTxSuccess,
    txError,
    resetWrite,
    refetchAll,
  } = useAirdropVault();

  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Read User's specific campaign state (claimed, eligible)
  const { data: userStateData, refetch: refetchUserState } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getUserCampaignState',
    args: address ? [campaign.campaignId, address] : undefined,
  });

  const [hasClaimed, hasEligibility] = userStateData ? (userStateData as [boolean, boolean]) : [false, false];

  const rewardFormatted = Number(formatUnits(campaign.rewardPerUser, 18)).toLocaleString();
  const remainingFormatted = Number(formatUnits(campaign.remainingAllocation, 18)).toLocaleString();
  const totalAllocFormatted = Number(formatUnits(campaign.totalAllocation, 18)).toLocaleString();
  const maxParts = Number(campaign.maximumParticipants);
  const currentParts = Number(campaign.currentParticipants);
  const progressPct = maxParts > 0 ? Math.min(100, Math.round((currentParts / maxParts) * 100)) : 0;

  const startDate = new Date(Number(campaign.startTime) * 1000).toLocaleString();
  const deadlineDate = new Date(Number(campaign.claimDeadline) * 1000).toLocaleString();

  const handleClaim = async () => {
    try {
      setErrorMessage('');
      setModalOpen(true);
      await claimReward(campaign.campaignId);
      await refetchUserState();
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Claim failed');
    }
  };

  const handleVerifierApproveSelf = async () => {
    if (!address) return;
    try {
      setErrorMessage('');
      setModalOpen(true);
      await approveUserEligibility(campaign.campaignId, address);
      await refetchUserState();
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Approval failed');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetWrite();
    refetchUserState();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </button>

      {/* Main Campaign Card */}
      <div className="rounded-3xl bg-vault-card border border-vault-border p-6 sm:p-10 shadow-2xl space-y-8">
      <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-8 md:p-10 shadow-2xl space-y-6 sm:space-y-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-vault-border/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={campaign.category} />
              <StatusBadge status={campaign.status ?? 1} />
              <span className="text-xs font-mono text-slate-500">ID #{campaign.campaignId.toString()}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {campaign.title}
            </h1>
          </div>

          <div className="flex flex-col items-start sm:items-end bg-vault-dark p-4 rounded-2xl border border-vault-border/80">
          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-vault-dark p-3.5 sm:p-4 rounded-2xl border border-vault-border/80">
            <span className="text-xs text-slate-400 font-medium">Configured Reward</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Flame className="w-5 h-5 text-vault-accent" />
              <span className="font-mono text-2xl font-black text-white">{rewardFormatted}</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-white">{rewardFormatted}</span>
              <span className="text-xs font-bold text-vault-accent">AIR</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Overview</h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {campaign.description}
          </p>
        </div>

        {/* Economic Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-vault-dark border border-vault-border/60 text-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-vault-dark border border-vault-border/60 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500">Remaining Allocation</span>
            <div className="font-mono text-sm font-bold text-slate-200">{remainingFormatted} AIR</div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-200">{remainingFormatted} AIR</div>
            <span className="text-[10px] text-slate-500">of {totalAllocFormatted} AIR</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500">Participants Cap</span>
            <div className="font-mono text-sm font-bold text-slate-200">{currentParts} / {maxParts}</div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-200">{currentParts} / {maxParts}</div>
            <span className="text-[10px] text-emerald-400 font-medium">{progressPct}% Claimed</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500">Start Time</span>
            <div className="font-mono text-[11px] text-slate-300 truncate">{startDate}</div>
            <div className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">{startDate}</div>
            <span className="text-[10px] text-slate-500">On-Chain Verified</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500">Claim Deadline</span>
            <div className="font-mono text-[11px] text-slate-300 truncate">{deadlineDate}</div>
            <div className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">{deadlineDate}</div>
            <span className="text-[10px] text-slate-500">Strict Enforcement</span>
          </div>
        </div>

        {/* Allocation Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Campaign Capacity</span>
            <span className="font-mono text-vault-accent font-bold">{progressPct}% Filled</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-vault-dark overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-vault-accent via-cyan-400 to-vault-purple rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* User Eligibility & Claim Status Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-vault-darker to-vault-dark border border-vault-borderHover/30 space-y-5">
          <div className="flex items-center justify-between">
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-vault-darker to-vault-dark border border-vault-borderHover/30 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-vault-accent" />
              <UserCheck className="w-4 h-4 text-vault-accent shrink-0" />
              <span>Your Participation Status</span>
            </h3>
            {isConnected && (
              <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]">
              <span className="text-xs font-mono text-slate-400 truncate max-w-[120px] sm:max-w-[200px]">
                {address}
              </span>
            )}
          </div>

          {!isConnected ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-3">
              <p className="text-xs text-slate-400">Connect your wallet to check your eligibility and claim AIR rewards.</p>
              <appkit-button />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                {/* Eligibility Pill */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  hasEligibility
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {hasEligibility ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}
                  <div>
                    <div className="font-bold">{hasEligibility ? "Eligibility Verified" : "Awaiting Verification"}</div>
                    <div className="text-[11px] opacity-80">
                      {hasEligibility ? "You are authorized to claim this campaign reward." : "Complete the task below to verify eligibility."}
                    </div>
                  </div>
                </div>

                {/* Claim Status Pill */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  hasClaimed
                    ? 'bg-vault-accent/10 border-vault-accent/30 text-vault-accent'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  {hasClaimed ? <CheckCircle2 className="w-5 h-5 text-vault-accent shrink-0" /> : <Lock className="w-5 h-5 text-slate-500 shrink-0" />}
                  <div>
                    <div className="font-bold">{hasClaimed ? "Reward Claimed" : "Reward Unclaimed"}</div>
                    <div className="text-[11px] opacity-80">
                      {hasClaimed ? "AIR tokens are in your wallet." : "Claimable once verified & active."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Section */}
              <div className="p-4 rounded-xl bg-vault-dark border border-vault-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Requirement Method:</span>
                  <span className="px-2 py-0.5 rounded bg-vault-accent/10 text-vault-accent text-[11px] font-mono">
                    {campaign.verificationType}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Participate in Bohr ecosystem tasks matching this campaign rule. Once completed, your wallet address is verified on-chain by authorized verifiers.
                </p>

                {/* Interactive Task Completion Simulator */}
                {!hasEligibility && !hasClaimed && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setTaskCompleted(true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        taskCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{taskCompleted ? "Task Marked as Completed" : "Mark Task as Completed"}</span>
                    </button>

                    {isVerifier && (
                      <button
                        onClick={handleVerifierApproveSelf}
                        className="py-2.5 px-4 rounded-xl bg-vault-purple/20 hover:bg-vault-purple/30 border border-vault-purple/40 text-vault-purple text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verifier: Authorize Wallet</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Claim Action Button */}
              <div>
                {hasClaimed ? (
                  <div className="p-4 rounded-xl bg-vault-accent/10 border border-vault-accent/30 text-center space-y-2">
                    <div className="text-sm font-bold text-vault-accent">Reward Successfully Claimed!</div>
                    <p className="text-xs text-slate-400">
                      You have already claimed {rewardFormatted} AIR for this campaign. You can now hold your AIR or convert it into native BOT in the Conversion Vault.
                    </p>
                    <button
                      onClick={() => onNavigate('convert')}
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vault-accent text-vault-darker font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                      <span>Open Conversion Vault</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={!hasEligibility || campaign.status !== CampaignStatus.ACTIVE}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                      hasEligibility && campaign.status === CampaignStatus.ACTIVE
                        ? 'bg-gradient-to-r from-vault-accent via-cyan-400 to-vault-purple text-vault-darker hover:opacity-95 shadow-vault-accent/20 cursor-pointer scale-[1.01]'
                        : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {campaign.status !== CampaignStatus.ACTIVE
                        ? "Campaign Not Active"
                        : hasEligibility
                        ? `Claim ${rewardFormatted} AIR Now`
                        : "Verify Eligibility to Claim"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Creator & Explorer Reference */}
        <div className="pt-4 border-t border-vault-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span className="font-mono">Creator: {campaign.creator}</span>
          <span className="font-mono text-[11px] sm:text-xs truncate max-w-full sm:max-w-md">Creator: {campaign.creator}</span>
          <a
            href={`${BOHR_EXPLORER_URL}address/${AIRDROP_VAULT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-vault-accent hover:underline flex items-center gap-1"
          >
            <span>View Contract on BohrScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        isPending={isTxSubmitting}
        isWaiting={isTxWaiting}
        isSuccess={isTxSuccess}
        txHash={txHash}
        errorMessage={errorMessage || txError?.message}
        title="Claiming Campaign Reward"
      />
    </div>
  );
};
