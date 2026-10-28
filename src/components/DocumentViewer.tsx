import React from 'react';
import {
  DocType,
  InvoiceItem,
  CustomerInfo,
  FirmInfo,
  BankInfo,
  TermsInfo,
  InvoiceMeta,
  WccDetails,
  QuotationDetails,
  MarginReceiptDetails,
  EstimateSpecRow,
  EstimatePriceRow,
  StockItem,
  TradeKey,
} from '../types/solar';
import { formatINR, formatIntegerINR, numberToWordsRupees } from '../services/licenseService';
import { maskAadhaar } from '../utils/privacy';
import { t, Language } from '../utils/i18n';
import { CountryCode, getCountryConfig } from '../config/countries';
import { TRADE_CONFIGS } from '../config/trades';
import { Trash2, Plus, Sun, ShieldCheck, ChevronUp, ChevronDown, GripVertical, CheckCircle2, Receipt, Search } from 'lucide-react';

interface DocumentViewerProps {
  docType: DocType;
  templateStyle: 1 | 2 | 3; // 1: Clean, 2: Blue, 3: Dark
  showBuyRates: boolean;
  currency: string;
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  customer: CustomerInfo;
  onCustomerChange: (c: CustomerInfo) => void;
  firm: FirmInfo;
  bank: BankInfo;
  terms: TermsInfo;
  meta: InvoiceMeta;
  onMetaChange: (m: InvoiceMeta) => void;
  wcc: WccDetails;
  onWccChange: (w: WccDetails) => void;
  quotation: QuotationDetails;
  onQuotationChange: (q: QuotationDetails) => void;
  marginReceipt?: MarginReceiptDetails;
  onMarginReceiptChange?: (m: MarginReceiptDetails) => void;
  stockLibrary: StockItem[];
  accentColor?: string;
  watermarkText?: string;
  trade?: TradeKey;
  lang?: Language;
  country?: CountryCode;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  docType,
  templateStyle,
  showBuyRates,
  currency,
  items,
  onItemsChange,
  customer,
  onCustomerChange,
  firm,
  bank,
  terms,
  meta,
  onMetaChange,
  wcc,
  onWccChange,
  quotation,
  onQuotationChange,
  marginReceipt,
  onMarginReceiptChange,
  stockLibrary,
  accentColor,
  watermarkText,
  trade = 'solar',
  lang = 'en',
  country = 'IN',
}) => {
  // Country & Tax Rules
  const countryConfig = getCountryConfig(country || currency);
  const showCgstSgst = countryConfig.showCgstSgst;

  // Autocomplete suggestion state
  const [activeSuggestId, setActiveSuggestId] = React.useState<number | null>(null);

  // Estimate Specification rows (editable, add/delete rows as requested)
  const [estimateSpecs, setEstimateSpecs] = React.useState<EstimateSpecRow[]>([
    { id: 's1', description: `PV Modules (DCR) - ${wcc.plantCapacityKw || '3 kW'}`, make: wcc.panelMake || 'Waaree', warranty: '12Yr Product | 25Yr Perf.' },
    { id: 's2', description: `Inverter (${wcc.plantCapacityKw || '5 kW'})`, make: wcc.inverterMake || 'Polycab / Deye', warranty: '8 Years' },
    { id: 's3', description: 'Mech. Structures & Accessories', make: 'GI Hot Dip Galvanized', warranty: '5 Years' },
    { id: 's4', description: 'ACDB / DCDB Box', make: 'Standard Make', warranty: '5 Years' },
    { id: 's5', description: 'Cables DC & AC + accessories', make: 'Polycab / As per Avail.', warranty: '5 Years' },
    { id: 's6', description: 'Earthing & Lightning Arrester', make: 'Standard Make', warranty: 'As per IS Std.' },
  ]);

  // Estimate Price rows (editable, add/delete rows as requested)
  const initialEstimateTotal = 200000;
  const initialLine1 = Math.round(initialEstimateTotal * 0.67);
  const initialLine2 = initialEstimateTotal - initialLine1;

  const [estimatePrices, setEstimatePrices] = React.useState<EstimatePriceRow[]>([
    {
      id: 'p1',
      sn: 1,
      description: `Design, Engineering, Supply, Construction, Packing & Forwarding, Transportation, Installation and Commissioning of ${wcc.plantCapacityKw || '3 kW'} (DCR) Solar Power Generating System with ${wcc.panelMake || 'Waaree'} Panels and ${wcc.inverterMake || 'Polycab / Deye'} ${wcc.plantCapacityKw || '5 kW'} Inverter`,
      taxableAmount: Math.round((initialLine1 / 1.05) * 100) / 100,
      gstRate: 5,
      totalAmount: initialLine1,
    },
    {
      id: 'p2',
      sn: 2,
      description: 'Balance of System - ACDB/DCDB, Mounting Structure, DC/AC Cables, Earthing & Lightning Arrester, Installation Accessories',
      taxableAmount: Math.round((initialLine2 / 1.18) * 100) / 100,
      gstRate: 18,
      totalAmount: initialLine2,
    },
  ]);

  const handleAddSpecRow = () => {
    setEstimateSpecs((prev) => [
      ...prev,
      { id: String(Date.now()), description: 'New Component / Service', make: 'Standard Make', warranty: '1 Year' },
    ]);
  };

  const handleUpdateSpecRow = (id: string, field: keyof EstimateSpecRow, val: string) => {
    setEstimateSpecs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeleteSpecRow = (id: string) => {
    setEstimateSpecs((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddPriceRow = () => {
    setEstimatePrices((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sn: prev.length + 1,
        description: 'Additional System Specification / Civil Works',
        taxableAmount: 10000,
        gstRate: 18,
        totalAmount: 11800,
      },
    ]);
  };

  const handleUpdatePriceRow = (id: string, field: keyof EstimatePriceRow, val: any) => {
    setEstimatePrices((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === 'taxableAmount' || field === 'gstRate') {
          const tax = Number(field === 'taxableAmount' ? val : updated.taxableAmount) || 0;
          const rate = Number(field === 'gstRate' ? val : updated.gstRate) || 0;
          updated.totalAmount = Math.round((tax * (1 + rate / 100)) * 100) / 100;
        } else if (field === 'totalAmount') {
          const tot = Number(val) || 0;
          const rate = Number(updated.gstRate) || 0;
          updated.taxableAmount = Math.round((tot / (1 + rate / 100)) * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleDeletePriceRow = (id: string) => {
    setEstimatePrices((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.map((r, i) => ({ ...r, sn: i + 1 }));
    });
  };

  // Calculations
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalSingleTax = 0;

  const calculatedItems = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const taxRate = Number(it.gst) || 0;
    const lineTotal = qty * rate;

    let cgst = 0;
    let sgst = 0;
    let totalTax = 0;

    if (showCgstSgst) {
      cgst = (lineTotal * (taxRate / 2)) / 100;
      sgst = (lineTotal * (taxRate / 2)) / 100;
      totalTax = cgst + sgst;
    } else {
      totalTax = (lineTotal * taxRate) / 100;
    }

    const totalWithTax = lineTotal + totalTax;

    totalTaxable += lineTotal;
    totalCgst += cgst;
    totalSgst += sgst;
    totalSingleTax += totalTax;

    return {
      ...it,
      lineTotal,
      cgst,
      sgst,
      totalTax,
      totalWithTax,
    };
  });

  const rawGrandTotal = totalTaxable + (showCgstSgst ? totalCgst + totalSgst : totalSingleTax);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;

  // Tax Slab Breakdown
  const taxBuckets: { [rate: number]: { taxable: number; cgst: number; sgst: number; totalTax: number } } = {};
  calculatedItems.forEach((it) => {
    const r = it.gst || 0;
    if (!taxBuckets[r]) taxBuckets[r] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
    taxBuckets[r].taxable += it.lineTotal;
    taxBuckets[r].cgst += it.cgst;
    taxBuckets[r].sgst += it.sgst;
    taxBuckets[r].totalTax += (it as any).totalTax || 0;
  });

  // Handlers for Items
  const handleItemChange = (id: number, field: keyof InvoiceItem, val: any) => {
    const updated = items.map((it) => {
      if (it.id !== id) return it;
      const copy: any = { ...it, [field]: val };
      // Auto-fill HSN and GST if item name matches stock
      if (field === 'name') {
        const found = stockLibrary.find((s) => s.name === val);
        if (found) {
          copy.hsn = found.hsn;
          copy.gst = found.gst;
          if (found.defaultBuy && !copy.buyRate) {
            copy.buyRate = found.defaultBuy;
          }
        }
      }
      return copy;
    });
    onItemsChange(updated);
  };

  const handleSelectStockSuggestion = (id: number, s: StockItem) => {
    const updated = items.map((it) => {
      if (it.id !== id) return it;
      const buyRate = s.defaultBuy || it.buyRate || 0;
      const rate = it.rate && it.rate > 0 ? it.rate : (buyRate > 0 ? Math.round(buyRate * 1.25) : 1000);
      return {
        ...it,
        name: s.name,
        hsn: s.hsn,
        gst: s.gst,
        buyRate: buyRate || it.buyRate,
        rate: rate,
      };
    });
    onItemsChange(updated);
    setActiveSuggestId(null);
  };

  const handleAddItemRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      name: '',
      hsn: '85414300',
      gst: 18,
      qty: 1,
      unit: 'NOS',
      buyRate: 1000,
      rate: 1300,
      serialNumbers: '',
    };
    onItemsChange([...items, newItem]);
  };

  const handleDeleteItemRow = (id: number) => {
    onItemsChange(items.filter((it) => it.id !== id));
  };

  // Reorder Item Controls (Move Up, Move Down, Drag & Drop)
  const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null);

  const handleMoveItemUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    onItemsChange(newItems);
  };

  const handleMoveItemDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    onItemsChange(newItems);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIdx === null || draggedIdx === targetIndex) return;
    const newItems = [...items];
    const [moved] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIndex, 0, moved);
    setDraggedIdx(null);
    onItemsChange(newItems);
  };

  // Firm Header Component
  // Firm Header Component
  const renderFirmHeader = (theme: 1 | 2 | 3) => {
    const nameColor =
      theme === 1 ? 'text-slate-900' : theme === 2 ? 'text-white' : 'text-amber-400';
    const subColor =
      theme === 1 ? 'text-slate-600' : theme === 2 ? 'text-blue-100' : 'text-slate-300';

    const tradeCfg = TRADE_CONFIGS[trade] || TRADE_CONFIGS.general_trading;

    // Dynamic document title based on trade & country
    const docTitle =
      docType === 'invoice'
        ? (showCgstSgst ? 'TAX INVOICE' : `${countryConfig.taxName.toUpperCase()} INVOICE`)
        : docType === 'quotation'
        ? (trade === 'solar' ? 'SOLAR QUOTATION' : `QUOTATION — ${tradeCfg.shortName.toUpperCase()}`)
        : docType === 'wcc'
        ? 'WORK COMPLETION'
        : docType === 'estimate'
        ? 'BANK LOAN ESTIMATE'
        : 'PAYMENT RECEIPT';

    const defaultTagline =
      trade === 'solar'
        ? 'Solar Energy Solutions | PM Surya Ghar Empanelled Vendor'
        : `${tradeCfg.title} | Commercial & Retail Invoicing`;

    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {firm.logo ? (
            <img
              src={firm.logo}
              alt="Logo"
              className="h-16 w-28 object-contain rounded bg-white/10 p-1"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Sun className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className={`text-xl font-black tracking-tight ${nameColor} leading-tight`}>
              {firm.name}
            </h1>
            <p className={`text-[10px] font-semibold ${subColor} mt-0.5`}>
              {firm.tagline || defaultTagline}
            </p>
            <p className={`text-[10px] ${subColor} leading-relaxed`}>{firm.address}</p>
            <p className={`text-[10px] ${subColor}`}>
              <b>Tel:</b> {firm.mobile} | <b>{countryConfig.taxIdLabel}:</b> {firm.gstin || 'N/A'}{' '}
              {firm.pan ? `| PAN: ${firm.pan}` : ''}
              {firm.email ? ` | ${firm.email}` : ''}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`inline-block rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
              theme === 1
                ? 'bg-slate-900 text-amber-400'
                : theme === 2
                ? 'bg-white/20 text-white border border-white/30 backdrop-blur'
                : 'bg-amber-400 text-slate-950'
            }`}
          >
            {docTitle}
          </div>
          <div className={`mt-1 text-[10px] font-semibold ${subColor}`}>
            {meta.copyType || 'Original for Recipient'}
          </div>
        </div>
      </div>
    );
  };

  // Watermark Render
  const renderWatermark = () => {
    if (!watermarkText) return null;
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07] select-none z-0 overflow-hidden">
        <span className="text-6xl sm:text-8xl font-black uppercase tracking-widest rotate-[-30deg] text-slate-950 border-4 border-slate-950 px-8 py-3 rounded-3xl">
          {watermarkText}
        </span>
      </div>
    );
  };

  // Meta Information Bar
  const renderMetaRow = (bgClass: string, textClass: string) => {
    return (
      <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg ${bgClass} px-3 py-2 text-[10px] ${textClass}`}>
        <div>
          <b>Doc No:</b>{' '}
          <input
            type="text"
            value={meta.invNo}
            onChange={(e) => onMetaChange({ ...meta, invNo: e.target.value })}
            placeholder="INV/26-27/001"
            className="border-b border-dashed border-current bg-transparent font-bold focus:outline-none"
          />
        </div>
        <div>
          <b>Date:</b>{' '}
          <input
            type="date"
            value={meta.date}
            onChange={(e) => onMetaChange({ ...meta, date: e.target.value })}
            className="border-b border-dashed border-current bg-transparent font-bold focus:outline-none"
          />
        </div>
        <div>
          <b>E-Way / Ref:</b>{' '}
          <input
            type="text"
            value={meta.eway}
            onChange={(e) => onMetaChange({ ...meta, eway: e.target.value })}
            placeholder="Optional"
            className="border-b border-dashed border-current bg-transparent focus:outline-none w-24"
          />
        </div>
        <div>
          <b>Place of Supply:</b> {meta.placeOfSupply || 'State / Region (00)'}
        </div>
        <div>
          <b>Tax Applicable:</b> {countryConfig.taxLabel}
        </div>
      </div>
    );
  };

  // Customer Billed / Shipped Box
  const renderCustomerBoxes = (borderClass: string, headerClass: string) => {
    const isSolar = trade === 'solar';
    const tradeCfg = TRADE_CONFIGS[trade] || TRADE_CONFIGS.general_trading;
    const customFields = tradeCfg.tradeSpecificFields?.customerFields || [];

    return (
      <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
        <div className={`rounded-lg border ${borderClass} p-2.5`}>
          <div className={`font-bold uppercase tracking-wider mb-1 ${headerClass}`}>
            Billed To ({isSolar ? 'Site Owner' : 'Customer / Client'})
          </div>
          <div className="space-y-0.5 leading-relaxed">
            <div className="font-bold text-xs">{customer.name || '—'}</div>
            {customer.relation && <div>{customer.relation}</div>}
            <div className="whitespace-pre-line">{customer.address || '—'}</div>
            {customer.mobile && <div><b>Mobile:</b> {customer.mobile}</div>}
            {isSolar && customer.aadhar && <div><b>Aadhaar:</b> {maskAadhaar(customer.aadhar)}</div>}
            
            {/* Solar Specific fields strictly only shown in Solar EPC mode */}
            {isSolar && (
              <>
                {customer.appNo && (
                  <div className="text-amber-600 font-semibold">
                    <b>PM Surya Ghar App No:</b> {customer.appNo}
                  </div>
                )}
                {customer.consumerNo && (
                  <div>
                    <b>K-No / Electricity CA:</b> {customer.consumerNo}
                  </div>
                )}
              </>
            )}

            {/* Non-Solar trade specific custom fields */}
            {!isSolar && (
              <>
                {customer.appNo && customFields[0] && (
                  <div>
                    <b>{customFields[0].label}:</b> {customer.appNo}
                  </div>
                )}
                {customer.consumerNo && customFields[1] && (
                  <div>
                    <b>{customFields[1].label}:</b> {customer.consumerNo}
                  </div>
                )}
              </>
            )}

            {customer.gstin && (
              <div>
                <b>{countryConfig.taxIdLabel}:</b> {customer.gstin}
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-lg border ${borderClass} p-2.5`}>
          <div className={`font-bold uppercase tracking-wider mb-1 ${headerClass}`}>
            Shipped To ({isSolar ? 'Installation Site' : 'Delivery Destination'})
          </div>
          <div className="space-y-0.5 leading-relaxed">
            <div className="font-bold text-xs">{customer.name || '—'}</div>
            <div className="whitespace-pre-line">{customer.address || 'Same as Billing Address'}</div>
            
            {/* Solar Specific load */}
            {isSolar && (
              <>
                {customer.sanctionLoad && <div><b>Sanctioned Load:</b> {customer.sanctionLoad}</div>}
                <div className="text-slate-500 italic mt-1">Solar Rooftop On-Grid Net-Metered Site</div>
              </>
            )}

            {/* Non-solar delivery */}
            {!isSolar && (
              <>
                {customer.sanctionLoad && customFields[2] && (
                  <div>
                    <b>{customFields[2].label}:</b> {customer.sanctionLoad}
                  </div>
                )}
                <div className="text-slate-500 italic mt-1">Direct Counter / Destination Delivery</div>
              </>
            )}

            {customer.mobile && <div><b>Contact:</b> {customer.mobile}</div>}
          </div>
        </div>
      </div>
    );
  };

  // Main Items Table
  const renderItemsTable = (thClass: string, totalRowClass: string) => {
    // Quotations NEVER expose cost/buying rates under any circumstances
    const allowBuyRates = showBuyRates && docType !== 'quotation';
    const availableStocks = stockLibrary && stockLibrary.length > 0 ? stockLibrary : (TRADE_CONFIGS[trade]?.defaultStocks || []);

    return (
      <div className="mt-3 overflow-x-auto">
        {/* Datalist for fast item stock selection */}
        <datalist id="stock-datalist">
          {availableStocks.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>

        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className={thClass}>
              <th className="py-2 px-1 text-center w-12 print:w-6">#</th>
              <th className="py-2 px-2 text-left">Description of Goods / Services</th>
              <th className="py-2 px-1.5 text-center w-16">{countryConfig.itemCodeLabel}</th>
              <th className="py-2 px-1 text-center w-12">{countryConfig.taxLabel}</th>
              <th className="py-2 px-1 text-center w-12">Qty</th>
              <th className="py-2 px-1 text-center w-12">Unit</th>
              {allowBuyRates && (
                <th className="py-2 px-1 text-right w-16 bg-amber-900/20 text-amber-300">
                  Buy Rate
                </th>
              )}
              <th className="py-2 px-1.5 text-right w-18">Rate ({currency})</th>
              {showCgstSgst ? (
                <>
                  <th className="py-2 px-1.5 text-right w-16">CGST</th>
                  <th className="py-2 px-1.5 text-right w-16">SGST</th>
                </>
              ) : (
                <th className="py-2 px-1.5 text-right w-18">{countryConfig.taxName} ({currency})</th>
              )}
              <th className="py-2 px-2 text-right w-20">Total ({currency})</th>
              <th className="py-2 px-1 w-6 print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {calculatedItems.map((it, idx) => (
              <tr
                key={it.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`hover:bg-slate-50/50 transition-colors ${
                  draggedIdx === idx ? 'opacity-40 bg-amber-50 border-y-2 border-dashed border-amber-400' : ''
                }`}
              >
                <td className="py-2 px-1 text-center text-slate-400 font-medium align-middle">
                  {/* Clean number on Print / PDF */}
                  <span className="hidden print:inline">{idx + 1}</span>

                  {/* Interactive Drag & Up/Down Controls in Editor */}
                  <div className="flex items-center justify-center gap-0.5 print:hidden">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      title="Drag to reorder"
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-700 text-[11px] w-3 text-center">{idx + 1}</span>
                    <div className="flex flex-col -space-y-1 ml-0.5">
                      <button
                        type="button"
                        title="Move Up"
                        disabled={idx === 0}
                        onClick={() => handleMoveItemUp(idx)}
                        className="p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        title="Move Down"
                        disabled={idx === calculatedItems.length - 1}
                        onClick={() => handleMoveItemDown(idx)}
                        className="p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2 text-left">
                  {/* Editor Mode with Interactive Catalog Autocomplete */}
                  <div className="print:hidden space-y-1">
                    <div className="relative">
                      <textarea
                        rows={Math.max(1, Math.min(4, Math.ceil((it.name?.length || 0) / 30)))}
                        value={it.name}
                        placeholder="Enter item description or type to search catalog..."
                        onFocus={() => setActiveSuggestId(it.id)}
                        onBlur={() => setTimeout(() => setActiveSuggestId(null), 250)}
                        onChange={(e) => {
                          handleItemChange(it.id, 'name', e.target.value);
                          setActiveSuggestId(it.id);
                        }}
                        className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none resize-none leading-snug text-xs py-0.5"
                      />
                      {activeSuggestId === it.id && (
                        <div className="absolute left-0 top-full z-50 mt-0.5 w-80 max-h-56 overflow-y-auto rounded-xl border border-amber-500/40 bg-slate-950 p-1.5 shadow-2xl text-left">
                          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 flex justify-between items-center">
                            <span>📦 {TRADE_CONFIGS[trade]?.shortName || 'Catalog'} Stock Suggestions</span>
                            <span className="text-slate-500 text-[8px]">1-click auto fill</span>
                          </div>
                          {(it.name && it.name.trim()
                            ? availableStocks.filter((s) => s.name.toLowerCase().includes(it.name.toLowerCase()))
                            : availableStocks
                          )
                            .slice(0, 7)
                            .map((s) => (
                              <button
                                key={s.name}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectStockSuggestion(it.id, s);
                                }}
                                className="w-full text-left rounded-lg p-2 text-[10px] hover:bg-amber-500/20 text-slate-200 hover:text-white transition group border border-transparent hover:border-amber-500/30 my-0.5"
                              >
                                <div className="font-bold text-amber-300 group-hover:text-amber-200 leading-snug">{s.name}</div>
                                <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5">
                                  <span>{countryConfig.itemCodeLabel}: <b className="text-slate-300">{s.hsn}</b></span>
                                  <span>{countryConfig.taxLabel}: <b className="text-slate-300">{s.gst}%</b></span>
                                  {s.defaultBuy ? (
                                    <span>Cost: <b className="text-emerald-400">{currency}{s.defaultBuy}</b></span>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      rows={Math.max(1, Math.min(5, Math.ceil((it.serialNumbers?.length || 0) / 40)))}
                      value={it.serialNumbers || ''}
                      placeholder="Serial no. / Make / Extra notes (auto expands)..."
                      onChange={(e) => handleItemChange(it.id, 'serialNumbers', e.target.value)}
                      className="w-full bg-slate-50/80 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-mono focus:border-amber-500 focus:bg-white focus:outline-none resize-y min-h-[24px] leading-relaxed"
                    />
                  </div>

                  {/* Clean Print Mode - Full Text Wrapping, No Truncation */}
                  <div className="hidden print:block">
                    <div className="font-bold text-slate-900 leading-snug whitespace-pre-wrap break-words text-[11px]">
                      {it.name || '—'}
                    </div>
                    {it.serialNumbers && (
                      <div className="text-[9.5px] text-slate-700 font-mono mt-1 whitespace-pre-wrap break-words leading-relaxed border-l-2 border-slate-300 pl-1.5">
                        {it.serialNumbers}
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-2 px-1.5 text-center">
                  <div className="print:hidden">
                    <input
                      type="text"
                      value={it.hsn}
                      onChange={(e) => handleItemChange(it.id, 'hsn', e.target.value)}
                      className="w-full text-center bg-transparent focus:outline-none font-mono"
                    />
                  </div>
                  <span className="hidden print:inline font-mono">{it.hsn}</span>
                </td>

                <td className="py-2 px-1 text-center">
                  {/* Editor Mode Select */}
                  <div className="print:hidden">
                    <select
                      value={it.gst}
                      onChange={(e) => handleItemChange(it.id, 'gst', Number(e.target.value))}
                      className="bg-transparent text-center font-bold focus:outline-none cursor-pointer"
                    >
                      {countryConfig.availableRates.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Print Mode - Clean text without dropdown arrow */}
                  <span className="hidden print:inline font-bold">{it.gst}%</span>
                </td>

                <td className="py-2 px-1 text-center">
                  <div className="print:hidden">
                    <input
                      type="number"
                      value={it.qty || ''}
                      onChange={(e) => handleItemChange(it.id, 'qty', Number(e.target.value))}
                      className="w-full text-center bg-transparent font-bold focus:outline-none"
                    />
                  </div>
                  <span className="hidden print:inline font-bold">{it.qty}</span>
                </td>

                <td className="py-2 px-1 text-center">
                  {/* Editor Mode Select */}
                  <div className="print:hidden">
                    <select
                      value={it.unit}
                      onChange={(e) => handleItemChange(it.id, 'unit', e.target.value)}
                      className="bg-transparent text-center focus:outline-none cursor-pointer"
                    >
                      <option value="NOS">NOS</option>
                      <option value="Pcs.">Pcs.</option>
                      <option value="Set">Set</option>
                      <option value="Mtr.">Mtr.</option>
                      <option value="Kg.">Kg.</option>
                      <option value="Job">Job</option>
                    </select>
                  </div>
                  {/* Print Mode - Clean text without dropdown arrow */}
                  <span className="hidden print:inline">{it.unit}</span>
                </td>

                {showBuyRates && (
                  <td className="py-2 px-1 text-right bg-amber-50/50">
                    <input
                      type="number"
                      value={it.buyRate || ''}
                      onChange={(e) => handleItemChange(it.id, 'buyRate', Number(e.target.value))}
                      className="w-full text-right bg-transparent text-amber-800 font-bold focus:outline-none"
                    />
                  </td>
                )}

                <td className="py-2 px-1.5 text-right font-medium">
                  <div className="print:hidden">
                    <input
                      type="number"
                      value={it.rate || ''}
                      onChange={(e) => handleItemChange(it.id, 'rate', Number(e.target.value))}
                      className="w-full text-right bg-transparent font-bold focus:outline-none"
                    />
                  </div>
                  <span className="hidden print:inline font-medium">{formatINR(it.rate)}</span>
                </td>

                {showCgstSgst ? (
                  <>
                    <td className="py-2 px-1.5 text-right text-emerald-700 font-medium">
                      {formatINR(it.cgst)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-emerald-700 font-medium">
                      {formatINR(it.sgst)}
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-1.5 text-right text-emerald-700 font-medium">
                    {formatINR((it as any).totalTax || 0)}
                  </td>
                )}
                <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                  {formatINR(it.totalWithTax)}
                </td>
                <td className="py-2 px-1 text-center print:hidden">
                  <button
                    onClick={() => handleDeleteItemRow(it.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                    title="Delete row"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
              <td colSpan={showBuyRates ? 7 : 6} className="py-1.5 px-2 text-right">
                Taxable Subtotal:
              </td>
              <td className="py-1.5 px-1.5 text-right">{formatINR(totalTaxable)}</td>
              {showCgstSgst ? (
                <>
                  <td className="py-1.5 px-1.5 text-right text-emerald-700">{formatINR(totalCgst)}</td>
                  <td className="py-1.5 px-1.5 text-right text-emerald-700">{formatINR(totalSgst)}</td>
                </>
              ) : (
                <td className="py-1.5 px-1.5 text-right text-emerald-700">{formatINR(totalSingleTax)}</td>
              )}
              <td className="py-1.5 px-2 text-right font-extrabold">{formatINR(rawGrandTotal)}</td>
              <td className="print:hidden"></td>
            </tr>

            {roundOff !== 0 && (
              <tr className="text-[9px] text-slate-500">
                <td colSpan={showBuyRates ? 9 : 8} className="py-0.5 px-2 text-right">
                  Round Off (+/-):
                </td>
                <td colSpan={2} className="py-0.5 px-2 text-right font-mono">
                  {roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                </td>
                <td className="print:hidden"></td>
              </tr>
            )}

            <tr className={totalRowClass}>
              <td colSpan={showBuyRates ? 6 : 5} className="py-2.5 px-3 text-left font-normal text-[10px]">
                <div className="font-semibold text-slate-700">Amount in Words:</div>
                <div className="font-bold italic text-slate-900 mt-0.5">
                  {numberToWordsRupees(grandTotal)}
                </div>
              </td>
              <td colSpan={2} className="py-2.5 px-2 text-right uppercase tracking-wider text-xs">
                Grand Total ({currency}):
              </td>
              <td colSpan={3} className="py-2.5 px-3 text-right font-black text-base">
                {currency} {formatIntegerINR(grandTotal)}
              </td>
              <td className="print:hidden"></td>
            </tr>
          </tfoot>
        </table>

        {/* Add Row Button in Table */}
        <div className="mt-2 flex justify-start print:hidden">
          <button
            onClick={handleAddItemRow}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" /> + Add Row
          </button>
        </div>
      </div>
    );
  };

  // Tax Summary / Slab Breakdown Table (For Accounting & Tax Authority Compliance)
  const renderGstBreakdown = (thClass: string) => {
    const sortedEntries = Object.entries(taxBuckets).sort((a, b) => Number(a[0]) - Number(b[0]));

    const ruleNote =
      trade === 'solar'
        ? (showCgstSgst
            ? 'GST calculated under CGST & SGST Rules 2017 & CBIC Notification No. 8/2021-CT(R) for Solar EPC Composite Supply (70% goods + 30% services) or applicable statutory HSN/SAC classifications.'
            : countryConfig.taxRuleNote)
        : countryConfig.taxRuleNote;

    return (
      <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3">
        {/* Left: Tax Accounting Note */}
        <div className="flex-1 text-[9.5px] text-slate-600 bg-slate-50/80 rounded-lg p-2.5 border border-slate-200">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[9px] mb-0.5">
            {countryConfig.taxName} Accounting Summary & Compliance Note
          </div>
          <p className="leading-relaxed">{ruleNote}</p>
        </div>

        {/* Right: Structured Tax Summary Table */}
        <div className="shrink-0 overflow-x-auto">
          <table className="border-collapse text-[9px] min-w-[340px] border border-slate-300 rounded-lg overflow-hidden shadow-xs">
            <thead>
              <tr className={thClass}>
                <th
                  colSpan={showCgstSgst ? 5 : 4}
                  className="py-1 px-2.5 text-left uppercase tracking-wider font-extrabold text-[9px] border-b border-white/20"
                >
                  {countryConfig.taxSummaryTitle}
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-1 px-2 text-center">Tax Slab</th>
                <th className="py-1 px-2 text-right">Taxable ({currency})</th>
                {showCgstSgst ? (
                  <>
                    <th className="py-1 px-2 text-right">CGST</th>
                    <th className="py-1 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-1 px-2 text-right">Rate (%)</th>
                )}
                <th className="py-1 px-2 text-right">Total Tax ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedEntries.length > 0 ? (
                sortedEntries.map(([rateStr, vals]) => {
                  const rate = Number(rateStr);
                  const halfRate = (rate / 2).toFixed(1).replace('.0', '');
                  return (
                    <tr key={rateStr} className="hover:bg-slate-50">
                      <td className="py-1 px-2 text-center font-bold text-slate-900">
                        {rate}% {countryConfig.taxName}
                      </td>
                      <td className="py-1 px-2 text-right font-medium">{formatINR(vals.taxable)}</td>
                      {showCgstSgst ? (
                        <>
                          <td className="py-1 px-2 text-right text-emerald-800">
                            <span className="text-[8px] text-slate-400 mr-1">({halfRate}%)</span>
                            {formatINR(vals.cgst)}
                          </td>
                          <td className="py-1 px-2 text-right text-emerald-800">
                            <span className="text-[8px] text-slate-400 mr-1">({halfRate}%)</span>
                            {formatINR(vals.sgst)}
                          </td>
                        </>
                      ) : (
                        <td className="py-1 px-2 text-right text-slate-600 font-semibold">{rate}%</td>
                      )}
                      <td className="py-1 px-2 text-right font-bold text-slate-950">
                        {formatINR(showCgstSgst ? vals.cgst + vals.sgst : vals.totalTax)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showCgstSgst ? 5 : 4} className="py-1 px-2 text-center text-slate-400 italic">
                    No taxable items
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-black bg-slate-100 text-slate-950">
                <td className="py-1.5 px-2 text-center uppercase tracking-wide">Total</td>
                <td className="py-1.5 px-2 text-right">{formatINR(totalTaxable)}</td>
                {showCgstSgst ? (
                  <>
                    <td className="py-1.5 px-2 text-right text-emerald-800">{formatINR(totalCgst)}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-800">{formatINR(totalSgst)}</td>
                  </>
                ) : (
                  <td className="py-1.5 px-2 text-right text-slate-500">—</td>
                )}
                <td className="py-1.5 px-2 text-right font-black text-slate-950">
                  {formatINR(showCgstSgst ? totalCgst + totalSgst : totalSingleTax)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // Bank & Footer Signatures
  const renderFooter = (bankBgClass: string, sigColor: string) => {
    return (
      <div className="mt-4 pt-3 border-t border-slate-300 text-[10px]">
        {/* Bank Bar */}
        <div className={`rounded-lg ${bankBgClass} p-2 flex flex-wrap items-center justify-between gap-2`}>
          <div>
            <b>Bank Details:</b> {bank.bankName} | <b>A/C No:</b> {bank.accountNo} | <b>IFSC:</b>{' '}
            {bank.ifsc} | <b>Branch:</b> {bank.branch}
          </div>
          {bank.upiId && (
            <div className="font-semibold text-emerald-700">
              <b>UPI / QR:</b> {bank.upiId}
            </div>
          )}
        </div>

        {/* Declaration & T&C */}
        <div className="mt-2 space-y-1 text-[9px] text-slate-600">
          <div>
            <b>Declaration:</b> {terms.declaration}
          </div>
          <div>
            <b>Terms & Conditions:</b> {terms.tnc}
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 flex items-end justify-between pt-4">
          <div className="text-center">
            <div className={`w-40 border-t ${sigColor} mb-1`} />
            <div className="font-semibold text-slate-700">Customer / Receiver Signature</div>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="text-xs font-bold text-slate-900">For {firm.name}</div>
            {firm.signature ? (
              <div className="h-12 flex items-center justify-center my-1">
                <img
                  src={firm.signature}
                  alt="Authorised Signatory"
                  className="max-h-12 max-w-[160px] object-contain"
                />
              </div>
            ) : (
              <div className="h-8" />
            )}
            <div className={`w-48 border-t ${sigColor} mb-1`} />
            <div className="font-semibold text-slate-700">Authorised Signatory</div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Render: WCC (Work Completion Certificate) - Solar Exclusive
  // -------------------------------------------------------------
  if (docType === 'wcc') {
    if (trade !== 'solar') {
      return (
        <div className="mx-auto w-full max-w-2xl bg-white text-slate-900 p-8 shadow-xl rounded-xl text-center">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
            <h3 className="text-base font-bold text-amber-900">
              Document Not Applicable for {trade.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="mt-2 text-xs text-amber-700">
              Work Completion Certificate (WCC) is statutory for Solar EPC & Rooftop installations.
              Please switch to <b>Tax Invoice</b> or <b>Quotation</b> for your active trade.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl print:shadow-none print:p-0">
        {/* WCC Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {firm.name}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {firm.tagline || 'Solar Energy Solutions | PM Surya Ghar: Muft Bijli Yojana Vendor'}
          </p>
          <p className="text-xs text-slate-600">{firm.address}</p>
          <p className="text-xs text-slate-600">
            GSTIN: <b>{firm.gstin}</b> | Phone: <b>{firm.mobile}</b>
          </p>
        </div>

        {/* Title */}
        <div className="mt-6 text-center">
          <span className="inline-block border-b-2 border-slate-900 pb-1 text-base font-extrabold uppercase tracking-wider text-slate-900">
            Work Completion Certificate (WCC)
          </span>
          <p className="mt-1 text-xs text-slate-500">
            As per Ministry of New & Renewable Energy (MNRE) & PM Surya Ghar Guidelines
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-700 leading-relaxed">
          This is to solemnly certify that <b>{firm.name}</b> (GSTIN: {firm.gstin}), having its office at {firm.address}, has successfully supplied, erected, tested, and commissioned the Grid-Connected Solar Rooftop Power Plant as per the following specifications:
        </p>

        {/* Detailed Table Grid */}
        <div className="mt-6 divide-y divide-slate-200 border border-slate-300 rounded-lg text-xs">
          <div className="flex p-3 bg-slate-50">
            <div className="w-56 font-bold text-slate-700">1. EPC Vendor / Installer:</div>
            <div className="flex-1 font-semibold">{firm.name}</div>
          </div>
          <div className="flex p-3">
            <div className="w-56 font-bold text-slate-700">2. Beneficiary / Site Owner:</div>
            <div className="flex-1 font-semibold">{customer.name || '—'} {customer.relation ? `(${customer.relation})` : ''}</div>
          </div>
          <div className="flex p-3 bg-slate-50">
            <div className="w-56 font-bold text-slate-700">3. Installation Site Address:</div>
            <div className="flex-1 whitespace-pre-line">{customer.address || '—'}</div>
          </div>
          <div className="flex p-3">
            <div className="w-56 font-bold text-slate-700">4. Solar Plant Capacity:</div>
            <div className="flex-1 font-bold text-emerald-800 flex items-center gap-1">
              <input
                type="text"
                value={wcc.plantCapacityKw}
                onChange={(e) => onWccChange({ ...wcc, plantCapacityKw: e.target.value })}
                placeholder="e.g. 3.00 kW"
                className="border-b border-dashed border-current bg-transparent focus:outline-none w-32 font-bold"
              />
              <span>(On-Grid Rooftop)</span>
            </div>
          </div>
          <div className="flex p-3 bg-slate-50">
            <div className="w-56 font-bold text-slate-700">5. Solar PV Module Make & Type:</div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={wcc.panelMake}
                onChange={(e) => onWccChange({ ...wcc, panelMake: e.target.value })}
                placeholder="e.g. Waaree Bifacial DCR 550Wp"
                className="w-full border-b border-dashed border-current bg-transparent focus:outline-none font-semibold"
              />
            </div>
          </div>
          <div className="flex p-3">
            <div className="w-56 font-bold text-slate-700">6. Solar Inverter Make & Serial:</div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={wcc.inverterMake}
                onChange={(e) => onWccChange({ ...wcc, inverterMake: e.target.value })}
                placeholder="e.g. Polycab 3kW / Deye String Inverter"
                className="w-full border-b border-dashed border-current bg-transparent focus:outline-none font-semibold"
              />
            </div>
          </div>
          <div className="flex p-3 bg-slate-50">
            <div className="w-56 font-bold text-slate-700">7. Electricity Consumer K-No.:</div>
            <div className="flex-1 font-mono font-semibold">{customer.consumerNo || '—'}</div>
          </div>
          <div className="flex p-3">
            <div className="w-56 font-bold text-slate-700">8. PM Surya Ghar App No.:</div>
            <div className="flex-1 font-mono font-bold text-amber-700">{customer.appNo || '—'}</div>
          </div>
          <div className="flex p-3 bg-slate-50">
            <div className="w-56 font-bold text-slate-700">9. Aadhaar Number:</div>
            <div className="flex-1 font-mono">{maskAadhaar(customer.aadhar) || '—'}</div>
          </div>
          <div className="flex p-3">
            <div className="w-56 font-bold text-slate-700">10. Work Completion Date:</div>
            <div className="flex-1">
              <input
                type="date"
                value={wcc.completionDate}
                onChange={(e) => onWccChange({ ...wcc, completionDate: e.target.value })}
                className="border-b border-dashed border-current bg-transparent font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Declaration Notice */}
        <div className="mt-6 rounded-lg border border-slate-300 bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-700">
          <p>
            <b>Customer Undertaking:</b> I hereby confirm that the solar plant has been installed at my premises in full working condition with all necessary safety equipment including Earth Electrode, ACDB, DCDB, and Lightning Arrester. The system is ready for net-metering synchronization with DISCOM.
          </p>
        </div>

        {/* Dual Signature */}
        <div className="mt-14 flex items-end justify-between text-xs">
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-800 mb-1" />
            <div className="font-bold text-slate-800">Signature of Site Owner</div>
            <div className="text-[10px] text-slate-500">Name: {customer.name || 'Consumer'}</div>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="text-xs font-bold text-slate-900">For {firm.name}</div>
            {firm.signature ? (
              <div className="h-12 flex items-center justify-center my-1">
                <img
                  src={firm.signature}
                  alt="Authorised Signatory"
                  className="max-h-12 max-w-[160px] object-contain"
                />
              </div>
            ) : (
              <div className="h-10" />
            )}
            <div className="w-48 border-t-2 border-slate-800 mb-1" />
            <div className="font-bold text-slate-800">Authorised Signatory</div>
            <div className="text-[10px] text-slate-500">With Stamp & Date</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: Solar Quotation (Lump sum) or Commercial Quotation
  // -------------------------------------------------------------
  if (docType === 'quotation' && trade !== 'solar') {
    const isSolar = false;

    return (
      <div className="mx-auto w-full max-w-4xl bg-white text-slate-900 p-8 shadow-2xl rounded-xl print:shadow-none print:p-0">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-md">
          {renderFirmHeader(2)}
        </div>

        {renderMetaRow('bg-emerald-50 text-emerald-950', 'text-emerald-950')}
        {renderCustomerBoxes('border-emerald-200 bg-emerald-50/30', 'text-emerald-800')}

        {/* Quotation Solar ROI Banner - Only for Solar trade */}
        {isSolar && (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-emerald-700" /> PM Surya Ghar Expected Benefits & Subsidy
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                <div className="text-[10px] text-slate-500">Plant Capacity</div>
                <div className="text-sm font-bold text-emerald-800">{quotation.plantCapacityKw || '3 kW'}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                <div className="text-[10px] text-slate-500">Annual Generation</div>
                <div className="text-sm font-bold text-emerald-800">
                  ~{quotation.annualGenerationUnits || '4,300'} Units/Yr
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                <div className="text-[10px] text-slate-500">Annual Bill Savings</div>
                <div className="text-sm font-bold text-emerald-800">
                  ~{currency} {formatIntegerINR(quotation.annualSavingsRs || 34400)}
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                <div className="text-[10px] text-slate-500">Direct Central Subsidy</div>
                <div className="text-sm font-extrabold text-amber-600">
                  {currency} {formatIntegerINR(quotation.subsidyAmount || 78000)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scope of Supply Table for Solar vs Standard Itemized Table for other trades */}
        {isSolar ? (
          <div className="mt-4 overflow-x-auto">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <span>📦</span> Scope of Supply & System Specifications
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Complete All-Inclusive Supply & Commissioning</span>
            </div>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-emerald-800 text-white font-bold">
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-3">Component Description & Engineering Specifications</th>
                  <th className="py-2 px-2 text-center w-16">Qty</th>
                  <th className="py-2 px-2 text-center w-16">Unit</th>
                  <th className="py-2 px-3 text-right">Standard Warranty / Scope</th>
                  <th className="py-2 px-1 text-center w-8 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-emerald-50/40">
                    <td className="py-2 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => handleItemChange(it.id, 'name', e.target.value)}
                        placeholder="Item description & specification"
                        className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none"
                      />
                      {it.serialNumbers && (
                        <div className="text-[10px] text-slate-500 font-medium">{it.serialNumbers}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        value={it.qty || ''}
                        onChange={(e) => handleItemChange(it.id, 'qty', Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-slate-600">{it.unit || 'NOS'}</td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-800 text-[11px]">
                      {it.name.toLowerCase().includes('module') || it.name.toLowerCase().includes('panel')
                        ? '25 Yrs Performance (ALMM DCR)'
                        : it.name.toLowerCase().includes('inverter')
                        ? '5-10 Yrs Manufacturer Warranty'
                        : it.name.toLowerCase().includes('structure')
                        ? 'HDG 80 Micron (10 Yrs Warranty)'
                        : it.name.toLowerCase().includes('cable') || it.name.toLowerCase().includes('wire')
                        ? 'Complete Wiring & Connection Scope'
                        : 'Installer Workmanship & Scope'}
                    </td>
                    <td className="py-2 px-1 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteItemRow(it.id)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                        title="Delete row"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Complete Deal Package Price Summary */}
            <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 uppercase tracking-wide">
                    Commercial Proposal / Quotation ({quotation.plantCapacityKw || '3 kW'} On-Grid Rooftop)
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Price includes design, supply of ALMM solar modules, grid-tied inverter, structure, ACDB/DCDB, lightning arrester, chemical earthing, testing, DISCOM net-metering liaisoning & 5-year comprehensive maintenance.
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-emerald-900 text-white p-3 text-right min-w-[260px] shadow-sm">
                  <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                    Total System Deal Amount
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {currency} {formatIntegerINR(grandTotal)}
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-1">
                    (All-inclusive of Supply, Installation & GST)
                  </div>
                  {quotation.subsidyAmount > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-700/80 text-[11px]">
                      <div className="flex justify-between text-amber-300 font-semibold">
                        <span>Less Govt Subsidy:</span>
                        <span>- {currency} {formatIntegerINR(quotation.subsidyAmount)}</span>
                      </div>
                      <div className="flex justify-between font-black text-white mt-0.5 text-xs">
                        <span>Net Site Owner Cost:</span>
                        <span>{currency} {formatIntegerINR(Math.max(0, grandTotal - quotation.subsidyAmount))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Row Button in Table */}
            <div className="mt-2 flex justify-start print:hidden">
              <button
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" /> + Add Specification Row
              </button>
            </div>
          </div>
        ) : (
          renderItemsTable(
            'bg-emerald-800 text-white font-bold',
            'bg-emerald-100 text-emerald-950 font-extrabold border-t-2 border-emerald-600'
          )
        )}

        {renderGstBreakdown('bg-emerald-800 text-white font-bold')}
        {renderFooter('bg-emerald-50 text-emerald-950', 'border-emerald-800')}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: MARGIN MONEY & BENEFICIARY PAYMENT RECEIPT
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Render: MARGIN MONEY & BENEFICIARY PAYMENT RECEIPT
  // -------------------------------------------------------------
  if (docType === 'receipt') {
    const totalDeal = marginReceipt?.totalProjectDealAmount || grandTotal || 200000;
    const amountRcvd = marginReceipt?.amountReceived !== undefined ? marginReceipt.amountReceived : 50000;
    const bankLoan = Math.max(0, totalDeal - amountRcvd);
    const mode = marginReceipt?.paymentMode || 'CASH';
    const modeLabel = mode === 'CASH' ? 'Cash' : mode === 'UPI' ? 'UPI' : mode === 'CHEQUE' ? 'Cheque' : 'Bank Transfer';

    const defaultTowards = `Margin money (customer's own contribution) against installation of ${wcc.plantCapacityKw || '3 kW'} (DCR) Solar Power Generating System at the above address, as per Estimate Ref. No. ${marginReceipt?.receiptNo?.replace('REC', 'EST') || 'JEC-EST-012/2026'}, under PM Surya Ghar: Muft Bijli Yojana.`;
    const towardsText = marginReceipt?.towardsDescription || defaultTowards;

    const handleReceiptFieldChange = (field: keyof MarginReceiptDetails, val: any) => {
      if (!onMarginReceiptChange) return;
      const updated: MarginReceiptDetails = {
        receiptNo: marginReceipt?.receiptNo || 'JEC-MM-013/2026',
        receiptDate: marginReceipt?.receiptDate || new Date().toISOString().split('T')[0],
        customerName: customer.name,
        customerMobile: customer.mobile,
        customerAddress: customer.address,
        consumerNo: customer.consumerNo,
        appNo: customer.appNo,
        totalProjectDealAmount: totalDeal,
        expectedSubsidyAmount: marginReceipt?.expectedSubsidyAmount || 78000,
        marginMoneyDue: totalDeal - (marginReceipt?.expectedSubsidyAmount || 78000),
        amountReceived: amountRcvd,
        amountReceivedWords: numberToWordsRupees(amountRcvd),
        balanceRemaining: bankLoan,
        paymentMode: mode,
        transactionRef: marginReceipt?.transactionRef || '',
        notes: marginReceipt?.notes || '',
        towardsDescription: towardsText,
        ...marginReceipt,
        [field]: val,
      };

      if (field === 'amountReceived' || field === 'totalProjectDealAmount') {
        const r = field === 'amountReceived' ? Number(val) : updated.amountReceived;
        const tot = field === 'totalProjectDealAmount' ? Number(val) : updated.totalProjectDealAmount;
        updated.amountReceived = r;
        updated.totalProjectDealAmount = tot;
        updated.balanceRemaining = Math.max(0, tot - r);
        updated.amountReceivedWords = numberToWordsRupees(r);
      }
      onMarginReceiptChange(updated);
    };

    // Theming classes
    const isDark = templateStyle === 3;
    const isBlue = templateStyle === 2;

    const headerBg = isDark ? 'bg-slate-950 text-white' : isBlue ? 'bg-blue-950 text-white' : 'bg-[#0d1f35] text-white';
    const brandColor = isDark ? 'text-amber-400' : isBlue ? 'text-sky-400' : 'text-[#e9bc3f]';
    const stripColor = isDark ? 'bg-amber-400' : isBlue ? 'bg-sky-400' : 'bg-[#e9bc3f]';
    const titleBorder = isDark ? 'border-amber-400 text-amber-400' : isBlue ? 'border-sky-400 text-blue-900' : 'border-[#e9bc3f] text-[#0d1f35]';
    const amtHeaderBg = isDark ? 'bg-slate-900 text-amber-300' : isBlue ? 'bg-blue-900 text-white' : 'bg-[#0d1f35] text-white';
    const amtValBg = isDark ? 'bg-slate-900 text-amber-400 border-slate-700' : isBlue ? 'bg-blue-50 text-blue-950 border-blue-200' : 'bg-[#fff6dc] text-[#0d1f35] border-[#0d1f35]';
    const boxBorder = isDark ? 'border-slate-700 bg-slate-900/60 text-slate-200' : isBlue ? 'border-blue-200 bg-blue-50/30 text-slate-800' : 'border-[#0d1f35] bg-white text-slate-900';

    return (
      <div className={`relative mx-auto w-full max-w-4xl ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'} p-6 sm:p-10 shadow-2xl rounded-xl print:shadow-none print:p-0 overflow-hidden font-sans`}>
        {renderWatermark()}

        {/* Navy / Dark Header Banner */}
        <div className={`-mx-6 -mt-6 sm:-mx-10 sm:-mt-10 p-6 sm:p-8 ${headerBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10`}>
          <div>
            <div className={`text-2xl sm:text-3xl font-black ${brandColor} tracking-wide`}>
              {firm.name || 'Your Business / Firm Name'}
            </div>
            <div className="text-xs text-slate-200 mt-1 font-medium">
              {firm.tagline || 'Solar Energy Solutions | Rooftop Systems & Services'}
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed text-slate-300 sm:max-w-xs">
            <div>{firm.address || 'Business Address, City, State, PIN'}</div>
            <div>{firm.mobile ? `Mo: ${firm.mobile}` : 'Contact: +91 XXXXX-XXXXX'}{firm.gstin ? ` | GSTIN: ${firm.gstin}` : ''}</div>
          </div>
        </div>

        {/* Accent strip */}
        <div className={`-mx-6 sm:-mx-10 h-1.5 ${stripColor}`} />

        {/* Title */}
        <div className="text-center my-5 pb-2 relative z-10">
          <h2 className={`text-xl sm:text-2xl font-black tracking-wider uppercase inline-block border-b-2 pb-1 ${titleBorder}`}>
            MARGIN MONEY RECEIPT
          </h2>
          <div className="text-[10px] text-slate-500 mt-1 italic">
            Customer Contribution Acknowledgment Slip for Bank Loan & Solar Rooftop Installation
          </div>
        </div>

        {/* Receipt No and Date */}
        <div className="flex justify-between items-center text-xs font-bold my-3 px-1 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Receipt No.:</span>
            <input
              type="text"
              value={marginReceipt?.receiptNo || 'JEC-MM-013/2026'}
              onChange={(e) => handleReceiptFieldChange('receiptNo', e.target.value)}
              className="font-mono font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none w-36"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Date:</span>
            <input
              type="date"
              value={marginReceipt?.receiptDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => handleReceiptFieldChange('receiptDate', e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer Details Box */}
        <div className={`rounded-lg border p-3.5 my-3 text-xs leading-relaxed ${boxBorder} relative z-10`}>
          <div className="font-black text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
            Received From:
          </div>
          <div className="font-bold text-sm text-slate-900">
            {customer.name || 'Valued Solar Consumer'}
            {customer.relation && <span className="font-normal text-slate-600 ml-4">({customer.relation})</span>}
          </div>
          <div className="text-slate-600 mt-0.5">{customer.address || 'Consumer Site Address, Sri Ganganagar'}</div>
          <div className="flex flex-wrap gap-4 mt-1.5 text-slate-700">
            {customer.mobile && <span><b>Contact No.:</b> {customer.mobile}</span>}
            {customer.aadhar && <span><b>Aadhaar No.:</b> {maskAadhaar(customer.aadhar)}</span>}
            {customer.consumerNo && <span><b>K-No / Consumer No:</b> {customer.consumerNo}</span>}
            {customer.appNo && <span><b>App No:</b> {customer.appNo}</span>}
          </div>
        </div>

        {/* Big Prominent Amount Received Box */}
        <div className="my-4 rounded-lg overflow-hidden border border-slate-400 relative z-10">
          <div className={`text-center py-2 font-bold text-xs uppercase tracking-wider ${amtHeaderBg}`}>
            Amount Received (Margin Money)
          </div>
          <div className={`text-center py-4 px-3 ${amtValBg} flex flex-col items-center justify-center`}>
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              {currency} {formatIntegerINR(amountRcvd)}/-
            </div>
            <div className="print:hidden mt-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Edit Received Amount:</span>
              <input
                type="number"
                value={amountRcvd}
                onChange={(e) => handleReceiptFieldChange('amountReceived', Number(e.target.value))}
                className="w-36 text-center text-sm font-black bg-white border border-slate-400 rounded px-2 py-0.5 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Amount in words */}
        <div className="text-xs font-bold text-slate-800 my-2 px-1 relative z-10">
          <b>In Words:</b> <span className="capitalize">{numberToWordsRupees(amountRcvd)} Only</span>
        </div>

        {/* Towards & Cost Breakdown Box */}
        <div className="rounded-lg border border-slate-400 p-3.5 my-3 text-xs leading-relaxed bg-slate-50/70 text-slate-800 relative z-10">
          <div className="mb-2">
            <b>Payment Mode:</b> <span className="font-bold text-slate-900">{modeLabel}</span>
            {marginReceipt?.transactionRef && (
              <span className="ml-3 text-slate-600 font-mono">Ref: {marginReceipt.transactionRef}</span>
            )}
          </div>
          <div className="mb-3">
            <b>Towards:</b>{' '}
            <textarea
              rows={2}
              value={towardsText}
              onChange={(e) => handleReceiptFieldChange('towardsDescription', e.target.value)}
              className="w-full mt-1 p-1.5 text-xs bg-white border border-slate-300 rounded font-normal text-slate-800 focus:outline-none"
            />
          </div>
          <div className="p-2.5 rounded bg-white border border-slate-300 font-bold flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="text-slate-500">Total System Cost:</span>{' '}
              <span className="font-black text-slate-900">{currency} {formatIntegerINR(totalDeal)}/-</span>
            </div>
            <span className="text-slate-400">=</span>
            <div>
              <span className="text-slate-500">Bank Loan:</span>{' '}
              <span className="font-black text-blue-800">{currency} {formatIntegerINR(bankLoan)}/-</span>
            </div>
            <span className="text-slate-400">+</span>
            <div>
              <span className="text-slate-500">Margin Money (this receipt):</span>{' '}
              <span className="font-black text-emerald-800">{currency} {formatIntegerINR(amountRcvd)}/-</span>
            </div>
          </div>
        </div>

        {/* Interactive Payment Mode Selector (Editor Only) */}
        <div className="print:hidden my-3 p-3 bg-slate-100 rounded-lg flex flex-wrap items-center gap-4 text-xs font-semibold relative z-10">
          <span className="text-slate-700">Change Payment Mode:</span>
          {(['CASH', 'UPI', 'NEFT_RTGS', 'CHEQUE'] as const).map((m) => (
            <label key={m} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="rcptMode"
                value={m}
                checked={mode === m}
                onChange={() => handleReceiptFieldChange('paymentMode', m)}
                className="text-amber-600"
              />
              <span>{m === 'CASH' ? 'Cash' : m === 'UPI' ? 'UPI' : m === 'CHEQUE' ? 'Cheque' : 'Bank Transfer'}</span>
            </label>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-600">Ref / Slip:</span>
            <input
              type="text"
              placeholder="e.g. UPI-1234 / Slip #1"
              value={marginReceipt?.transactionRef || ''}
              onChange={(e) => handleReceiptFieldChange('transactionRef', e.target.value)}
              className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono"
            />
          </div>
        </div>

        {/* Note */}
        <p className="text-[11px] text-slate-500 italic my-3 relative z-10">
          Note: This receipt confirms that the above margin money amount has been received in {modeLabel.toLowerCase()} by {firm.name || 'Jagga Enterprises & Co.'} from the customer towards their contribution for the solar installation referenced above, for submission to the financing bank.
        </p>

        {/* Dual Signatures */}
        <div className="mt-8 pt-4 flex justify-between items-end text-xs relative z-10">
          <div className="text-center">
            <div className="w-44 border-b border-slate-500 mb-1"></div>
            <div className="font-bold text-slate-700">Receiver's (Customer's) Signature</div>
          </div>
          <div className="text-center">
            {firm.signature && (
              <img src={firm.signature} alt="Sign" className="h-10 mx-auto object-contain mb-1" />
            )}
            <div className="w-52 border-b border-slate-900 mb-1"></div>
            <div className="font-black text-slate-900">For {firm.name || 'Your Business / Firm Name'}</div>
            <div className="text-[10px] text-slate-500">Authorised Signatory</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: Bank Loan Margin Money Estimate (Exact Jagga Tool Layout + Editable Rows)
  // -------------------------------------------------------------
  if (docType === 'estimate' || (docType === 'quotation' && trade === 'solar')) {
    if (trade !== 'solar') {
      return (
        <div className="mx-auto w-full max-w-2xl bg-white text-slate-900 p-8 shadow-xl rounded-xl text-center">
          <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-6">
            <h3 className="text-base font-bold text-indigo-900">
              Document Not Applicable for {trade.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="mt-2 text-xs text-indigo-700">
              Bank Loan Margin Money Estimate is specific to PM Surya Ghar & Solar Rooftop bank financing.
              Please switch to <b>Tax Invoice</b> or <b>Quotation</b> for your active trade.
            </p>
          </div>
        </div>
      );
    }

    const isDark = templateStyle === 3;
    const isBlue = templateStyle === 2;

    const estimateTotalTaxable = estimatePrices.reduce((sum, r) => sum + (Number(r.taxableAmount) || 0), 0);
    const estimateGrandTotal = estimatePrices.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const estimateTotalTax = Math.max(0, estimateGrandTotal - estimateTotalTaxable);

    // Group taxes by rate for Tax Summary Table
    const estimateTaxBuckets: { [rate: number]: { taxable: number; cgst: number; sgst: number; totalTax: number } } = {};
    estimatePrices.forEach((r) => {
      const rate = Number(r.gstRate) || 0;
      const tax = Math.max(0, (Number(r.totalAmount) || 0) - (Number(r.taxableAmount) || 0));
      if (!estimateTaxBuckets[rate]) estimateTaxBuckets[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      estimateTaxBuckets[rate].taxable += Number(r.taxableAmount) || 0;
      estimateTaxBuckets[rate].cgst += tax / 2;
      estimateTaxBuckets[rate].sgst += tax / 2;
      estimateTaxBuckets[rate].totalTax += tax;
    });

    const primaryColor = isDark ? 'text-amber-400' : isBlue ? 'text-blue-800' : 'text-[#1f6fb2]';
    const thBg = isDark ? 'bg-slate-950 text-amber-300' : isBlue ? 'bg-blue-100 text-blue-950' : 'bg-[#eaf2fa] text-slate-900';
    const totalRowBg = isDark ? 'bg-slate-800 text-amber-300' : 'bg-[#fff2cc] text-slate-900';

    return (
      <div className={`relative mx-auto w-full max-w-4xl ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'} p-6 sm:p-10 shadow-2xl rounded-xl print:shadow-none print:p-0 font-sans text-xs`}>
        {renderWatermark()}

        {/* Center Header */}
        <div className="text-center mb-3">
          <div className={`text-2xl sm:text-3xl font-black ${primaryColor} tracking-wide`}>
            {firm.name || 'Your Business / Firm Name'}
          </div>
          <div className="italic text-xs text-slate-500 mt-0.5">
            {firm.tagline || 'Solar Energy Solutions | Rooftop Systems & Services'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {firm.address || 'Business Address, City, State, PIN'}<br />
            {firm.mobile ? `Mo: ${firm.mobile}` : 'Contact: +91 XXXXX-XXXXX'}{firm.gstin ? ` | GSTIN: ${firm.gstin}` : ''}
          </div>
          <div className="font-black text-xl text-slate-900 mt-3 uppercase tracking-wider">
            ESTIMATE / QUOTATION
          </div>
          <div className="italic text-[10px] text-slate-500">
            (For Bank Loan Margin Money & Client Commercial Proposal - Not a Tax Invoice)
          </div>
        </div>

        {/* Ref. No. and Date Row */}
        <div className="flex justify-between items-center text-xs font-bold my-2.5 px-1 border-b border-slate-200 pb-2">
          <div>
            <span className="text-slate-500">Ref. No.:</span>{' '}
            <span className="font-mono text-slate-900">{meta.quotRef || meta.invNo || 'JEC-EST-012/2026'}</span>
          </div>
          <div>
            <span className="text-slate-500">Date:</span>{' '}
            <span className="text-slate-900">{meta.date || new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {/* Customer Details Box */}
        <div className="rounded-lg border border-slate-800 p-3 my-2.5 bg-white text-xs leading-relaxed text-slate-900">
          <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Customer Details
          </div>
          <div>
            <b>Name:</b> {customer.name || 'Valued Solar Beneficiary'}
            {customer.relation && <span className="ml-4"><b>{customer.relation.includes('/') ? customer.relation : `S/O / W/O: ${customer.relation}`}</b></span>}
          </div>
          {customer.address && <div><b>Address:</b> {customer.address}</div>}
          <div className="flex flex-wrap gap-4 mt-0.5">
            {customer.mobile && <span><b>Contact No.:</b> {customer.mobile}</span>}
            {customer.aadhar && <span><b>Aadhaar No.:</b> {maskAadhaar(customer.aadhar)}</span>}
            {customer.appNo && <span><b>PM Surya Ghar App No.:</b> {customer.appNo}</span>}
          </div>
        </div>

        {/* 1. System Specifications Table (Editable, add/delete rows) */}
        <div className="my-3">
          <div className="flex justify-between items-center mb-1">
            <b className="text-xs uppercase tracking-wider text-slate-900">System Specifications</b>
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
            >
              <Plus className="h-3 w-3" /> Add Specification Row
            </button>
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs text-left">
            <thead>
              <tr className={thBg}>
                <th className="border border-slate-400 p-2 font-bold w-1/2">Description</th>
                <th className="border border-slate-400 p-2 font-bold w-1/4">Make</th>
                <th className="border border-slate-400 p-2 font-bold w-1/4">Warranty</th>
                <th className="border border-slate-400 p-1 w-8 text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {estimateSpecs.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => handleUpdateSpecRow(row.id, 'description', e.target.value)}
                      className="w-full bg-transparent font-medium text-slate-900 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={row.make}
                      onChange={(e) => handleUpdateSpecRow(row.id, 'make', e.target.value)}
                      className="w-full bg-transparent text-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={row.warranty}
                      onChange={(e) => handleUpdateSpecRow(row.id, 'warranty', e.target.value)}
                      className="w-full bg-transparent text-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 p-1 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => handleDeleteSpecRow(row.id)}
                      className="text-rose-500 hover:text-rose-700"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. Price Details Table (Editable, add/delete rows) */}
        <div className="my-3">
          <div className="flex justify-between items-center mb-1">
            <b className="text-xs uppercase tracking-wider text-slate-900">Price Details</b>
            <button
              type="button"
              onClick={handleAddPriceRow}
              className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
            >
              <Plus className="h-3 w-3" /> Add Price Row
            </button>
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs text-left">
            <thead>
              <tr className={thBg}>
                <th className="border border-slate-400 p-2 font-bold w-10 text-center">S.N.</th>
                <th className="border border-slate-400 p-2 font-bold">Job Description</th>
                <th className="border border-slate-400 p-2 font-bold text-right w-28">Taxable Amt ({currency})</th>
                <th className="border border-slate-400 p-2 font-bold text-center w-20">GST</th>
                <th className="border border-slate-400 p-2 font-bold text-right w-32">Amount Incl. GST ({currency})</th>
                <th className="border border-slate-400 p-1 w-8 text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {estimatePrices.map((p, idx) => {
                const taxAmt = Math.max(0, p.totalAmount - p.taxableAmount);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5">
                      <textarea
                        rows={2}
                        value={p.description}
                        onChange={(e) => handleUpdatePriceRow(p.id, 'description', e.target.value)}
                        className="w-full bg-transparent font-medium text-slate-900 focus:outline-none resize-none leading-relaxed"
                      />
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">
                      <input
                        type="number"
                        value={p.taxableAmount}
                        onChange={(e) => handleUpdatePriceRow(p.id, 'taxableAmount', e.target.value)}
                        className="w-full text-right bg-transparent font-medium focus:outline-none"
                      />
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      <div className="font-bold text-slate-800">{formatINR(taxAmt)}</div>
                      <div className="text-[10px] text-slate-500">
                        <select
                          value={p.gstRate}
                          onChange={(e) => handleUpdatePriceRow(p.id, 'gstRate', Number(e.target.value))}
                          className="bg-transparent font-bold text-slate-600 focus:outline-none"
                        >
                          <option value="5">(5%)</option>
                          <option value="18">(18%)</option>
                          <option value="12">(12%)</option>
                          <option value="0">(0%)</option>
                        </select>
                      </div>
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-bold text-slate-900">
                      <input
                        type="number"
                        value={p.totalAmount}
                        onChange={(e) => handleUpdatePriceRow(p.id, 'totalAmount', e.target.value)}
                        className="w-full text-right bg-transparent font-bold focus:outline-none"
                      />
                    </td>
                    <td className="border border-slate-300 p-1 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDeletePriceRow(p.id)}
                        className="text-rose-500 hover:text-rose-700"
                        title="Delete price row"
                      >
                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className={`font-black ${totalRowBg} border-t-2 border-slate-600`}>
                <td className="border border-slate-400 p-2 text-center" colSpan={2}>
                  <b>GRAND TOTAL</b>
                </td>
                <td className="border border-slate-400 p-2 text-right">
                  {formatINR(estimateTotalTaxable)}
                </td>
                <td className="border border-slate-400 p-2 text-center">
                  {formatINR(estimateTotalTax)}
                </td>
                <td className="border border-slate-400 p-2 text-right text-sm">
                  {currency} {formatIntegerINR(estimateGrandTotal)}
                </td>
                <td className="border border-slate-400 p-1 print:hidden"></td>
              </tr>
            </tbody>
          </table>
          <p className="my-2 px-1 font-bold text-slate-800">
            <b>Estimate Amount in Words:</b> Rupees {numberToWordsRupees(estimateGrandTotal)} Only
          </p>
        </div>

        {/* 3. Tax Summary (Intra-State: CGST + SGST or Single Tax) */}
        <div className="my-3">
          <b className="text-xs uppercase tracking-wider text-slate-900">
            {showCgstSgst ? 'Tax Summary (Intra-State: CGST + SGST)' : `Tax Summary (${countryConfig.taxName})`}
          </b>
          <table className="w-full border-collapse border border-slate-400 text-xs text-right mt-1">
            <thead>
              <tr className={thBg}>
                <th className="border border-slate-400 p-1.5 text-right">Taxable Amt ({currency})</th>
                {showCgstSgst ? (
                  <>
                    <th className="border border-slate-400 p-1.5 text-center">CGST %</th>
                    <th className="border border-slate-400 p-1.5 text-right">CGST Amt ({currency})</th>
                    <th className="border border-slate-400 p-1.5 text-center">SGST %</th>
                    <th className="border border-slate-400 p-1.5 text-right">SGST Amt ({currency})</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-400 p-1.5 text-center">{countryConfig.taxName} %</th>
                    <th className="border border-slate-400 p-1.5 text-right">{countryConfig.taxName} Amt ({currency})</th>
                  </>
                )}
                <th className="border border-slate-400 p-1.5 text-right">Total Tax ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(estimateTaxBuckets).map(([rStr, b]) => {
                const r = Number(rStr);
                return (
                  <tr key={r} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5">{formatINR(b.taxable)}</td>
                    {showCgstSgst ? (
                      <>
                        <td className="border border-slate-300 p-1.5 text-center">{(r / 2).toFixed(1)}%</td>
                        <td className="border border-slate-300 p-1.5">{formatINR(b.cgst)}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{(r / 2).toFixed(1)}%</td>
                        <td className="border border-slate-300 p-1.5">{formatINR(b.sgst)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-300 p-1.5 text-center">{r}%</td>
                        <td className="border border-slate-300 p-1.5">{formatINR(b.totalTax)}</td>
                      </>
                    )}
                    <td className="border border-slate-300 p-1.5 font-bold">{formatINR(b.totalTax)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-slate-100">
                <td className="border border-slate-400 p-1.5">{formatINR(estimateTotalTaxable)}</td>
                {showCgstSgst ? (
                  <>
                    <td className="border border-slate-400 p-1.5"></td>
                    <td className="border border-slate-400 p-1.5">{formatINR(estimateTotalTax / 2)}</td>
                    <td className="border border-slate-400 p-1.5"></td>
                    <td className="border border-slate-400 p-1.5">{formatINR(estimateTotalTax / 2)}</td>
                  </>
                ) : (
                  <>
                    <td className="border border-slate-400 p-1.5"></td>
                    <td className="border border-slate-400 p-1.5">{formatINR(estimateTotalTax)}</td>
                  </>
                )}
                <td className="border border-slate-400 p-1.5 font-black">{formatINR(estimateTotalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Terms & Bank Details Side-by-Side Table (Exact Jagga Tool format) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
          <div className="border border-slate-800 rounded p-2.5 text-[10px] leading-relaxed text-slate-700 bg-white">
            <b className="text-slate-900 block mb-1 text-xs">Terms &amp; Conditions:</b>
            1. Valid for 30 days from estimate date.<br />
            2. 50% advance before material procurement.<br />
            3. Balance 50% on installation completion.<br />
            4. Net metering will be submitted to DISCOM after installation.<br />
            5. PM Surya Ghar subsidy credited directly to customer's bank account.<br />
            6. All equipment carries respective manufacturer company warranty.<br />
            7. This is an estimate for bank loan/margin money purposes and is not a tax invoice.
          </div>
          <div className="border border-slate-800 rounded p-2.5 text-[10px] leading-relaxed text-slate-700 bg-white">
            <b className="text-slate-900 block mb-1 text-xs">Bank Details:</b>
            <b>Bank:</b> {bank.bankName || 'Your Bank Name'}<br />
            <b>Branch:</b> {bank.branch || 'Branch Name'}<br />
            <b>A/c No.:</b> {bank.accountNo || 'XXXXXXXXXXXX'}<br />
            <b>IFSC Code:</b> {bank.ifsc || 'IFSC0000XXX'}<br />
            <b>A/c Holder:</b> {firm.name || 'Your Business / Firm Name'}
          </div>
        </div>

        {/* 5. Signature Section */}
        <div className="mt-8 pt-4 flex justify-end text-xs">
          <div className="text-center w-56">
            {firm.signature && (
              <img src={firm.signature} alt="Sign" className="h-10 mx-auto object-contain mb-1" />
            )}
            <div className="border-b border-slate-900 mb-1"></div>
            <div className="font-black text-slate-900">For {firm.name || 'Your Business / Firm Name'}</div>
            <div className="text-[10px] text-slate-500">Authorised Signatory</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: TAX INVOICE (3 Professional Themes)
  // -------------------------------------------------------------
  if (templateStyle === 2) {
    // Theme 2: Corporate Blue
    return (
      <div className="relative mx-auto w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        {renderWatermark()}
        <div
          className="p-6 text-white"
          style={accentColor ? { backgroundColor: accentColor } : { background: 'linear-gradient(to right, #172554, #1e3a8a, #312e81)' }}
        >
          {renderFirmHeader(2)}
        </div>
        <div className="h-1.5 bg-amber-400" />
        <div className="relative z-10 p-6">
          {renderMetaRow('bg-blue-50 text-blue-950', 'text-blue-950')}
          {renderCustomerBoxes('border-blue-200 bg-blue-50/30', 'text-blue-800')}
          {renderItemsTable(
            'bg-blue-900 text-white font-bold',
            'bg-blue-100 text-blue-950 font-extrabold border-t-2 border-blue-600'
          )}
          {renderGstBreakdown('bg-blue-900 text-white font-bold')}
          {renderFooter('bg-blue-50 text-blue-950', 'border-blue-900')}
        </div>
      </div>
    );
  }

  if (templateStyle === 3) {
    // Theme 3: Midnight Dark & Gold (Solar Tech)
    return (
      <div className="relative mx-auto w-full max-w-4xl bg-slate-900 text-slate-100 shadow-2xl rounded-xl overflow-hidden print:bg-white print:text-slate-900 print:shadow-none">
        {renderWatermark()}
        <div className="bg-slate-950 p-6 border-b-2 border-amber-400">
          {renderFirmHeader(3)}
        </div>
        <div className="relative z-10 p-6">
          {renderMetaRow('bg-slate-950 text-slate-200', 'text-slate-200')}
          {renderCustomerBoxes('border-slate-800 bg-slate-950/50', 'text-amber-400')}
          {renderItemsTable(
            'bg-slate-950 text-amber-400 font-bold',
            'bg-amber-400 text-slate-950 font-extrabold border-t-2 border-amber-500'
          )}
          {renderGstBreakdown('bg-slate-950 text-amber-400 font-bold')}
          {renderFooter('bg-slate-950 text-slate-300', 'border-amber-400')}
        </div>
      </div>
    );
  }

  // Theme 1: Clean Minimal White
  return (
    <div className="relative mx-auto w-full max-w-4xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl rounded-xl print:shadow-none print:p-0 overflow-hidden">
      {renderWatermark()}
      <div
        className="border-b-4 border-slate-900 pb-4 relative z-10"
        style={accentColor ? { borderBottomColor: accentColor } : undefined}
      >
        {renderFirmHeader(1)}
      </div>
      <div className="relative z-10">
        {renderMetaRow('bg-slate-100 text-slate-800', 'text-slate-800')}
        {renderCustomerBoxes('border-slate-300 bg-slate-50/50', 'text-slate-900')}
        {renderItemsTable(
          'bg-slate-900 text-white font-bold',
          'bg-slate-900 text-amber-400 font-extrabold border-t-2 border-slate-800'
        )}
        {renderGstBreakdown('bg-slate-900 text-white font-bold')}
        {renderFooter('bg-slate-100 text-slate-800', 'border-slate-900')}
      </div>
    </div>
  );
};
