import React, { useState, useEffect } from 'react';
import { CustomerInfo } from '../types/solar';
import { User, Users, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface CustomerDrawerProps {
  customer: CustomerInfo;
  onCustomerChange: (c: CustomerInfo) => void;
  onClose?: () => void;
  onOpenCrm?: () => void;
}

const SAVED_CUSTOMERS_KEY = 'nb_saved_customers_list';

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  customer,
  onCustomerChange,
  onOpenCrm,
}) => {
  const [savedList, setSavedList] = useState<CustomerInfo[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_CUSTOMERS_KEY);
      if (raw) setSavedList(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const handleSaveToDirectory = () => {
    if (!customer.name.trim()) {
      alert('Please enter at least customer name');
      return;
    }
    const updated = [customer, ...savedList.filter((c) => c.name !== customer.name)].slice(0, 50);
    setSavedList(updated);
    localStorage.setItem(SAVED_CUSTOMERS_KEY, JSON.stringify(updated));
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 2000);
  };

  const handleSelectCustomer = (c: CustomerInfo) => {
    onCustomerChange(c);
    setShowSavedList(false);
  };

  const handleDeleteSaved = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedList.filter((c) => c.name !== name);
    setSavedList(updated);
    localStorage.setItem(SAVED_CUSTOMERS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-900/90 p-4 text-slate-100 border-r border-slate-800 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <User className="h-4 w-4" /> Customer & PM Surya Ghar Details
        </h3>
        <button
          onClick={() => setShowSavedList(!showSavedList)}
          className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <Users className="h-3.5 w-3.5 text-amber-400" />
          Saved ({savedList.length})
        </button>
      </div>

      {/* CRM Portal Shortcut */}
      {onOpenCrm && (
        <button
          onClick={onOpenCrm}
          className="w-full flex items-center justify-between rounded-xl border border-purple-500/40 bg-purple-950/30 p-2.5 text-xs font-bold text-purple-300 hover:bg-purple-900/40 transition"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span>Open Customer CRM & History</span>
          </span>
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-200">
            Open ➔
          </span>
        </button>
      )}

      {showSavedList && (
        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-lg">
          <div className="text-xs font-bold text-amber-400 mb-2">Select Saved Customer:</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {savedList.map((c, i) => (
              <div
                key={i}
                onClick={() => handleSelectCustomer(c)}
                className="flex items-center justify-between rounded p-1.5 text-xs hover:bg-slate-800 cursor-pointer text-slate-200"
              >
                <div>
                  <div className="font-semibold text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.mobile || 'No phone'} • {c.sanctionLoad || ''}</div>
                </div>
                <button
                  onClick={(e) => handleDeleteSaved(c.name, e)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {savedList.length === 0 && (
              <div className="text-[11px] text-slate-500 text-center py-2">No saved customers yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Customer Form Fields */}
      <div className="mt-4 space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Site Owner / Customer Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Sh. Rajesh Kumar Verma"
            value={customer.name}
            onChange={(e) => onCustomerChange({ ...customer, name: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Father's / Husband's Name (S/O or W/O)
          </label>
          <input
            type="text"
            placeholder="e.g. S/O Rameshwar Dayal Verma"
            value={customer.relation}
            onChange={(e) => onCustomerChange({ ...customer, relation: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Site Installation Address
          </label>
          <textarea
            rows={2}
            placeholder="Complete address with ward, tehsil & pincode"
            value={customer.address}
            onChange={(e) => onCustomerChange({ ...customer, address: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Mobile Phone</label>
            <input
              type="text"
              placeholder="e.g. 98290-XXXXX"
              value={customer.mobile}
              onChange={(e) => onCustomerChange({ ...customer, mobile: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Aadhaar No. (Masked on Print)</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-1234"
              value={customer.aadhar}
              onChange={(e) => onCustomerChange({ ...customer, aadhar: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
            <span className="text-[9.5px] text-slate-500 block mt-0.5">🔒 UIDAI Compliant: Masked on bills</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3 space-y-2.5">
          <div className="text-[11px] font-bold text-amber-300">PM Surya Ghar & Discom Identifiers</div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Application No. (Surya Ghar Portal)</label>
            <input
              type="text"
              placeholder="e.g. RJ-SG-2026-789104"
              value={customer.appNo}
              onChange={(e) => onCustomerChange({ ...customer, appNo: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Electricity K-No. / Consumer No.</label>
              <input
                type="text"
                placeholder="e.g. 1402/2390/4910"
                value={customer.consumerNo}
                onChange={(e) => onCustomerChange({ ...customer, consumerNo: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Sanctioned Load</label>
              <input
                type="text"
                placeholder="e.g. 3.00 kW"
                value={customer.sanctionLoad}
                onChange={(e) => onCustomerChange({ ...customer, sanctionLoad: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Customer GSTIN (For B2B commercial solar)
          </label>
          <input
            type="text"
            placeholder="Leave empty for residential consumers"
            value={customer.gstin}
            onChange={(e) => onCustomerChange({ ...customer, gstin: e.target.value.toUpperCase() })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSaveToDirectory}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-700"
        >
          {successSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Saved to Directory!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Customer to Directory
            </>
          )}
        </button>
      </div>
    </div>
  );
};
