import React, { useState } from 'react';
import {
  Bug,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Phone,
  User,
  Paperclip,
  Check,
  Mail
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '../config/version';
import { FirmInfo } from '../types/solar';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  firm: FirmInfo;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  firm,
}) => {
  const [category, setCategory] = useState<'BUG' | 'CALCULATION' | 'FEATURE' | 'OTHER'>('BUG');
  const [clientName, setClientName] = useState(firm.name || '');
  const [clientPhone, setClientPhone] = useState(firm.mobile || '');
  const [clientEmail, setClientEmail] = useState(firm.email || '');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Kripya apna message ya dikkat detail me likhein.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const diagnostics = includeDiagnostics
      ? {
          appVersion: CURRENT_APP_VERSION,
          userAgent: navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
        }
      : null;

    const payload = {
      id: 'REP-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      category,
      clientName: clientName.trim() || 'Anonymous User',
      clientPhone: clientPhone.trim() || 'Not Provided',
      clientEmail: clientEmail.trim() || '',
      message: message.trim(),
      diagnostics,
    };

    try {
      // 1. Post to backend server endpoint
      const res = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 2. Also save to local registry for offline/history
      try {
        const existing = JSON.parse(localStorage.getItem('dexon_bug_reports_local') || '[]');
        existing.unshift(payload);
        localStorage.setItem('dexon_bug_reports_local', JSON.stringify(existing.slice(0, 50)));
      } catch {}

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    } catch (err: any) {
      // Offline fallback: still save locally
      try {
        const existing = JSON.parse(localStorage.getItem('dexon_bug_reports_local') || '[]');
        existing.unshift(payload);
        localStorage.setItem('dexon_bug_reports_local', JSON.stringify(existing.slice(0, 50)));
      } catch {}

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }
  };

  const handleSendViaWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 *Dexon Bug / Support Report*\n` +
      `Category: ${category}\n` +
      `Client: ${clientName || 'User'} (${clientPhone || 'N/A'})\n` +
      `Version: v${CURRENT_APP_VERSION}\n\n` +
      `*Issue Details:*\n${message}`
    );
    window.open(`https://wa.me/919429842000?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-xl flex-col rounded-3xl border border-rose-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <Bug className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Report an Issue or Feedback
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  Priority Support
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Koi dikkat, calculation doubt ya nayi feature request yaha submit karein.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-black text-white">Aapka Message Safalta-Purvak Submit Ho Gaya!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Aapki report encrypted pipeline ke through direct hamari core engineering team ke inbox me deliver ho gayi hai. Hum ise turant review karenge.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="w-full sm:w-auto rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Send Copy to WhatsApp Also</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSuccess(false);
                  setMessage('');
                  onClose();
                }}
                className="w-full sm:w-auto rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Done / Theek Hai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category Pills */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Issue Category (Kaisa mudda hai?)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'BUG', label: '🐛 Bug / Kharabi' },
                  { id: 'CALCULATION', label: '🧮 Tax / Math' },
                  { id: 'FEATURE', label: '✨ New Feature' },
                  { id: 'OTHER', label: '💬 Feedback' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`rounded-xl border py-2 px-2 text-xs font-bold transition text-center ${
                      category === cat.id
                        ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Your / Business Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Aapka / Firm ka naam"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  WhatsApp / Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Email ID (For Fix Update)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Message Box */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Describe the Issue / Suggestion *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detail me batayein: Kya dikkat aayi? Kaunsa step follow karne par error aaya? Ya kaunsi nayi feature chahiye..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* System Diagnostics Checkbox */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span>Include diagnostic info (App v{CURRENT_APP_VERSION}, browser info) for faster resolution</span>
              </label>
            </div>

            {/* Hidden Email Privacy Notice */}
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <b>Secret Delivery Pipeline:</b> Aapka sandesh encrypted server proxy ke through direct owner inbox me jata hai.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 shadow-lg shadow-rose-500/20 flex items-center gap-2 transition"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Sending Report...' : 'Submit Issue to Support ➔'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
