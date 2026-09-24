import React, { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { useAppKit } from '@reown/appkit/react';
import {
  Coins,
  Layers,
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  Activity,
  Menu,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { BOHR_CHAIN_ID } from '../config/constants';
import { useAirdropVault } from '../hooks/useAirdropVault';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { userAirBalance, isCampaignManager, isVerifier, isTreasuryManager, isPauser, isAdmin } = useAirdropVault();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWrongNetwork = isConnected && chainId !== BOHR_CHAIN_ID;
  const hasAdminPrivileges = isConnected && (isAdmin || isCampaignManager || isVerifier || isTreasuryManager || isPauser);

  const formattedAir = isConnected ? Number(formatUnits(userAirBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00";

  const navItems = [
    { id: 'marketplace', label: 'Marketplace', icon: Layers },
    { id: 'convert', label: 'Convert AIR', icon: ArrowRightLeft },
    { id: 'portfolio', label: 'My Rewards', icon: Wallet },
    { id: 'activity', label: 'Activity', icon: Activity },
    ...(hasAdminPrivileges ? [{ id: 'admin', label: 'Protocol Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-vault-border bg-vault-dark/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-vault-accent via-cyan-400 to-vault-purple p-0.5 shadow-lg shadow-vault-accent/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-vault-darker rounded-[14px] flex items-center justify-center">
                <Coins className="w-6 h-6 text-vault-accent group-hover:rotate-12 transition-transform duration-300" />
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-vault-accent via-cyan-400 to-vault-purple p-0.5 shadow-lg shadow-vault-accent/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-vault-darker rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-vault-accent group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-mono">Airdrop<span className="text-vault-accent">Vault</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-vault-accent/15 text-vault-accent border border-vault-accent/30 tracking-wider">V1</span>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white font-mono">Airdrop<span className="text-vault-accent">Vault</span></span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded bg-vault-accent/15 text-vault-accent border border-vault-accent/30 tracking-wider">V1</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">Bohr Campaign Marketplace</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">Bohr Campaign Marketplace</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-vault-card border border-vault-borderHover text-vault-accent shadow-md shadow-vault-accent/5'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-vault-accent' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden sm:flex items-center gap-3">
          {/* Right Action Bar (Desktop & Tablets) */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
            {/* Network Indicator */}
            {isConnected && (
              isWrongNetwork ? (
                <button
                  onClick={() => switchChain?.({ chainId: BOHR_CHAIN_ID })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Switch to Bohr</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-vault-card border border-vault-border text-xs text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Bohr Testnet</span>
                  <span className="hidden xl:inline">Bohr Testnet</span>
                  <span className="xl:hidden">Bohr</span>
                </div>
              )
            )}

            {/* AIR Balance Quick Pill */}
            {isConnected && !isWrongNetwork && (
              <div
                onClick={() => onNavigate('portfolio')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-vault-accent/10 to-vault-purple/10 border border-vault-accent/30 text-xs font-semibold text-white cursor-pointer hover:border-vault-accent/60 transition-all shadow-sm"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-vault-accent/10 to-vault-purple/10 border border-vault-accent/30 text-xs font-semibold text-white cursor-pointer hover:border-vault-accent/60 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-vault-accent" />
                <span className="font-mono text-vault-accent">{formattedAir}</span>
                <span className="text-slate-400 font-normal">AIR</span>
              </div>
            )}

            {/* Wallet Connect Button */}
            <appkit-button />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <appkit-button />
          {/* Mobile & Small Tablet Menu Button */}
          <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
            <div className="scale-90 sm:scale-100 origin-right">
              <appkit-button />
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-vault-card border border-vault-border text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
              className="p-2 sm:p-2.5 rounded-xl bg-vault-card border border-vault-border text-slate-300 hover:text-white shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-vault-border bg-vault-darker/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
        <div className="md:hidden border-t border-vault-border bg-vault-darker/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Network Alert if Wrong Network */}
          {isConnected && isWrongNetwork && (
            <div className="p-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Wrong Network</span>
              </div>
              <button
                onClick={() => {
                  switchChain?.({ chainId: BOHR_CHAIN_ID });
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
              >
                Switch to Bohr
              </button>
            </div>
          )}

          {/* Connected Network & Balance Pill on Mobile */}
          {isConnected && !isWrongNetwork && (
            <div className="p-3 mb-2 rounded-xl bg-vault-card border border-vault-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">Bohr Testnet</span>
              </div>
              <div
                onClick={() => {
                  onNavigate('portfolio');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-vault-accent font-mono font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{formattedAir} AIR</span>
              </div>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-vault-card border border-vault-accent/40 text-vault-accent'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-vault-accent' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isConnected && (
            <div className="pt-4 border-t border-vault-border/50 flex items-center justify-between text-xs px-2 text-slate-400">
              <span>Your AIR Balance:</span>
              <span className="font-mono text-vault-accent font-bold text-sm">{formattedAir} AIR</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
