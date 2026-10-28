import React, { useState } from 'react';
import { FirmInfo, BankInfo, TermsInfo, LicenseInfo } from '../types/solar';
import { Building2, Landmark, FileText, KeyRound, Upload, Check, PenTool, ShieldCheck, Hash } from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';

interface FirmSettingsDrawerProps {
  firm: FirmInfo;
  onFirmChange: (f: FirmInfo) => void;
  bank: BankInfo;
  onBankChange: (b: BankInfo) => void;
  terms: TermsInfo;
  onTermsChange: (t: TermsInfo) => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  license: LicenseInfo | null;
  onChangeLicense: () => void;
  onOpenAdmin: () => void;
  onSaveAll: () => void;
  onOpenMultiFirm?: () => void;
  onLoadDemoData?: () => void;
}

export const FirmSettingsDrawer: React.FC<FirmSettingsDrawerProps> = ({
  firm,
  onFirmChange,
  bank,
  onBankChange,
  terms,
  onTermsChange,
  currency,
  onCurrencyChange,
  license,
  onChangeLicense,
  onOpenAdmin,
  onSaveAll,
  onOpenMultiFirm,
  onLoadDemoData,
}) => {
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onFirmChange({ ...firm, logo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-900/90 p-4 text-slate-100 border-r border-slate-800 space-y-5">
      {/* License Status Card */}
      <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4" /> Current License
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              license?.plan === 'Business'
                ? 'bg-purple-500/20 text-purple-300'
                : license?.plan === 'Pro'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {license?.plan || 'Free Trial'}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-300">
          <div>Client: <b className="text-white">{license?.clientName || 'Demo User'}</b></div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Key: <span className="text-amber-300">{license?.key || 'None'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Valid Till: <b className="text-slate-200">{license?.expiry || '—'}</b>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onChangeLicense}
            className="flex-1 rounded bg-slate-800 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700"
          >
            Change License
          </button>
          <button
            onClick={onOpenAdmin}
            className="flex-1 rounded border border-slate-700 bg-slate-900 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Admin Panel
          </button>
        </div>
      </div>

      {/* Multi-Firm Manager Shortcut */}
      {onOpenMultiFirm && (
        <button
          onClick={onOpenMultiFirm}
          className="w-full flex items-center justify-between rounded-xl border border-purple-500/40 bg-purple-950/30 p-2.5 text-xs font-bold text-purple-300 hover:bg-purple-900/40 transition"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-400" />
            <span>Multi-Firm Manager (Unlimited)</span>
          </span>
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-200">
            Open ➔
          </span>
        </button>
      )}

      {/* Firm Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <Building2 className="h-4 w-4 text-amber-400" /> Firm & Company Details
        </h3>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Firm Name *</label>
          <input
            type="text"
            value={firm.name}
            onChange={(e) => onFirmChange({ ...firm, name: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Tagline / Subheading</label>
          <input
            type="text"
            value={firm.tagline}
            onChange={(e) => onFirmChange({ ...firm, tagline: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Office Address</label>
          <textarea
            rows={2}
            value={firm.address}
            onChange={(e) => onFirmChange({ ...firm, address: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Mobile / Tel</label>
            <input
              type="text"
              value={firm.mobile}
              onChange={(e) => onFirmChange({ ...firm, mobile: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">GSTIN</label>
            <input
              type="text"
              value={firm.gstin}
              onChange={(e) => onFirmChange({ ...firm, gstin: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Email</label>
            <input
              type="email"
              value={firm.email}
              onChange={(e) => onFirmChange({ ...firm, email: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">PAN No.</label>
            <input
              type="text"
              value={firm.pan}
              onChange={(e) => onFirmChange({ ...firm, pan: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Firm Logo (Prints on invoices)</label>
          <div className="flex items-center gap-3">
            <div className="h-14 w-28 rounded-lg border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
              {firm.logo ? (
                <img src={firm.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-500">No Logo</span>
              )}
            </div>
            <label className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {firm.logo && (
              <button
                type="button"
                onClick={() => onFirmChange({ ...firm, logo: '' })}
                className="text-xs text-slate-500 hover:text-rose-400"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Digital Signature & Stamp */}
        <div className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" /> Authorised Signature & Stamp
            </label>
            {firm.signature && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <Check className="h-3 w-3" /> Active on PDF
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-16 w-32 rounded-lg border border-dashed border-slate-700 bg-white flex items-center justify-center overflow-hidden p-1 shadow-inner">
              {firm.signature ? (
                <img
                  src={firm.signature}
                  alt="Authorised Signatory"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400 font-medium italic text-center leading-tight">
                  No Signature<br />(Blank line on PDF)
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => setIsSigModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:brightness-110 active:scale-95 transition"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>{firm.signature ? 'Change / Re-draw' : '✍️ Draw / Upload'}</span>
              </button>

              {firm.signature && (
                <button
                  type="button"
                  onClick={() => onFirmChange({ ...firm, signature: '' })}
                  className="text-[11px] text-slate-400 hover:text-rose-400 text-left transition px-1"
                >
                  ✕ Remove Signature
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Draw your signature using mouse/touch or upload an image. It will print cleanly on Tax Invoices, Quotations & WCC.
          </p>
        </div>

        {/* Invoice Auto-Numbering Settings */}
        <div className="rounded-xl border border-blue-500/30 bg-slate-950/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> Invoice Auto-Numbering Setup
            </label>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 border border-blue-500/30">
              No Duplicates
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Prefix / Code</label>
              <input
                type="text"
                placeholder="e.g. JE or INV"
                value={firm.invoicePrefix || ''}
                onChange={(e) => onFirmChange({ ...firm, invoicePrefix: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white uppercase font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Start Seq No.</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 1 or 101"
                value={firm.invoiceStartingNumber || ''}
                onChange={(e) => onFirmChange({ ...firm, invoiceStartingNumber: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Next invoice numbers will auto-increment based on history records and never produce duplicates.
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <Landmark className="h-4 w-4 text-emerald-400" /> Bank & Payment Details
        </h3>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Bank Name</label>
          <input
            type="text"
            placeholder="e.g. Punjab National Bank"
            value={bank.bankName}
            onChange={(e) => onBankChange({ ...bank, bankName: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Account Number</label>
            <input
              type="text"
              placeholder="e.g. 6156002100006195"
              value={bank.accountNo}
              onChange={(e) => onBankChange({ ...bank, accountNo: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">IFSC Code</label>
            <input
              type="text"
              placeholder="e.g. PUNB0615600"
              value={bank.ifsc}
              onChange={(e) => onBankChange({ ...bank, ifsc: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Branch Name</label>
            <input
              type="text"
              placeholder="e.g. Sadhuali Cantt, Sri Ganganagar"
              value={bank.branch}
              onChange={(e) => onBankChange({ ...bank, branch: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">UPI ID / VPA</label>
            <input
              type="text"
              placeholder="e.g. 9429842000@pnb"
              value={bank.upiId || ''}
              onChange={(e) => onBankChange({ ...bank, upiId: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Terms & Declarations */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <FileText className="h-4 w-4 text-blue-400" /> Declarations & T&C
        </h3>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Declaration (Printed on Tax Invoice)
          </label>
          <textarea
            rows={2}
            value={terms.declaration}
            onChange={(e) => onTermsChange({ ...terms, declaration: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Terms & Conditions (Warranty, Jurisdiction)
          </label>
          <textarea
            rows={2}
            value={terms.tnc}
            onChange={(e) => onTermsChange({ ...terms, tnc: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="text-[11px] font-medium text-slate-400 block mb-1">Currency Symbol</label>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
        >
          <option value="₹">₹ Indian Rupee (INR)</option>
          <option value="$">$ US Dollar (USD)</option>
          <option value="AED">AED UAE Dirham</option>
          <option value="£">£ British Pound (GBP)</option>
          <option value="€">€ Euro (EUR)</option>
        </select>
      </div>

      <button
        onClick={onSaveAll}
        className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400 shadow-md"
      >
        💾 Save Firm & Bank Settings
      </button>

      {onLoadDemoData && (
        <button
          type="button"
          onClick={onLoadDemoData}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          title="Load Jagga Enterprises & sample invoices for testing"
        >
          🧪 Load Demo Sample (Jagga Solar Dataset)
        </button>
      )}

      {/* Digital Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        currentSignature={firm.signature}
        onSaveSignature={(sigUrl) => {
          onFirmChange({ ...firm, signature: sigUrl });
        }}
        firmName={firm.name}
      />
    </div>
  );
};
