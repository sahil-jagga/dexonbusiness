import React, { useState } from 'react';
import { Sparkles, PhoneCall, Check, X, Tag } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterKey: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onEnterKey }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const handleWhatsAppBuy = (plan: string, price: string) => {
    const text = encodeURIComponent(
      `Hi Sahil, I want to activate Nexbill (${plan} - ${price} - ${billingCycle.toUpperCase()}). Please send payment QR.`
    );
    window.open(`https://wa.me/919429842000?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border-2 border-amber-500 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Upgrade NexBill License 🚀</h2>
              <p className="text-xs text-amber-400 font-bold">
                Unlock Unlimited Invoices & Complete Business Suite
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-4 py-1.5 transition ${
                billingCycle === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Plan
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`rounded-lg px-4 py-1.5 transition flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Plan</span>
              <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] text-white font-extrabold">
                Save 37%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Pro Plan */}
          <div
            onClick={() =>
              handleWhatsAppBuy(
                'Pro Plan',
                billingCycle === 'annual' ? '₹1,499/yr' : '₹199/mo'
              )
            }
            className="cursor-pointer rounded-2xl border border-amber-500/50 bg-slate-950 p-4 hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wide">⭐ Pro Plan</span>
                <span className="text-[10px] text-emerald-400 font-bold">Unlimited Firms</span>
              </div>
              <div className="mt-2">
                {billingCycle === 'annual' ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">₹1,499</span>
                      <span className="text-xs text-slate-400">/ year</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                      ~₹125 / month <span className="text-emerald-400 font-bold">(Save ₹889 / 37%)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">₹199</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Monthly billing, cancel anytime</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>Unlimited Invoices & Quotations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>Unlimited Multi-Firms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>All 3 Invoice Themes + All Trades</span>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-amber-500/20 border border-amber-500/40 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition">
              Select Pro
            </button>
          </div>

          {/* Business Plan */}
          <div
            onClick={() =>
              handleWhatsAppBuy(
                'Business Plan',
                billingCycle === 'annual' ? '₹2,999/yr' : '₹399/mo'
              )
            }
            className="cursor-pointer rounded-2xl border-2 border-purple-500/80 bg-purple-950/20 p-4 hover:border-purple-400 transition flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400 uppercase tracking-wide">🚀 Business Plan</span>
                <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[9px] font-black text-purple-200">
                  Best Value
                </span>
              </div>
              <div className="mt-2">
                {billingCycle === 'annual' ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">₹2,999</span>
                      <span className="text-xs text-slate-400">/ year</span>
                    </div>
                    <div className="text-[11px] text-purple-300 font-semibold mt-0.5">
                      ~₹250 / month <span className="text-emerald-400 font-bold">(Save ₹1,789 / 37%)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">₹399</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Monthly billing, full business suite</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                  <b>Unlimited Multi-Firms & CA Mode</b>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                  <span>Customer CRM, Daybook & ITR 44AD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                  <span>Tax Return Export (CSV / GSTR-1) + Priority Support</span>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-purple-600 py-2 text-xs font-black text-white hover:bg-purple-500 transition shadow-md">
              Select Business
            </button>
          </div>
        </div>

        {/* WhatsApp & Call Direct */}
        <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-center border border-slate-800">
          <div className="text-xs text-slate-400">Direct Activation Hotline (Sahil Jagga):</div>
          <div className="mt-1 text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5">
            <PhoneCall className="h-4 w-4" /> 94298-42000 / 94283-42000
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => {
              onClose();
              onEnterKey();
            }}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            Enter Key
          </button>
          <button
            onClick={() =>
              handleWhatsAppBuy(
                'Plan',
                billingCycle === 'annual' ? '₹1,999/yr' : '₹199/mo'
              )
            }
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Buy on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
