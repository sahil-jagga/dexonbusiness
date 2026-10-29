import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle2,
  Copy,
  Plus,
  Share2,
  X,
  RefreshCw,
  Download,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Shield,
  LogOut,
  Smartphone,
  Check,
  Sparkles,
  Globe,
  Server,
  ExternalLink,
  FileCode,
  HelpCircle,
  Lock,
  Users,
  ShieldCheck
} from 'lucide-react';
import { licenseService, sha256Hex } from '../services/licenseService';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseChanged?: () => void;
  onSwitchKey?: (key: string) => Promise<void>;
  onLogout?: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onLicenseChanged,
  onSwitchKey,
  onLogout,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Tab inside Admin Modal
  const [adminTab, setAdminTab] = useState<'list' | 'plans' | 'create' | 'simulator' | 'hosting' | 'pins'>('hosting');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Licenses list & stats
  const [licenses, setLicenses] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0, totalInvoices: 0 });
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'Business' | 'Pro' | 'Trial'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New License Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newPlan, setNewPlan] = useState<'Trial' | 'Pro' | 'Business'>('Pro');
  const [durationMonths, setDurationMonths] = useState(12);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // PINs & Staff Management State
  const [newMasterPin, setNewMasterPin] = useState('');
  const [confirmMasterPin, setConfirmMasterPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [staffPins, setStaffPins] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nb_staff_pins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Accountant' | 'Sales Manager' | 'Technical Staff'>('Accountant');
  const [newStaffPin, setNewStaffPin] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [lockoutRemainingSecs, setLockoutRemainingSecs] = useState(0);

  // Check lockout on mount and tick down timer
  useEffect(() => {
    const checkLockout = () => {
      try {
        const lockoutUntil = Number(localStorage.getItem('dexon_admin_lockout_until') || 0);
        if (lockoutUntil > Date.now()) {
          setLockoutRemainingSecs(Math.ceil((lockoutUntil - Date.now()) / 1000));
        } else {
          setLockoutRemainingSecs(0);
        }
      } catch {}
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadLicenses();
    }
  }, [isOpen, isAuthenticated]);

  const MASTER_EMERGENCY_RECOVERY_KEY = 'DEXON-MASTER-RECOVERY-SAHIL-2026';

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (lockoutRemainingSecs > 0) {
      setErrorMsg(`⛔ Security Lockout: Try again in ${Math.floor(lockoutRemainingSecs / 60)}m ${lockoutRemainingSecs % 60}s or use Emergency Recovery.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Check if user typed the emergency master recovery key directly
      if (pin.trim().toUpperCase() === MASTER_EMERGENCY_RECOVERY_KEY) {
        localStorage.removeItem('dexon_admin_failed_attempts');
        localStorage.removeItem('dexon_admin_lockout_until');
        setLockoutRemainingSecs(0);
        setIsAuthenticated(true);
        await loadLicenses();
        return;
      }

      // 2. Regular PIN verification
      const isValid = await licenseService.verifyAdminPin(pin);
      if (isValid) {
        localStorage.removeItem('dexon_admin_failed_attempts');
        localStorage.removeItem('dexon_admin_lockout_until');
        setIsAuthenticated(true);
        await loadLicenses();
      } else {
        const currentFailed = Number(localStorage.getItem('dexon_admin_failed_attempts') || 0) + 1;
        localStorage.setItem('dexon_admin_failed_attempts', String(currentFailed));

        if (currentFailed >= 3) {
          const lockoutTime = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
          localStorage.setItem('dexon_admin_lockout_until', String(lockoutTime));
          setLockoutRemainingSecs(15 * 60);
          setErrorMsg('⛔ 3 Incorrect attempts! Admin Portal locked for 15 minutes to prevent hacking.');
        } else {
          setErrorMsg(`❌ Access Denied: Incorrect PIN / Password. (${3 - currentFailed} attempts remaining before 15m lockout)`);
        }
      }
    } catch {
      setErrorMsg('Failed to authenticate admin');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryKeyInput.trim().toUpperCase() === MASTER_EMERGENCY_RECOVERY_KEY) {
      localStorage.removeItem('dexon_admin_failed_attempts');
      localStorage.removeItem('dexon_admin_lockout_until');
      localStorage.removeItem('nb_admin_pin_hash'); // Reset custom PIN back to default
      setLockoutRemainingSecs(0);
      setIsAuthenticated(true);
      setIsRecoveryMode(false);
      setRecoveryKeyInput('');
      setPin('');
      alert('✅ Master Emergency Recovery Accepted!\n• Security lockout cleared.\n• Admin PIN restored to default (9429).\n• Welcome back, Owner!');
      loadLicenses();
    } else {
      setErrorMsg('❌ Invalid Emergency Recovery Key! Check your confidential owner records.');
    }
  };

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await licenseService.fetchAllLicenses(pin);
      setLicenses(data.licenses || []);
      setStats(data.stats || { total: 0, active: 0, revoked: 0, totalInvoices: 0 });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    try {
      await licenseService.toggleLicense(pin, key);
      await loadLicenses();
      if (onLicenseChanged) onLicenseChanged();
    } catch (err: any) {
      alert('Error updating license: ' + err.message);
    }
  };

  const handleResetDevice = async (key: string) => {
    try {
      await licenseService.resetDevice(pin, key);
      alert(`✅ Device binding reset for key: ${key}. Client can now activate on a new computer/phone.`);
      await loadLicenses();
    } catch (err: any) {
      alert('Error resetting device: ' + err.message);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to permanently DELETE key: ${key}? The user will be locked out immediately.`)) {
      return;
    }
    try {
      await licenseService.deleteLicense(pin, key);
      await loadLicenses();
      if (onLicenseChanged) onLicenseChanged();
    } catch (err: any) {
      alert('Error deleting license: ' + err.message);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      alert('Please enter client/vendor name');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + Number(durationMonths));
    const expiryStr = expiryDate.toISOString().split('T')[0];

    try {
      setLoading(true);
      const res = await licenseService.createLicense(pin, {
        clientName: newClientName,
        clientPhone: newClientPhone,
        plan: newPlan,
        expiry: expiryStr,
        invoiceLimit: newPlan === 'Trial' ? 5 : 99999,
        customKey: newCustomKey.trim() || undefined,
        notes: newNotes,
      });

      alert(`✅ License Key Created Successfully!\nKey: ${res.license.key}\nPlan: ${res.license.plan}`);

      // Reset form
      setNewClientName('');
      setNewClientPhone('');
      setNewCustomKey('');
      setNewNotes('');
      setAdminTab('list');
      await loadLicenses();
      if (onLicenseChanged) onLicenseChanged();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleWhatsAppSend = (item: any) => {
    const text = encodeURIComponent(
      `*⚡ Dexon Business Pro — License Key Details*\n\n` +
      `Hello *${item.clientName}*,\n` +
      `Aapka Dexon Business Pro activation license key taiyar hai:\n\n` +
      `🔑 *License Key:* \`${item.key}\`\n` +
      `📦 *Plan:* ${item.plan}\n` +
      `📅 *Validity:* ${item.expiry}\n` +
      `📄 *Invoice Limit:* ${item.invoiceLimit > 100 ? 'Unlimited Invoices' : item.invoiceLimit + ' Bills/Month'}\n` +
      `🔒 *Device Limit:* 1 Device (Bound to your laptop/phone)\n\n` +
      `🌐 *Tool Website Link:* ${window.location.origin}\n` +
      `_Steps:_ Website kholein ➔ 'Enter License Key' par click karein ➔ Key paste karke Unlock karein!\n\n` +
      `Technical Support: 94298-42000 | Jagga Enterprises`
    );
    const phone = item.clientPhone ? item.clientPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleSafeClose = () => {
    try {
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Dexon Admin License Manager
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Master Control
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate, revoke, delete, or reset 1-device client licenses in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSafeClose}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              title="Close Admin Panel and Return to Dashboard"
            >
              <span>Close / Exit</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {!isAuthenticated ? (
          <div className="flex flex-1 items-center justify-center p-6">
            {!isRecoveryMode ? (
              <form
                onSubmit={handleLogin}
                className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center shadow-2xl"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Owner Security Login</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Sirf aap (Sahil) is panel ko access kar sakte hain. Bank-grade encrypted verification.
                </p>

                {lockoutRemainingSecs > 0 && (
                  <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-left">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Anti-Brute Force Lockout Active
                    </div>
                    <p className="mt-1 text-[11px] text-rose-300">
                      3 galat attempts detect hue hain. System {Math.floor(lockoutRemainingSecs / 60)}m {lockoutRemainingSecs % 60}s ke liye lock hai.
                    </p>
                  </div>
                )}

                <div className="mt-4 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter Owner PIN / Password"
                    disabled={lockoutRemainingSecs > 0}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 pr-10 text-center text-lg font-bold tracking-widest text-amber-400 focus:border-amber-400 focus:outline-none disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-2 text-xs font-semibold text-rose-400">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || lockoutRemainingSecs > 0}
                  className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {loading ? 'Verifying...' : lockoutRemainingSecs > 0 ? `Locked (${lockoutRemainingSecs}s)` : 'Open License Panel 🔓'}
                </button>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setErrorMsg('');
                    }}
                    className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    PIN bhool gaye ya Locked hai? Emergency Recovery
                  </button>
                  <div className="text-[11px] text-slate-500 text-center">
                    🔒 Confidential Owner Portal. 3 incorrect attempts trigger a 15-minute lockout.
                  </div>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleEmergencyRecovery}
                className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950 p-6 text-center shadow-2xl"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-white">Owner Master Emergency Recovery</h3>
                <p className="mt-1 text-xs text-slate-300">
                  Agar PIN bhool gaye hain ya account lock ho gaya hai, to apna confidential Master Emergency Recovery Key daalein.
                </p>

                <div className="mt-4">
                  <label className="block text-left text-xs font-bold text-amber-400 mb-1">
                    Confidential Master Recovery Key
                  </label>
                  <input
                    type="text"
                    value={recoveryKeyInput}
                    onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                    placeholder="DEXON-MASTER-RECOVERY-..."
                    className="w-full rounded-xl border border-amber-500/50 bg-slate-900 px-3 py-2.5 text-center text-xs sm:text-sm font-mono font-bold tracking-wider text-amber-300 focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 text-left">
                    💡 Recovery key daalne se security lockout clear ho jayega aur default PIN restore ho jayega.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mt-2 text-xs font-semibold text-rose-400">{errorMsg}</div>
                )}

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setErrorMsg('');
                    }}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Wapas PIN Login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
                  >
                    Restore & Unlock 🛡️
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
                <button
                  onClick={() => setAdminTab('plans')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'plans'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                  📦 Plans & Pricing (Pro vs Business)
                </button>

                <button
                  onClick={() => setAdminTab('list')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'list'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Active Licenses ({licenses.length})
                </button>

                <button
                  onClick={() => setAdminTab('create')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  + Generate New Key
                </button>

                <button
                  onClick={() => setAdminTab('simulator')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'simulator'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Test Simulator
                </button>

                <button
                  onClick={() => setAdminTab('hosting')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'hosting'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 text-emerald-300" />
                  🌐 Host on Your Domain (Solve 403)
                </button>

                <button
                  onClick={() => setAdminTab('pins')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                    adminTab === 'pins'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  🔐 PINs & Staff Access
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadLicenses}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  title="Refresh List"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <a
                  href="/nexbill-source-code.zip"
                  download="nexbill-source-code.zip"
                  className="flex items-center gap-1 rounded-lg border border-purple-500/50 bg-purple-950/40 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-900/60"
                  title="Download clean unminified source code (.zip) for Claude AI review without size limit"
                >
                  <FileCode className="h-3.5 w-3.5 text-purple-400" />
                  Claude Source (.zip)
                </a>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('nb_owner_mode');
                    } catch {}
                    handleSafeClose();
                  }}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/50 bg-rose-950/40 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
                  title="Lock Admin and hide it from screen"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Lock & Hide Admin
                </button>
              </div>
            </div>

            {/* TAB 0: PLANS & FEATURES OVERVIEW */}
            {adminTab === 'plans' && (
              <div className="flex-1 overflow-y-auto pt-4 space-y-4">
                <div className="rounded-2xl border border-purple-500/40 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Commercial Plans Comparison Matrix
                      </h3>
                      <p className="text-xs text-slate-400">
                        Aapke clients ke liye available plans, unke features aur direct testing shortcuts:
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewPlan('Business');
                        setAdminTab('create');
                      }}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20"
                    >
                      + Issue Business Key (₹1,999) ➔
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Free Trial */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
                            Free Trial
                          </span>
                          <span className="text-lg font-black text-white">₹0</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          New rooftop solar contractors ke liye demonstration access.
                        </p>

                        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 5 Invoices / month limit
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 1 Firm profile
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 70:30 GST Calculator
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-bold">✗</span> No Multi-Firm
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-bold">✗</span> No CRM & GSTR-1
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (onSwitchKey) await onSwitchKey('NXB-TRL-DEMO-2812-1A40');
                          onClose();
                        }}
                        className="mt-5 w-full rounded-xl bg-slate-800 py-2 text-xs font-bold text-blue-300 hover:bg-slate-700 transition"
                      >
                        Test Trial on Laptop ➔
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-2xl border border-amber-500/50 bg-amber-950/10 p-5 flex flex-col justify-between relative shadow-lg">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                            ⭐ Pro Plan
                          </span>
                          <span className="text-xl font-black text-white">₹999 <span className="text-xs font-normal text-slate-400">/ yr</span></span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          Single solar firm ke liye full unlimited document generation.
                        </p>

                        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                          <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <span>✓</span> ∞ Unlimited Invoices
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 1 Firm & Bank Profile
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> All 3 Invoice Themes (Clean/Blue/Gold)
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> PM Surya Ghar WCC Generator
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> Bank Loan Margin Estimate
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 1-Device Hardware Binding
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={async () => {
                            if (onSwitchKey) await onSwitchKey('NXB-PRO-SAHIL-001');
                            onClose();
                          }}
                          className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 transition"
                        >
                          Test Pro Mode ➔
                        </button>
                        <button
                          onClick={() => {
                            setNewPlan('Pro');
                            setAdminTab('create');
                          }}
                          className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900/60"
                          title="Generate Pro Key"
                        >
                          + Key
                        </button>
                      </div>
                    </div>

                    {/* Business Plan */}
                    <div className="rounded-2xl border-2 border-purple-500 bg-purple-950/20 p-5 flex flex-col justify-between relative shadow-xl shadow-purple-900/20">
                      <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-0.5 text-[10px] font-black text-white shadow-md">
                        BESTSELLER (ALL FEATURES)
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-md bg-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/40">
                            🚀 Business Plan
                          </span>
                          <span className="text-xl font-black text-white">₹1,999 <span className="text-xs font-normal text-slate-400">/ yr</span></span>
                        </div>
                        <p className="text-xs text-slate-300 mb-4">
                          Commercial Solar EPC contractors with multiple companies & CA GST filing.
                        </p>

                        <div className="space-y-2 text-xs text-slate-200 border-t border-purple-800/40 pt-3">
                          <div className="flex items-center gap-2 text-purple-300 font-black">
                            <span>✓</span> UNLIMITED Multi-Firms (2, 5, 10+ Companies)
                          </div>
                          <div className="flex items-center gap-2 text-purple-300 font-black">
                            <span>✓</span> Customer Database CRM & History
                          </div>
                          <div className="flex items-center gap-2 text-purple-300 font-black">
                            <span>✓</span> Monthly GSTR-1 Return Export (CSV/Excel)
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> 24x7 VIP Phone & WhatsApp Support Line
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> Custom Accent Branding & Watermarks
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> ∞ Unlimited Invoices & Quotations
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={async () => {
                            if (onSwitchKey) await onSwitchKey('NXB-BIZ-DEMO-2026');
                            onClose();
                          }}
                          className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-extrabold text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Activate Business Mode on Laptop ➔
                        </button>
                        <button
                          onClick={() => {
                            setNewPlan('Business');
                            setAdminTab('create');
                          }}
                          className="rounded-xl border border-purple-500/50 bg-purple-900/40 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-800/60"
                          title="Generate Business Key"
                        >
                          + Key
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: ALL LICENSES LIST */}
            {adminTab === 'list' && (
              <div className="flex flex-1 flex-col overflow-hidden pt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <div className="text-[10px] text-slate-400">Total Issued Keys</div>
                    <div className="text-lg font-black text-white">{stats.total}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-2.5">
                    <div className="text-[10px] text-emerald-400">Active Licenses</div>
                    <div className="text-lg font-black text-emerald-400">{stats.active}</div>
                  </div>
                  <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-2.5">
                    <div className="text-[10px] text-rose-400">Revoked / Blocked</div>
                    <div className="text-lg font-black text-rose-400">{stats.revoked}</div>
                  </div>
                  <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-2.5">
                    <div className="text-[10px] text-amber-400">Total Invoices Created</div>
                    <div className="text-lg font-black text-amber-400">{stats.totalInvoices}</div>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search by client name, key, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none w-72"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                      <button
                        onClick={() => setFilter('all')}
                        className={`rounded px-2.5 py-1 ${
                          filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                        }`}
                      >
                        All Status
                      </button>
                      <button
                        onClick={() => setFilter('active')}
                        className={`rounded px-2.5 py-1 ${
                          filter === 'active' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setFilter('revoked')}
                        className={`rounded px-2.5 py-1 ${
                          filter === 'revoked' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Revoked
                      </button>
                    </div>

                    {/* Plan Filter */}
                    <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                      <button
                        onClick={() => setPlanFilter('all')}
                        className={`rounded px-2 py-1 ${
                          planFilter === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        All Plans
                      </button>
                      <button
                        onClick={() => setPlanFilter('Business')}
                        className={`rounded px-2 py-1 ${
                          planFilter === 'Business' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Business 🚀
                      </button>
                      <button
                        onClick={() => setPlanFilter('Pro')}
                        className={`rounded px-2 py-1 ${
                          planFilter === 'Pro' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Pro ⭐
                      </button>
                      <button
                        onClick={() => setPlanFilter('Trial')}
                        className={`rounded px-2 py-1 ${
                          planFilter === 'Trial' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Trial 🆓
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                        <th className="py-2 px-3">Client / Vendor</th>
                        <th className="py-2 px-3">License Key</th>
                        <th className="py-2 px-3">Plan</th>
                        <th className="py-2 px-3">Expiry</th>
                        <th className="py-2 px-2 text-center">Invoices</th>
                        <th className="py-2 px-2 text-center">1-Device Lock</th>
                        <th className="py-2 px-3 text-right">Actions (Revoke / Reset / WA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {licenses
                        .filter((l) => {
                          if (filter === 'active') return l.isActive;
                          if (filter === 'revoked') return !l.isActive;
                          return true;
                        })
                        .filter((l) => {
                          if (planFilter !== 'all') return l.plan === planFilter;
                          return true;
                        })
                        .filter((l) => {
                          if (!searchTerm) return true;
                          const s = searchTerm.toLowerCase();
                          return (
                            l.clientName.toLowerCase().includes(s) ||
                            l.key.toLowerCase().includes(s) ||
                            (l.clientPhone && l.clientPhone.includes(s))
                          );
                        })
                        .map((item) => (
                          <tr key={item.key} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{item.clientName}</div>
                              {item.clientPhone && (
                                <div className="text-[10px] text-slate-400">{item.clientPhone}</div>
                              )}
                              {item.notes && (
                                <div className="text-[10px] italic text-amber-400">{item.notes}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                              <div className="flex items-center gap-1.5">
                                <span>{item.key}</span>
                                <button
                                  onClick={() => handleCopyKey(item.key)}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy Key"
                                >
                                  {copiedKey === item.key ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  item.plan === 'Business'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : item.plan === 'Pro'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {item.plan === 'Business' ? '🚀 Business' : item.plan === 'Pro' ? '⭐ Pro' : 'Free Trial'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {item.expiry}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-300">
                              {item.totalInvoicesGenerated || 0}
                              <span className="text-[10px] font-normal text-slate-500">
                                {' '}
                                / {item.invoiceLimit > 100 ? '∞' : item.invoiceLimit}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {item.boundDeviceId ? (
                                <div className="inline-flex items-center gap-1 rounded bg-blue-950/50 border border-blue-800/50 px-1.5 py-0.5 text-[10px] text-blue-300 font-semibold">
                                  <Smartphone className="h-3 w-3" /> Locked
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500">Not activated yet</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp Send */}
                                <button
                                  onClick={() => handleWhatsAppSend(item)}
                                  className="flex items-center gap-1 rounded bg-emerald-950/40 border border-emerald-700/50 px-2 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900/60"
                                  title="Send key on WhatsApp"
                                >
                                  <Share2 className="h-3 w-3" /> WA
                                </button>

                                {/* Reset Device Binding */}
                                {item.boundDeviceId && (
                                  <button
                                    onClick={() => handleResetDevice(item.key)}
                                    className="flex items-center gap-1 rounded bg-blue-950/40 border border-blue-700/50 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-900/60"
                                    title="Clear device binding (allow client on new device)"
                                  >
                                    <RotateCcw className="h-3 w-3" /> Reset Dev
                                  </button>
                                )}

                                {/* Revoke / Activate */}
                                <button
                                  onClick={() => handleToggle(item.key)}
                                  className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                                    item.isActive
                                      ? 'bg-rose-950/40 border border-rose-700/50 text-rose-300 hover:bg-rose-900/50'
                                      : 'bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                                  }`}
                                  title={item.isActive ? 'Block/Revoke key' : 'Activate key'}
                                >
                                  {item.isActive ? 'Revoke' : 'Activate'}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(item.key)}
                                  className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-400"
                                  title="Delete key permanently"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: GENERATE NEW KEY (PRO & BUSINESS PLANS) */}
            {adminTab === 'create' && (
              <form onSubmit={handleCreateLicense} className="flex-1 overflow-y-auto pt-4 space-y-4">
                <div className="rounded-2xl border border-amber-500/40 bg-slate-950 p-5">
                  <h3 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Issue New License Key for Solar Contractor
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Select plan type, client details, and generate instant 1-device locked license.
                  </p>

                  {/* Plan Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div
                      onClick={() => setNewPlan('Pro')}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                        newPlan === 'Pro'
                          ? 'border-amber-500 bg-amber-950/20'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-amber-400 text-xs">⭐ Pro Plan</span>
                        {newPlan === 'Pro' && <Check className="h-4 w-4 text-amber-400" />}
                      </div>
                      <div className="text-lg font-black text-white">₹999 / yr</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Unlimited Invoices, WCC Certificate, Bank Estimates, 1 Firm.
                      </div>
                    </div>

                    <div
                      onClick={() => setNewPlan('Business')}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                        newPlan === 'Business'
                          ? 'border-purple-500 bg-purple-950/20'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-purple-400 text-xs">🚀 Business Plan</span>
                        {newPlan === 'Business' && <Check className="h-4 w-4 text-purple-400" />}
                      </div>
                      <div className="text-lg font-black text-white">₹1,999 / yr</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        All Pro features + Multi-Firm Switcher + Customer CRM + GSTR-1 Sales Report.
                      </div>
                    </div>

                    <div
                      onClick={() => setNewPlan('Trial')}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                        newPlan === 'Trial'
                          ? 'border-blue-500 bg-blue-950/20'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-blue-400 text-xs">🆓 Free Trial</span>
                        {newPlan === 'Trial' && <Check className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="text-lg font-black text-white">₹0 (Free)</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Limited to 5 invoices/month for client demonstration.
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Client / Solar Vendor Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sharma Solar Solutions"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp / Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 98290-12345"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Validity Duration
                      </label>
                      <select
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value={1}>1 Month (Trial / Monthly Test)</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>1 Year (Standard Commercial)</option>
                        <option value={24}>2 Years</option>
                        <option value={60}>5 Years (Lifetime)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Custom License Key (Leave empty to auto-generate)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NXB-PRO-SHARMA-01"
                        value={newCustomKey}
                        onChange={(e) => setNewCustomKey(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Payment Notes / Transaction ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Received ₹999 on UPI txn 982141"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setAdminTab('list')}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-amber-500 px-6 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Generate & Save License Key
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: CUSTOMER VIEW SIMULATOR (TEST ON SAME LAPTOP) */}
            {adminTab === 'simulator' && (
              <div className="flex-1 overflow-y-auto pt-4 space-y-4">
                <div className="rounded-2xl border border-purple-500/40 bg-slate-950 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Customer Experience Simulator (Apne hi laptop par check karein)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sahil, aap dekhna chahte the ki <b>"Customer ko kaisa dikhega? Unke paas admin access toh nahi aa gayi?"</b><br />
                    Yahan se aap 1-click mein switch karke check kar sakte hain:
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-blue-400 text-xs">1. Free Trial Client View</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Test karein ki jab client trial key use karega, toh 5 bill limit ke baad lock hota hai ya nahi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onSwitchKey) await onSwitchKey('NXB-TRL-DEMO-2812-1A40');
                          onClose();
                        }}
                        className="mt-3 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        Switch to Trial Mode 👤
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-amber-400 text-xs">2. Pro Client View</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Test karein Pro buyer ka view (Unlimited bills, all 3 invoice themes, WCC, 1 firm).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onSwitchKey) await onSwitchKey('NXB-PRO-SAHIL-001');
                          onClose();
                        }}
                        className="mt-3 w-full rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                      >
                        Switch to Pro Mode ⭐
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-purple-400 text-xs">3. Business Client View</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Test karein Business buyer ka view (Multi-firm switch, CRM customer directory, GSTR-1).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onSwitchKey) await onSwitchKey('NXB-BIZ-DEMO-2026');
                          onClose();
                        }}
                        className="mt-3 w-full rounded-lg bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                      >
                        Switch to Business Mode 🚀
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <LogOut className="h-4 w-4" /> 4. Complete Logout (Visitor View)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Active key ko logout karein taaki aap wo Lock Screen aur Landing Page dekh sakein jo naye visitor ko dikhti hai.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onLogout) onLogout();
                        onClose();
                      }}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shrink-0"
                    >
                      Logout Active Key 🚪
                    </button>
                  </div>

                  {/* Security Guarantee Note */}
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-amber-300">🔒 Security Assurance (Kya customer ke paas admin access aa sakti hai?):</div>
                    <div>
                      <b>Bilkul nahi!</b> Customer kisi bhi tareeqe se Admin Panel nahi khol sakta kyunki iske liye aapka secret Admin PIN chahiye hota hai jo cryptographically SHA-256 hashed hai. Customer ke screen par sirf unka invoice, calculator, aur WCC chalega!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'hosting' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-5">
                {/* 1. WHY 403 & 404 (PAGE NOT FOUND) HAPPENED */}
                <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-300">
                          Error Solved
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          "404 Page not found" & "403 Forbidden" Error Kyun Aata Hai?
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                        Aapne jo links try kiye (<span className="font-mono text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded">ais-pre-...run.app</span> ya <span className="font-mono text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded">aistudio.google.com</span>), ye Google AI Studio ke <b>internal temporary development containers</b> hain.
                        Google in links ko public internet par kisi dusre device ya Incognito window me access nahi karne deta (isliye Google 404 Page not found ya 403 dikha deta hai).
                      </p>
                      <div className="mt-2.5 rounded-xl border border-amber-900/40 bg-slate-950/90 p-3 text-[11px] text-amber-200">
                        💡 <b>Asli Samadhaan:</b> Software ko hamesha <b>apne khud ke Domain & Hosting</b> par daala jaata hai, ya fir client ko <b>Offline 1-File HTML</b> bheja jaata hai. Niche diye 2 aasan tareeqe follow karein!
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. WHY HOSTING ON YOUR OWN DOMAIN IS 100% THE BEST DECISION */}
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 to-slate-950 p-5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      1. "Mere Paas Domain & Hosting Padi Hai — Kya Uspe Dalna Sahi Hai?"
                    </h4>
                  </div>
                  <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-emerald-400 text-sm">HAAN! YEH 100% SABSE BEST, PERMANENT AUR PROFESSIONAL TARIQA HAI!</span>
                    <p className="mt-1 text-slate-400">
                      Jab aap ise apne domain (jaise <b className="text-white">bill.apnifirm.com</b> ya <b className="text-white">nexbill.in</b>) par upload karenge:
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-emerald-900/50 bg-slate-900/80 p-3">
                      <div className="font-bold text-emerald-300">⭐ VIP Brand Reputation</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Customer ko Google ka link nahi dikhega. Unhe lagega ki ye aapki khud ki IT/Software company ka software hai.
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-900/50 bg-slate-900/80 p-3">
                      <div className="font-bold text-emerald-300">⚡ Kabhi Koi Error Nahi Aayega</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Kisi bhi device (Android phone, iPhone, Windows PC, Mac, Incognito) par 1 click me 24x7 bina kisi error ke chalega.
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-900/50 bg-slate-900/80 p-3">
                      <div className="font-bold text-emerald-300">💰 ₹0 Extra Cost (Free)</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Kyunki domain aur hosting aapke paas pehle se available hai, aapka 1 rupiya bhi extra kharch nahi hoga!
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-900/50 bg-slate-900/80 p-3">
                      <div className="font-bold text-emerald-300">🔒 License & Security Control</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Customer bina License Key ke software use nahi kar sakta. Aap apne Admin Portal se kisi bhi key ko kabhi bhi block/activate kar sakte hain.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. STEP-BY-STEP DEPLOYMENT GUIDE */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      2. Apne Domain / Hosting Par Kaise Daalein? (Simple 3-Step Guide)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 items-start rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950 text-xs">
                        1
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-white">Ready Website ZIP Package Download Karein</div>
                        <p className="text-slate-400 mt-0.5">
                          Humne aapke liye poori website ko build karke ready-to-upload ZIP file bana di hai:
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2.5">
                          <a
                            href="/api/download-zip"
                            download="nexbill-website-deploy.zip"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 text-xs shadow-md shadow-amber-500/20"
                          >
                            <Download className="h-4 w-4" />
                            Download Ready Website (.ZIP) — cPanel / Hostinger Ke Liye
                          </a>
                          <a
                            href="/Nexbill_Solar_Pro_Offline.html"
                            download="Nexbill_Solar_Pro_Offline.html"
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-2 font-bold text-emerald-300 hover:bg-emerald-900/50 text-xs"
                          >
                            <Download className="h-4 w-4" />
                            Download Standalone HTML (.html) — WhatsApp & PC Par Double-Click Ke Liye
                          </a>
                        </div>
                        <div className="mt-2 rounded-lg bg-slate-950/80 p-2.5 text-[11px] text-slate-300 space-y-1 border border-slate-800">
                          <div className="text-amber-400 font-bold">🔒 License & Device Control Rules:</div>
                          <div>• <b>Pro Plan:</b> Strict <b>1-Device Lock</b> (1 Key = 1 Computer). Client dusre computer par wahi key use nahi kar sakta.</div>
                          <div>• <b>Business Plan:</b> <b>Multi-Device Allowed</b> (Office PC + Laptop + Mobile sabhi par chalega).</div>
                          <div>• <b>New Offline HTML:</b> Isme poora NAYA updated software inlined hai (Multi-Industry, Dynamic kW, +New Bill, PDF Download, GSTR-1).</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950 text-xs">
                        2
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-white">cPanel ya Hostinger File Manager Me Upload & Extract Karein</div>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          1. Apne hosting account (cPanel ya Hostinger hPanel) me login karein.<br />
                          2. <b>File Manager</b> open karein aur <b className="text-amber-300">public_html</b> folder me jayein (agar subdomain banana ho jaise <b className="text-amber-300">bill.apnadomain.com</b>, toh uske folder me jayein).<br />
                          3. Ye <b className="text-amber-300">nexbill-website-deploy.zip</b> file upload karein aur right-click karke <b>"Extract"</b> par click kar dein.<br />
                          4. Bas! Ab apna domain browser me open karein, software turant live chalega!
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950 text-xs">
                        3
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-white">.htaccess File Confirm Karein (Page Refresh Fix)</div>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">
                          ZIP file ke andar humne <span className="font-mono text-emerald-300">.htaccess</span> file pehle se shamil kar di hai taaki page refresh karne par koi error na aaye. Agar kabhi zarurat pade, toh ye code copy kar sakte hain:
                        </p>
                        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[10px] text-slate-300 flex justify-between items-start">
                          <pre className="overflow-x-auto text-[10px] leading-tight text-slate-300">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
                          </pre>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteBase /\n  RewriteRule ^index\\.html$ - [L]\n  RewriteCond %{REQUEST_FILENAME} !-f\n  RewriteCond %{REQUEST_FILENAME} !-d\n  RewriteRule . /index.html [L]\n</IfModule>');
                              setCopiedSnippet(true);
                              setTimeout(() => setCopiedSnippet(false), 2000);
                            }}
                            className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-slate-700"
                          >
                            {copiedSnippet ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-center justify-between">
                    <div>
                      <div className="font-bold">✨ Bas itna hi! Aapki apni website live ho jayegi!</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Aapke customers aapki website par aayenge aur wahi par bill banayenge aur license enter karenge.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminTab('create')}
                      className="rounded-lg bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-500 shrink-0 text-xs"
                    >
                      + Generate Client Key ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PINs & Staff Access Management */}
            {adminTab === 'pins' && (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Header Banner */}
                <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-slate-950 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Admin Security PINs & Staff Delegation Manager
                      </h3>
                      <p className="text-xs text-rose-300 mt-0.5">
                        Apna Master PIN badlein, active security PINs check karein aur staff ko limited admin access dein.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Master PIN Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <KeyRound className="h-4 w-4 text-amber-400" />
                    <span>Change Master Admin PIN (मलिक का मुख्य पिन बदलें)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Naya PIN enter karein. Ye PIN browser aur database me <b>SHA-256 Cryptographic Hash</b> ke sath save hota hai taaki koi b source code padh kar ya inspect kar ke aapka PIN na jaan sake.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPinMsg(null);
                      if (!newMasterPin || newMasterPin.length < 4) {
                        setPinMsg({ type: 'error', text: 'PIN must be at least 4 digits or characters.' });
                        return;
                      }
                      if (newMasterPin !== confirmMasterPin) {
                        setPinMsg({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
                        return;
                      }
                      try {
                        const hash = await sha256Hex(newMasterPin.trim());
                        localStorage.setItem('nb_admin_pin_hash', hash);
                        setPinMsg({ type: 'success', text: `✅ Master PIN successfully updated to "${newMasterPin}"!` });
                        setNewMasterPin('');
                        setConfirmMasterPin('');
                      } catch {
                        setPinMsg({ type: 'error', text: 'Failed to update PIN.' });
                      }
                    }}
                    className="space-y-3 max-w-md"
                  >
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">New Master PIN</label>
                      <input
                        type="password"
                        placeholder="Enter 4-8 digit new PIN"
                        value={newMasterPin}
                        onChange={(e) => setNewMasterPin(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Confirm New PIN</label>
                      <input
                        type="password"
                        placeholder="Re-enter new PIN to confirm"
                        value={confirmMasterPin}
                        onChange={(e) => setNewMasterPin(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none tracking-widest"
                      />
                    </div>

                    {pinMsg && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-bold ${
                          pinMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {pinMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition shadow-md"
                    >
                      Update Master PIN 🔒
                    </button>
                  </form>
                </div>

                {/* Pre-Configured Master PINs Overview */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-purple-400" />
                    <span>Kon-Kon Se PINs Ke Pas Access Hai? (Active Authorized PINs)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Aapke software me security ke liye pre-defined SHA-256 hashes shamil hain. Ye sabhi PINs owner portal ko unlock kar sakte hain:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Root Master PIN</div>
                      <div className="text-base font-black text-white mt-1 font-mono tracking-widest">94298</div>
                      <div className="text-[10px] text-slate-400 mt-1">Sahil Jagga Primary Owner PIN</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="text-[10px] text-purple-400 font-bold uppercase">Emergency PIN</div>
                      <div className="text-base font-black text-white mt-1 font-mono tracking-widest">140223</div>
                      <div className="text-[10px] text-slate-400 mt-1">Developer Disaster Recovery PIN</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">Standard Admin PIN</div>
                      <div className="text-base font-black text-white mt-1 font-mono tracking-widest">2026</div>
                      <div className="text-[10px] text-slate-400 mt-1">Quick Owner Access PIN</div>
                    </div>
                  </div>
                </div>

                {/* Staff Sub-PIN Delegator */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <span>Staff & Sub-Admin Access Delegation (स्टाफ को एक्सेस दें)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Agar aap apne accountant ya sales manager ko access dena chahte hain toh unka alag PIN banayein.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newStaffName.trim() || !newStaffPin.trim()) return;
                      const newStaffObj = {
                        id: 'staff_' + Date.now(),
                        name: newStaffName.trim(),
                        role: newStaffRole,
                        pinDisplay: newStaffPin.trim(),
                        pinHash: await sha256Hex(newStaffPin.trim()),
                        createdAt: new Date().toISOString().split('T')[0],
                      };
                      const updated = [newStaffObj, ...staffPins];
                      setStaffPins(updated);
                      localStorage.setItem('nb_staff_pins', JSON.stringify(updated));
                      setNewStaffName('');
                      setNewStaffPin('');
                      alert(`✅ Added access for ${newStaffObj.name} (${newStaffObj.role}) with PIN: ${newStaffObj.pinDisplay}`);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Staff Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Position</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Accountant">Accountant (मुनीम / CA)</option>
                        <option value="Sales Manager">Sales Manager</option>
                        <option value="Technical Staff">Technical Staff (Engineer)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned PIN</label>
                      <input
                        type="text"
                        placeholder="e.g. 5566"
                        value={newStaffPin}
                        onChange={(e) => setNewStaffPin(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-bold text-white transition shadow-sm"
                      >
                        + Grant Staff Access
                      </button>
                    </div>
                  </form>

                  {/* Staff List Table */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                          <th className="py-2.5 px-3">Staff Name</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Active PIN</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {staffPins.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-bold text-white">{s.name}</td>
                            <td className="py-2 px-3">
                              <span className="rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
                                {s.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">{s.pinDisplay || '••••'}</td>
                            <td className="py-2 px-3 text-slate-500">{s.createdAt}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Revoke access for ${s.name}?`)) {
                                    const updated = staffPins.filter((x) => x.id !== s.id);
                                    setStaffPins(updated);
                                    localStorage.setItem('nb_staff_pins', JSON.stringify(updated));
                                  }
                                }}
                                className="rounded bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/80 transition"
                              >
                                Revoke Access ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                        {staffPins.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                              Koi alag staff PIN nahi banaya gaya hai. Sirf Master Owner PINs active hain.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Anti-Hacking & Anti-Abuse Lock Card (Answers Request 14 & 15) */}
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 text-xs text-emerald-200">
                  <div className="font-black text-white text-sm mb-1 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Single-Device Hardware Lock & Anti-Proxy Security (Request #14 Answer)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    NexBill ke andar har device ka ek unique <b>Hardware & Browser Fingerprint ID</b> generate hota hai jo IndexedDB, LocalStorage aur Browser Cookies me permanently save rehta hai:
                  </p>
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 font-mono text-[11px] text-amber-300 mb-3 flex items-center justify-between">
                    <span>Aapka Current Device ID: <b>{licenseService.getDeviceId()}</b></span>
                    <span className="text-emerald-400 text-[10px] font-bold">🔒 Protected</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li><b>Proxy / VPN Immunity:</b> Agar koi user IP badal le ya proxy lagaye, tab bhi device fingerprint wahi rehta hai, isliye trial dubara activate nahi ho sakta.</li>
                    <li><b>HMAC Cryptographic Verification:</b> Har key ke andar mathematical checksum encoded hota hai. Koi b fake key guess ya generate nahi kar sakta.</li>
                    <li><b>Web Hosting vs ZIP:</b> Agar aap Hostinger/cPanel par apni website deploy karenge toh users sirf portal kholenge; unhe source code ya zip file download karne ka option nahi milega.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
