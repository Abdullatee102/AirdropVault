import React, { useState } from 'react';
import { ExternalLink, Copy, Check, PlusCircle, Coins, ShieldCheck, Cpu } from 'lucide-react';
import { AIRDROP_VAULT_ADDRESS, BOHR_EXPLORER_URL } from '../config/constants';

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [addedToken, setAddedToken] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(AIRDROP_VAULT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <footer className="w-full border-t border-vault-border bg-vault-darker/90 backdrop-blur-xl mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-vault-accent to-vault-purple flex items-center justify-center">
                <Coins className="w-4 h-4 text-vault-darker" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-mono">Airdrop<span className="text-vault-accent">Vault</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              AirdropVault is an on-chain reward campaign marketplace and AIR-to-BOT conversion system on Bohr Testnet. Complete verified tasks, claim genuine AIR ERC-20 tokens, and convert eligible AIR to native BOT through a funded liquidity pool.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                One-Contract Unified Architecture
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 inline-flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-vault-accent" />
                Mint-On-Claim Economics
              </span>
            </div>
          </div>

          {/* Unified Contract Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Contract & Token</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-vault-dark border border-vault-border text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>AirdropVault CA (AIR Token)</span>
                  <button onClick={copyAddress} className="hover:text-vault-accent transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="font-mono text-slate-200 text-[11px] truncate">
                <div className="font-mono text-slate-200 text-[11px] sm:text-xs break-all select-all">
                  {AIRDROP_VAULT_ADDRESS}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addAirToWallet}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-vault-accent/10 border border-vault-accent/30 hover:bg-vault-accent/20 text-vault-accent text-xs font-medium transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{addedToken ? "Added!" : "Import AIR Token"}</span>
                </button>

                <a
                  href={`${BOHR_EXPLORER_URL}address/${AIRDROP_VAULT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-vault-dark border border-vault-border hover:border-vault-accent/40 text-slate-400 hover:text-white transition-colors"
                  className="p-2 rounded-lg bg-vault-dark border border-vault-border hover:border-vault-accent/40 text-slate-400 hover:text-white transition-colors shrink-0"
                  title="View on BohrScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Network Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Network Details</h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="text-slate-300">Bohr Testnet</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Chain ID:</span>
                <span className="text-slate-300">968</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Native Asset:</span>
                <span className="text-emerald-400 font-semibold">BOT</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Rate:</span>
                <span className="text-vault-accent">1,000 AIR = 0.1 BOT</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-vault-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="pt-8 border-t border-vault-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center sm:text-left">
          <p>© 2026 AirdropVault. Real On-Chain Reward Campaigns & Conversion Pool.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Bohr Testnet RPC Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
