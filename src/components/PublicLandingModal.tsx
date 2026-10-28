import React, { useState } from 'react';
import {
  Sun,
  ShieldCheck,
  Zap,
  FileText,
  Calculator,
  Check,
  PhoneCall,
  Key,
  Award,
  TrendingUp,
  Percent,
  Sparkles,
  Briefcase,
  Globe
} from 'lucide-react';
import { IndustryType } from '../types/solar';
import { CountryCode, COUNTRIES, getCountryConfig } from '../config/countries';

interface PublicLandingModalProps {
  isOpen: boolean;
  onUnlockWithKey: (key: string) => Promise<{ success: boolean; message?: string }>;
  onTryTrial: () => void;
  onOpenAdmin: () => void;
  currentIndustry?: IndustryType;
  onSelectIndustry?: (industry: IndustryType) => void;
  country?: CountryCode;
  onCountryChange?: (c: CountryCode) => void;
}

const INDUSTRY_OPTIONS: Array<{ id: IndustryType; label: string; icon: string }> = [
  { id: 'solar', label: '☀️ Solar Rooftop & EPC', icon: '☀️' },
  { id: 'electrical', label: '⚡ Electricals & Wire', icon: '⚡' },
  { id: 'automobile', label: '🏍️ Bike & Auto Spares', icon: '🏍️' },
  { id: 'finance', label: '💼 CA, Tax & Accounts', icon: '💼' },
  { id: 'general', label: '🏢 General Trade & Wholesale', icon: '🏢' },
];

