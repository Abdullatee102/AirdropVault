export enum CampaignCategory {
  DAILY = 0,
  COMMUNITY = 1,
  REFERRAL = 2,
  LEARNING = 3,
  ON_CHAIN = 4,
  FREE_DROP = 5,
  CUSTOM = 6,
}

export enum CampaignStatus {
  UPCOMING = 0,
  ACTIVE = 1,
  PAUSED = 2,
  EXHAUSTED = 3,
  ENDED = 4,
  CANCELLED = 5,
}

export interface Campaign {
  campaignId: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  category: CampaignCategory;
  rewardPerUser: bigint;
  totalAllocation: bigint;
  remainingAllocation: bigint;
  maximumParticipants: bigint;
  currentParticipants: bigint;
  startTime: bigint;
  claimDeadline: bigint;
  verificationType: string;
  isPaused: boolean;
  isCancelled: boolean;
  status?: CampaignStatus;
}

export interface UserStats {
  airBalance: bigint;
  totalClaimed: bigint;
  totalConverted: bigint;
  botReceived: bigint;
}

export interface ProtocolStats {
  totalCampaigns: bigint;
  activeCampaigns: bigint;
  totalAirClaimed: bigint;
  totalAirConverted: bigint;
  totalBotDistributed: bigint;
  botPoolBalance: bigint;
  totalAirSupply: bigint;
  maxAirSupply: bigint;
  totalAirMinted: bigint;
}

export interface ActivityEvent {
  id: string;
  type: 'CLAIM' | 'CONVERT' | 'DEPOSIT' | 'CREATE' | 'ELIGIBILITY';
  title: string;
  amount?: string;
  asset?: string;
  account: string;
  txHash: string;
  timestamp: number;
}
