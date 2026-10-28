import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/90 px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
      <WifiOff className="h-4 w-4 text-amber-400" />
      <span>Offline Mode — PWA Service Worker Active (Local Storage Enabled)</span>
    </div>
  );
};