const INDUSTRY_CONTENT: Partial<Record<IndustryType, {
  badge: string;
  title: string;
  tagline: string;
  headline: string;
  subheadline: string;
  planTarget: string;
  features: Array<{ icon: any; title: string; desc: string; color: string }>;
}>> = {
  solar: {
    badge: 'Solar EPC V2.5',
    title: 'NEXBILL SOLAR',
    tagline: 'Dedicated Invoicing, 70:30 GST Optimization & WCC Tool for Solar EPC Vendors',
    headline: 'Why Indian Solar Installers Choose Nexbill over Generic Billing Apps',
    subheadline: 'Built specifically for PM Surya Ghar: Muft Bijli Yojana & State DISCOM compliance',
    planTarget: 'Solar EPC & Rooftop Contractors',
    features: [
      {
        icon: Percent,
        color: 'text-amber-400 bg-amber-500/10',
        title: '70:30 GST Auto Optimizer',
        desc: 'Automatically calculates 5% GST (Solar panels & Inverter) vs 18% GST (BOS, Structure, Installation) to ensure DISCOM invoice approval.',
      },
      {
        icon: FileText,
        color: 'text-emerald-400 bg-emerald-500/10',
        title: '4 Essential Solar Docs in 1 Click',
        desc: 'Generate Tax Invoice (Original/Duplicate), PM Surya Ghar WCC Certificate, Customer Quotation with ROI, and Bank Loan Estimate.',
      },
      {
        icon: Calculator,
        color: 'text-blue-400 bg-blue-500/10',
        title: 'Reverse Target Pricing',
        desc: 'Give a target price (e.g. ₹1,80,000 for 3kW) and your cost rates; the tool auto-computes exact item rates and tax margins instantly.',
      },
    ],
  },
  electrical: {
    badge: 'Electrical Edition',
    title: 'NEXBILL ELECTRICAL',
    tagline: 'Fast GST Billing, Cable Multi-Units (Mtr/Coil) & Inventory for Electrical Dealers',
    headline: 'Why Electrical Contractors & Hardware Dealers Choose Nexbill over Generic Billing Apps',
    subheadline: 'Preloaded Polycab/Havells catalog, verified HSN codes (8544/8536) & wire coil calculators',
    planTarget: 'Electrical Dealers & Contractors',
    features: [
      {
        icon: Zap,
        color: 'text-amber-400 bg-amber-500/10',
        title: 'Preloaded Electrical Catalog',
        desc: 'Instant 1-click billing for Polycab/Havells copper wires, MCBs, modular switches, and conduit pipes with verified HSN & 18% GST.',
      },
      {
        icon: FileText,
        color: 'text-emerald-400 bg-emerald-500/10',
        title: 'Multi-Unit Flexible Billing',
        desc: 'Bill effortlessly in Meters, Coils, Numbers, Sets, or Lump-sum Contract Labor without manual unit conversions or math errors.',
      },
      {
        icon: TrendingUp,
        color: 'text-purple-400 bg-purple-500/10',
        title: 'Cash/Bank Daybook & CA Export',
        desc: 'Track daily counter cash sales, NEFT receipts, and download monthly GSTR-1 Excel/CSV for your accountant in 1 click.',
      },
    ],
  },
  automobile: {
    badge: 'Automobile Edition',
    title: 'NEXBILL AUTO',
    tagline: 'Smart Billing, Dual GST (18% & 28%) & Spares Management for Workshops & Retailers',
    headline: 'Why Auto Spare Parts & Workshop Owners Choose Nexbill over Generic Billing Apps',
    subheadline: 'Engine oils, batteries, tyres, two-wheeler spares & mechanic job work billing with zero hassle',
    planTarget: 'Auto Spare Retailers & Workshops',
    features: [
      {
        icon: Percent,
        color: 'text-rose-400 bg-rose-500/10',
        title: 'Dual GST (18% & 28%) Auto Split',
        desc: 'Bill lubricants (18%) and batteries/tyres/spares (28%) together with automatic tax summaries and statutory reverse charge notice.',
      },
      {
        icon: Award,
        color: 'text-amber-400 bg-amber-500/10',
        title: 'Model & Part Serial Tracking',
        desc: 'Print vehicle registration number, battery warranty serial, and mechanic labor charges cleanly on customer receipts.',
      },
      {
        icon: Calculator,
        color: 'text-emerald-400 bg-emerald-500/10',
        title: 'Counter UPI QR & Daily Khata',
        desc: 'Dynamic UPI QR code right on the printed bill for instant scan & pay; complete cash vs bank daybook tracking.',
      },
    ],
  },
  finance: {
    badge: 'CA & Tax Edition',
    title: 'NEXBILL FINANCE & CA',
    tagline: 'Multi-Firm Billing, Section 44AD ITR Calculator & Smart Bank Statement Parser',
    headline: 'Why CA Firms, Tax Consultants & Accountants Choose Nexbill over Generic Billing Apps',
    subheadline: 'VouchrIt AI bank statement parser, Sec 44AD presumptive tax calculations & multi-GSTIN portal',
    planTarget: 'CA Firms & Tax Consultants',
    features: [
      {
        icon: Sparkles,
        color: 'text-purple-400 bg-purple-500/10',
        title: 'Smart Bank Statement Parser',
        desc: 'Upload or paste PDF statements from SBI, PNB, HDFC, ICICI; automatically detects credits, debits, and categories into accounting ledgers.',
      },
      {
        icon: Calculator,
        color: 'text-emerald-400 bg-emerald-500/10',
        title: 'ITR Section 44AD Engine',
        desc: 'Automatic 6% digital and 8% cash presumptive tax calculation for small business clients ready for ITR-4 (Sugam) audit filing.',
      },
      {
        icon: ShieldCheck,
        color: 'text-blue-400 bg-blue-500/10',
        title: 'Multi-Firm Instant Switcher',
        desc: 'Maintain dozens of separate client firms, custom logos, GSTINs, bank accounts, and invoice sequences from a single screen.',
      },
    ],
  },
  general: {
    badge: 'All-in-One Edition',
    title: 'NEXBILL BIZ',
    tagline: 'Professional GST Billing, Dynamic UPI QR Code, Cash/Bank Daybook & Profit Analytics',
    headline: 'Why Indian Wholesale Traders & Retail Distributors Choose Nexbill over Generic Billing Apps',
    subheadline: 'Clean GST tax invoices, customer CRM, digital signatures, and 100% offline-ready PWA',
    planTarget: 'Wholesale & Retail Businesses',
    features: [
      {
        icon: Zap,
        color: 'text-amber-400 bg-amber-500/10',
        title: 'Dynamic UPI QR Code',
        desc: 'Print real-time UPI QR codes linked to your bank VPA; customers scan and pay directly at billing counter.',
      },
      {
        icon: TrendingUp,
        color: 'text-emerald-400 bg-emerald-500/10',
        title: 'Full Daybook & Profit Analysis',
        desc: 'See daily cash-in-hand, bank balances, supplier expenses, and exact net profit margins without complex tally training.',
      },
      {
        icon: ShieldCheck,
        color: 'text-blue-400 bg-blue-500/10',
        title: 'Installable Offline PWA',
        desc: 'Works offline as an app on your mobile, tablet, or PC without internet; auto-syncs and downloads high-res PDF invoices.',
      },
    ],
  },
};

