import React, { useState } from 'react';
import { formatUnits } from 'viem';
import {
  ShieldCheck,
  PlusCircle,
  Coins,
  UserCheck,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useAirdropVault } from '../hooks/useAirdropVault';
import { TransactionModal } from '../components/TransactionModal';
import { CampaignCategory } from '../types';
import { CATEGORY_LABELS } from '../config/constants';

export const AdminPage: React.FC = () => {
  const {
    isConnected,
    isAdmin,
    isCampaignManager,
    isVerifier,
    isTreasuryManager,
    isPauser,
    isPaused,
    campaigns,
    botPoolBalance,
    createCampaign,
    approveUserEligibility,
    batchApproveUserEligibility,
    pauseCampaign,
    unpauseCampaign,
    cancelCampaign,
    depositBot,
    setConversionRate,
    setConversionLimits,
    pauseProtocol,
    unpauseProtocol,
    txHash,
    isTxSubmitting,
    isTxWaiting,
    isTxSuccess,
    txError,
    resetWrite,
    refetchAll,
  } = useAirdropVault();

  const [activeTab, setActiveTab] = useState<'create' | 'eligibility' | 'treasury' | 'emergency'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create Campaign Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<number>(CampaignCategory.COMMUNITY);
  const [rewardPerUser, setRewardPerUser] = useState('200');
  const [totalAllocation, setTotalAllocation] = useState('20000');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [durationDays, setDurationDays] = useState('30');
  const [verificationType, setVerificationType] = useState('VERIFIER_TASK');

  // Eligibility Form State
  const [targetCampaignId, setTargetCampaignId] = useState<string>('1');
  const [singleUserAddress, setSingleUserAddress] = useState('');
  const [batchUserAddresses, setBatchUserAddresses] = useState('');

  // Treasury Form State
  const [botDepositAmount, setBotDepositAmount] = useState('0.5');
  const [newRateAir, setNewRateAir] = useState('1000');
  const [newRateBot, setNewRateBot] = useState('0.1');
  const [newMinAir, setNewMinAir] = useState('1000');
  const [newMaxAir, setNewMaxAir] = useState('100000');

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      const startTime = Math.floor(Date.now() / 1000);
      const claimDeadline = startTime + Number(durationDays) * 86400;

      await createCampaign(
        title,
        description,
        category,
        rewardPerUser,
        totalAllocation,
        Number(maxParticipants),
        startTime,
        claimDeadline,
        verificationType
      );
      await refetchAll();
      setTitle('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to create campaign');
    }
  };

  const handleSingleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      await approveUserEligibility(BigInt(targetCampaignId), singleUserAddress as `0x${string}`);
      await refetchAll();
      setSingleUserAddress('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to approve user');
    }
  };

  const handleBatchApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      const addresses = batchUserAddresses
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a.startsWith('0x')) as `0x${string}`[];

      if (addresses.length === 0) {
        throw new Error('No valid Ethereum addresses found.');
      }

      await batchApproveUserEligibility(BigInt(targetCampaignId), addresses);
      await refetchAll();
      setBatchUserAddresses('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to batch approve users');
    }
  };

  const handleDepositBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      await depositBot(botDepositAmount);
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Deposit failed');
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      await setConversionRate(newRateAir, newRateBot);
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to update rate');
    }
  };

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setModalOpen(true);
      await setConversionLimits(newMinAir, newMaxAir);
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to update limits');
    }
  };

  const handleToggleEmergencyPause = async () => {
    try {
      setErrorMessage('');
      setModalOpen(true);
      if (isPaused) {
        await unpauseProtocol();
      } else {
        await pauseProtocol();
      }
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Failed to toggle pause state');
    }
  };

  const handleCampaignAction = async (action: 'pause' | 'unpause' | 'cancel', campaignId: bigint) => {
    try {
      setErrorMessage('');
      setModalOpen(true);
      if (action === 'pause') await pauseCampaign(campaignId);
      if (action === 'unpause') await unpauseCampaign(campaignId);
      if (action === 'cancel') await cancelCampaign(campaignId);
      await refetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Campaign action failed');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetWrite();
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto py-16 sm:py-20 text-center space-y-4 px-4">
        <ShieldCheck className="w-12 h-12 text-vault-accent mx-auto" />
        <h2 className="text-xl font-bold text-white">Connect Authorized Wallet</h2>
        <p className="text-xs text-slate-400">Connect a wallet possessing administrative or operational roles on AirdropVault.</p>
        <div className="flex justify-center pt-2">
          <appkit-button balance="hide" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 min-w-0">

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vault-accent/10 border border-vault-accent/30 text-vault-accent text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Protocol Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">AirdropVault Management</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Role-bounded smart contract configuration</p>
        </div>

        {/* Roles Badges */}
        <div className="flex flex-wrap gap-2 text-[11px] font-mono">
          {isAdmin && <span className="px-2.5 py-1 rounded-md bg-vault-accent/10 text-vault-accent border border-vault-accent/30">DEFAULT_ADMIN</span>}
          {isCampaignManager && <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">CAMPAIGN_MANAGER</span>}
          {isVerifier && <span className="px-2.5 py-1 rounded-md bg-vault-purple/10 text-vault-purple border border-vault-purple/30">VERIFIER</span>}
          {isTreasuryManager && <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">TREASURY_MANAGER</span>}
          {isPauser && <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">PAUSER</span>}
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-vault-border pb-3 overflow-x-auto scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'create'
              ? 'bg-vault-accent text-vault-darker shadow-md shadow-vault-accent/20'
              : 'bg-vault-card border border-vault-border text-slate-300 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Create Campaign</span>
        </button>

        <button
          onClick={() => setActiveTab('eligibility')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'eligibility'
              ? 'bg-vault-accent text-vault-darker shadow-md shadow-vault-accent/20'
              : 'bg-vault-card border border-vault-border text-slate-300 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Authorize Eligibility</span>
        </button>

        <button
          onClick={() => setActiveTab('treasury')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'treasury'
              ? 'bg-vault-accent text-vault-darker shadow-md shadow-vault-accent/20'
              : 'bg-vault-card border border-vault-border text-slate-300 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span>Treasury & Rates</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'emergency'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
              : 'bg-vault-card border border-vault-border text-slate-300 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Emergency Controls</span>
        </button>
      </div>

      {/* Tab 1: Create Campaign Wizard */}
      {activeTab === 'create' && (
        <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-8 space-y-6 min-w-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-vault-accent shrink-0" />
              <span>Create New Campaign</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Authorized campaign managers define bounded reward parameters. Economic relationships are enforced by the contract.
            </p>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bohr DeFi Sprint"
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white focus:outline-none focus:border-vault-accent cursor-pointer"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description / Task Reference</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the campaign task and requirements..."
                className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white focus:outline-none focus:border-vault-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">AIR Reward Per User</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={rewardPerUser}
                  onChange={(e) => setRewardPerUser(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Maximum Participants</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Total Campaign Allocation (AIR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalAllocation}
                  onChange={(e) => setTotalAllocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Verification Identifier</label>
                <input
                  type="text"
                  required
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isCampaignManager}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isCampaignManager
                  ? 'bg-gradient-to-r from-vault-accent to-vault-purple text-vault-darker hover:opacity-95'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isCampaignManager ? "Deploy Campaign to Bohr Testnet" : "Requires CAMPAIGN_MANAGER_ROLE"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Eligibility Verification */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">

          {/* Single User Approval */}
          <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-6 space-y-4 min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-vault-accent shrink-0" />
              <span>Single User Approval</span>
            </h3>

            <form onSubmit={handleSingleApprove} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Campaign ID</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetCampaignId}
                  onChange={(e) => setTargetCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">User Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={singleUserAddress}
                  onChange={(e) => setSingleUserAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <button
                type="submit"
                disabled={!isVerifier}
                className="w-full py-2.5 rounded-xl bg-vault-accent text-vault-darker text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Authorize User Eligibility
              </button>
            </form>
          </div>

          {/* Batch Approval */}
          <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-6 space-y-4 min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-vault-purple shrink-0" />
              <span>Batch User Approval</span>
            </h3>

            <form onSubmit={handleBatchApprove} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Campaign ID</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetCampaignId}
                  onChange={(e) => setTargetCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Addresses (One per line)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="0x123...&#10;0x456..."
                  value={batchUserAddresses}
                  onChange={(e) => setBatchUserAddresses(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <button
                type="submit"
                disabled={!isVerifier}
                className="w-full py-2.5 rounded-xl bg-vault-purple text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Batch Authorize Wallets
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Treasury & Rate Management */}
      {activeTab === 'treasury' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">

          {/* Deposit BOT */}
          <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-6 space-y-4 min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fund BOT Conversion Pool</span>
            </h3>
            <p className="text-xs text-slate-400">
              Current Pool Balance: <strong className="font-mono text-emerald-400">{Number(formatUnits(botPoolBalance, 18)).toFixed(4)} BOT</strong>
            </p>

            <form onSubmit={handleDepositBot} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Deposit Amount (Native BOT)</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.001"
                  value={botDepositAmount}
                  onChange={(e) => setBotDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-vault-dark border border-vault-border text-xs text-white font-mono focus:outline-none focus:border-vault-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-vault-darker text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Deposit BOT into Pool
              </button>
            </form>
          </div>

          {/* Update Rate & Limits */}
          <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-6 space-y-4 min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-vault-accent shrink-0" />
              <span>Configure Rate & Limits</span>
            </h3>

            <form onSubmit={handleUpdateRate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Rate AIR</label>
                  <input
                    type="number"
                    value={newRateAir}
                    onChange={(e) => setNewRateAir(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-vault-dark border border-vault-border text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Rate BOT</label>
                  <input
                    type="number"
                    step="any"
                    value={newRateBot}
                    onChange={(e) => setNewRateBot(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-vault-dark border border-vault-border text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isTreasuryManager}
                className="w-full py-2 rounded-lg bg-vault-card border border-vault-border text-xs font-bold text-vault-accent hover:border-vault-accent"
              >
                Update Conversion Rate
              </button>
            </form>

            <form onSubmit={handleUpdateLimits} className="space-y-3 pt-3 border-t border-vault-border/60">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Min AIR</label>
                  <input
                    type="number"
                    value={newMinAir}
                    onChange={(e) => setNewMinAir(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-vault-dark border border-vault-border text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Max AIR</label>
                  <input
                    type="number"
                    value={newMaxAir}
                    onChange={(e) => setNewMaxAir(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-vault-dark border border-vault-border text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isTreasuryManager}
                className="w-full py-2 rounded-lg bg-vault-card border border-vault-border text-xs font-bold text-vault-accent hover:border-vault-accent"
              >
                Update Conversion Limits
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Emergency Controls & Campaign Toggles */}
      {activeTab === 'emergency' && (
        <div className="space-y-6 min-w-0">

          {/* Global Pause Protocol */}
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
            isPaused
              ? 'bg-red-500/10 border-red-500/40 text-red-300'
              : 'bg-vault-card border-vault-border text-slate-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-6 h-6 shrink-0 ${isPaused ? 'text-red-400' : 'text-amber-400'}`} />
                <div>
                  <h3 className="text-base font-bold text-white">Emergency Protocol Pause</h3>
                  <p className="text-xs text-slate-400">
                    {isPaused
                      ? "The protocol is currently PAUSED. Claims and conversions are blocked."
                      : "The protocol is active and functioning normally."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleEmergencyPause}
                disabled={!isPauser}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all w-full sm:w-auto shrink-0 ${
                  isPaused
                    ? 'bg-emerald-500 text-vault-darker hover:opacity-90'
                    : 'bg-red-500 text-white hover:opacity-90'
                }`}
              >
                {isPaused ? "Unpause Protocol" : "Emergency Pause"}
              </button>
            </div>
          </div>

          {/* Individual Campaign Lifecycle Controls */}
          <div className="rounded-3xl bg-vault-card border border-vault-border p-5 sm:p-6 space-y-4 min-w-0">
            <h3 className="text-base font-bold text-white">Manage Active Campaigns</h3>
            <div className="divide-y divide-vault-border/60">
              {campaigns.map((c) => (
                <div key={c.campaignId.toString()} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-white block sm:inline break-words">#{c.campaignId.toString()} - {c.title}</span>
                    <div className="text-[11px] text-slate-400">
                      Remaining: {Number(formatUnits(c.remainingAllocation, 18)).toLocaleString()} AIR
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.isPaused ? (
                      <button
                        onClick={() => handleCampaignAction('unpause', c.campaignId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-vault-darker"
                      >
                        Unpause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCampaignAction('pause', c.campaignId)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500 hover:text-vault-darker"
                      >
                        Pause
                      </button>
                    )}

                    {!c.isCancelled && (
                      <button
                        onClick={() => handleCampaignAction('cancel', c.campaignId)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-bold hover:bg-red-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        isPending={isTxSubmitting}
        isWaiting={isTxWaiting}
        isSuccess={isTxSuccess}
        txHash={txHash}
        errorMessage={errorMessage || txError?.message}
        title="Admin Transaction"
      />
    </div>
  );
};
