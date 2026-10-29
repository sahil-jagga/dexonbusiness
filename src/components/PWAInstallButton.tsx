import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, X, Apple, Monitor, CheckCircle2, DownloadCloud, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running inside standalone installed window
  if (isInstalled) {
    return (
      <span
        className="hidden md:inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-2 py-1 text-[10px] font-bold text-emerald-400"
        title="Dexon is installed and running as a standalone app"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span>Dexon Installed</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    // 1-Click Direct Install: If browser prompt is available, launch native OS install dialog directly!
    if (isInstallable) {
      try {
        const outcome = await install();
        // If user accepted, browser handles the installation automatically
        if (outcome) {
          return;
        }
      } catch {
        setShowGuideModal(true);
      }
    } else {
      // If prompt not available yet (or already installed in Chrome browser profile)
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 font-extrabold text-white shadow-md shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
        title="Install Dexon directly on your phone or computer as a standalone desktop/mobile app (1-Click Instant Install, Works 100% Offline)"
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
        <span>Install App</span>
      </button>

      {/* Cross-Platform Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                  <DownloadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    Install Dexon App
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                      PWA Offline Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Install without Google Play / App Store — Works 100% Offline</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Instruction Guides */}
            <div className="mt-4 space-y-3.5 text-xs">
              {isIOS ? (
                // iPhone / iPad Guide
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Apple className="h-4 w-4 text-slate-200" />
                    <span>iPhone / iPad (Safari Browser)</span>
                  </div>
                  <div className="space-y-2 text-slate-300 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 shrink-0">1</span>
                      <span>Safari browser ke bottom toolbar me <b>Share (Tir wala square icon)</b> par tap karein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 shrink-0">2</span>
                      <span>Neeche scroll karein aur <b>"Add to Home Screen"</b> par click karein.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Android Phone Guide */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Smartphone className="h-4 w-4 text-emerald-400" />
                      <span>Android Phone (Chrome / Brave / Edge)</span>
                    </div>
                    <div className="space-y-1.5 text-slate-300 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-slate-950 shrink-0">1</span>
                        <span>Browser ke top-right me <b>3 Dots (⋮)</b> menu par click karein.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-slate-950 shrink-0">2</span>
                        <span>Menu me <b>"Install app"</b> ya <b>"Add to Home screen"</b> chunein.</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop / Laptop Guide with "Open in app" explanation */}
                  <div className="rounded-2xl border border-cyan-500/40 bg-slate-950 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Monitor className="h-4 w-4 text-cyan-400" />
                        <span>Computer / Laptop (Chrome / Edge)</span>
                      </div>
                      <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                        Desktop App
                      </span>
                    </div>

                    {/* Notice for "Open in app" address bar button */}
                    <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-[11px] text-amber-200 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-300">
                        <span>🖥️</span> Address Bar mein "Open in app" button:
                      </div>
                      <p className="text-slate-200">
                        Agar aapke Chrome address bar (URL ke bilkul right side) par <b>[ 🖥️ Open in app ]</b> dikh raha hai, toh ye app aapke PC par <b>already installed</b> hai! Use click karke direct app window kholiye.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-slate-300 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-slate-950 shrink-0">1</span>
                        <span>Browser address bar (URL) ke right side me <b>Install icon (🖥️ / 📥)</b> ya <b>Open in app</b> par click karein.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-slate-950 shrink-0">2</span>
                        <span>Ya Chrome Menu (3 dots) ➔ <b>Cast, save and share</b> ➔ <b>"Install Dexon"</b> karein.</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Offline Benefit Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center gap-2 text-emerald-300 text-[11px]">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Install hone ke baad ye app phone/computer me <b>bina internet</b> ke bhi fast khulegi!</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
            >
              Samajh Gaya / Theek Hai
            </button>
          </div>
        </div>
      )}
    </>
  );
};
