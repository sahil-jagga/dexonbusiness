import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  FileCode,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { backupService } from '../services/backupService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    try {
      backupService.exportFullBackup();
      setMessage({
        type: 'success',
        text: 'Backup file downloaded! Keep this JSON file safe on your computer, Google Drive or pendrive.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Failed to create backup: ${err.message}`,
      });
    }
  };

  const handleExportCsv = () => {
    try {
      backupService.exportInvoicesToCSV();
      setMessage({
        type: 'success',
        text: 'All invoices exported to CSV! Open with Microsoft Excel, LibreOffice, or Google Sheets.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Failed to export CSV: ${err.message}`,
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring will import records from this backup file. Do you want to proceed?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    setMessage(null);

    const result = await backupService.restoreBackupFromFile(file);
    setRestoring(false);

    if (result.success) {
      setMessage({
        type: 'success',
        text: result.message,
      });
      if (onDataRestored) {
        onDataRestored();
      }
    } else {
      setMessage({
        type: 'error',
        text: result.message,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Data Backup, Restore & Source Export
              </h2>
              <p className="text-xs text-slate-400">
                100% Offline Data Protection, Disaster Recovery & Claude Source Code Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs ${
              message.type === 'success'
                ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border border-rose-500/40 bg-rose-950/40 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1">{message.text}</div>
          </div>
        )}

        {/* Main Grid: Backup & Restore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Download Full Backup */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <HardDrive className="h-4 w-4" /> 1. System Backup (JSON)
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Downloads complete snapshot of all bills, customers, firms, daybook entries, and digital signatures into an encrypted JSON file.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-bold text-white shadow-md transition"
            >
              <Download className="h-4 w-4" />
              Download Backup (.json)
            </button>
          </div>

          {/* Card 2: Restore from Backup */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Upload className="h-4 w-4" /> 2. Restore Backup (JSON)
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Restore your previous data if browser cache is cleared or when moving to a new computer or mobile phone.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                disabled={restoring}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/50 hover:bg-emerald-900/60 px-3 py-2 text-xs font-bold text-emerald-300 transition"
              >
                {restoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {restoring ? 'Restoring Data...' : 'Upload & Restore (.json)'}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Grid: Excel CSV & Claude Clean Source Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
          {/* Card 3: Export Invoices to Excel CSV */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <FileSpreadsheet className="h-4 w-4" /> Excel / CSV Export
            </div>
            <p className="text-[11px] text-slate-400">
              Export all sales invoices into an Excel spreadsheet for your CA or tax filing.
            </p>
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
              Export Invoices to Excel
            </button>
          </div>

          {/* Card 4: Claude / CA Clean Source Code Zip */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <FileCode className="h-4 w-4 text-purple-400" /> Source Code for Claude / CA
            </div>
            <p className="text-[11px] text-slate-400">
              Clean unminified TypeScript/React source code (.zip) under 200KB — ideal for Claude AI code review without upload limits.
            </p>
            <a
              href="/NexBill-Fixed-Source-v1.zip"
              download="NexBill-Fixed-Source-v1.zip"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow transition"
            >
              <Download className="h-3.5 w-3.5" />
              Download NexBill-Fixed-Source-v1.zip
            </a>
          </div>
        </div>

        {/* Security / Privacy Footnote */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Data Privacy & Compliance Notice:
          </div>
          <div>
            All customer data, Aadhaar numbers, and billing history are stored 100% locally in your device storage and are never uploaded to any external third-party servers. Customer Aadhaar numbers on exported invoices are masked (first 8 digits hidden as <code className="text-amber-300">XXXX-XXXX-1234</code>) in compliance with UIDAI regulations.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
