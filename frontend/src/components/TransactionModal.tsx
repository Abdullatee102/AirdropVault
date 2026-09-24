import React from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { BOHR_EXPLORER_URL } from '../config/constants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  isWaiting: boolean;
  isSuccess: boolean;
  txHash?: string;
  errorMessage?: string;
  title?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  isPending,
  isWaiting,
  isSuccess,
  txHash,
  errorMessage,
  title = "Processing Transaction",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-2xl bg-vault-card border border-vault-border shadow-2xl backdrop-blur-xl relative">
        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          {isPending && (
            <div className="w-16 h-16 rounded-full bg-vault-accent/10 border border-vault-accent/30 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-vault-accent animate-spin" />
            </div>
          )}

          {isWaiting && (
            <div className="w-16 h-16 rounded-full bg-vault-purple/10 border border-vault-purple/30 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-vault-purple animate-spin" />
            </div>
          )}

          {isSuccess && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          )}

          {errorMessage && (
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          )}

          {/* Title and Message */}
          <h3 className="text-xl font-bold text-white mb-2">
            {isPending && (title || "Confirm in Wallet")}
            {isWaiting && "Confirming on Bohr Testnet"}
            {isSuccess && "Transaction Successful"}
            {errorMessage && "Transaction Failed"}
          </h3>

          <p className="text-sm text-slate-400 mb-6">
            {isPending && "Please review and approve the transaction in your connected wallet."}
            {isWaiting && "Transaction submitted. Waiting for blockchain confirmation..."}
            {isSuccess && "Your transaction has been verified and confirmed on-chain."}
            {errorMessage && (errorMessage.length > 120 ? errorMessage.slice(0, 120) + "..." : errorMessage)}
          </p>

          {/* Explorer Link */}
          {txHash && (
            <a
              href={`${BOHR_EXPLORER_URL}tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-vault-dark border border-vault-border text-xs text-vault-accent hover:border-vault-accent/40 transition-colors"
            >
              <span>View on Bohr Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Close / Action Button */}
          {(isSuccess || errorMessage) && (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-vault-accent to-vault-purple hover:opacity-90 font-semibold text-vault-darker transition-all shadow-lg shadow-vault-accent/10"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
