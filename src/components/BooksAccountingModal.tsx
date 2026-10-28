import React, { useState, useMemo } from 'react';
import {
  BookEntry,
  BookCategory,
  TransactionType,
  PaymentMode,
  InvoiceHistoryRecord
} from '../types/solar';
import { formatINR, formatIntegerINR } from '../services/licenseService';
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building,
  RefreshCw,
  Sparkles,
  HelpCircle,
  X,
  FileText,
  AlertCircle,
  Tag
} from 'lucide-react';
import { TradeKey } from '../types/solar';

interface BooksAccountingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: BookEntry[];
  onEntriesChange: (entries: BookEntry[]) => void;
  invoicesHistory: InvoiceHistoryRecord[];
  firmName: string;
  trade?: TradeKey;
}

export const STANDARD_CATEGORY_LABELS: Record<string, { label: string; type: TransactionType; color: string }> = {
  // Common Universal Inflows
  SALES_INVOICE: { label: 'Sales / Tax Invoice', type: 'INFLOW', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  DIRECT_INCOME: { label: 'Direct Income / Services', type: 'INFLOW', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  CUSTOMER_ADVANCE: { label: 'Customer Advance / Token', type: 'INFLOW', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  INTEREST_INCOME: { label: 'Bank Interest & Credit', type: 'INFLOW', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  COMMISSION_INCOME: { label: 'Commission & Brokerage', type: 'INFLOW', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  OTHER_INCOME: { label: 'Other Business Income', type: 'INFLOW', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  SOLAR_SUBSIDY: { label: 'PM Surya Ghar Subsidy DBT', type: 'INFLOW', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },

  // Common Universal Outflows
  GOODS_PURCHASE: { label: 'Goods / Stock / Raw Material Purchase', type: 'OUTFLOW', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  OFFICE_EXPENSE: { label: 'Office Expenses & Stationery', type: 'OUTFLOW', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  BANK_CHARGES: { label: 'Bank Charges & Commission', type: 'OUTFLOW', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  SALARY_STAFF: { label: 'Staff Salary & Wages', type: 'OUTFLOW', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  OFFICE_RENT: { label: 'Office / Shop / Godown Rent', type: 'OUTFLOW', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ELECTRICITY_UTILITY: { label: 'Electricity & Utility Bills', type: 'OUTFLOW', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  FREIGHT_TRANSPORT: { label: 'Vehicle Transport & Freight', type: 'OUTFLOW', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  MARKETING_ADS: { label: 'Marketing & Advertising', type: 'OUTFLOW', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  TEA_REFRESHMENT: { label: 'Tea, Refreshment & Staff Welfare', type: 'OUTFLOW', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  TRAVEL_CONVEYANCE: { label: 'Travel & Conveyance', type: 'OUTFLOW', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  REPAIR_MAINTENANCE: { label: 'Repairs & Maintenance', type: 'OUTFLOW', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  GST_TAX_PAYMENT: { label: 'GST / Tax Challan Payment', type: 'OUTFLOW', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  OWNER_DRAWING: { label: 'Owner Personal Drawings', type: 'OUTFLOW', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  MISC_EXPENSE: { label: 'General / Misc Expense', type: 'OUTFLOW', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },

  // Solar EPC Specific Outflows
  PANEL_PURCHASE: { label: 'Solar PV Module Purchase', type: 'OUTFLOW', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  INVERTER_PURCHASE: { label: 'Inverter Purchase', type: 'OUTFLOW', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  HARDWARE_CABLES: { label: 'Structure, GI & Cable Hardware', type: 'OUTFLOW', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  LABOR_WAGES: { label: 'Installation & Electrician Labor', type: 'OUTFLOW', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export const getCategoryBadgeInfo = (cat: string, type: TransactionType) => {
  if (STANDARD_CATEGORY_LABELS[cat]) {
    return STANDARD_CATEGORY_LABELS[cat];
  }
  return {
    label: cat,
    type,
    color: type === 'INFLOW'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };
};

export const BooksAccountingModal: React.FC<BooksAccountingModalProps> = ({
  isOpen,
  onClose,
  entries,
  onEntriesChange,
  invoicesHistory,
  firmName,
  trade = 'solar',
}) => {
  const isSolar = trade === 'solar';
  const [activeTab, setActiveTab] = useState<'daybook' | 'bank_upload' | 'itr_pnl'>('daybook');
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'BANK' | 'CASH' | 'UPI'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');

  // User-defined custom categories stored in localStorage
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nb_custom_ledger_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Manual Entry Form State
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newParticulars, setNewParticulars] = useState('');
  const [newType, setNewType] = useState<TransactionType>('OUTFLOW');
  const [newCategory, setNewCategory] = useState<BookCategory>(isSolar ? 'PANEL_PURCHASE' : 'GOODS_PURCHASE');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [newMode, setNewMode] = useState<PaymentMode>('BANK');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newParty, setNewParty] = useState('');
  const [newRefNo, setNewRefNo] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Handle adding custom ledger name
  const handleSaveCustomCategory = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('nb_custom_ledger_categories', JSON.stringify(updated));
      } catch {}
    }
    setNewCategory(trimmed);
    setIsCustomMode(false);
    setCustomInput('');
  };

  // Bank Statement Parser State
  const [rawStatementText, setRawStatementText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [selectedStatementBank, setSelectedStatementBank] = useState('ALL');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Financial Year for ITR
  const [fyYear, setFyYear] = useState('2026-27');

  const safeEntries = useMemo(() => (Array.isArray(entries) ? entries : []), [entries]);
  const safeInvoices = useMemo(() => (Array.isArray(invoicesHistory) ? invoicesHistory : []), [invoicesHistory]);

  // -------------------------------------------------------------
  // Daybook Calculations
  // -------------------------------------------------------------
  const filteredEntries = safeEntries.filter((e) => {
    if (modeFilter !== 'ALL' && e.mode !== modeFilter) return false;
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        (e.particulars || '').toLowerCase().includes(q) ||
        (e.partyName && e.partyName.toLowerCase().includes(q)) ||
        (e.refNo && e.refNo.toLowerCase().includes(q)) ||
        (e.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totals = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let bankBalance = 0;
    let cashBalance = 0;

    safeEntries.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (e.type === 'INFLOW') {
        totalInflow += amt;
        if (e.mode === 'CASH') cashBalance += amt;
        else bankBalance += amt;
      } else {
        totalOutflow += amt;
        if (e.mode === 'CASH') cashBalance -= amt;
        else bankBalance -= amt;
      }
    });

    return {
      totalInflow,
      totalOutflow,
      netProfit: totalInflow - totalOutflow,
      bankBalance,
      cashBalance,
      netCashAndBank: bankBalance + cashBalance,
    };
  }, [safeEntries]);

  // -------------------------------------------------------------
  // Add Manual Entry Handler
  // -------------------------------------------------------------
  const handleSaveNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newParticulars.trim() || isNaN(amt) || amt <= 0) {
      alert('Please enter valid description and amount.');
      return;
    }

    const newEntry: BookEntry = {
      id: 'book_' + Date.now(),
      date: newDate,
      particulars: newParticulars.trim(),
      category: newCategory,
      type: newType,
      mode: newMode,
      amount: amt,
      partyName: newParty.trim() || undefined,
      refNo: newRefNo.trim() || undefined,
      notes: newNotes.trim() || undefined,
      source: 'MANUAL',
    };

    onEntriesChange([newEntry, ...safeEntries]);
    setIsAddingEntry(false);
    // Reset form
    setNewParticulars('');
    setNewAmount('');
    setNewParty('');
    setNewRefNo('');
    setNewNotes('');
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Delete this accounting entry from the ledger?')) {
      onEntriesChange(safeEntries.filter((e) => e.id !== id));
    }
  };

  // -------------------------------------------------------------
  // 1-Click Invoice Sync into Books
  // -------------------------------------------------------------
  const handleSyncInvoices = () => {
    let addedCount = 0;
    const existingRefNos = new Set(safeEntries.map((e) => e.refNo?.toUpperCase()));

    const newEntries: BookEntry[] = [];
    safeInvoices.forEach((inv) => {
      if (inv.invNo && !existingRefNos.has(inv.invNo.toUpperCase())) {
        newEntries.push({
          id: 'sync_' + inv.id + '_' + Date.now(),
          date: inv.date || new Date().toISOString().split('T')[0],
          particulars: `Tax Invoice Sale: ${inv.invNo} (${inv.customerName})`,
          category: 'SALES_INVOICE',
          type: 'INFLOW',
          mode: 'BANK',
          amount: inv.grandTotal || 0,
          refNo: inv.invNo,
          partyName: inv.customerName,
          source: 'INVOICE_SYNC',
          notes: `Auto-synced from Nexbill Billing Registry (${inv.itemsCount} items)`,
        });
        addedCount++;
      }
    });

    if (addedCount === 0) {
      alert('Sabhi invoices pehle se hi Books me synced hain! Koi naya invoice nahi mila.');
      return;
    }

    onEntriesChange([...newEntries, ...safeEntries]);
    alert(`✅ ${addedCount} Naye Tax Invoices safalta-poorvak Books & Daybook me add ho gaye!`);
  };

  // -------------------------------------------------------------
  // Smart Bank Statement Parser (VouchrIt AI-style Heuristic)
  // -------------------------------------------------------------
  const handleParseStatement = (textToParse: string) => {
    if (!textToParse.trim()) {
      alert('Please paste or upload bank statement text.');
      return;
    }

    const lines = textToParse.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: any[] = [];

    // Date regex patterns (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
    const dateRegex = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/;

    lines.forEach((line, idx) => {
      // Find date
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) return;

      const dateStr = dateMatch[0];
      // Normalize to YYYY-MM-DD
      let normalizedDate = new Date().toISOString().split('T')[0];
      try {
        const parts = dateStr.split(/[-\/]/);
        if (parts[0].length === 4) {
          normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } catch {}

      // Extract numbers/amounts from the line
      // Match amounts like 1,80,000.00 or 15000.00
      const amountsFound = line
        .replace(dateStr, '')
        .match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\b/g);

      if (!amountsFound || amountsFound.length === 0) return;

      // Extract description
      let narration = line
        .replace(dateStr, '')
        .replace(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!narration || narration.length < 3) narration = 'Bank Transaction Entry';

      // Pick amount
      const rawAmt = amountsFound[0].replace(/,/g, '');
      const amount = parseFloat(rawAmt);
      if (isNaN(amount) || amount <= 0) return;

      const lower = line.toLowerCase();
      // Determine Debit vs Credit
      const isCredit =
        lower.includes('cr') ||
        lower.includes('credit') ||
        lower.includes('deposit') ||
        lower.includes('subsidy') ||
        lower.includes('dbt');

      const type: TransactionType = isCredit ? 'INFLOW' : 'OUTFLOW';

      // AI/Heuristic Category Mapping (VouchrIt smart categorization)
      let category: BookCategory = isCredit ? 'CUSTOMER_ADVANCE' : 'MISC_EXPENSE';

      if (lower.includes('subsidy') || lower.includes('dbt') || lower.includes('mnre')) {
        category = 'SOLAR_SUBSIDY';
      } else if (lower.includes('waaree') || lower.includes('adani') || lower.includes('tata') || lower.includes('vikram') || lower.includes('module') || lower.includes('panel')) {
        category = 'PANEL_PURCHASE';
      } else if (lower.includes('inverter') || lower.includes('polycab') || lower.includes('deye') || lower.includes('growatt') || lower.includes('sungrow')) {
        category = 'INVERTER_PURCHASE';
      } else if (lower.includes('hardware') || lower.includes('pipe') || lower.includes('cable') || lower.includes('earthing') || lower.includes('structure') || lower.includes('gi ')) {
        category = 'HARDWARE_CABLES';
      } else if (lower.includes('labor') || lower.includes('electrician') || lower.includes('wages') || lower.includes('mounting')) {
        category = 'LABOR_WAGES';
      } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel') || lower.includes('transport') || lower.includes('freight')) {
        category = 'FREIGHT_TRANSPORT';
      } else if (lower.includes('rent')) {
        category = 'OFFICE_RENT';
      } else if (lower.includes('salary') || lower.includes('staff')) {
        category = 'SALARY_STAFF';
      } else if (lower.includes('chg') || lower.includes('charge') || lower.includes('sms') || lower.includes('annual fee')) {
        category = 'BANK_CHARGES';
      } else if (lower.includes('gst') || lower.includes('challan') || lower.includes('tax')) {
        category = 'GST_TAX_PAYMENT';
      } else if (isCredit && (lower.includes('sale') || lower.includes('inv') || lower.includes('solar'))) {
        category = 'SALES_INVOICE';
      }

      parsed.push({
        id: 'parsed_' + idx + '_' + Date.now(),
        date: normalizedDate,
        particulars: narration.slice(0, 120),
        category,
        type,
        mode: 'BANK' as PaymentMode,
        amount,
        selected: true,
      });
    });

    if (parsed.length === 0) {
      alert('Could not find recognizable transactions in the provided text. Please ensure lines contain Date and Amount.');
      return;
    }

    setParsedPreview(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawStatementText(content);
      handleParseStatement(content);
      setIsProcessingFile(false);
    };

    reader.onerror = () => {
      alert('Failed to read file');
      setIsProcessingFile(false);
    };

    reader.readAsText(file);
  };

  const handleImportParsedEntries = () => {
    const selected = parsedPreview.filter((p) => p.selected);
    if (selected.length === 0) {
      alert('No entries selected for import.');
      return;
    }

    const newBookEntries: BookEntry[] = selected.map((s) => ({
      id: 'stmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: s.date,
      particulars: s.particulars,
      category: s.category,
      type: s.type,
      mode: s.mode,
      amount: s.amount,
      source: 'BANK_STATEMENT',
      notes: 'Imported from Bank Statement Statement Parser',
    }));

    onEntriesChange([...newBookEntries, ...safeEntries]);
    setParsedPreview([]);
    setRawStatementText('');
    setActiveTab('daybook');
    alert(`🎉 Success! ${newBookEntries.length} bank transactions imported directly into Daybook & P&L!`);
  };

  // -------------------------------------------------------------
  // ITR & P&L Calculations (Adaptive for all business trades)
  // -------------------------------------------------------------
  const pnlReport = useMemo(() => {
    let salesTurnover = 0;
    let subsidyIncome = 0;
    let otherIncome = 0;

    let directMaterialCosts = 0;
    let directLaborCosts = 0;

    let freightExpenses = 0;
    let rentExpenses = 0;
    let salaryExpenses = 0;
    let bankExpenses = 0;
    let miscExpenses = 0;

    let cashTurnover = 0;
    let digitalTurnover = 0;

    safeEntries.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (e.type === 'INFLOW') {
        if (e.category === 'SALES_INVOICE') salesTurnover += amt;
        else if (e.category === 'SOLAR_SUBSIDY') subsidyIncome += amt;
        else otherIncome += amt;

        if (e.mode === 'CASH') cashTurnover += amt;
        else digitalTurnover += amt;
      } else {
        if (
          e.category === 'GOODS_PURCHASE' ||
          e.category === 'PANEL_PURCHASE' ||
          e.category === 'INVERTER_PURCHASE' ||
          e.category === 'HARDWARE_CABLES'
        ) {
          directMaterialCosts += amt;
        } else if (e.category === 'LABOR_WAGES') {
          directLaborCosts += amt;
        } else if (e.category === 'FREIGHT_TRANSPORT') {
          freightExpenses += amt;
        } else if (e.category === 'OFFICE_RENT') {
          rentExpenses += amt;
        } else if (e.category === 'SALARY_STAFF') {
          salaryExpenses += amt;
        } else if (e.category === 'BANK_CHARGES') {
          bankExpenses += amt;
        } else {
          miscExpenses += amt;
        }
      }
    });

    const totalTurnover = salesTurnover + subsidyIncome + otherIncome;
    const directCogs = directMaterialCosts + directLaborCosts;
    const grossProfit = totalTurnover - directCogs;
    const grossMarginPct = totalTurnover > 0 ? (grossProfit / totalTurnover) * 100 : 0;

    const indirectExpenses = freightExpenses + rentExpenses + salaryExpenses + bankExpenses + miscExpenses;
    const netProfit = grossProfit - indirectExpenses;
    const netMarginPct = totalTurnover > 0 ? (netProfit / totalTurnover) * 100 : 0;

    // Section 44AD Presumptive Taxation (6% on digital, 8% on cash)
    const presumptiveProfit44AD = digitalTurnover * 0.06 + cashTurnover * 0.08;

    return {
      salesTurnover,
      subsidyIncome,
      otherIncome,
      totalTurnover,
      cashTurnover,
      digitalTurnover,
      directMaterialCosts,
      directLaborCosts,
      directCogs,
      grossProfit,
      grossMarginPct: isNaN(grossMarginPct) ? 0 : grossMarginPct,
      freightExpenses,
      rentExpenses,
      salaryExpenses,
      bankExpenses,
      miscExpenses,
      indirectExpenses,
      netProfit,
      netMarginPct: isNaN(netMarginPct) ? 0 : netMarginPct,
      presumptiveProfit44AD,
    };
  }, [safeEntries]);

  // Only return null for rendering AFTER all React Hooks have executed unconditionally
  if (!isOpen) return null;

  // Export Daybook to CSV
  const handleExportCsv = () => {
    let csv = 'Date,Particulars,Category,Type,Mode,Amount,Ref No,Party Name,Source,Notes\n';
    safeEntries.forEach((e) => {
      const row = [
        `"${e.date}"`,
        `"${(e.particulars || '').replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.type}"`,
        `"${e.mode}"`,
        e.amount,
        `"${e.refNo || ''}"`,
        `"${(e.partyName || '').replace(/"/g, '""')}"`,
        `"${e.source || 'MANUAL'}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFirm = (firmName || 'My_Firm').replace(/\s+/g, '_');
    link.download = `DayBook_Ledger_${safeFirm}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col rounded-3xl border border-purple-500/30 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Books & Accounts Maintain
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/30">
                  Tally & ITR Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cash Book, Bank Ledger, Smart Statement Parser & ITR Profit & Loss Suite for <b className="text-slate-200">{firmName}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncInvoices}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition"
              title="Sync all generated invoices from CRM directly into Books as Sales"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sync Invoices</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('daybook')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'daybook'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Cash & Bank Day Book</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {safeEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bank_upload')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'bank_upload'
                ? 'border-purple-400 text-purple-400 bg-slate-900/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Bank Statement (VouchrIt AI)</span>
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-extrabold">
              Auto-Entry
            </span>
          </button>

          <button
            onClick={() => setActiveTab('itr_pnl')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'itr_pnl'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>ITR & P&L Statement (Sec 44AD)</span>
          </button>
        </div>

        {/* Tab 1: Day Book & Ledgers */}
        {activeTab === 'daybook' && (
          <div className="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 shadow-sm">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Total Inflow (Sales)
                </div>
                <div className="mt-1 text-base font-black text-white">
                  ₹ {formatIntegerINR(totals.totalInflow)}
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 shadow-sm">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5" /> Total Outflow (Expenses)
                </div>
                <div className="mt-1 text-base font-black text-white">
                  ₹ {formatIntegerINR(totals.totalOutflow)}
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 shadow-sm">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" /> Bank Balance
                </div>
                <div className="mt-1 text-base font-black text-blue-200">
                  ₹ {formatIntegerINR(totals.bankBalance)}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 shadow-sm">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Cash In Hand
                </div>
                <div className="mt-1 text-base font-black text-amber-200">
                  ₹ {formatIntegerINR(totals.cashBalance)}
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 shadow-sm col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Net Profit / Balance
                </div>
                <div className={`mt-1 text-base font-black ${totals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹ {formatIntegerINR(totals.netProfit)}
                </div>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search narration, party, or ref no..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <select
                  value={modeFilter}
                  onChange={(e: any) => setModeFilter(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Modes</option>
                  <option value="BANK">Bank A/C</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="UPI">UPI Transfer</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Inflow/Outflow</option>
                  <option value="INFLOW">Inflow (+ Credit)</option>
                  <option value="OUTFLOW">Outflow (- Debit)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingEntry(!isAddingEntry)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Entry</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  title="Export Daybook to CSV for Tally or Excel"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Collapsible Add Entry Form */}
            {isAddingEntry && (
              <form
                onSubmit={handleSaveNewEntry}
                className="rounded-2xl border border-amber-500/40 bg-slate-950 p-4 shadow-xl space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> New Accounting Transaction Entry
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingEntry(false)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Type</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewType('INFLOW');
                          setNewCategory('SALES_INVOICE');
                          setIsCustomMode(false);
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                          newType === 'INFLOW' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        + Inflow (Receipt)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewType('OUTFLOW');
                          setNewCategory(isSolar ? 'PANEL_PURCHASE' : 'GOODS_PURCHASE');
                          setIsCustomMode(false);
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                          newType === 'OUTFLOW' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        - Outflow (Payment)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Mode</label>
                    <select
                      value={newMode}
                      onChange={(e: any) => setNewMode(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CASH">Cash in Hand</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-400">Category / Ledger</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomMode(!isCustomMode);
                          if (!isCustomMode) setCustomInput('');
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {isCustomMode ? '← Pick List' : '+ Write Custom'}
                      </button>
                    </div>

                    {isCustomMode ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="e.g. Courier Charges, Diesel..."
                          className="flex-1 rounded-lg border border-amber-500 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:outline-none font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveCustomCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomCategory}
                          className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newCategory}
                        onChange={(e: any) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomMode(true);
                          } else {
                            setNewCategory(e.target.value);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                      >
                        {newType === 'INFLOW' ? (
                          <>
                            <optgroup label="General Business Inflow (All Trades)">
                              <option value="SALES_INVOICE">Sales / Customer Invoice</option>
                              <option value="DIRECT_INCOME">Direct Income / Service Fee</option>
                              <option value="CUSTOMER_ADVANCE">Customer Advance / Token</option>
                              <option value="INTEREST_INCOME">Bank Interest & Credit</option>
                              <option value="COMMISSION_INCOME">Commission & Brokerage</option>
                              <option value="OTHER_INCOME">Other Business Income</option>
                            </optgroup>
                            {isSolar && (
                              <optgroup label="Solar EPC Specific Inflow">
                                <option value="SOLAR_SUBSIDY">PM Surya Ghar Subsidy DBT</option>
                              </optgroup>
                            )}
                          </>
                        ) : (
                          <>
                            <optgroup label="Common Business Expenses (All Trades)">
                              <option value="GOODS_PURCHASE">Goods / Stock / Raw Material Purchase</option>
                              <option value="OFFICE_EXPENSE">General Office Expense & Stationery</option>
                              <option value="BANK_CHARGES">Bank Charges & Commission</option>
                              <option value="SALARY_STAFF">Staff Salary & Wages</option>
                              <option value="OFFICE_RENT">Office / Shop / Godown Rent</option>
                              <option value="ELECTRICITY_UTILITY">Electricity & Utility Bills</option>
                              <option value="FREIGHT_TRANSPORT">Freight, Transport & Courier</option>
                              <option value="MARKETING_ADS">Marketing & Advertising</option>
                              <option value="TEA_REFRESHMENT">Tea & Refreshment / Staff Welfare</option>
                              <option value="TRAVEL_CONVEYANCE">Travel & Conveyance</option>
                              <option value="REPAIR_MAINTENANCE">Repairs & Maintenance</option>
                              <option value="GST_TAX_PAYMENT">GST / Tax Challan Payment</option>
                              <option value="OWNER_DRAWING">Owner Personal Drawings</option>
                              <option value="MISC_EXPENSE">General / Miscellaneous Expense</option>
                            </optgroup>
                            {isSolar && (
                              <optgroup label="Solar EPC Material & Labor">
                                <option value="PANEL_PURCHASE">Solar PV Module Purchase</option>
                                <option value="INVERTER_PURCHASE">Solar Inverter Purchase</option>
                                <option value="HARDWARE_CABLES">Structure, GI & Cable Hardware</option>
                                <option value="LABOR_WAGES">Installation Labor & Electrician</option>
                              </optgroup>
                            )}
                          </>
                        )}
                        {customCategories.length > 0 && (
                          <optgroup label="Your Custom Business Ledgers">
                            {customCategories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="__CUSTOM__">+ Write Custom Ledger Name...</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Particulars / Description *</label>
                    <input
                      type="text"
                      value={newParticulars}
                      onChange={(e) => setNewParticulars(e.target.value)}
                      placeholder="e.g. Purchase 12 NOS Waaree 550Wp Bifacial Panels"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="e.g. 98400"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Party / Vendor Name</label>
                    <input
                      type="text"
                      value={newParty}
                      onChange={(e) => setNewParty(e.target.value)}
                      placeholder="e.g. Waaree Solar Distributor"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingEntry(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Save to Daybook
                  </button>
                </div>
              </form>
            )}

            {/* Daybook Table */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">Particulars & Description</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-center w-20">Mode</th>
                    <th className="py-2.5 px-3 text-right w-28 text-rose-400">Debit (Out)</th>
                    <th className="py-2.5 px-3 text-right w-28 text-emerald-400">Credit (In)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => {
                      const catInfo = getCategoryBadgeInfo(entry.category, entry.type);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{entry.date}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-semibold text-white leading-snug">{entry.particulars}</div>
                            {(entry.partyName || entry.refNo) && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {entry.partyName && <span>👤 {entry.partyName}</span>}
                                {entry.refNo && <span className="font-mono text-amber-400/80">Ref: {entry.refNo}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 font-sans whitespace-nowrap">
                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-sans">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                              {entry.mode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-400">
                            {entry.type === 'OUTFLOW' ? `₹ ${formatINR(entry.amount)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                            {entry.type === 'INFLOW' ? `₹ ${formatINR(entry.amount)}` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-sans italic">
                        No transactions found in this view. Click "+ Add Entry" or "Sync Invoices".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Smart Bank Statement Parser (VouchrIt AI style) */}
        {activeTab === 'bank_upload' && (
          <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-5">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Smart Bank Statement Parser (VouchrIt AI-style)
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        SBI, PNB, HDFC, ICICI, BOB
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Apne bank account ka statement (CSV, Excel ya PDF se copied text) upload karein. Hamara AI parser har transaction ko <b>Date, Narration, Debit, Credit aur Ledger Category</b> me automatically map kar deta hai!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload & Paste Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: File Upload */}
              <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 p-5 text-center flex flex-col items-center justify-center gap-2.5 hover:border-purple-400 transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Upload Bank Statement CSV / TXT</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Directly parse exported statement from NetBanking</div>
                </div>
                <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md transition">
                  Choose Statement File
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option B: Copy Paste Text */}
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-1">Or Paste Text from PDF Bank Statement:</div>
                  <textarea
                    rows={3}
                    value={rawStatementText}
                    onChange={(e) => setRawStatementText(e.target.value)}
                    placeholder="Paste bank statement rows here (e.g. 05/04/2026 NEFT-WAAREE SOLAR-120000.00 DR...)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200 font-mono focus:border-purple-400 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleParseStatement(rawStatementText)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Parse Statement
                  </button>
                </div>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Extracted Transactions ({parsedPreview.length} Found)</span>
                    <span className="text-emerald-400 text-[11px]">Review & choose categories before saving</span>
                  </div>

                  <button
                    onClick={handleImportParsedEntries}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Import {parsedPreview.filter((p) => p.selected).length} Entries to Books
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={parsedPreview.every((p) => p.selected)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedPreview(parsedPreview.map((p) => ({ ...p, selected: checked })));
                            }}
                          />
                        </th>
                        <th className="py-2.5 px-3 w-28">Date</th>
                        <th className="py-2.5 px-3">Bank Narration</th>
                        <th className="py-2.5 px-3 w-48">Predicted Ledger Category</th>
                        <th className="py-2.5 px-3 text-right w-28">Debit (- Dr)</th>
                        <th className="py-2.5 px-3 text-right w-28">Credit (+ Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {parsedPreview.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => {
                                const copy = [...parsedPreview];
                                copy[idx].selected = e.target.checked;
                                setParsedPreview(copy);
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 text-slate-400">{row.date}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-white truncate max-w-[280px]">
                            {row.particulars}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <select
                              value={row.category}
                              onChange={(e) => {
                                const copy = [...parsedPreview];
                                copy[idx].category = e.target.value as BookCategory;
                                setParsedPreview(copy);
                              }}
                              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                            >
                              {row.type === 'INFLOW' ? (
                                <>
                                  <option value="SALES_INVOICE">Sales / Customer Invoice</option>
                                  <option value="DIRECT_INCOME">Direct Income / Service Fees</option>
                                  <option value="CUSTOMER_ADVANCE">Customer Advance</option>
                                  <option value="INTEREST_INCOME">Bank Interest / Credit</option>
                                  <option value="OTHER_INCOME">Other Business Income</option>
                                  {isSolar && <option value="SOLAR_SUBSIDY">PM Surya Ghar Subsidy DBT</option>}
                                </>
                              ) : (
                                <>
                                  <option value="GOODS_PURCHASE">Goods / Stock / Raw Material</option>
                                  <option value="OFFICE_EXPENSE">Office Expenses & Stationery</option>
                                  <option value="BANK_CHARGES">Bank Charges & Folio</option>
                                  <option value="SALARY_STAFF">Staff Salary & Wages</option>
                                  <option value="OFFICE_RENT">Office / Shop Rent</option>
                                  <option value="ELECTRICITY_UTILITY">Electricity & Utility</option>
                                  <option value="FREIGHT_TRANSPORT">Vehicle Freight & Transport</option>
                                  <option value="MARKETING_ADS">Marketing & Advertising</option>
                                  <option value="TEA_REFRESHMENT">Tea & Refreshment</option>
                                  <option value="GST_TAX_PAYMENT">GST / Tax Payment</option>
                                  <option value="OWNER_DRAWING">Owner Personal Drawing</option>
                                  <option value="MISC_EXPENSE">General Expense</option>
                                  {isSolar && (
                                    <>
                                      <option value="PANEL_PURCHASE">Solar PV Module Purchase</option>
                                      <option value="INVERTER_PURCHASE">Solar Inverter Purchase</option>
                                      <option value="HARDWARE_CABLES">Structure, GI & Cable Hardware</option>
                                      <option value="LABOR_WAGES">Installation Labor & Electrician</option>
                                    </>
                                  )}
                                </>
                              )}
                              {customCategories.length > 0 && (
                                <optgroup label="Custom Ledgers">
                                  {customCategories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-rose-400">
                            {row.type === 'OUTFLOW' ? `₹ ${formatINR(row.amount)}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400">
                            {row.type === 'INFLOW' ? `₹ ${formatINR(row.amount)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ITR & P&L Statement */}
        {activeTab === 'itr_pnl' && (
          <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
            {/* Header Control */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Trading & Profit & Loss Statement
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                    ITR Audit / Section 44AD Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Generated automatically from all sales invoices, material purchases, and ledger expenses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Financial Year:</span>
                <select
                  value={fyYear}
                  onChange={(e) => setFyYear(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none"
                >
                  <option value="2026-27">FY 2026-27 (AY 2027-28)</option>
                  <option value="2025-26">FY 2025-26 (AY 2026-27)</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-400" /> Print P&L
                </button>
              </div>
            </div>

            {/* P&L Statement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Direct Incomes & Gross Profit */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                  1. Gross Revenue & Direct Inflows
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">
                      {isSolar ? 'Total Solar Tax Invoices Sales:' : 'Total Commercial Sales Invoices:'}
                    </span>
                    <span className="font-mono font-bold text-white">₹ {formatINR(pnlReport.salesTurnover)}</span>
                  </div>
                  {(isSolar || pnlReport.subsidyIncome > 0) && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">PM Surya Ghar Subsidy Receipts:</span>
                      <span className="font-mono font-bold text-teal-300">₹ {formatINR(pnlReport.subsidyIncome)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Other Direct Receipts / Advances:</span>
                    <span className="font-mono font-bold text-white">₹ {formatINR(pnlReport.otherIncome)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-emerald-400 text-sm bg-emerald-950/30 px-2 rounded-lg">
                    <span>Total Business Turnover:</span>
                    <span className="font-mono">₹ {formatIntegerINR(pnlReport.totalTurnover)}</span>
                  </div>
                </div>

                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2 pt-2">
                  2. Direct Material Costs (COGS)
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">
                      {isSolar ? 'Solar Modules, Inverters & Hardware Purchases:' : 'Goods, Stock & Raw Material Purchases:'}
                    </span>
                    <span className="font-mono font-bold text-rose-300">₹ {formatINR(pnlReport.directMaterialCosts)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">
                      {isSolar ? 'Installation, Earthing & Electrician Labor:' : 'Direct Labor, Production & Job Work:'}
                    </span>
                    <span className="font-mono font-bold text-rose-300">₹ {formatINR(pnlReport.directLaborCosts)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-rose-400 text-sm bg-rose-950/30 px-2 rounded-lg">
                    <span>Total Direct Costs:</span>
                    <span className="font-mono">₹ {formatIntegerINR(pnlReport.directCogs)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                  <span className="font-extrabold text-xs uppercase tracking-wide">Gross Profit:</span>
                  <div className="text-right">
                    <span className="text-base font-black font-mono">₹ {formatIntegerINR(pnlReport.grossProfit)}</span>
                    <div className="text-[10px] text-purple-300">Gross Margin: {(pnlReport.grossMarginPct || 0).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Indirect Expenses, Net Profit & ITR Sec 44AD */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-2">
                  3. Indirect Operating Expenses
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Transportation, Delivery & Fuel:</span>
                    <span className="font-mono font-bold text-slate-200">₹ {formatINR(pnlReport.freightExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Commercial Office / Godown Rent:</span>
                    <span className="font-mono font-bold text-slate-200">₹ {formatINR(pnlReport.rentExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Staff Salary & Team Payroll:</span>
                    <span className="font-mono font-bold text-slate-200">₹ {formatINR(pnlReport.salaryExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Bank Service Charges & GST:</span>
                    <span className="font-mono font-bold text-slate-200">₹ {formatINR(pnlReport.bankExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">General Administrative / Tea / Miscellaneous:</span>
                    <span className="font-mono font-bold text-slate-200">₹ {formatINR(pnlReport.miscExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-200 text-sm bg-slate-900 px-2 rounded-lg">
                    <span>Total Operating Overheads:</span>
                    <span className="font-mono">₹ {formatIntegerINR(pnlReport.indirectExpenses)}</span>
                  </div>
                </div>

                {/* Net Profit Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 text-emerald-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Net Business Profit (Before Tax)</div>
                      <div className="text-xl font-black text-white font-mono mt-0.5">
                        ₹ {formatIntegerINR(pnlReport.netProfit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                        {(pnlReport.netMarginPct || 0).toFixed(1)}% Net Margin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 44AD Presumptive Taxation Box */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs space-y-2">
                  <h5 className="font-bold text-amber-300 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> ITR Section 44AD Presumptive Taxation Scheme
                  </h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Small business traders and contractors with annual turnover under ₹3 Crores can file <b>ITR-4 (Sugam)</b> without maintaining audited balance sheets:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <div className="text-slate-400">Bank/Digital Turnover (6%)</div>
                      <div className="font-bold text-white font-mono">₹ {formatIntegerINR(pnlReport.digitalTurnover)}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Min Profit: ₹ {formatIntegerINR(pnlReport.digitalTurnover * 0.06)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <div className="text-slate-400">Cash Turnover (8%)</div>
                      <div className="font-bold text-white font-mono">₹ {formatIntegerINR(pnlReport.cashTurnover)}</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">Min Profit: ₹ {formatIntegerINR(pnlReport.cashTurnover * 0.08)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-amber-500/20 font-bold text-white">
                    <span>Deemed ITR Taxable Income (Sec 44AD):</span>
                    <span className="text-amber-400 font-mono text-sm">
                      ₹ {formatIntegerINR(pnlReport.presumptiveProfit44AD)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
