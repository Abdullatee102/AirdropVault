export const BOHR_CHAIN_ID = 968;
export const BOHR_RPC_URL = import.meta.env.VITE_BOT_RPC_URL || "https://rpc.bohr.life";
export const BOHR_EXPLORER_URL = import.meta.env.VITE_BOT_EXPLORER_URL || "https://scan.bohr.life/";
export const AIRDROP_VAULT_ADDRESS = (import.meta.env.VITE_AIRDROP_VAULT_CONTRACT_ADDRESS || "0xFeCE26cE87096A449DF46748C45739B541b1f5BC") as `0x${string}`;
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || "b0ed2f41971704df2800043e6799378c";

export const CATEGORY_LABELS: Record<number, string> = {
  0: "Daily",
  1: "Community",
  2: "Referral",
  3: "Learning",
  4: "On-Chain",
  5: "Free Drop",
  6: "Custom",
};

export const STATUS_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: "Upcoming", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  1: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  2: { label: "Paused", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  3: { label: "Exhausted", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  4: { label: "Ended", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
  5: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};
