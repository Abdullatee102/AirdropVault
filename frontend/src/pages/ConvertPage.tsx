import React, { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import {
  ArrowRightLeft,
  Coins,
  Flame,
  ArrowDown,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useAirdropVault } from '../hooks/useAirdropVault';
import { TransactionModal } from '../components/TransactionModal';

interface ConvertPageProps {
  onNavigate?: (page: string) => void;
}

export const ConvertPage: React.FC<ConvertPageProps> = ({ onNavigate }) => {
  const {
    address,
    isConnected,
    userAirBalance,
    botPoolBalance,
    rateAIR,
    rateBOT,
    minConversionAIR,
    maxConversionAIR,
    currentlyConvertibleAIR,
    isPaused,
    calculateBOT,
    convertAir,
    txHash,
    isTxSubmitting,
    isTxWaiting,
    isTxSuccess,
    txError,
    resetWrite,
    refetchAll,
  } = useAirdropVault();

  const [airInput, setAirInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Format balances and rates
  const userAirFormatted = Number(formatUnits(userAirBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const poolBotFormatted = Number(formatUnits(botPoolBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const minAirFormatted = Number(formatUnits(minConversionAIR, 18)).toLocaleString();
  const maxAirFormatted = Number(formatUnits(maxConversionAIR, 18)).toLocaleString();
  const convertibleAirFormatted = Number(formatUnits(currentlyConvertibleAIR, 18)).toLocaleString();

  // Rate text: 1000 AIR -> 0.1 BOT
  const rateRatioText = `${Number(formatUnits(rateAIR, 18)).toLocaleString()} AIR → ${formatUnits(rateBOT, 18)} BOT`;

  // Calculated BOT output
  const botOutput = calculateBOT(airInput);
  const parsedInputWei = (() => {
    try {
      return parseUnits(airInput || '0', 18);
    } catch {
      return 0n;
    }
  })();

  const parsedOutputWei = (() => {
    try {
      return parseUnits(botOutput || '0', 18);
    } catch {
      return 0n;
    }
  })();

  const poolAfterConversion = botPoolBalance >= parsedOutputWei ? botPoolBalance - parsedOutputWei : 0n;
  const poolAfterFormatted = Number(formatUnits(poolAfterConversion, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });

  // Conversion validation checks
  const isZeroLiquidity = botPoolBalance === 0n;
  const isBelowMin = parsedInputWei > 0n && parsedInputWei < minConversionAIR;
  const isAboveMax = parsedInputWei > maxConversionAIR;
  const isInsufficientAir = parsedInputWei > userAirBalance;
  const isInsufficientLiquidity = parsedOutputWei > botPoolBalance;
  const isValidInput = parsedInputWei > 0n && !isBelowMin && !isAboveMax && !isInsufficientAir && !isInsufficientLiquidity && !isPaused;

  const handleConvert = async () => {
    if (!isValidInput) return;
    try {
      setErrorMessage('');
      setModalOpen(true);
      await convertAir(airInput);
      await refetchAll();
      setAirInput('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.shortMessage || err?.message || 'Conversion failed');
    }
  };

  const handleSetMax = () => {
    // Max convertible is minimum of userAirBalance and currentlyConvertibleAIR
    const maxUsable = userAirBalance < currentlyConvertibleAIR ? userAirBalance : currentlyConvertibleAIR;
    const finalAmount = maxUsable > maxConversionAIR ? maxConversionAIR : maxUsable;
    setAirInput(formatUnits(finalAmount, 18));
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetWrite();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Page Title & Intro */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vault-accent/10 border border-vault-accent/30 text-vault-accent text-xs font-semibold">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Real On-Chain Conversion Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Convert <span className="text-vault-accent">AIR</span> → Native <span className="text-emerald-400">BOT</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Burn your verified AIR reward tokens to receive native Bohr Testnet BOT directly in your wallet at the protocol-defined conversion rate.
        </p>
      </div>

      {/* Protocol Conversion Rate Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-vault-card to-vault-dark border border-vault-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vault-accent/15 border border-vault-accent/30 flex items-center justify-center">
            <Coins className="w-5 h-5 text-vault-accent" />
          </div>
          <div>
            <span className="text-slate-400 font-medium">Protocol Conversion Rate</span>
            <div className="text-sm font-bold text-white font-mono">{rateRatioText}</div>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-vault-border sm:pl-4">
          <span className="text-slate-400 font-medium">Current BOT Liquidity</span>
          <div className="text-sm font-bold text-emerald-400 font-mono">{poolBotFormatted} BOT</div>
        </div>
      </div>

      {/* Main Conversion Card */}
      <div className="rounded-3xl bg-vault-card border border-vault-border p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-vault-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Input: AIR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">You Convert (AIR)</span>
            <div className="flex items-center gap-1.5">
              <span>Balance: <strong className="font-mono text-slate-200">{userAirFormatted} AIR</strong></span>
              {userAirBalance > 0n && (
                <button
                  onClick={handleSetMax}
                  className="px-2 py-0.5 rounded bg-vault-accent/15 text-vault-accent font-bold text-[10px] hover:bg-vault-accent/25 transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={airInput}
              onChange={(e) => setAirInput(e.target.value)}
              placeholder="0.0"
              disabled={isZeroLiquidity || isPaused}
              className="w-full py-4 pl-4 pr-24 rounded-2xl bg-vault-dark border border-vault-border text-lg sm:text-2xl font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-vault-accent/60 transition-colors disabled:opacity-50"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-vault-card border border-vault-border text-xs font-bold text-vault-accent font-mono">
              <Flame className="w-4 h-4 text-vault-accent" />
              <span>AIR</span>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-10 h-10 rounded-full bg-vault-dark border border-vault-borderHover flex items-center justify-center text-vault-accent shadow-md">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Output: BOT Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">You Receive (Native BOT)</span>
            <span>Direct to your connected wallet</span>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={botOutput}
              placeholder="0.0"
              className="w-full py-4 pl-4 pr-24 rounded-2xl bg-vault-dark/60 border border-vault-border text-lg sm:text-2xl font-mono font-bold text-emerald-400 placeholder-slate-600 focus:outline-none cursor-default"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 font-mono">
              <Coins className="w-4 h-4" />
              <span>BOT</span>
            </div>
          </div>
        </div>

        {/* Conversion Details / Summary */}
        <div className="p-4 rounded-2xl bg-vault-dark border border-vault-border/60 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Minimum Conversion</span>
            <span className="font-mono text-slate-200">{minAirFormatted} AIR (0.1 BOT)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Maximum Per Transaction</span>
            <span className="font-mono text-slate-200">{maxAirFormatted} AIR</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Currently Convertible by Liquidity</span>
            <span className="font-mono text-emerald-400 font-semibold">{convertibleAirFormatted} AIR</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Conversion Fee</span>
            <span className="font-mono text-slate-200">0% (Zero Protocol Fee)</span>
          </div>
          {parsedInputWei > 0n && (
            <div className="pt-2 border-t border-vault-border/40 flex justify-between text-slate-300 font-medium">
              <span>BOT Pool Balance After:</span>
              <span className="font-mono text-slate-100">{poolAfterFormatted} BOT</span>
            </div>
          )}
        </div>

        {/* Zero Liquidity Warning */}
        {isZeroLiquidity && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>BOT Conversion Temporarily Unavailable</span>
            </div>
            <p className="opacity-90 leading-relaxed">
              The conversion pool currently has no BOT liquidity. You can continue safely holding your AIR tokens in your wallet for upcoming campaign utilities or future conversion pool refills.
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {!isZeroLiquidity && isBelowMin && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Amount is below the minimum conversion limit of {minAirFormatted} AIR.</span>
          </div>
        )}

        {!isZeroLiquidity && isAboveMax && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Amount exceeds the maximum per-transaction conversion limit of {maxAirFormatted} AIR.</span>
          </div>
        )}

        {!isZeroLiquidity && isInsufficientAir && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Insufficient AIR balance in your wallet.</span>
          </div>
        )}

        {!isZeroLiquidity && isInsufficientLiquidity && !isInsufficientAir && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Requested amount exceeds current BOT liquidity pool capacity. Maximum currently convertible is {convertibleAirFormatted} AIR.</span>
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <div className="text-center pt-2">
            <appkit-button />
          </div>
        ) : (
          <button
            onClick={handleConvert}
            disabled={!isValidInput}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
              isValidInput
                ? 'bg-gradient-to-r from-vault-accent via-cyan-400 to-emerald-400 text-vault-darker hover:opacity-95 shadow-vault-accent/20 cursor-pointer scale-[1.01]'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {isZeroLiquidity
                ? "Conversion Unavailable (Empty Pool)"
                : isBelowMin
                ? `Minimum is ${minAirFormatted} AIR`
                : isAboveMax
                ? `Maximum is ${maxAirFormatted} AIR`
                : isInsufficientAir
                ? "Insufficient AIR Balance"
                : isInsufficientLiquidity
                ? "Exceeds BOT Pool Liquidity"
                : `Convert ${airInput || '0'} AIR → ${botOutput} BOT`}
            </span>
          </button>
        )}

        {/* Holding AIR Note */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-500">
            Holding AIR? You can choose to hold AIR for future campaign privileges or convert anytime when liquidity allows.
          </p>
        </div>
      </div>

      {/* Conversion Flow Explainer */}
      <div className="rounded-3xl bg-vault-card border border-vault-border p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>How Conversion Works (Atomic & Secure)</span>
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
          <li>User specifies the amount of AIR to convert (minimum {minAirFormatted} AIR).</li>
          <li>AirdropVault contract validates user balance, conversion limits, and current BOT liquidity.</li>
          <li>Converted AIR is permanently burned from total circulation.</li>
          <li>Native Bohr BOT is transferred directly to the user's wallet in the same atomic transaction.</li>
        </ol>
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
        title="Converting AIR to BOT"
      />
    </div>
  );
};
