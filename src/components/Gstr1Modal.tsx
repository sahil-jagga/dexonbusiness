import React, { useState } from 'react';
import { InvoiceHistoryRecord } from '../types/solar';
import { formatINR, formatIntegerINR } from '../services/licenseService';
import { FileSpreadsheet, Download, Printer, Filter, Calendar, CheckCircle, X } from 'lucide-react';

interface Gstr1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoicesHistory: InvoiceHistoryRecord[];
  firmName: string;
}

export const Gstr1Modal: React.FC<Gstr1ModalProps> = ({
  isOpen,
  onClose,
  invoicesHistory,
  firmName,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  if (!isOpen) return null;

  // Extract available months
  const monthsSet = new Set<string>();
  invoicesHistory.forEach((inv) => {
    if (inv.date) {
      const ym = inv.date.substring(0, 7); // YYYY-MM
      monthsSet.add(ym);
    }
  });
  const availableMonths = Array.from(monthsSet).sort().reverse();

  // Filter records
  const filteredInvoices = invoicesHistory.filter((inv) => {
    if (selectedMonth === 'ALL') return true;
    return inv.date && inv.date.startsWith(selectedMonth);
  });

  // Calculate totals
  const totalTaxable = filteredInvoices.reduce((sum, inv) => sum + (inv.taxableAmount || 0), 0);
  const totalCgst = filteredInvoices.reduce((sum, inv) => sum + (inv.cgstAmount || 0), 0);
  const totalSgst = filteredInvoices.reduce((sum, inv) => sum + (inv.sgstAmount || 0), 0);
  const total5 = filteredInvoices.reduce((sum, inv) => sum + (inv.tax5Amount || 0), 0);
  const total18 = filteredInvoices.reduce((sum, inv) => sum + (inv.tax18Amount || 0), 0);
  const grandTotal = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const b2bCount = filteredInvoices.filter((inv) => inv.customerGstin && inv.customerGstin.trim().length > 5).length;
  const b2cCount = filteredInvoices.length - b2bCount;

  // Export CSV in standard GSTR-1 format
  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Invoice Value (INR)',
      'Place Of Supply',
      'Reverse Charge',
      'Invoice Type',
      'Receiver Name',
      'Receiver GSTIN',
      'Taxable Value (INR)',
      '5% GST Amount (INR)',
      '18% GST Amount (INR)',
      'CGST (INR)',
      'SGST (INR)',
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invNo}"`,
      `"${inv.date}"`,
      inv.grandTotal.toFixed(2),
      `"08-Rajasthan"`,
      `"N"`,
      inv.customerGstin ? `"B2B Regular"` : `"B2C Others (Surya Ghar)"`,
      `"${inv.customerName || 'Consumer'}"`,
      `"${inv.customerGstin || '-'}"`,
      inv.taxableAmount.toFixed(2),
      inv.tax5Amount.toFixed(2),
      inv.tax18Amount.toFixed(2),
      inv.cgstAmount.toFixed(2),
      inv.sgstAmount.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR1_${firmName.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Monthly GST Return Export (GSTR-1 Format)
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  Business Plan
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Click Excel / CSV export for CA & GST Portal filing ({firmName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-purple-400" /> Filter Month:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-purple-400 focus:outline-none font-semibold"
            >
              <option value="ALL">All Recorded Invoices ({invoicesHistory.length})</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {ym} (Month)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" /> Print Summary
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredInvoices.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-md disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Download GSTR-1 CSV / Excel
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[10px] text-slate-400">Total Invoices</div>
              <div className="text-lg font-black text-white mt-0.5">{filteredInvoices.length}</div>
              <div className="text-[9px] text-slate-500 mt-1">
                B2C: <b>{b2cCount}</b> | B2B: <b>{b2bCount}</b>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[10px] text-slate-400">Total Taxable Turnover</div>
              <div className="text-lg font-black text-slate-200 mt-0.5">₹ {formatIntegerINR(totalTaxable)}</div>
            </div>

            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
              <div className="text-[10px] text-emerald-400">5% GST (Panels/Inverters)</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">₹ {formatIntegerINR(total5)}</div>
            </div>

            <div className="rounded-xl border border-orange-900/40 bg-orange-950/20 p-3">
              <div className="text-[10px] text-orange-300">18% GST (BOS/Services)</div>
              <div className="text-lg font-black text-orange-300 mt-0.5">₹ {formatIntegerINR(total18)}</div>
            </div>

            <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3">
              <div className="text-[10px] text-purple-300">Total Invoice Value</div>
              <div className="text-lg font-black text-purple-300 mt-0.5">₹ {formatIntegerINR(grandTotal)}</div>
            </div>
          </div>

          {/* GSTR-1 Table */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-3">Customer / Beneficiary</th>
                  <th className="py-2.5 px-2">GSTIN</th>
                  <th className="py-2.5 px-2 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-2 text-right text-emerald-400">CGST (₹)</th>
                  <th className="py-2.5 px-2 text-right text-emerald-400">SGST (₹)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-white">Invoice Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-mono font-bold text-amber-300">{inv.invNo}</td>
                    <td className="py-2 px-2 text-slate-300">{inv.date}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-white">{inv.customerName}</div>
                      {inv.plantCapacityKw && (
                        <div className="text-[10px] text-slate-400">{inv.plantCapacityKw} Rooftop</div>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                      {inv.customerGstin || <span className="text-slate-600">B2C Consumer</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-slate-200">
                      {formatINR(inv.taxableAmount)}
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-400">{formatINR(inv.cgstAmount)}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{formatINR(inv.sgstAmount)}</td>
                    <td className="py-2 px-3 text-right font-extrabold text-white">
                      {formatINR(inv.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredInvoices.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-900 font-bold">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-400">
                      Total:
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-200">{formatINR(totalTaxable)}</td>
                    <td className="py-2.5 px-2 text-right text-emerald-400">{formatINR(totalCgst)}</td>
                    <td className="py-2.5 px-2 text-right text-emerald-400">{formatINR(totalSgst)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-300 text-sm">{formatINR(grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {filteredInvoices.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No invoices recorded for this period yet. When you generate and print invoices, they appear here automatically!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
