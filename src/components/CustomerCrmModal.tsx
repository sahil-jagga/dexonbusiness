import React, { useState, useRef } from 'react';
import { CustomerInfo, InvoiceHistoryRecord } from '../types/solar';
import { formatIntegerINR } from '../services/licenseService';
import { backupService } from '../services/backupService';
import {
  Users,
  History,
  Search,
  Plus,
  Trash2,
  ArrowUpRight,
  Share2,
  Download,
  Upload,
  X,
  Calendar,
  Filter,
  FileSpreadsheet,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CustomerCrmModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerList: CustomerInfo[];
  onSaveCustomerList: (list: CustomerInfo[]) => void;
  onSelectCustomer: (cust: CustomerInfo) => void;
  invoicesHistory: InvoiceHistoryRecord[];
  onLoadInvoiceRecord: (record: InvoiceHistoryRecord) => void;
  onDeleteHistoryRecord: (id: string) => void;
  onImportInvoicesHistory?: (records: InvoiceHistoryRecord[]) => void;
  onDataRestored?: () => void;
}

export const CustomerCrmModal: React.FC<CustomerCrmModalProps> = ({
  isOpen,
  onClose,
  customerList,
  onSaveCustomerList,
  onSelectCustomer,
  invoicesHistory,
  onLoadInvoiceRecord,
  onDeleteHistoryRecord,
  onImportInvoicesHistory,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'crm' | 'history'>('crm');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Range and Filter State for Invoice History
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyDocType, setHistoryDocType] = useState<string>('ALL');
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvHistoryFileInputRef = useRef<HTMLInputElement>(null);

  // Add new customer modal form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAadhar, setNewAadhar] = useState('');
  const [newAppNo, setNewAppNo] = useState('');
  const [newConsumerNo, setNewConsumerNo] = useState('');
  const [newSanctionLoad, setNewSanctionLoad] = useState('3.00 kW');
  const [newGstin, setNewGstin] = useState('');

  if (!isOpen) return null;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter customer name');
      return;
    }
    const newCust: CustomerInfo = {
      name: newName.trim(),
      relation: newRelation.trim(),
      address: newAddress.trim(),
      mobile: newMobile.trim(),
      aadhar: newAadhar.trim(),
      appNo: newAppNo.trim(),
      consumerNo: newConsumerNo.trim(),
      sanctionLoad: newSanctionLoad.trim(),
      gstin: newGstin.trim().toUpperCase(),
    };

    const updated = [newCust, ...customerList.filter((c) => c.name !== newCust.name)];
    onSaveCustomerList(updated);
    setShowAddForm(false);
    // Reset
    setNewName('');
    setNewRelation('');
    setNewAddress('');
    setNewMobile('');
    setNewAadhar('');
    setNewAppNo('');
    setNewConsumerNo('');
    setNewGstin('');
  };

  const handleDeleteCustomer = (name: string) => {
    if (confirm(`Delete customer "${name}" from CRM directory?`)) {
      onSaveCustomerList(customerList.filter((c) => c.name !== name));
    }
  };

  const handleWhatsAppChat = (cust: CustomerInfo) => {
    const text = encodeURIComponent(`Hello ${cust.name}, greetings from Solar Power Solutions.`);
    const phone = cust.mobile ? cust.mobile.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  const handleExportCustomersCSV = () => {
    const headers = [
      'Name',
      'Relation',
      'Address',
      'Mobile',
      'Aadhaar',
      'Surya Ghar App No',
      'Consumer K-No',
      'Sanctioned Load',
      'GSTIN',
    ];
    const rows = customerList.map((c) => [
      `"${c.name}"`,
      `"${c.relation}"`,
      `"${(c.address || '').replace(/\n/g, ' ')}"`,
      `"${c.mobile}"`,
      `"${c.aadhar}"`,
      `"${c.appNo}"`,
      `"${c.consumerNo}"`,
      `"${c.sanctionLoad}"`,
      `"${c.gstin}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customers_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered History Records based on Global Search and Date Range
  const filteredHistory = invoicesHistory.filter((item) => {
    // 1. Text Search across Customer Name, Invoice No, Mobile Phone, Firm Name, Plant Capacity
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      const matchText =
        (item.customerName || '').toLowerCase().includes(s) ||
        (item.invNo || '').toLowerCase().includes(s) ||
        (item.customerMobile || '').includes(s) ||
        (item.firmName || '').toLowerCase().includes(s) ||
        (item.plantCapacityKw || '').toLowerCase().includes(s);
      if (!matchText) return false;
    }

    // 2. Document Type Filter
    if (historyDocType !== 'ALL') {
      if (historyDocType === 'quotation_estimate') {
        if (item.docType !== 'quotation' && item.docType !== 'estimate') return false;
      } else if (item.docType !== historyDocType) {
        return false;
      }
    }

    // 3. Date Range Filter
    if (historyStartDate && item.date < historyStartDate) return false;
    if (historyEndDate && item.date > historyEndDate) return false;

    return true;
  });

  const totalFilteredSum = filteredHistory.reduce((sum, h) => sum + (Number(h.grandTotal) || 0), 0);

  // Quick Date Presets
  const handleSetPreset = (preset: 'today' | 'month' | 'last30' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setHistoryStartDate(todayStr);
      setHistoryEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setHistoryStartDate(firstDay);
      setHistoryEndDate(todayStr);
    } else if (preset === 'last30') {
      const past30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      setHistoryStartDate(past30);
      setHistoryEndDate(todayStr);
    } else if (preset === 'all') {
      setHistoryStartDate('');
      setHistoryEndDate('');
      setHistoryDocType('ALL');
      setSearchTerm('');
    }
  };

  // Export Filtered History to CSV
  const handleExportFilteredHistoryCSV = () => {
    const headers = [
      'Document No',
      'Date',
      'Document Type',
      'Customer Name',
      'Customer Mobile',
      'Capacity / Model',
      'Taxable Amount (Rs)',
      'CGST (Rs)',
      'SGST (Rs)',
      'Grand Total (Rs)',
      'Firm Name',
    ];
    const rows = filteredHistory.map((h) => [
      `"${h.invNo}"`,
      `"${h.date}"`,
      `"${h.docType}"`,
      `"${h.customerName}"`,
      `"${h.customerMobile || ''}"`,
      `"${h.plantCapacityKw || ''}"`,
      h.taxableAmount || 0,
      h.cgstAmount || 0,
      h.sgstAmount || 0,
      h.grandTotal || 0,
      `"${h.firmName}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Filtered_Invoice_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample CSV Template for Bulk Invoice History Import
  const handleDownloadInvoiceSampleCsv = () => {
    const headers = [
      'Document No',
      'Date',
      'Document Type',
      'Customer Name',
      'Customer Mobile',
      'Capacity / Model',
      'Taxable Amount',
      'CGST',
      'SGST',
      'Grand Total',
      'Firm Name',
    ];
    const sampleRows = [
      ['"INV/26-27/001"', '"2026-10-25"', '"invoice"', '"Ramesh Sharma"', '"9829012345"', '"3.00 kW"', '110000', '2750', '2750', '115500', '"Jagga Enterprises"'],
      ['"INV/26-27/002"', '"2026-10-26"', '"invoice"', '"Pooja Verma"', '"9414098765"', '"5.00 kW"', '180000', '4500', '4500', '189000', '"Jagga Enterprises"'],
      ['"EST/26-27/003"', '"2026-10-27"', '"estimate"', '"Vikram Singh"', '"9829554321"', '"4.00 kW"', '145000', '3625', '3625', '152250', '"Jagga Enterprises"'],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sample_Invoices_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Import Handler for Invoice History
  const handleImportHistoryCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Robust CSV parsing taking quotes and line breaks into account
      const rawRows = text.split(/\r\n|\n|\r/).filter((r) => r.trim().length > 0);
      if (rawRows.length < 2) {
        setBackupNotice({ type: 'error', text: 'CSV file is empty or missing data rows.' });
        if (csvHistoryFileInputRef.current) csvHistoryFileInputRef.current.value = '';
        return;
      }

      const parseRow = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result.map((c) => c.replace(/^["']|["']$/g, '').trim());
      };

      const headerRow = parseRow(rawRows[0]).map((h) => h.toLowerCase());
      
      // Dynamic column resolution based on common header names
      const colInvNo = headerRow.findIndex((h) => h.includes('doc') || h.includes('inv') || h.includes('number'));
      const colDate = headerRow.findIndex((h) => h.includes('date'));
      const colDocType = headerRow.findIndex((h) => h.includes('type'));
      const colCustomer = headerRow.findIndex((h) => h.includes('customer') || h.includes('client') || h.includes('party'));
      const colMobile = headerRow.findIndex((h) => h.includes('phone') || h.includes('mobile'));
      const colCapacity = headerRow.findIndex((h) => h.includes('capacity') || h.includes('model') || h.includes('spec') || h.includes('item'));
      const colTaxable = headerRow.findIndex((h) => h.includes('taxable'));
      const colCgst = headerRow.findIndex((h) => h.includes('cgst'));
      const colSgst = headerRow.findIndex((h) => h.includes('sgst'));
      const colTotal = headerRow.findIndex((h) => h.includes('grand') || h.includes('total') || h.includes('amount'));
      const colFirm = headerRow.findIndex((h) => h.includes('firm') || h.includes('company'));

      const importedRecords: InvoiceHistoryRecord[] = [];
      const timestamp = Date.now();

      for (let i = 1; i < rawRows.length; i++) {
        const cols = parseRow(rawRows[i]);
        if (cols.length === 0 || cols.every((c) => !c)) continue;

        const invNo = (colInvNo !== -1 && cols[colInvNo]) ? cols[colInvNo] : `INV/IMP/${timestamp}-${i}`;
        const date = (colDate !== -1 && cols[colDate]) ? cols[colDate] : new Date().toISOString().split('T')[0];
        const rawType = (colDocType !== -1 && cols[colDocType]) ? cols[colDocType].toLowerCase() : 'invoice';
        const docType = (rawType.includes('est') || rawType.includes('quot'))
          ? 'estimate'
          : rawType.includes('rec')
          ? 'receipt'
          : rawType.includes('wcc')
          ? 'wcc'
          : 'invoice';

        const customerName = (colCustomer !== -1 && cols[colCustomer]) ? cols[colCustomer] : 'Bulk Client';
        const customerMobile = (colMobile !== -1 && cols[colMobile]) ? cols[colMobile] : '';
        const plantCapacityKw = (colCapacity !== -1 && cols[colCapacity]) ? cols[colCapacity] : '';
        const taxableAmount = (colTaxable !== -1 && cols[colTaxable]) ? parseFloat(cols[colTaxable]) || 0 : 0;
        const cgstAmount = (colCgst !== -1 && cols[colCgst]) ? parseFloat(cols[colCgst]) || 0 : 0;
        const sgstAmount = (colSgst !== -1 && cols[colSgst]) ? parseFloat(cols[colSgst]) || 0 : 0;
        const grandTotal = (colTotal !== -1 && cols[colTotal]) ? parseFloat(cols[colTotal]) || (taxableAmount + cgstAmount + sgstAmount) : (taxableAmount + cgstAmount + sgstAmount);
        const firmName = (colFirm !== -1 && cols[colFirm]) ? cols[colFirm] : 'My Business Firm';

        importedRecords.push({
          id: `imp_${timestamp}_${i}`,
          invNo,
          date,
          docType: docType as any,
          customerName,
          customerMobile,
          plantCapacityKw,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          tax5Amount: cgstAmount + sgstAmount,
          tax18Amount: 0,
          grandTotal,
          firmName,
          itemsCount: 1,
          itemsSnapshot: [
            {
              id: Date.now() + i,
              name: plantCapacityKw ? `Package: ${plantCapacityKw}` : 'General Supply Item',
              hsn: '85414300',
              gst: taxableAmount > 0 ? Math.round(((cgstAmount + sgstAmount) / taxableAmount) * 100) || 5 : 5,
              qty: 1,
              unit: 'NOS',
              rate: taxableAmount || grandTotal,
              buyRate: Math.round((taxableAmount || grandTotal) * 0.8),
            },
          ],
          customerSnapshot: {
            name: customerName,
            mobile: customerMobile,
            relation: '',
            address: '',
            aadhar: '',
            gstin: '',
            appNo: '',
            consumerNo: '',
            sanctionLoad: plantCapacityKw || '',
          },
          createdAt: new Date().toISOString(),
        });
      }

      if (importedRecords.length === 0) {
        setBackupNotice({ type: 'error', text: 'Could not extract valid invoice rows from the uploaded CSV.' });
        if (csvHistoryFileInputRef.current) csvHistoryFileInputRef.current.value = '';
        return;
      }

      if (onImportInvoicesHistory) {
        onImportInvoicesHistory(importedRecords);
      } else {
        // Fallback direct storage update
        const existing = [...invoicesHistory];
        const existingNos = new Set(existing.map((h) => h.invNo));
        const filteredNew = importedRecords.filter((rec) => !existingNos.has(rec.invNo));
        const combined = [...filteredNew, ...existing];
        localStorage.setItem('nb_invoices_history', JSON.stringify(combined));
      }

      setBackupNotice({
        type: 'success',
        text: `✅ Successfully imported ${importedRecords.length} invoices from CSV into History!`,
      });
    } catch (err: any) {
      setBackupNotice({ type: 'error', text: `Failed to import CSV: ${err.message}` });
    }

    if (csvHistoryFileInputRef.current) csvHistoryFileInputRef.current.value = '';
  };

  // Full JSON System Backup & Restore
  const handleExportFullJsonBackup = () => {
    try {
      backupService.exportFullBackup();
      setBackupNotice({
        type: 'success',
        text: 'Full system backup JSON file downloaded! Keeps all Invoices, Customers & Multi-Firms safe.',
      });
    } catch (err: any) {
      setBackupNotice({ type: 'error', text: `Export failed: ${err.message}` });
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring will import all invoices, customers, and firms from this backup. Continue?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const res = await backupService.restoreBackupFromFile(file);
    if (res.success) {
      setBackupNotice({ type: 'success', text: res.message });
      if (onDataRestored) onDataRestored();
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setBackupNotice({ type: 'error', text: res.message });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col rounded-3xl border border-purple-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden font-sans">
        {/* Hidden File Input for JSON Backup Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportJsonFile}
          className="hidden"
        />

        {/* Hidden File Input for CSV Invoices Bulk Import */}
        <input
          ref={csvHistoryFileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportHistoryCSV}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Customer Database CRM &amp; Global Invoice History
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/30">
                  Business Plan
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Filter by date range, search by customer name, export filtered records or take full JSON backup.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {backupNotice && (
          <div
            className={`flex items-center justify-between px-6 py-2 text-xs font-semibold ${
              backupNotice.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-950/80 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {backupNotice.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{backupNotice.text}</span>
            </div>
            <button onClick={() => setBackupNotice(null)} className="text-slate-400 hover:text-white ml-4">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/70 px-6 py-3">
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                activeTab === 'crm' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Customer Directory ({customerList.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition ${
                activeTab === 'history' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Invoice History ({invoicesHistory.length})
            </button>
          </div>

          {/* Quick Actions (JSON Backup & Restore) */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExportFullJsonBackup}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition shadow-sm"
              title="Download 100% full application data (invoices, customers, firms) as JSON backup"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
              title="Upload previously saved JSON backup to restore all data"
            >
              <Upload className="h-3.5 w-3.5 text-amber-400" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: CRM CUSTOMER DIRECTORY */}
          {activeTab === 'crm' && (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, address, app no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCustomersCSV}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                    title="Export customer list to CSV"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
                  </button>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> + New Customer
                  </button>
                </div>
              </div>

              {/* Add New Customer Form Popup */}
              {showAddForm && (
                <form onSubmit={handleCreateCustomer} className="rounded-2xl border border-purple-500/40 bg-slate-950 p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> Add New Customer to CRM
                    </h4>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Customer / Client Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Chandra Sharma"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">S/O or W/O</label>
                      <input
                        type="text"
                        placeholder="S/O Mohan Lal Sharma"
                        value={newRelation}
                        onChange={(e) => setNewRelation(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Mobile Phone</label>
                      <input
                        type="text"
                        placeholder="98290-XXXXX"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">Installation / Billing Address</label>
                      <input
                        type="text"
                        placeholder="Plot No. 4, Street 1, Sri Ganganagar..."
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Aadhaar No. (Optional)</label>
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX"
                        value={newAadhar}
                        onChange={(e) => setNewAadhar(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="rounded bg-purple-600 px-4 py-1 text-xs font-bold text-white hover:bg-purple-500">
                      Save Customer
                    </button>
                  </div>
                </form>
              )}

              {/* Customer Directory Table */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                      <th className="py-2.5 px-3">Client / Customer Name</th>
                      <th className="py-2.5 px-3">Mobile Phone</th>
                      <th className="py-2.5 px-3">App / Reference No</th>
                      <th className="py-2.5 px-2">Consumer / CA No</th>
                      <th className="py-2.5 px-2">Load</th>
                      <th className="py-2.5 px-3">Address</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customerList
                      .filter((c) => {
                        if (!searchTerm) return true;
                        const s = searchTerm.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(s) ||
                          (c.mobile && c.mobile.includes(s)) ||
                          (c.appNo && c.appNo.toLowerCase().includes(s)) ||
                          (c.consumerNo && c.consumerNo.includes(s))
                        );
                      })
                      .map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white">{c.name}</div>
                            {c.relation && <div className="text-[10px] text-slate-400">{c.relation}</div>}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-300">{c.mobile || '—'}</div>
                            {c.mobile && (
                              <button
                                onClick={() => handleWhatsAppChat(c)}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Share2 className="h-2.5 w-2.5" /> WhatsApp
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{c.appNo || '—'}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-300">{c.consumerNo || '—'}</td>
                          <td className="py-2.5 px-2 font-bold text-emerald-400">{c.sanctionLoad || '—'}</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate" title={c.address}>
                            {c.address || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  onSelectCustomer(c);
                                  onClose();
                                }}
                                className="rounded bg-purple-600/30 border border-purple-500/50 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-600 hover:text-white transition flex items-center gap-1"
                                title="Load details into active document"
                              >
                                Load Bill <ArrowUpRight className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.name)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete from CRM"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {customerList.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No customers saved in CRM yet. Click "+ New Customer" to add your first client!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INVOICE HISTORY WITH ADVANCED GLOBAL SEARCH & DATE RANGE FILTERING */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Filter Controls Bar */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Customer / Global Search */}
                  <div className="sm:col-span-5 relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Global search: Customer Name, Phone, Doc No, Firm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  {/* Document Type Dropdown */}
                  <div className="sm:col-span-3">
                    <select
                      value={historyDocType}
                      onChange={(e) => setHistoryDocType(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-purple-400 focus:outline-none font-medium"
                    >
                      <option value="ALL">All Documents (Tax Invoices &amp; Estimates)</option>
                      <option value="invoice">Tax Invoices Only</option>
                      <option value="quotation_estimate">Estimates &amp; Quotations</option>
                      <option value="receipt">Margin Money Receipts</option>
                      <option value="wcc">WCC Reports</option>
                    </select>
                  </div>

                  {/* Date Range: Start Date & End Date */}
                  <div className="sm:col-span-4 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">From:</span>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="bg-transparent text-xs text-white focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">To:</span>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="bg-transparent text-xs text-white focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Filter Presets & Summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-purple-400" /> Presets:
                    </span>
                    <button
                      onClick={() => handleSetPreset('all')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        !historyStartDate && !historyEndDate
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => handleSetPreset('today')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white text-[11px] font-medium"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleSetPreset('month')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white text-[11px] font-medium"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => handleSetPreset('last30')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white text-[11px] font-medium"
                    >
                      Last 30 Days
                    </button>
                    {(historyStartDate || historyEndDate || searchTerm || historyDocType !== 'ALL') && (
                      <button
                        onClick={() => handleSetPreset('all')}
                        className="px-2 py-0.5 rounded text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 ml-2"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset Filters
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadInvoiceSampleCsv}
                      className="flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition"
                      title="Download sample CSV template for bulk invoices import"
                    >
                      <Download className="h-3.5 w-3.5 text-cyan-400" /> Sample CSV
                    </button>
                    <button
                      onClick={() => csvHistoryFileInputRef.current?.click()}
                      className="flex items-center gap-1 rounded bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/50 px-2.5 py-1 text-[11px] font-bold text-purple-200 transition"
                      title="Upload CSV to import multiple invoices into History"
                    >
                      <Upload className="h-3.5 w-3.5 text-purple-400" /> Import Invoices CSV
                    </button>
                    <button
                      onClick={handleExportFilteredHistoryCSV}
                      disabled={filteredHistory.length === 0}
                      className="flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-300 disabled:opacity-40 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export Filtered ({filteredHistory.length}) to CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Filtered Records</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {filteredHistory.length} <span className="text-xs font-normal text-slate-400">/ {invoicesHistory.length}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Total Filtered Value</div>
                  <div className="text-lg font-black text-emerald-300 mt-0.5">
                    ₹ {formatIntegerINR(totalFilteredSum)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Active Date Filter</div>
                  <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                    {historyStartDate || historyEndDate
                      ? `${historyStartDate || 'Start'} to ${historyEndDate || 'Now'}`
                      : 'All Dates (Full Timeline)'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Search Query</div>
                  <div className="text-xs font-bold text-amber-300 mt-1 truncate">
                    {searchTerm ? `"${searchTerm}"` : 'All Customers'}
                  </div>
                </div>
              </div>

              {/* Invoices History Table */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                      <th className="py-2.5 px-3">Doc No</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-2">Capacity / Spec</th>
                      <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{item.invNo}</td>
                        <td className="py-2.5 px-2 text-slate-300">{item.date}</td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] uppercase font-black ${
                              item.docType === 'invoice'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : item.docType === 'receipt'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {item.docType === 'estimate' ? 'Estimate' : item.docType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{item.customerName}</div>
                          {item.customerMobile && (
                            <div className="text-[10px] text-slate-400">{item.customerMobile}</div>
                          )}
                          <div className="text-[10px] text-slate-500 italic">{item.firmName}</div>
                        </td>
                        <td className="py-2.5 px-2 text-emerald-400 font-bold">{item.plantCapacityKw || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-white text-sm">
                          ₹ {formatIntegerINR(item.grandTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onLoadInvoiceRecord(item);
                                onClose();
                              }}
                              className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
                              title="Re-open this invoice into editor"
                            >
                              Re-Open Bill
                            </button>
                            <button
                              onClick={() => onDeleteHistoryRecord(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete record from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredHistory.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    {invoicesHistory.length === 0
                      ? 'No invoices saved to history yet. Whenever you print or download an invoice, it will appear here!'
                      : 'No invoices match your selected filters (Customer name or Date range). Try clicking "Reset Filters".'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
