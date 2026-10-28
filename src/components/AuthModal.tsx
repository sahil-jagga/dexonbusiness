import React, { useState } from 'react';
import { X, User, Shield, CheckCircle, Database, LogOut, Mail, Lock } from 'lucide-react';
import { authService, AuthUser } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUserChange: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMsg({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await authService.signIn(email);
      onUserChange(user);
      setMsg({ text: `Logged in as ${user.email}. Workspace data is now safely isolated.`, type: 'success' });
      setTimeout(() => {
        onClose();
        setMsg(null);
      }, 1200);
    } catch {
      setMsg({ text: 'Sign in failed. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    const guest = authService.getCurrentUser();
    onUserChange(guest);
    setMsg({ text: 'Signed out. Returned to local workspace.', type: 'success' });
    setTimeout(() => {
      onClose();
      setMsg(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">User Account & Database</h2>
              <p className="text-[11px] text-slate-400">Secure Workspace & Multi-Tenant Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Active Account Status */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Active Workspace:</span>
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <CheckCircle className="h-3 w-3" /> Data Isolated
              </span>
            </div>
            <div className="text-sm font-black text-white">{currentUser.fullName}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Shield className="h-3 w-3 text-amber-400" /> Tenant ID: {currentUser.id}
            </div>
          </div>

          {msg && (
            <div
              className={`rounded-lg p-2.5 text-xs font-semibold ${
                msg.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800'
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Sign In / Switch Account Form */}
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sign In to Specific Business Account
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@business.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-amber-500 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Switching Workspace...' : 'Switch Workspace / Account'}
            </button>
          </form>

          {/* Database Info */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Database className="h-3.5 w-3.5 text-blue-400" /> PostgreSQL & Supabase Database
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Records are isolated by user ID. When Supabase environment keys are provided, data synchronizes to cloud PostgreSQL with Row Level Security.
            </p>
          </div>

          {currentUser.id !== 'local_user' && (
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:border-rose-800 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out & Return to Guest Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