export const PublicLandingModal: React.FC<PublicLandingModalProps> = ({
  isOpen,
  onUnlockWithKey,
  onTryTrial,
  onOpenAdmin,
  currentIndustry = 'solar',
  onSelectIndustry,
  country = 'IN',
  onCountryChange,
}) => {
  const [selectedInd, setSelectedInd] = useState<IndustryType>(currentIndustry);
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(() => {
    try {
      return (localStorage.getItem('nb_country') as CountryCode) || country || 'IN';
    } catch {
      return 'IN';
    }
  });
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      return localStorage.getItem('nb_currency') || '₹';
    } catch {
      return '₹';
    }
  });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleCountrySelect = (cCode: CountryCode) => {
    setSelectedCountryCode(cCode);
    const cfg = COUNTRIES[cCode] || COUNTRIES.IN;
    setSelectedCurrency(cfg.currency);
    try {
      localStorage.setItem('nb_country', cCode);
      localStorage.setItem('nb_currency', cfg.currency);
    } catch {}
    if (onCountryChange) {
      onCountryChange(cCode);
    }
  };

  // Sync if prop changes
  React.useEffect(() => {
    if (currentIndustry) setSelectedInd(currentIndustry);
  }, [currentIndustry]);

  // Secret Owner shortcut (Ctrl + Shift + A)
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        onOpenAdmin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpenAdmin]);

  const handleSecretLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setLogoClicks(0);
      onOpenAdmin();
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  if (!isOpen) return null;

  const currentContent = INDUSTRY_CONTENT[selectedInd] || INDUSTRY_CONTENT.solar!;

  const handleIndustrySelect = (ind: IndustryType) => {
    setSelectedInd(ind);
    if (onSelectIndustry) {
      onSelectIndustry(ind);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorMsg('Please enter a license key.');
      return;
    }
    setVerifying(true);
    setErrorMsg('');
    const res = await onUnlockWithKey(keyInput.trim());
    setVerifying(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid or revoked license key.');
    }
  };

  const handleTrialClick = () => {
    if (onSelectIndustry) {
      onSelectIndustry(selectedInd);
    }
    onTryTrial();
  };

  const handleWhatsAppBuy = (plan: string, price: string) => {
    const text = encodeURIComponent(
      `Hi Sahil, I want to purchase Nexbill (${currentContent.title} - ${plan} - ${price}). Please share payment details & activation key.`
    );
    window.open(`https://wa.me/919429842000?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <div className="my-auto flex w-full max-w-4xl flex-col rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Industry Category Switcher Tabs */}
        <div className="bg-slate-950 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-400 mr-2">
            <Briefcase className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Select Your Trade:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {INDUSTRY_OPTIONS.map((opt) => {
              const isActive = selectedInd === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleIndustrySelect(opt.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Banner with Dynamic Industry Content */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-6 sm:p-8 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                onClick={handleSecretLogoClick}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 cursor-pointer select-none"
                title="Nexbill Multi-Industry Suite"
              >
                <Sun className="h-7 w-7 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {currentContent.title} <span className="text-amber-400">PRO</span>
                  </h1>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                    {currentContent.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  {currentContent.tagline}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                GST Compliant & Offline PWA
              </span>
            </div>
          </div>

          {/* Quick License Input in Hero with Country / Currency Pre-Selector */}
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-slate-950/80 p-4 sm:p-5 shadow-xl">
            {/* Country & Currency Pre-Select */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-amber-400" /> Select Country & Currency for Invoicing:
              </span>
              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountrySelect(e.target.value as CountryCode)}
                className="rounded-lg bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold px-3 py-1 focus:outline-none cursor-pointer"
              >
                <option value="IN">🇮🇳 India (INR - ₹) [GST Split]</option>
                <option value="AE">🇦🇪 UAE / Gulf (AED - د.إ) [VAT 5%]</option>
                <option value="US">🇺🇸 United States (USD - $) [Sales Tax]</option>
                <option value="GB">🇬🇧 United Kingdom & Europe (GBP - £) [VAT]</option>
                <option value="NP">🇳🇵 Nepal (NPR - रू) [Local VAT 13%]</option>
                <option value="BD">🇧🇩 Bangladesh (BDT - ৳) [Local VAT 15%]</option>
                <option value="PK">🇵🇰 Pakistan (PKR - Rs) [Sales Tax]</option>
                <option value="SA">🇸🇦 Saudi Arabia (SAR - ﷼) [VAT 15%]</option>
              </select>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="ENTER LICENSE KEY (e.g. NXB-TRL-DEMO-2812-1A40)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm font-bold tracking-wider text-amber-400 placeholder:text-slate-500 placeholder:tracking-normal focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-amber-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {verifying ? 'Verifying Key...' : 'Unlock Tool 🔓'}
              </button>
              <button
                type="button"
                onClick={handleTrialClick}
                className="w-full sm:w-auto shrink-0 rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40"
              >
                Test Free Trial (5 Bills)
              </button>
            </form>

            {errorMsg && (
              <div className="mt-2 text-xs font-semibold text-rose-400 text-center sm:text-left">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Feature Highlights Grid */}
        <div className="p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {currentContent.headline}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {currentContent.subheadline}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentContent.features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 hover:border-amber-500/30 transition">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${feat.color} mb-3`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pricing Plans for Sale with Monthly vs Annual Toggle */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="text-center mb-5">
              <h3 className="text-base font-bold text-white">
                License Plans for {currentContent.planTarget}
              </h3>
              <p className="text-xs text-slate-400">Transparent commercial pricing. Select your billing preference.</p>

              {/* Monthly vs Annual Toggle */}
              <div className="mt-3 flex justify-center">
                <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`rounded-lg px-4 py-1.5 transition ${
                      billingCycle === 'monthly'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Plan
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`rounded-lg px-4 py-1.5 transition flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annual Plan</span>
                    <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] text-white font-extrabold">
                      Save 37%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {/* Pro Plan */}
              <div className="relative rounded-2xl border-2 border-amber-500 bg-slate-950 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="absolute -top-3 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black uppercase text-slate-950 tracking-wider">
                    {billingCycle === 'annual' ? 'Save 37%' : 'Flexible'}
                  </div>
                  <div className="text-sm font-bold text-amber-400">⭐ Pro License</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {billingCycle === 'annual' ? '₹1,499' : '₹199'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {billingCycle === 'annual' ? '/ 1 Year' : '/ Month'}
                    </span>
                  </div>
                  {billingCycle === 'annual' ? (
                    <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                      Effective: ~₹125/month <span className="text-emerald-400 font-bold">(Save ₹889 / 37%)</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Billed monthly • Cancel anytime
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Perfect for single firm & daily billing</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <b>Unlimited Invoices & Quotations</b>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      All 3 Premium Invoice Templates
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Preloaded Trade Catalog & Daybook
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Custom Firm Logo, Tax Details & Digital Sign
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() =>
                    handleWhatsAppBuy(
                      'Pro Plan',
                      billingCycle === 'annual' ? '₹1,499/yr' : '₹199/mo'
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400 flex items-center justify-center gap-2 transition"
                >
                  <PhoneCall className="h-4 w-4" /> Buy Pro ({billingCycle === 'annual' ? '₹1,499/yr' : '₹199/mo'})
                </button>
              </div>

              {/* Business Plan */}
              <div className="rounded-2xl border-2 border-purple-500/80 bg-slate-950/60 p-5 hover:border-purple-400 transition flex flex-col justify-between shadow-lg">
                <div>
                  <div className="text-sm font-bold text-purple-400">🚀 Business License</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {billingCycle === 'annual' ? '₹2,999' : '₹399'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {billingCycle === 'annual' ? '/ 1 Year' : '/ Month'}
                    </span>
                  </div>
                  {billingCycle === 'annual' ? (
                    <div className="text-[11px] text-purple-300 font-semibold mt-0.5">
                      Effective: ~₹250/month <span className="text-emerald-400 font-bold">(Save ₹1,789 / 37%)</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Billed monthly • Cancel anytime
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-400">For multi-firm businesses, distributors & CA</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                      <b>Everything in Pro + Unlimited Multi-Firms</b>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                      Bank Statement Parser (VouchrIt AI style)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                      Monthly Tax Return Export (GSTR-1 / CSV)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                      Priority 24/7 Support & Custom Branding
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() =>
                    handleWhatsAppBuy(
                      'Business Plan',
                      billingCycle === 'annual' ? '₹2,999/yr' : '₹399/mo'
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-extrabold text-white hover:bg-purple-500 flex items-center justify-center gap-2 transition"
                >
                  <PhoneCall className="h-4 w-4" /> Buy Business ({billingCycle === 'annual' ? '₹2,999/yr' : '₹399/mo'})
                </button>
              </div>
            </div>

            {/* Direct Contact Footer */}
            <div className="mt-6 text-center text-xs text-slate-400">
              Direct Contact: <b className="text-white">Jagga Enterprises</b> — Call / WhatsApp: <a href="tel:9429842000" className="text-amber-400 font-bold hover:underline">94298-42000</a> | <a href="tel:9428342000" className="text-amber-400 font-bold hover:underline">94283-42000</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
