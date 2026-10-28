import React, { useState } from 'react';
import {
  Palette,
  Check,
  X,
  Sparkles,
  Layout,
  Sliders,
  Printer,
  Eye,
  CheckCircle2,
  BookmarkCheck,
  RotateCcw
} from 'lucide-react';
import { FirmInfo } from '../types/solar';

interface InvoiceThemeDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: 1 | 2 | 3;
  onThemeSelect: (theme: 1 | 2 | 3) => void;
  accentColor: string;
  onAccentColorChange: (color: string) => void;
  watermarkText: string;
  onWatermarkTextChange: (text: string) => void;
  firm: FirmInfo;
}

const PRESET_COLORS = [
  { name: 'Solar Navy', hex: '#1a3a6e', bg: 'bg-[#1a3a6e]' },
  { name: 'Royal Indigo', hex: '#312e81', bg: 'bg-[#312e81]' },
  { name: 'Emerald Forest', hex: '#065f46', bg: 'bg-[#065f46]' },
  { name: 'Amber Gold', hex: '#b45309', bg: 'bg-[#b45309]' },
  { name: 'Crimson Wine', hex: '#881337', bg: 'bg-[#881337]' },
  { name: 'Charcoal Onyx', hex: '#0f172a', bg: 'bg-[#0f172a]' },
];

