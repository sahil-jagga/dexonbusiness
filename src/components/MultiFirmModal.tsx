import React, { useState } from 'react';
import { FirmInfo, BankInfo } from '../types/solar';
import { Building, Plus, Trash2, Edit3, Check, CheckCircle2, X, Upload } from 'lucide-react';

interface MultiFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmsList: FirmInfo[];
  activeFirm: FirmInfo;
  onSelectFirm: (firm: FirmInfo) => void;
  onSaveFirmList: (list: FirmInfo[]) => void;
  isBusinessPlan: boolean;
  onUpgradePrompt: () => void;
  plan?: 'Trial' | 'Pro' | 'Business';
}

export const MultiFirmModal: React.FC<MultiFirmModalProps> = ({
  isOpen,
  onClose,
  firmsList,
  activeFirm,
  onSelectFirm,
  onSaveFirmList,
  isBusinessPlan,
  onUpgradePrompt,
  plan = 'Trial',
}) => {
  const [editingFirm, setEditingFirm] = useState<FirmInfo | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLogo, setFormLogo] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    // Check firm limits based on plan (Trial strictly max 1 firm, Pro & Business unlimited)
    const count = firmsList.length;
    if (plan === 'Trial' && count >= 1) {
      alert('🔒 Free Trial Limit: Only 1 firm is allowed on the Free Trial.\n\nPlease upgrade to Pro or Business for unlimited multi-firm management.');
      onUpgradePrompt();
      return;
    }

    setEditingFirm(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormTagline('');
    setFormAddress('');
    setFormMobile('');
    setFormGstin('');
    setFormPan('');
    setFormEmail('');
    setFormLogo('');
  };

  const handleStartEdit = (f: FirmInfo) => {
    setEditingFirm(f);
    setIsCreatingNew(true);
    setFormName(f.name);
    setFormTagline(f.tagline || '');
    setFormAddress(f.address || '');
    setFormMobile(f.mobile || '');
    setFormGstin(f.gstin || '');
    setFormPan(f.pan || '');
    setFormEmail(f.email || '');
    setFormLogo(f.logo || '');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter firm name');
      return;
    }

    const firmObj: FirmInfo = {
      id: editingFirm?.id || 'firm_' + Date.now(),
      name: formName.trim(),
      tagline: formTagline.trim(),
      address: formAddress.trim(),
      mobile: formMobile.trim(),
      gstin: formGstin.trim().toUpperCase(),
      pan: formPan.trim().toUpperCase(),
      email: formEmail.trim(),
      logo: formLogo,
    };

    let updated: FirmInfo[];
    if (editingFirm) {
      updated = firmsList.map((f) => (f.id === editingFirm.id || f.name === editingFirm.name ? firmObj : f));
    } else {
      updated = [...firmsList, firmObj];
    }

    onSaveFirmList(updated);
    setIsCreatingNew(false);
    setEditingFirm(null);

    // If active firm was edited, update it
    if (activeFirm.name === editingFirm?.name || activeFirm.id === editingFirm?.id) {
      onSelectFirm(firmObj);
    }
  };

  const handleDeleteFirm = (firmToDelete: FirmInfo) => {
    if (firmsList.length <= 1) {
      alert('You must have at least 1 active firm');
      return;
    }
    if (confirm(`Are you sure you want to delete firm: "${firmToDelete.name}"?`)) {
      const updated = firmsList.filter((f) => f.name !== firmToDelete.name && f.id !== firmToDelete.id);
      onSaveFirmList(updated);
      if (activeFirm.name === firmToDelete.name) {
        onSelectFirm(updated[0]);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Multi-Firm Manager
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  Unlimited Firms (Business Plan)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Switch between different companies, GSTINs, and letterheads in 1 click.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {!isCreatingNew ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-slate-300">
                  Aapki Registered Firms: <span className="text-amber-400 font-extrabold">{firmsList.length}</span>
                </div>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/20"
                >
                  <Plus className="h-4 w-4" /> + Add New Firm (Unlimited)
                </button>
              </div>

              {/* Firms Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {firmsList.map((f, i) => {
                  const isActive = activeFirm.name === f.name || activeFirm.id === f.id;
                  return (
                    <div
                      key={f.id || i}
                      className={`relative rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-lg'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> ACTIVE FIRM
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-3">
                          {f.logo ? (
                            <img src={f.logo} alt="Logo" className="h-10 w-16 object-contain rounded bg-white/10 p-1" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-black text-sm">
                              #{i + 1}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-white text-sm">{f.name}</h3>
                            <p className="text-[10px] text-slate-400">{f.tagline || 'Solar EPC Contractor'}</p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
                          <div>
                            <span className="text-slate-500">GSTIN:</span> <b className="text-amber-400 font-mono">{f.gstin || 'None'}</b>
                          </div>
                          <div>
                            <span className="text-slate-500">Phone:</span> {f.mobile || '—'}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1" title={f.address}>
                            <span className="text-slate-500">Address:</span> {f.address || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(f)}
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          {firmsList.length > 1 && (
                            <button
                              onClick={() => handleDeleteFirm(f)}
                              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-400 ml-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          )}
                        </div>

                        {!isActive ? (
                          <button
                            onClick={() => {
                              onSelectFirm(f);
                              onClose();
                            }}
                            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-slate-700"
                          >
                            Set Active ➔
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-400">Currently Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Building className="h-4 w-4" /> {editingFirm ? 'Edit Firm Details' : 'Add New Firm (Unlimited)'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Company / Firm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jagga Solar Energy Pvt Ltd"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Tagline / Subheading</label>
                  <input
                    type="text"
                    placeholder="Solar EPC Solutions | PM Surya Ghar Empanelled"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Office / Works Address</label>
                  <textarea
                    rows={2}
                    placeholder="Complete business address"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Contact Phone Numbers</label>
                  <input
                    type="text"
                    placeholder="e.g. 94298-42000 | 94283-42000"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 08AABCJ1234F1Z5"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AABCJ1234F"
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Business Email</label>
                  <input
                    type="email"
                    placeholder="info@yourcompany.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Firm Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-24 rounded-lg border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
                      {formLogo ? (
                        <img src={formLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-500">No Logo</span>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-slate-700 flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Upload Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {formLogo && (
                      <button
                        type="button"
                        onClick={() => setFormLogo('')}
                        className="text-xs text-slate-500 hover:text-rose-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500"
                >
                  Save Firm
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
