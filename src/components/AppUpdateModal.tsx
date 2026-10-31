import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Bug,
  Zap,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  History,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CURRENT_APP_VERSION, APP_CHANGELOG, ReleaseNote } from '../config/version';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedVersion: string;
  onApplyUpdate: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  installedVersion,
  onApplyUpdate,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_APP_VERSION);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const activeRelease: ReleaseNote =
    APP_CHANGELOG.find((r) => r.version === selectedVersion) || APP_CHANGELOG[0];
  const hasPendingUpdate = installedVersion !== CURRENT_APP_VERSION;

  const handleExecuteUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      onApplyUpdate();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-amber-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Dexon Software Update & Bug Fixes
                {hasPendingUpdate && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ✨ Update Ready
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Aapke installed app ka version, naye updates aur sabhi bug fixes ki complete list.
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

        {/* Status Bar */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1">
              <span className="text-slate-400">Installed Version: </span>
              <b className="font-mono text-slate-200">v{installedVersion}</b>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 hidden sm:block" />
            <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 px-3 py-1">
              <span className="text-amber-300">Latest Release: </span>
              <b className="font-mono text-white">v{CURRENT_APP_VERSION}</b>
            </div>
          </div>

          {/* Quick Version Switcher Pills */}
          <div className="flex items-center gap-1">
            {APP_CHANGELOG.map((rel) => (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  selectedVersion === rel.version
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                v{rel.version} {rel.isLatest ? '(New)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Release Notes & Bug Fixes */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Release Title Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>Version {activeRelease.version} Release Notes</span>
                  {activeRelease.isLatest && (
                    <span className="rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/40">
                      CURRENT PRODUCTION
                    </span>
                  )}
                </h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Released on: <b className="text-slate-300">{activeRelease.releaseDate}</b>
                </div>
              </div>

              {hasPendingUpdate && (
                <button
                  type="button"
                  onClick={handleExecuteUpdate}
                  disabled={isUpdating}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
                >
                  <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? 'Updating App...' : '🚀 1-Click Update Now'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Bug Fixes (High Priority for Client Confidence) */}
          <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-slate-950 to-slate-950 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-black text-rose-300 uppercase tracking-wider mb-3">
              <Bug className="h-4 w-4 text-rose-400" />
              <span>Resolved Issues & Bug Fixes in v{activeRelease.version}</span>
            </div>
            <div className="space-y-2">
              {activeRelease.bugFixes.map((fix, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 font-bold text-[11px] mt-0.5">
                    ✓
                  </div>
                  <span className="text-slate-200 leading-relaxed font-medium">{fix}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: New Features Added */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider mb-3">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>New Features & Capabilities</span>
            </div>
            <div className="space-y-2">
              {activeRelease.newFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="text-slate-200 leading-relaxed font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Key Release Highlights */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
              <Sparkles className="h-4 w-4" />
              <span>Key Highlights Summary</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeRelease.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Dexon Enterprise Auto-Sync: Updates preserve all your existing bills & client history.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>
            {hasPendingUpdate && (
              <button
                type="button"
                onClick={handleExecuteUpdate}
                disabled={isUpdating}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition"
              >
                <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Updating Now...' : 'Update Dexon to v' + CURRENT_APP_VERSION}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