export const InvoiceThemeDesignerModal: React.FC<InvoiceThemeDesignerModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onThemeSelect,
  accentColor,
  onAccentColorChange,
  watermarkText,
  onWatermarkTextChange,
  firm,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<1 | 2 | 3>(activeTheme);
  const [selectedColor, setSelectedColor] = useState<string>(accentColor || '#1a3a6e');
  const [selectedWatermark, setSelectedWatermark] = useState<string>(watermarkText || '');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const handleSaveGlobalDefault = () => {
    // 1. Apply to live runtime
    onThemeSelect(selectedTheme);
    onAccentColorChange(selectedColor);
    onWatermarkTextChange(selectedWatermark);

    // 2. Persist globally into localStorage so preferred theme is remembered forever
    try {
      localStorage.setItem('nb_preferred_theme', String(selectedTheme));
      localStorage.setItem('nb_accent_color', selectedColor);
      localStorage.setItem('nb_watermark', selectedWatermark);
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    setIsSavedSuccessfully(true);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    setSelectedTheme(1);
    setSelectedColor('#1a3a6e');
    setSelectedWatermark('');
    onThemeSelect(1);
    onAccentColorChange('#1a3a6e');
    onWatermarkTextChange('');
    try {
      localStorage.removeItem('nb_preferred_theme');
      localStorage.removeItem('nb_accent_color');
      localStorage.removeItem('nb_watermark');
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 font-black">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Invoice Theme Designer
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                  Global Template Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose, customize, and save your preferred invoice design template globally across all documents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset to default minimal theme"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Theme Selection & Controls */}
          <div className="w-full lg:w-1/2 flex flex-col p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 space-y-6">
            {/* Step 1: 3 Distinct Visual Designs */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
                <Layout className="h-4 w-4" /> 1. Select Visual Design Template
              </label>

              <div className="space-y-3">
                {/* Theme 1: Minimalist Classic */}
                <div
                  onClick={() => {
                    setSelectedTheme(1);
                    onThemeSelect(1);
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                    selectedTheme === 1
                      ? 'border-amber-400 bg-slate-800/80 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-950 font-black text-xs">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          Minimalist Clean (Classic Light)
                          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                            Printer-Friendly
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          Clean white background, sharp hairline borders, uncluttered monochrome headers. Perfect for laser printing, official CA audits & low ink usage.
                        </p>
                      </div>
                    </div>
                    {selectedTheme === 1 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Theme 2: Modern Corporate */}
                <div
                  onClick={() => {
                    setSelectedTheme(2);
                    onThemeSelect(2);
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                    selectedTheme === 2
                      ? 'border-blue-400 bg-slate-800/80 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          Modern Corporate (Executive Indigo / Blue)
                          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 border border-blue-500/30">
                            B2B & Retail
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          Vibrant corporate gradient header banner, soft sky-tinted customer panels, colored item table headers & highlighted totals.
                        </p>
                      </div>
                    </div>
                    {selectedTheme === 2 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400 text-slate-950">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Theme 3: Professional Executive */}
                <div
                  onClick={() => {
                    setSelectedTheme(3);
                    onThemeSelect(3);
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                    selectedTheme === 3
                      ? 'border-amber-400 bg-slate-800/80 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-amber-400 border border-amber-400/50 font-black text-xs">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          Professional Executive (Midnight Onyx & Gold)
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                            Engineering & EPC
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          Deep charcoal header bar with metallic amber borders, high-contrast dark accents, luxury gold grand total banner. Best for contracts & industrial projects.
                        </p>
                      </div>
                    </div>
                    {selectedTheme === 3 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Accent Brand Color */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                <Sliders className="h-4 w-4" /> 2. Header & Border Accent Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        setSelectedColor(c.hex);
                        onAccentColorChange(c.hex);
                      }}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-white bg-slate-800 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: c.hex }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Watermark Setting */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                <Printer className="h-4 w-4" /> 3. Invoice Watermark Text (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PAID, ORIGINAL, TAX INVOICE"
                  value={selectedWatermark}
                  onChange={(e) => {
                    const text = e.target.value.toUpperCase();
                    setSelectedWatermark(text);
                    onWatermarkTextChange(text);
                  }}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWatermark('PAID');
                    onWatermarkTextChange('PAID');
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  PAID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWatermark('');
                    onWatermarkTextChange('');
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Visual Mockup Preview */}
          <div className="w-full lg:w-1/2 flex flex-col p-6 bg-slate-950/80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-amber-400" /> Live Design Preview
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                Template {selectedTheme}: {selectedTheme === 1 ? 'Minimal' : selectedTheme === 2 ? 'Modern' : 'Professional'}
              </span>
            </div>

            {/* Mini Invoice Card Preview */}
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 bg-white text-slate-900 overflow-hidden transform transition duration-300">
                {/* Header Strip */}
                {selectedTheme === 1 && (
                  <div
                    className="p-4 border-b-2 border-slate-900 bg-white"
                    style={{ borderBottomColor: selectedColor }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-black text-slate-900 tracking-tight">
                          {firm.name || 'Your Business Name'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium">
                          GSTIN: {firm.gstin || '08AAAPL1234F1Z5'} | {firm.address || 'Industrial Area, India'}
                        </div>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[9px] font-black uppercase bg-slate-900 text-amber-400">
                        TAX INVOICE
                      </span>
                    </div>
                  </div>
                )}

                {selectedTheme === 2 && (
                  <div
                    className="p-4 text-white"
                    style={{ backgroundColor: selectedColor || '#1a3a6e' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-black tracking-tight text-white">
                          {firm.name || 'Your Business Name'}
                        </div>
                        <div className="text-[9px] text-blue-100 font-medium">
                          GSTIN: {firm.gstin || '08AAAPL1234F1Z5'} | Commercial Invoicing
                        </div>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[9px] font-black uppercase bg-white/20 text-white border border-white/30 backdrop-blur">
                        TAX INVOICE
                      </span>
                    </div>
                  </div>
                )}

                {selectedTheme === 3 && (
                  <div className="p-4 bg-slate-950 text-slate-100 border-b-2 border-amber-400">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-black tracking-tight text-amber-400">
                          {firm.name || 'Your Business Name'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          GSTIN: {firm.gstin || '08AAAPL1234F1Z5'} | Engineering & Projects
                        </div>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[9px] font-black uppercase bg-amber-400 text-slate-950 font-black">
                        TAX INVOICE
                      </span>
                    </div>
                  </div>
                )}

                {/* Body Preview */}
                <div className={`p-4 space-y-3 ${selectedTheme === 3 ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}>
                  {/* Customer Card */}
                  <div
                    className={`rounded-lg p-2.5 text-[10px] border ${
                      selectedTheme === 2
                        ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                        : selectedTheme === 3
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Billed To: Sharma Enterprises</span>
                      <span className="font-mono">Inv: #INV-0042</span>
                    </div>
                    <div className="text-[9px] opacity-80 mt-0.5">Place of Supply: Rajasthan (08)</div>
                  </div>

                  {/* Table Sample */}
                  <div className="overflow-hidden rounded-lg border border-slate-200 text-[10px]">
                    <div
                      className={`grid grid-cols-12 p-1.5 font-bold ${
                        selectedTheme === 2
                          ? 'bg-blue-900 text-white'
                          : selectedTheme === 3
                          ? 'bg-slate-950 text-amber-400 border-b border-amber-500/30'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      <span className="col-span-1">#</span>
                      <span className="col-span-7">Item Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>
                    <div className="grid grid-cols-12 p-1.5 border-b border-slate-100 font-medium">
                      <span className="col-span-1">1</span>
                      <span className="col-span-7">Commercial Product Line Item</span>
                      <span className="col-span-2 text-center">2 Pcs</span>
                      <span className="col-span-2 text-right font-mono">₹ 14,000</span>
                    </div>
                    <div className="grid grid-cols-12 p-1.5 font-medium opacity-75">
                      <span className="col-span-1">2</span>
                      <span className="col-span-7">Installation & Testing Charges</span>
                      <span className="col-span-2 text-center">1 Job</span>
                      <span className="col-span-2 text-right font-mono">₹ 2,500</span>
                    </div>
                  </div>

                  {/* Summary Strip */}
                  <div
                    className={`flex justify-between items-center rounded-xl p-2.5 font-black text-xs ${
                      selectedTheme === 2
                        ? 'bg-blue-900 text-white'
                        : selectedTheme === 3
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-900 text-amber-400'
                    }`}
                  >
                    <span>Grand Total (with Tax):</span>
                    <span className="font-mono text-sm">₹ 19,470.00</span>
                  </div>

                  {/* Watermark Preview if set */}
                  {selectedWatermark && (
                    <div className="text-center py-1">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-dashed border-slate-400 opacity-60">
                        Watermark: {selectedWatermark}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <p className="text-xs text-slate-400">
            Selected Theme: <b className="text-amber-400">{selectedTheme === 1 ? 'Minimal (Classic Light)' : selectedTheme === 2 ? 'Modern (Corporate Blue)' : 'Professional (Midnight Onyx)'}</b>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveGlobalDefault}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black shadow-lg transition ${
                isSavedSuccessfully
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110'
              }`}
            >
              {isSavedSuccessfully ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved Globally as Default!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  <span>Save Preferred Template Globally</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
