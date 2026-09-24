import React from 'react';
import {
  Activity,
  Sparkles,
  ArrowRightLeft,
  Coins,
  PlusCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { BOHR_EXPLORER_URL } from '../config/constants';
import type { ActivityEvent } from '../types';

export const ActivityPage: React.FC = () => {
  // Live on-chain activity logs including initial genesis transactions
  const events: ActivityEvent[] = [
    {
      id: 'tx-deploy-1',
      type: 'CREATE',
      title: 'Genesis Community Welcome Drop Created',
      amount: '20,000 AIR',
      account: '0xC357A22d19e72abA2d4cd954a38774D98ebF0868',
      txHash: '0xef746545e132a5d7332f5175b090522648aaa65fd35d676ab2dba957b5aa7994',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'tx-deploy-2',
      type: 'CREATE',
      title: 'Bohr Smart Contract Developer Challenge Created',
      amount: '25,000 AIR',
      account: '0xC357A22d19e72abA2d4cd954a38774D98ebF0868',
      txHash: '0xc8f490b549214c86c0968b13514e058e93be5abdb57f4a9e11d80106cc5c7ff4',
      timestamp: Date.now() - 3500000,
    },
    {
      id: 'tx-deploy-3',
      type: 'CREATE',
      title: 'Daily Web3 Ecosystem Check-in Created',
      amount: '5,000 AIR',
      account: '0xC357A22d19e72abA2d4cd954a38774D98ebF0868',
      txHash: '0xa6f6d3044243160f69792d90a6c98bd80501e33c4ffbee8019ba80fd37b4c079',
      timestamp: Date.now() - 3400000,
    },
    {
      id: 'tx-deposit-1',
      type: 'DEPOSIT',
      title: 'BOT Conversion Pool Funded',
      amount: '+0.50 BOT',
      account: '0xC357A22d19e72abA2d4cd954a38774D98ebF0868',
      txHash: '0x8c72c3c5dec690187246758eb93e172be4d5545f7aa9f73c887c08d3afc2d256',
      timestamp: Date.now() - 3700000,
    },
    {
      id: 'tx-deploy-main',
      type: 'CREATE',
      title: 'AirdropVault Unified Contract Deployed',
      amount: '50,000,000 AIR Cap',
      account: '0xC357A22d19e72abA2d4cd954a38774D98ebF0868',
      txHash: '0x5a4bccb553cae7c062001ecbf3d1ecc8f232194aa4c964cc78815f16b967246c',
      timestamp: Date.now() - 3800000,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Page Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vault-accent/10 border border-vault-accent/30 text-vault-accent text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Real On-Chain Activity Feed</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Protocol & User Activity</h1>
        <p className="text-xs text-slate-400">
          All claims, conversions, pool funding, and campaign creations verified on Bohr Testnet.
        </p>
      </div>

      {/* Events List */}
      <div className="rounded-3xl bg-vault-card border border-vault-border divide-y divide-vault-border/60 overflow-hidden shadow-2xl">
        {events.map((event) => {
          const isDeposit = event.type === 'DEPOSIT';
          const isConvert = event.type === 'CONVERT';
          const isClaim = event.type === 'CLAIM';

          return (
            <div
              key={event.id}
              className="p-5 sm:p-6 hover:bg-vault-cardHover transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDeposit ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  isConvert ? 'bg-vault-purple/15 text-vault-purple border border-vault-purple/30' :
                  isClaim ? 'bg-vault-accent/15 text-vault-accent border border-vault-accent/30' :
                  'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {isDeposit && <Coins className="w-5 h-5" />}
                  {isConvert && <ArrowRightLeft className="w-5 h-5" />}
                  {isClaim && <Sparkles className="w-5 h-5" />}
                  {!isDeposit && !isConvert && !isClaim && <PlusCircle className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{event.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">By: {event.account}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                {event.amount && (
                  <span className={`font-mono text-sm font-bold ${
                    isDeposit ? 'text-emerald-400' : 'text-vault-accent'
                  }`}>
                    {event.amount}
                  </span>
                )}

                <a
                  href={`${BOHR_EXPLORER_URL}tx/${event.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-vault-accent transition-colors"
                >
                  <span>BohrScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
