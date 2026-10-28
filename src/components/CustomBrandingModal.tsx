import React, { useState } from 'react';
import { Palette, PhoneCall, Sparkles, Check, X, Shield, Headphones } from 'lucide-react';

interface CustomBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  onAccentColorChange: (color: string) => void;
  watermarkText: string;
  onWatermarkTextChange: (text: string) => void;
  isBusinessPlan: boolean;
}

const PRESET_COLORS = [
  { name: 'Solar Navy', hex: '#1a3a6e' },
  { name: 'Amber Gold', hex: '#b45309' },
  { name: 'Emerald Forest', hex: '#065f46' },
  { name: 'Royal Purple', hex: '#581c87' },
  { name: 'Crimson Wine', hex: '#881337' },
  { name: 'Onyx Slate', hex: '#0f172a' },
];

export const CustomBrandingModal: React.FC<CustomBrandingModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  onAccentColorChange,
  watermarkText,
  onWatermarkTextChange,
  isBusinessPlan,
}) => {
  if (!isOpen) return null;

  const handlePriorityWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 *VIP Priority Support Request (Business Plan Subscriber)*\n` +
      `Hello Sahil, I am using Nexbill Solar Pro Business Edition. I need priority assistance.`
    );
    window.open(`https://wa.me/919429842000?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex w-full max-w-lg flex-col rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Custom Branding & Priority Support
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  Business Plan
                </span>
              </h2>
              <p className="text-xs text-slate-400">Personalize templates & direct developer support line.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Priority Support Desk */}
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    24x7 Priority Support Desk
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-bold text-emerald-300">
                      VIP SLA
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Direct phone & WhatsApp access to senior developer (Sahil Jagga).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePriorityWhatsApp}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition"
            >
              <PhoneCall className="h-4 w-4" /> Open Priority WhatsApp Support (94298-42000)
            </button>
          </div>

          {/* Template Accent Color */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-purple-400" /> Invoice Header Accent Color
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">Choose the primary brand color for your invoices and quotations:</p>

            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = accentColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    onClick={() => onAccentColorChange(c.hex)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-white bg-slate-800 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: c.hex }} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watermark Control */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <h4 className="text-xs font-bold text-slate-200 mb-1">Optional Watermark on Bills</h4>
            <p className="text-[11px] text-slate-400 mb-2">Leave blank for no watermark or enter text:</p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PAID, DRAFT, DUPLICATE"
                value={watermarkText}
                onChange={(e) => onWatermarkTextChange(e.target.value.toUpperCase())}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-purple-400 focus:outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => onWatermarkTextChange('PAID')}
                className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                PAID
              </button>
              <button
                type="button"
                onClick={() => onWatermarkTextChange('')}
                className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
