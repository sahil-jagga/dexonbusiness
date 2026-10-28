import React from 'react';
import { DocType, LicenseInfo, FirmInfo, TradeKey } from '../types/solar';
import { TRADE_CONFIGS } from '../config/trades';
import { CountryCode, COUNTRIES_LIST } from '../config/countries';
import { AuthUser } from '../lib/supabase';
import {
  Sun,
  Printer,
  Share2,
  Sliders,
  User,
  Building2,
  ShieldAlert,
  FileText,
  ClipboardList,
  CheckCircle2,
  Landmark,
  Eye,
  EyeOff,
  LogOut,
  Building,
  Users,
  FileSpreadsheet,
  Palette,
  Sparkles,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Globe,
  Download,
  FileDown,
  Loader2,
  BookOpen,
  Database,
  RefreshCcw,
  Briefcase,
  Receipt
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  docType: DocType;
  onDocTypeChange: (dt: DocType) => void;
  activeSidebarTab: 'calc' | 'customer' | 'firm';
  onSidebarTabChange: (tab: 'calc' | 'customer' | 'firm') => void;
  templateStyle: 1 | 2 | 3;
  onTemplateStyleChange: (tpl: 1 | 2 | 3) => void;
  showBuyRates: boolean;
  onToggleBuyRates: () => void;
  license: LicenseInfo | null;
  monthInvoiceCount: number;
  activeFirm: FirmInfo;
  trade?: TradeKey;
  onOpenTradeModal?: () => void;
  currentUser?: AuthUser;
  onOpenAuthModal?: () => void;
  onOpenMultiFirm: () => void;
  onOpenCrm: () => void;
  onOpenGstr1: () => void;
  onOpenBooks?: () => void;
  onOpenBackup?: () => void;
  onOpenBranding: () => void;
  onOpenAdmin: () => void;
  onOpenLicenseChange: () => void;
  onLogoutKey: () => void;
  onPrint: () => void;
  onWhatsAppShare: () => void;
  onNewBill: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onDownloadPdf?: () => void;
  isGeneratingPdf?: boolean;
  lang?: 'en' | 'hi';
  onLanguageToggle?: () => void;
  currency?: string;
  onCurrencyChange?: () => void;
  country?: CountryCode;
  onCountryChange?: (c: CountryCode) => void;
  onOpenThemeDesigner?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  docType,
  onDocTypeChange,
  activeSidebarTab,
  onSidebarTabChange,
  templateStyle,
  onTemplateStyleChange,
  showBuyRates,
  onToggleBuyRates,
  license,
  monthInvoiceCount,
  activeFirm,
  trade = 'solar',
  onOpenTradeModal,
  currentUser,
  onOpenAuthModal,
  onOpenMultiFirm,
  onOpenCrm,
  onOpenGstr1,
  onOpenBooks,
  onOpenBackup,
  onOpenBranding,
  onOpenAdmin,
  onOpenLicenseChange,
  onLogoutKey,
  onPrint,
  onWhatsAppShare,
  onNewBill,
  isSidebarCollapsed,
  onToggleSidebar,
  onDownloadPdf,
  isGeneratingPdf = false,
  lang = 'en',
  onLanguageToggle,
  currency = '₹',
  onCurrencyChange,
  country = 'IN',
  onCountryChange,
  onOpenThemeDesigner,
}) => {
  const isBusiness = license?.plan === 'Business';
  const isPro = license?.plan === 'Pro';
  const limitStr = license?.invoiceLimit === 99999 ? 'Unlimited' : `${monthInvoiceCount}/${license?.invoiceLimit || 5} Used`;

  // Secret Owner Mode (Admin button & ZIP download are 100% HIDDEN by default)
  const [logoClicks, setLogoClicks] = React.useState(0);
  const [isOwnerUnlocked, setIsOwnerUnlocked] = React.useState(false);

  // Clear any old persistent flag to protect client machines
  React.useEffect(() => {
    try {
      localStorage.removeItem('nb_owner_mode');
    } catch {}
  }, []);

  // Secret 5-click trigger on Sun Logo
  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setLogoClicks(0);
      setIsOwnerUnlocked(true);
      onOpenAdmin();
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  // Force update helper (Purges Service Worker and stale browser caches)
  const handleForceUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      } catch {}
    }
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      } catch {}
    }
    window.location.reload();
  };

  // Keyboard shortcut: Ctrl + Shift + A to open Admin (Owner only)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOwnerUnlocked(true);
        onOpenAdmin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenAdmin]);

  // Secret URL Route Detection (e.g. #/dexonjitender, #/owner, #/xyz, or ?admin=dexonjitender)
  React.useEffect(() => {
    const checkSecretRoute = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const path = (window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const customSlug = (localStorage.getItem('nb_admin_secret_slug') || 'dexonjitender').toLowerCase();

      if (
        hash.includes('owner') ||
        hash.includes('dexonjitender') ||
        hash.includes('xyz') ||
        hash.includes(customSlug) ||
        path.includes('/owner') ||
        path.includes('/dexonjitender') ||
        path.includes('/xyz') ||
        path.includes(`/${customSlug}`) ||
        search.includes('admin=dexonjitender') ||
        search.includes('admin=owner') ||
        search.includes(`admin=${customSlug}`)
      ) {
        setIsOwnerUnlocked(true);
        onOpenAdmin();
      }
    };

    checkSecretRoute();
    window.addEventListener('hashchange', checkSecretRoute);
    return () => window.removeEventListener('hashchange', checkSecretRoute);
  }, [onOpenAdmin]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md print:hidden shadow-lg shadow-black/40">
      {/* ------------------------------------------------------------------- */}
      {/* TIER 1: BRANDING, FIRM SWITCHER & CRITICAL ACTIONS (PDF, PRINT, WHATSAPP) */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-900 overflow-x-auto gap-3">
        {/* Left Section: Brand, Plan Badge & Multi-Firm */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sidebar Expand / Collapse Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isSidebarCollapsed
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 animate-pulse'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isSidebarCollapsed ? 'Show / Expand Side Panel (▶)' : 'Collapse Side Panel for Full Screen Bill (◀)'}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 text-amber-400" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="text-[11px] font-bold">
              {isSidebarCollapsed ? 'Show Side Panel' : 'Full Screen'}
            </span>
          </button>

          {/* Logo & Software Name (Secret 5-click unlocks Owner Admin Portal) */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title="NexBill Software"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 shrink-0 group-hover:scale-105 transition">
              <Sun className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-tight">NexBill</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-400 border border-amber-500/30">
                  PRO SaaS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>Plan:</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLicenseChange();
                  }}
                  className={`font-bold hover:underline cursor-pointer flex items-center gap-0.5 ${
                    isBusiness ? 'text-purple-400' : isPro ? 'text-blue-400' : 'text-amber-400'
                  }`}
                  title="Click to view or change license key"
                >
                  <span>{license?.plan || 'Trial'}</span>
                  <span className="text-[9px] opacity-80">({limitStr})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogoutKey();
                  }}
                  className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                  title="Logout current license key"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Active Firm Pill with 1-click Switcher */}
          <button
            onClick={onOpenMultiFirm}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/30 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 hover:border-purple-400 transition"
            title="Multi-Firm Switcher (Unlimited firms in Business plan)"
          >
            <Building className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="max-w-[130px] truncate font-bold text-white text-xs">
              {activeFirm?.name || 'My Firm'}
            </span>
            <span className="rounded bg-purple-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-200">
              ⇄ Firm
            </span>
          </button>

          {/* Trade Switcher Pill */}
          {onOpenTradeModal && (
            <button
              onClick={onOpenTradeModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 transition"
              title="Switch Industry / Trade (Solar, Bike, Electronics, Hardware, Auto, General)"
            >
              <span className="text-xs">{TRADE_CONFIGS[trade]?.icon || '🏢'}</span>
              <span className="max-w-[110px] truncate font-bold text-white text-xs">
                {TRADE_CONFIGS[trade]?.shortName || 'Trade'}
              </span>
              <span className="rounded bg-amber-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-200">
                ⇄ Trade
              </span>
            </button>
          )}

          {/* User Account / Tenant Pill */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Manage Account & Isolated Workspace"
            >
              <User className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="max-w-[90px] truncate text-xs font-bold text-slate-200">
                {currentUser?.fullName || 'Account'}
              </span>
            </button>
          )}
        </div>

        {/* Right Section: Client Action Buttons + Conditional Owner Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA In-App Mobile/Desktop Install Prompt */}
          <PWAInstallButton />

          {/* 1. Download PDF (jsPDF High-Res Direct Download) */}
          <button
            onClick={onDownloadPdf || onPrint}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            title="Download crisp professional PDF using jsPDF directly to your computer"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            <span>{isGeneratingPdf ? 'Making PDF...' : 'Download PDF'}</span>
          </button>

          {/* 2. Print / System PDF */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
            title="Open system print dialog"
          >
            <Printer className="h-3.5 w-3.5 text-amber-400" />
            <span>Print</span>
          </button>

          {/* 3. WhatsApp Share */}
          <button
            onClick={onWhatsAppShare}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition"
            title="Share invoice summary on WhatsApp"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* OWNER EXCLUSIVE TOOLS (Only visible when unlocked via 5-clicks or Ctrl+Shift+A) */}
          {isOwnerUnlocked && (
            <>
              <div className="h-6 w-px bg-slate-800 mx-0.5" />

              {/* Direct Website ZIP Download */}
              <a
                href="/api/download-zip"
                download="nexbill-website-deploy.zip"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-95 transition"
                title="Owner: Download ready-to-upload website ZIP"
              >
                <Download className="h-3.5 w-3.5" />
                <span>ZIP</span>
              </a>

              {/* Admin License Manager */}
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500/20 px-2.5 py-1.5 text-xs font-black text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition animate-pulse"
                title="Owner License Manager Portal"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>

              {/* Lock & Hide Owner Tools */}
              <button
                onClick={() => setIsOwnerUnlocked(false)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                title="Lock & Hide Owner Tools"
              >
                🔒 Hide
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TIER 2: DOCUMENT MODES, DRAWERS, BUSINESS SUITE & THEMES */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 bg-slate-900/90 text-xs overflow-x-auto gap-3">
        {/* Left: + New Bill & Document Types */}
        <div className="flex items-center gap-2 shrink-0">
          {/* New Bill Button */}
          <button
            onClick={onNewBill}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-950/50 px-3 py-1 text-xs font-black text-emerald-300 hover:bg-emerald-600 hover:text-white shadow-sm transition"
            title="Create a fresh blank bill (Previous bill stays safely saved in CRM history)"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>+ New Bill</span>
          </button>

          {/* Document Type Selector Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => onDocTypeChange('invoice')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition ${
                docType === 'invoice'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Tax Invoice
            </button>

            <button
              onClick={() => onDocTypeChange('quotation')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition ${
                docType === 'quotation' || docType === 'estimate'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Estimate & Commercial Quotation"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Estimate / Quotation
            </button>

            {/* WCC & Margin Receipt are Solar exclusive */}
            {trade === 'solar' && (
              <>
                <button
                  onClick={() => onDocTypeChange('wcc')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition ${
                    docType === 'wcc'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  WCC
                </button>

                <button
                  onClick={() => onDocTypeChange('receipt')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition ${
                    docType === 'receipt'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Margin Money / Beneficiary Cash Payment Slip"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Margin Receipt
                </button>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Sidebar Drawer Quick Switchers */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => {
                if (isSidebarCollapsed) onToggleSidebar();
                onSidebarTabChange('calc');
              }}
              className={`rounded px-2.5 py-1 flex items-center gap-1 transition ${
                activeSidebarTab === 'calc' && !isSidebarCollapsed ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Open Calculator & Stocks Catalog"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Stocks & Calc</span>
            </button>
            <button
              onClick={() => {
                if (isSidebarCollapsed) onToggleSidebar();
                onSidebarTabChange('customer');
              }}
              className={`rounded px-2.5 py-1 flex items-center gap-1 transition ${
                activeSidebarTab === 'customer' && !isSidebarCollapsed ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Customer Details"
            >
              <User className="h-3.5 w-3.5" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => {
                if (isSidebarCollapsed) onToggleSidebar();
                onSidebarTabChange('firm');
              }}
              className={`rounded px-2.5 py-1 flex items-center gap-1 transition ${
                activeSidebarTab === 'firm' && !isSidebarCollapsed ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Firm & Bank Profile"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Firm Info</span>
            </button>
          </div>

          {/* Toggle Buy Rate / Profit Column Visibility */}
          <button
            onClick={onToggleBuyRates}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
              showBuyRates ? 'bg-amber-950/60 text-amber-300 border-amber-600/50' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Toggle Cost & Margin column in editor (Customer print me ye column kabhi nahi jata)"
          >
            {showBuyRates ? <Eye className="h-3.5 w-3.5 text-amber-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showBuyRates ? 'Cost: ON' : 'Cost: OFF'}</span>
          </button>
        </div>

        {/* Right: Business Suite Features, Theme Picker & WA Share */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Business Suite Quick Buttons (Always Visible) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={onOpenMultiFirm}
              className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 hover:bg-purple-900/40 transition"
              title="Multi-Firm Switcher"
            >
              <Building className="h-3 w-3 text-purple-400" />
              <span className="hidden md:inline">Multi-Firm</span>
            </button>
            <button
              onClick={onOpenCrm}
              className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 hover:bg-purple-900/40 transition"
              title="Customer CRM & History"
            >
              <Users className="h-3 w-3 text-purple-400" />
              <span>CRM</span>
            </button>
            <button
              onClick={onOpenGstr1}
              className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 hover:bg-purple-900/40 transition"
              title="GSTR-1 GST Sales Return Excel/CSV"
            >
              <FileSpreadsheet className="h-3 w-3 text-purple-400" />
              <span>GSTR-1</span>
            </button>
            {onOpenBooks && (
              <button
                onClick={onOpenBooks}
                className="flex items-center gap-1 rounded-md border border-amber-500/50 bg-amber-950/40 px-2 py-0.5 text-[11px] font-black text-amber-300 hover:bg-amber-900/50 transition shadow-sm"
                title="Books Maintain, Day Book, Bank Statement Auto-Import & ITR P&L"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Books & ITR</span>
              </button>
            )}
            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-950/30 px-2 py-0.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-900/40 transition"
                title="Full JSON System Backup, Restore, Excel CSV & Clean Source Code for Claude"
              >
                <Database className="h-3 w-3 text-cyan-400" />
                <span>Backup</span>
              </button>
            )}

            {/* Country & Tax System Switcher */}
            {onCountryChange && (
              <div className="relative flex items-center">
                <select
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value as CountryCode)}
                  className="appearance-none rounded-md border border-amber-500/50 bg-amber-950/40 py-0.5 pl-2 pr-5 text-[11px] font-black text-amber-300 hover:bg-amber-900/50 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
                  title="Switch Country & Tax System (Updates labels, single/split tax, and currency)"
                >
                  {COUNTRIES_LIST.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white font-semibold">
                      {c.flag} {c.code} ({c.currencySymbol || c.currency})
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-1.5 text-[8px] text-amber-400">▼</span>
              </div>
            )}

            {/* Language Switcher (EN / हिंदी) */}
            {onLanguageToggle && (
              <button
                onClick={onLanguageToggle}
                className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-900/40 transition"
                title="Switch Language: English / हिंदी"
              >
                <Globe className="h-3 w-3 text-amber-400" />
                <span>{lang === 'hi' ? 'हिंदी' : 'EN'}</span>
              </button>
            )}

            {/* Currency Switcher */}
            {onCurrencyChange && (
              <button
                onClick={onCurrencyChange}
                className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 transition"
                title="Click to Switch Currency"
              >
                <span className="font-extrabold text-amber-400">{currency}</span>
              </button>
            )}

            <button
              onClick={onOpenBranding}
              className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 hover:bg-purple-900/40 transition"
              title="Custom Branding & Support"
            >
              <Palette className="h-3 w-3 text-purple-400" />
              <span>Branding</span>
            </button>
          </div>

          <button
            onClick={handleForceUpdateApp}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title="If latest updates do not appear: Clears Service Worker cache & reloads the newest version"
          >
            <RefreshCcw className="h-3 w-3 text-cyan-400" />
            <span className="hidden xl:inline">Sync</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden lg:block" />

          {/* Theme Selector & Designer */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">Theme:</span>
            <div className="flex rounded-md border border-slate-800 bg-slate-950 p-0.5 text-[11px]">
              <button
                onClick={() => onTemplateStyleChange(1)}
                className={`rounded px-2 py-0.5 font-bold transition ${
                  templateStyle === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Minimalist Classic (Clean White)"
              >
                Minimal
              </button>
              <button
                onClick={() => onTemplateStyleChange(2)}
                className={`rounded px-2 py-0.5 font-bold transition ${
                  templateStyle === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Modern Corporate (Executive Blue)"
              >
                Modern
              </button>
              <button
                onClick={() => onTemplateStyleChange(3)}
                className={`rounded px-2 py-0.5 font-bold transition ${
                  templateStyle === 3 ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Professional Executive (Midnight Dark & Gold)"
              >
                Professional
              </button>
            </div>

            {onOpenThemeDesigner && (
              <button
                onClick={onOpenThemeDesigner}
                className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-900/50 hover:text-white transition shadow-sm"
                title="Open Invoice Theme Designer (Preview & Save Global Template)"
              >
                <Palette className="h-3 w-3 text-amber-400" />
                <span className="hidden xl:inline">Theme Designer</span>
              </button>
            )}
          </div>

          {/* WhatsApp Share Button */}
          <button
            onClick={onWhatsAppShare}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition"
            title="Share invoice summary on WhatsApp"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </header>
  );
};
