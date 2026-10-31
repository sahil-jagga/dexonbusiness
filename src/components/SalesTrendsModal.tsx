import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { InvoiceHistoryRecord } from '../types/solar';
import { formatIntegerINR } from '../services/licenseService';
import {
  TrendingUp,
  X,
  Calendar,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  DollarSign,
  FileText,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Layers,
} from 'lucide-react';

interface SalesTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoicesHistory: InvoiceHistoryRecord[];
  currency?: string;
  onRefreshHistory?: () => void;
}

interface MonthlyDataPoint {
  monthKey: string;      // "2026-03"
  monthLabel: string;    // "Mar 2026"
  year: number;
  totalRevenue: number;
  taxableSales: number;
  taxCollected: number;
  invoiceCount: number;
  avgTicket: number;
  growthPct?: number | null;
}

export const SalesTrendsModal: React.FC<SalesTrendsModalProps> = ({
  isOpen,
  onClose,
  invoicesHistory: initialHistory,
  currency = '₹',
  onRefreshHistory,
}) => {
  // Local state for fetched history
  const [history, setHistory] = useState<InvoiceHistoryRecord[]>(initialHistory);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedDocType, setSelectedDocType] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'composed'>('area');

  // Fetch or re-sync invoice history from persistent storage
  const fetchHistoryFromStorage = () => {
    setIsRefreshing(true);
    try {
      const saved = localStorage.getItem('nb_invoices_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } else {
        setHistory(initialHistory);
      }
      if (onRefreshHistory) onRefreshHistory();
    } catch {
      setHistory(initialHistory);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistoryFromStorage();
    }
  }, [isOpen, initialHistory]);

  // Load sample data if history is completely empty
  const handleLoadSampleHistory = () => {
    const months = [
      { key: '2026-01', name: 'Jan 2026', total: 185000, tax: 28000, count: 4 },
      { key: '2026-02', name: 'Feb 2026', total: 240000, tax: 36000, count: 6 },
      { key: '2026-03', name: 'Mar 2026', total: 320000, tax: 48000, count: 9 },
      { key: '2026-04', name: 'Apr 2026', total: 290000, tax: 43500, count: 7 },
      { key: '2026-05', name: 'May 2026', total: 410000, tax: 61500, count: 11 },
      { key: '2026-06', name: 'Jun 2026', total: 495000, tax: 74250, count: 13 },
      { key: '2026-07', name: 'Jul 2026', total: 460000, tax: 69000, count: 10 },
      { key: '2026-08', name: 'Aug 2026', total: 580000, tax: 87000, count: 15 },
      { key: '2026-09', name: 'Sep 2026', total: 640000, tax: 96000, count: 16 },
      { key: '2026-10', name: 'Oct 2026', total: 720000, tax: 108000, count: 18 },
    ];

    const sampleRecords: InvoiceHistoryRecord[] = [];
    months.forEach((m, idx) => {
      for (let i = 1; i <= m.count; i++) {
        const taxable = Math.round((m.total - m.tax) / m.count);
        const grand = Math.round(m.total / m.count);
        const taxVal = grand - taxable;
        const day = String(Math.min(28, i * 2 + 1)).padStart(2, '0');
        sampleRecords.push({
          id: `sample_${idx}_${i}`,
          invNo: `DX-26/${m.key.split('-')[1]}/${String(i).padStart(3, '0')}`,
          date: `${m.key}-${day}`,
          docType: 'invoice',
          customerName: `Sample Client ${i}`,
          customerMobile: '9876543210',
          taxableAmount: taxable,
          cgstAmount: Math.round(taxVal / 2),
          sgstAmount: Math.round(taxVal / 2),
          tax5Amount: 0,
          tax18Amount: taxVal,
          grandTotal: grand,
          firmName: 'Sample Solar Firm',
          itemsCount: 3,
          itemsSnapshot: [],
          customerSnapshot: {
            name: `Sample Client ${i}`,
            relation: '',
            address: 'Industrial Area',
            mobile: '9876543210',
            aadhar: '',
            appNo: '',
            consumerNo: '',
            sanctionLoad: '5 kW',
            gstin: '',
          },
          createdAt: `${m.key}-${day}T10:00:00.000Z`,
        });
      }
    });

    setHistory(sampleRecords);
    localStorage.setItem('nb_invoices_history', JSON.stringify(sampleRecords));
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract available years for filter
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    history.forEach((rec) => {
      if (rec.date && rec.date.length >= 4) {
        yearSet.add(rec.date.substring(0, 4));
      }
    });
    return Array.from(yearSet).sort().reverse();
  }, [history]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return history.filter((rec) => {
      if (selectedYear !== 'ALL') {
        if (!rec.date || !rec.date.startsWith(selectedYear)) return false;
      }
      if (selectedDocType !== 'ALL') {
        if (rec.docType !== selectedDocType) return false;
      }
      return true;
    });
  }, [history, selectedYear, selectedDocType]);

  // Monthly Sales Trends Aggregation
  const monthlyTrends: MonthlyDataPoint[] = useMemo(() => {
    const map = new Map<string, {
      totalRevenue: number;
      taxableSales: number;
      taxCollected: number;
      invoiceCount: number;
    }>();

    filteredRecords.forEach((rec) => {
      const dateStr = rec.date || (rec.createdAt ? rec.createdAt.substring(0, 10) : '');
      if (!dateStr || dateStr.length < 7) return;

      const ym = dateStr.substring(0, 7); // e.g. "2026-10"
      const prev = map.get(ym) || {
        totalRevenue: 0,
        taxableSales: 0,
        taxCollected: 0,
        invoiceCount: 0,
      };

      const tax = (rec.cgstAmount || 0) + (rec.sgstAmount || 0) || (rec.tax5Amount || 0) + (rec.tax18Amount || 0);

      map.set(ym, {
        totalRevenue: prev.totalRevenue + (rec.grandTotal || 0),
        taxableSales: prev.taxableSales + (rec.taxableAmount || 0),
        taxCollected: prev.taxCollected + tax,
        invoiceCount: prev.invoiceCount + 1,
      });
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Sort chronologically
    const sortedKeys = Array.from(map.keys()).sort();

    const result: MonthlyDataPoint[] = [];

    sortedKeys.forEach((key, idx) => {
      const val = map.get(key)!;
      const [yStr, mStr] = key.split('-');
      const year = parseInt(yStr, 10);
      const mIdx = parseInt(mStr, 10) - 1;
      const monthLabel = `${monthNames[mIdx] || mStr} ${year}`;
      const avgTicket = val.invoiceCount > 0 ? Math.round(val.totalRevenue / val.invoiceCount) : 0;

      let growthPct: number | null = null;
      if (idx > 0) {
        const prevMonth = result[idx - 1];
        if (prevMonth && prevMonth.totalRevenue > 0) {
          growthPct = Math.round(((val.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue) * 100);
        }
      }

      result.push({
        monthKey: key,
        monthLabel,
        year,
        totalRevenue: Math.round(val.totalRevenue),
        taxableSales: Math.round(val.taxableSales),
        taxCollected: Math.round(val.taxCollected),
        invoiceCount: val.invoiceCount,
        avgTicket,
        growthPct,
      });
    });

    return result;
  }, [filteredRecords]);

interface SummaryMetrics {
  totalRev: number;
  totalTaxable: number;
  totalTax: number;
  totalCount: number;
  avgMonthly: number;
  peakMonth: MonthlyDataPoint | null;
}

  // Overall KPI Metrics
  const summaryMetrics = useMemo<SummaryMetrics>(() => {
    const totalRev = monthlyTrends.reduce((sum, m) => sum + m.totalRevenue, 0);
    const totalTaxable = monthlyTrends.reduce((sum, m) => sum + m.taxableSales, 0);
    const totalTax = monthlyTrends.reduce((sum, m) => sum + m.taxCollected, 0);
    const totalCount = monthlyTrends.reduce((sum, m) => sum + m.invoiceCount, 0);
    const avgMonthly = monthlyTrends.length > 0 ? Math.round(totalRev / monthlyTrends.length) : 0;

    let peakMonth: MonthlyDataPoint | null = null;
    monthlyTrends.forEach((m) => {
      if (!peakMonth || m.totalRevenue > peakMonth.totalRevenue) {
        peakMonth = m;
      }
    });

    return {
      totalRev,
      totalTaxable,
      totalTax,
      totalCount,
      avgMonthly,
      peakMonth,
    };
  }, [monthlyTrends]);

  // Export Monthly Trends to Excel (.xlsx)
  const handleExportTrendsExcel = () => {
    const wb = XLSX.utils.book_new();

    const sheetData: (string | number)[][] = [
      ['DEXON MONTHLY SALES TRENDS & REVENUE REPORT'],
      [`Filter Year: ${selectedYear} | Document Type: ${selectedDocType} | Generated: ${new Date().toLocaleString()}`],
      [],
      ['SUMMARY METRICS'],
      [`Total Sales Revenue (${currency})`, summaryMetrics.totalRev],
      [`Total Taxable Sales (${currency})`, summaryMetrics.totalTaxable],
      [`Total GST / Tax Collected (${currency})`, summaryMetrics.totalTax],
      ['Total Invoices Count', summaryMetrics.totalCount],
      [`Average Monthly Revenue (${currency})`, summaryMetrics.avgMonthly],
      [`Peak Month`, summaryMetrics.peakMonth ? `${summaryMetrics.peakMonth.monthLabel} (${currency} ${summaryMetrics.peakMonth.totalRevenue.toLocaleString('en-IN')})` : 'N/A'],
      [],
      [
        'Month',
        'Year',
        'Invoices Count',
        `Taxable Sales (${currency})`,
        `Tax / GST (${currency})`,
        `Total Revenue (${currency})`,
        `Average Ticket Size (${currency})`,
        'MoM Growth (%)',
      ],
    ];

    monthlyTrends.forEach((m) => {
      sheetData.push([
        m.monthLabel,
        m.year,
        m.invoiceCount,
        m.taxableSales,
        m.taxCollected,
        m.totalRevenue,
        m.avgTicket,
        m.growthPct !== null && m.growthPct !== undefined ? `${m.growthPct > 0 ? '+' : ''}${m.growthPct}%` : '—',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 16 }, // Month
      { wch: 8 },  // Year
      { wch: 16 }, // Invoices
      { wch: 18 }, // Taxable
      { wch: 16 }, // Tax
      { wch: 20 }, // Total Revenue
      { wch: 20 }, // Avg Ticket
      { wch: 14 }, // Growth %
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sales_Trends');
    XLSX.writeFile(wb, `Dexon_Monthly_Sales_Trends_${selectedYear}.xlsx`);
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyDataPoint;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3.5 shadow-2xl text-xs text-white min-w-[210px]">
          <div className="font-extrabold text-amber-400 text-sm border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
              {data.invoiceCount} Bills
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Total Revenue:</span>
              <span>{currency} {formatIntegerINR(data.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-blue-300">
              <span>Taxable Value:</span>
              <span>{currency} {formatIntegerINR(data.taxableSales)}</span>
            </div>
            <div className="flex items-center justify-between text-purple-300">
              <span>GST / Tax:</span>
              <span>{currency} {formatIntegerINR(data.taxCollected)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Avg per Bill:</span>
              <span className="font-semibold text-slate-200">{currency} {formatIntegerINR(data.avgTicket)}</span>
            </div>
            {data.growthPct !== null && data.growthPct !== undefined && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">MoM Growth:</span>
                <span className={`font-bold flex items-center gap-0.5 ${data.growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.growthPct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {data.growthPct > 0 ? `+${data.growthPct}%` : `${data.growthPct}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Monthly Sales Trends</h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recharts Visualizer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track revenue, taxable sales, and bill volume trajectories over time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistoryFromStorage}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition active:scale-95 disabled:opacity-50"
              title="Refresh / Fetch latest invoice records from storage"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={handleExportTrendsExcel}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition active:scale-95"
              title="Export Monthly Trends to Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Trends (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Container with Smooth Scrolling */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Controls Bar: Filters & Chart Style Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-md">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold pl-1">
                <Filter className="h-3.5 w-3.5 text-amber-400" />
                <span>Filters:</span>
              </div>

              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>

              {/* Doc Type Select */}
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Document Types</option>
                <option value="invoice">Tax Invoices Only</option>
                <option value="quotation">Quotations / Estimates</option>
                <option value="receipt">Margin Receipts</option>
                <option value="wcc">Work Completion Certificates</option>
              </select>

              <span className="text-[11px] text-slate-400 ml-1">
                Showing <b>{filteredRecords.length}</b> records across <b>{monthlyTrends.length}</b> months
              </span>
            </div>

            {/* Chart Type Toggle Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
              <button
                onClick={() => setChartType('area')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition ${
                  chartType === 'area'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Revenue Area Gradient Trend"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Revenue Curve</span>
              </button>

              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Monthly Breakdown Bar Chart"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Sales vs Tax</span>
              </button>

              <button
                onClick={() => setChartType('composed')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition ${
                  chartType === 'composed'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Revenue with Invoice Count Line"
              >
                <LineChartIcon className="h-3.5 w-3.5" />
                <span>Revenue + Volume</span>
              </button>
            </div>
          </div>

          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span>Total Revenue</span>
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {currency} {formatIntegerINR(summaryMetrics.totalRev)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Across {summaryMetrics.totalCount} issued documents
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
                <span>Taxable Sales</span>
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {currency} {formatIntegerINR(summaryMetrics.totalTaxable)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tax collected: {currency} {formatIntegerINR(summaryMetrics.totalTax)}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
                <span>Average Monthly</span>
                <Calendar className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {currency} {formatIntegerINR(summaryMetrics.avgMonthly)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Monthly average run-rate
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-1">
                <span>Peak Month</span>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {summaryMetrics.peakMonth ? summaryMetrics.peakMonth.monthLabel : '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {summaryMetrics.peakMonth
                  ? `${currency} ${formatIntegerINR(summaryMetrics.peakMonth.totalRevenue)} record sales`
                  : 'No sales recorded'}
              </div>
            </div>
          </div>

          {/* Main Chart Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Monthly Sales Trajectory Chart
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive monthly sales data. Hover over any point to inspect detailed bill totals.
                </p>
              </div>

              {monthlyTrends.length === 0 && (
                <button
                  onClick={handleLoadSampleHistory}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
                  title="Load 10 months of sample solar business sales data to test charts"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Load Sample Sales Data
                </button>
              )}
            </div>

            {monthlyTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-white">No Sales History Found</h4>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Jab aap bills generate karenge ya save karenge, unka monthly sales trend yahan automatically plot hoga.
                </p>
                <button
                  onClick={handleLoadSampleHistory}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Load Sample Sales History (Preview Chart)
                </button>
              </div>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="taxableGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) =>
                          val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                        }
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalRevenue"
                        name="Total Revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="taxableSales"
                        name="Taxable Value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#taxableGradient)"
                      />
                    </AreaChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) =>
                          val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                        }
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                      />
                      <Bar dataKey="taxableSales" name="Taxable Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="taxCollected" name="GST / Tax" fill="#a855f7" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="totalRevenue" name="Grand Total" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <ComposedChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) =>
                          val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                        }
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#f59e0b"
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalRevenue"
                        name="Total Revenue"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        opacity={0.85}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="invoiceCount"
                        name="Invoices Issued (Count)"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#f59e0b' }}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Month-by-Month Data Breakdown Table */}
          {monthlyTrends.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Monthly Sales Breakdown Table</h4>
                </div>
                <button
                  onClick={handleExportTrendsExcel}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Month</th>
                      <th className="py-2.5 px-3 text-center">Invoices</th>
                      <th className="py-2.5 px-3 text-right">Taxable Sales ({currency})</th>
                      <th className="py-2.5 px-3 text-right">GST / Tax ({currency})</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue ({currency})</th>
                      <th className="py-2.5 px-3 text-right">Avg / Bill</th>
                      <th className="py-2.5 px-4 text-center">MoM Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {monthlyTrends.map((m) => (
                      <tr key={m.monthKey} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {m.monthLabel}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300 font-mono font-bold">
                            {m.invoiceCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-blue-300">
                          {formatIntegerINR(m.taxableSales)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-300">
                          {formatIntegerINR(m.taxCollected)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                          {formatIntegerINR(m.totalRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatIntegerINR(m.avgTicket)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {m.growthPct !== null && m.growthPct !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-bold ${
                                m.growthPct >= 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {m.growthPct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {m.growthPct > 0 ? `+${m.growthPct}%` : `${m.growthPct}%`}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold text-white text-xs">
                    <tr>
                      <td className="py-3 px-4 uppercase tracking-wider">Total / Overall</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400">{summaryMetrics.totalCount}</td>
                      <td className="py-3 px-3 text-right text-blue-300">{formatIntegerINR(summaryMetrics.totalTaxable)}</td>
                      <td className="py-3 px-3 text-right text-purple-300">{formatIntegerINR(summaryMetrics.totalTax)}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 text-sm font-black">
                        {currency} {formatIntegerINR(summaryMetrics.totalRev)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {summaryMetrics.totalCount > 0
                          ? formatIntegerINR(Math.round(summaryMetrics.totalRev / summaryMetrics.totalCount))
                          : '0'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
