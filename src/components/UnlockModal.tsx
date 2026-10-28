import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyKey: (key: string) => Promise<{ success: boolean; message?: string }>;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ isOpen, onClose, onVerifyKey }) => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorMsg('Please enter a license key');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await onVerifyKey(keyInput.trim());
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Invalid or revoked license key');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <KeyRound className="h-4 w-4 text-amber-400" /> Enter / Change License Key
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Enter your License Key</label>
            <input
              type="text"
              placeholder="e.g. NXB-PRO-XXXX-XXXX-XXXX"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold tracking-wider text-amber-400 focus:border-amber-400 focus:outline-none"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-rose-400">{errorMsg}</div>
          )}

          <div className="rounded-lg bg-slate-950 p-2.5 text-[11px] text-slate-400 space-y-1">
            <div><b>Activated key</b> locks automatically to this device for full offline security.</div>
            <div><b>Need a key?</b> Call / WhatsApp: <b className="text-amber-400">94298-42000</b></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Activate License 🔓'}
          </button>
        </form>
      </div>
    </div>
  );
};
