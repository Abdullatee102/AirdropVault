import { defineChain } from 'viem';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';
import { BOHR_CHAIN_ID, BOHR_RPC_URL, BOHR_EXPLORER_URL, REOWN_PROJECT_ID, APP_URL } from './constants';

export const bohrTestnet = defineChain({
  id: BOHR_CHAIN_ID,
  name: 'Bohr Testnet',
  nativeCurrency: {
    name: 'BOHR',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [BOHR_RPC_URL],
    },
    public: {
      http: [BOHR_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: BOHR_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const metadata = {
  name: 'AirdropVault',
  description: 'On-Chain Airdrop & Reward Campaign Marketplace',
  url: typeof window !== 'undefined' ? window.location.origin : APP_URL,
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [bohrTestnet],
  projectId: REOWN_PROJECT_ID,
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks: [bohrTestnet],
  defaultNetwork: bohrTestnet,
  projectId: REOWN_PROJECT_ID,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00e5ff',
    '--w3m-border-radius-master': '12px',
  },
});
