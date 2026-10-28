import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Apple } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Install Prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
        title="Install Nexbill as an app on your phone or computer (Works offline)"
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit beforeinstallprompt guide)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
          title="Install on iPhone / iPad"
        >
          <Apple className="h-3.5 w-3.5 text-white" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-white" />
                  <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-slate-950 shrink-0">
                    1
                  </span>
                  <span>Safari browser toolbar me neeche <b>Share (Tir wala box)</b> icon par tap karein.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-slate-950 shrink-0">
                    2
                  </span>
                  <span>List me scroll karein aur <b>"Add to Home Screen" (Home Screen par jodein)</b> par click karein.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-slate-950 shrink-0">
                    ✓
                  </span>
                  <span>Nexbill Solar Pro bina internet ke aapke phone me app bankar save ho jayega!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md transition"
              >
                Theek Hai / Samajh Gaya
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
