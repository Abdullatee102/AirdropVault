import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatUnits, parseUnits, keccak256, toHex } from 'viem';
import { AIRDROP_VAULT_ABI } from '../abi/AirdropVaultAbi';
import { AIRDROP_VAULT_ADDRESS } from '../config/constants';
import { Campaign, CampaignStatus } from '../types';

export const CAMPAIGN_MANAGER_ROLE = keccak256(toHex("CAMPAIGN_MANAGER_ROLE"));
export const REWARD_MANAGER_ROLE = keccak256(toHex("REWARD_MANAGER_ROLE"));
export const TREASURY_MANAGER_ROLE = keccak256(toHex("TREASURY_MANAGER_ROLE"));
export const VERIFIER_ROLE = keccak256(toHex("VERIFIER_ROLE"));
export const PAUSER_ROLE = keccak256(toHex("PAUSER_ROLE"));
export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export function useAirdropVault() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Read Protocol Stats
  const { data: protocolStatsData, refetch: refetchProtocolStats, isLoading: isStatsLoading } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getProtocolStats',
  });

  // Read BOT Pool Balance
  const { data: botPoolBalanceData, refetch: refetchPoolBalance } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getBOTPoolBalance',
  });

  // Read Conversion Rates & Limits
  const { data: rateAIRData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'conversionRateAIR',
  });

  const { data: rateBOTData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'conversionRateBOT',
  });

  const { data: minConversionData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'minConversionAIR',
  });

  const { data: maxConversionData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'maxConversionAIR',
  });

  const { data: maxAirSupplyData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'MAX_AIR_SUPPLY',
  });

  const { data: isPausedData } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'paused',
  });

  const { data: currentlyConvertibleData, refetch: refetchConvertible } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getCurrentlyConvertibleAIR',
  });

  // Read User Stats
  const { data: userStatsData, refetch: refetchUserStats } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
  });

  // Read User AIR Balance
  const { data: userAirBalanceData, refetch: refetchAirBalance } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read All Campaigns
  const { data: allCampaignsData, refetch: refetchCampaigns, isLoading: isCampaignsLoading } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'getAllCampaigns',
  });

  // Roles verification for current connected account
  const { data: isAdmin } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'checkRole',
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
  });

  const { data: isCampaignManager } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'checkRole',
    args: address ? [CAMPAIGN_MANAGER_ROLE, address] : undefined,
  });

  const { data: isVerifier } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'checkRole',
    args: address ? [VERIFIER_ROLE, address] : undefined,
  });

  const { data: isTreasuryManager } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'checkRole',
    args: address ? [TREASURY_MANAGER_ROLE, address] : undefined,
  });

  const { data: isPauser } = useReadContract({
    address: AIRDROP_VAULT_ADDRESS,
    abi: AIRDROP_VAULT_ABI,
    functionName: 'checkRole',
    args: address ? [PAUSER_ROLE, address] : undefined,
  });

  // Contract write actions
  const { writeContractAsync, data: txHash, isPending: isTxSubmitting, reset: resetWrite } = useWriteContract();
  const { isLoading: isTxWaiting, isSuccess: isTxSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Invalidate queries after successful state changing tx
  const refetchAll = async () => {
    await Promise.all([
      refetchProtocolStats(),
      refetchPoolBalance(),
      refetchCampaigns(),
      refetchUserStats(),
      refetchAirBalance(),
      refetchConvertible(),
      queryClient.invalidateQueries(),
    ]);
  };

  // Structured campaign objects list
  const campaigns: Campaign[] = (() => {
    if (!allCampaignsData) return [];
    const [rawCampaigns, statuses] = allCampaignsData as [Campaign[], number[]];
    return rawCampaigns.map((c, idx) => ({
      ...c,
      status: statuses[idx] as CampaignStatus,
    }));
  })();

  // Parse helper rates
  const rateAIR = rateAIRData ? BigInt(rateAIRData.toString()) : 1000n * 10n ** 18n;
  const rateBOT = rateBOTData ? BigInt(rateBOTData.toString()) : 10n ** 17n; // 0.1 BOT
  const minConversionAIR = minConversionData ? BigInt(minConversionData.toString()) : 1000n * 10n ** 18n;
  const maxConversionAIR = maxConversionData ? BigInt(maxConversionData.toString()) : 100000n * 10n ** 18n;
  const maxAirSupply = maxAirSupplyData ? BigInt(maxAirSupplyData.toString()) : 50000000n * 10n ** 18n;
  const userAirBalance = userAirBalanceData ? BigInt(userAirBalanceData.toString()) : 0n;
  const botPoolBalance = botPoolBalanceData ? BigInt(botPoolBalanceData.toString()) : 0n;
  const currentlyConvertibleAIR = currentlyConvertibleData ? BigInt(currentlyConvertibleData.toString()) : 0n;

  // Calculate BOT from AIR amount
  const calculateBOT = (airAmountStr: string): string => {
    try {
      if (!airAmountStr || isNaN(Number(airAmountStr))) return "0";
      const airWei = parseUnits(airAmountStr, 18);
      if (rateAIR === 0n) return "0";
      const botWei = (airWei * rateBOT) / rateAIR;
      return formatUnits(botWei, 18);
    } catch {
      return "0";
    }
  };

  // Actions
  const claimReward = async (campaignId: bigint) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'claim',
      args: [campaignId],
    });
  };

  const convertAir = async (airAmountStr: string) => {
    const amountWei = parseUnits(airAmountStr, 18);
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'convertAIRToBOT',
      args: [amountWei],
    });
  };

  const depositBot = async (botAmountStr: string) => {
    const amountWei = parseUnits(botAmountStr, 18);
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'depositBOT',
      value: amountWei,
    });
  };

  const createCampaign = async (
    title: string,
    description: string,
    category: number,
    rewardPerUserStr: string,
    totalAllocationStr: string,
    maxParticipants: number,
    startTime: number,
    claimDeadline: number,
    verificationType: string
  ) => {
    const rewardWei = parseUnits(rewardPerUserStr, 18);
    const totalAllocWei = parseUnits(totalAllocationStr, 18);

    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'createCampaign',
      args: [
        title,
        description,
        category,
        rewardWei,
        totalAllocWei,
        BigInt(maxParticipants),
        BigInt(startTime),
        BigInt(claimDeadline),
        verificationType,
      ],
    });
  };

  const approveUserEligibility = async (campaignId: bigint, userAddress: `0x${string}`) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'approveEligibility',
      args: [campaignId, userAddress],
    });
  };

  const batchApproveUserEligibility = async (campaignId: bigint, userAddresses: `0x${string}`[]) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'batchApproveEligibility',
      args: [campaignId, userAddresses],
    });
  };

  const pauseCampaign = async (campaignId: bigint) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'pauseCampaign',
      args: [campaignId],
    });
  };

  const unpauseCampaign = async (campaignId: bigint) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'unpauseCampaign',
      args: [campaignId],
    });
  };

  const cancelCampaign = async (campaignId: bigint) => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'cancelCampaign',
      args: [campaignId],
    });
  };

  const setConversionRate = async (rateAirStr: string, rateBotStr: string) => {
    const rateAirWei = parseUnits(rateAirStr, 18);
    const rateBotWei = parseUnits(rateBotStr, 18);
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'setConversionRate',
      args: [rateAirWei, rateBotWei],
    });
  };

  const setConversionLimits = async (minAirStr: string, maxAirStr: string) => {
    const minAirWei = parseUnits(minAirStr, 18);
    const maxAirWei = parseUnits(maxAirStr, 18);
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'setConversionLimits',
      args: [minAirWei, maxAirWei],
    });
  };

  const pauseProtocol = async () => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'pauseProtocol',
    });
  };

  const unpauseProtocol = async () => {
    return (writeContractAsync as any)({
      address: AIRDROP_VAULT_ADDRESS,
      abi: AIRDROP_VAULT_ABI,
      functionName: 'unpauseProtocol',
    });
  };

  return {
    address,
    isConnected,
    campaigns,
    isCampaignsLoading,
    protocolStatsData,
    isStatsLoading,
    userStatsData,
    userAirBalance,
    botPoolBalance,
    rateAIR,
    rateBOT,
    minConversionAIR,
    maxConversionAIR,
    maxAirSupply,
    currentlyConvertibleAIR,
    isPaused: !!isPausedData,
    isAdmin: !!isAdmin,
    isCampaignManager: !!isCampaignManager || !!isAdmin,
    isVerifier: !!isVerifier || !!isAdmin,
    isTreasuryManager: !!isTreasuryManager || !!isAdmin,
    isPauser: !!isPauser || !!isAdmin,
    calculateBOT,
    claimReward,
    convertAir,
    depositBot,
    createCampaign,
    approveUserEligibility,
    batchApproveUserEligibility,
    pauseCampaign,
    unpauseCampaign,
    cancelCampaign,
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
  };
}
