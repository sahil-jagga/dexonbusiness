import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { TRADE_CONFIGS, TradeKey, TradeConfig } from '../config/trades';

interface TradeSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  activeTrade: TradeKey;
  onSelectTrade: (trade: TradeKey) => void;
  isInitialSetup?: boolean;
}

export const TradeSelectionModal: React.FC<TradeSelectionModalProps> = ({
  isOpen,
  onClose,
  activeTrade,
  onSelectTrade,
  isInitialSetup = false,
}) => {
  if (!isOpen) return null;

  const trades = Object.values(TRADE_CONFIGS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🏢</span> {isInitialSetup ? 'Select Your Business Industry / Trade' : 'Switch Business Trade'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your line of business to enable specialized billing formats, tax calculators, and item catalogs.
            </p>
          </div>
          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Trade Grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trades.map((t: TradeConfig) => {
            const isSelected = activeTrade === t.key;
            return (
              <div
                key={t.key}
                onClick={() => {
                  onSelectTrade(t.key);
                  if (onClose) onClose();
                }}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{t.icon}</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Active Trade
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">Click to Select</span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-white">{t.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                </div>

                {/* Features badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.supports7030 && (
                      <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/40">
                        70:30 Statutory Helper
                      </span>
                    )}
                    {t.supportsWcc && (
                      <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800/40">
                        WCC Certificate
                      </span>
                    )}
                    {t.supportsBankEstimate && (
                      <span className="rounded bg-purple-950/60 px-1.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-800/40">
                        Bank Estimate
                      </span>
                    )}
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      Standard GST Invoice
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {t.lumpSumQuotation ? 'Lump Sum Package Quotation' : 'Itemized Quotation'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-full rounded-lg py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span>{isSelected ? 'Currently Selected' : 'Choose ' + t.shortName}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>You can switch your trade anytime from the top navigation bar.</span>
          {isInitialSetup && (
            <span className="text-amber-400 font-semibold">Select an option above to continue</span>
          )}
        </div>
      </div>
    </div>
  );
};
