import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  Maximize2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
  Briefcase
} from 'lucide-react';
import { InvoiceItem, StockItem, IndustryType, TradeKey } from '../types/solar';
import { CountryCode, getCountryConfig } from '../config/countries';
import { formatIntegerINR } from '../services/licenseService';
import { generateSolarKitForKw, INDUSTRY_CATALOGS } from '../data/defaultData';

interface SidebarCalculatorProps {
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  targetPrice: number;
  onTargetPriceChange: (val: number) => void;
  stockLibrary: StockItem[];
  onAddStockItem: (item: StockItem) => void;
  onUpdateStockItem?: (item: StockItem) => void;
  onDeleteStockItem: (name: string) => void;
  currency: string;
  country?: CountryCode;
  trade?: TradeKey;
  industry: IndustryType;
  onIndustryChange: (ind: IndustryType) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarCalculator: React.FC<SidebarCalculatorProps> = ({
  items,
  onItemsChange,
  targetPrice,
  onTargetPriceChange,
  stockLibrary,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  currency,
  country = 'IN',
  trade = 'solar',
  industry,
  onIndustryChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const countryCfg = getCountryConfig(country);
  const [newStockName, setNewStockName] = useState('');
  const [newStockHsn, setNewStockHsn] = useState('');
  const [newStockGst, setNewStockGst] = useState<number>(countryCfg.defaultTaxRate);
  const [newStockBuy, setNewStockBuy] = useState<number>(1000);
  const [newStockQty, setNewStockQty] = useState<number>(10);
  const [newStockMin, setNewStockMin] = useState<number>(5);
  const [newStockUnit, setNewStockUnit] = useState<string>('NOS');

  // Low stock filters & quick editing state
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  const [editingItemName, setEditingItemName] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editMin, setEditMin] = useState<number>(5);

  // Dynamic Solar Load state (kW)
  const [selectedKw, setSelectedKw] = useState<number>(3);
  const [customKwInput, setCustomKwInput] = useState<string>('3');

  // Stock catalog search & fullscreen modal
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Compute Buying Total (w/GST)
  const totalBuyWithGst = items.reduce((acc, it) => {
    const buyLine = (it.buyRate || 0) * (it.qty || 1);
    return acc + buyLine * (1 + (it.gst || 0) / 100);
  }, 0);

  // Compute Selling Total (w/GST)
  const totalSellWithGst = items.reduce((acc, it) => {
    const sellLine = (it.rate || 0) * (it.qty || 1);
    return acc + sellLine * (1 + (it.gst || 0) / 100);
  }, 0);

  const profit = Math.round(totalSellWithGst - totalBuyWithGst);
  const profitPercent = totalBuyWithGst > 0 ? ((profit / totalBuyWithGst) * 100).toFixed(1) : '0';

  const taxableSell = items.reduce((acc, it) => acc + (it.rate || 0) * (it.qty || 1), 0);
  const taxAmountSell = Math.max(0, totalSellWithGst - taxableSell);

  // Compute 5% vs 18% share in selling (Solar 70:30 Rule in India)
  let sum5 = 0;
  let sum18 = 0;
  let sum12 = 0;
  let sum28 = 0;
  items.forEach((it) => {
    const lineWithTax = (it.rate || 0) * (it.qty || 1) * (1 + (it.gst || 0) / 100);
    if (it.gst === 5) sum5 += lineWithTax;
    else if (it.gst === 18) sum18 += lineWithTax;
    else if (it.gst === 12) sum12 += lineWithTax;
    else if (it.gst === 28) sum28 += lineWithTax;
  });

  const totalGSTSubject = sum5 + sum18;
  const pct5 = totalGSTSubject > 0 ? (sum5 / totalGSTSubject) * 100 : 0;
  const pct18 = totalGSTSubject > 0 ? (sum18 / totalGSTSubject) * 100 : 0;

  // Auto-reverse calculation from targetPrice
  const handleAutoReverseCalculate = () => {
    if (targetPrice <= 0 || totalBuyWithGst <= 0) return;

    const updated = items.map((it) => {
      const itBuyWithGst = (it.buyRate || 0) * (it.qty || 1) * (1 + (it.gst || 0) / 100);
      const weight = itBuyWithGst / totalBuyWithGst;
      const targetForItem = targetPrice * weight;
      const rateExcludingGst = it.qty > 0 ? (targetForItem / (1 + (it.gst || 0) / 100)) / it.qty : 0;
      return {
        ...it,
        rate: Math.round(rateExcludingGst * 100) / 100,
      };
    });

    onItemsChange(updated);
  };

  // Dynamic Load Kit Generation (e.g. 1kW, 2kW, 3kW, 5kW, 10kW or custom)
  const handleApplySolarKw = (kwVal: number) => {
    const safe = Math.max(0.5, kwVal || 3);
    setSelectedKw(safe);
    setCustomKwInput(String(safe));
    const generated = generateSolarKitForKw(safe);
    onTargetPriceChange(generated.targetPrice);
    onItemsChange(generated.items);
  };

  // Low Stock Helpers & Thresholds
  const getThreshold = (stk: StockItem) => (typeof stk.minStock === 'number' ? stk.minStock : 5);
  const getQty = (stk: StockItem) => (typeof stk.quantity === 'number' ? stk.quantity : 0);
  const isLowStock = (stk: StockItem) => getQty(stk) <= getThreshold(stk);
  const isOutOfStock = (stk: StockItem) => getQty(stk) <= 0;
  const lowStockCount = stockLibrary.filter(isLowStock).length;

  const handleUpdateStockQty = (stk: StockItem, delta: number) => {
    if (!onUpdateStockItem) return;
    const current = getQty(stk);
    const updatedQty = Math.max(0, current + delta);
    onUpdateStockItem({
      ...stk,
      quantity: updatedQty,
    });
  };

  const handleSaveThresholdEdit = (stk: StockItem) => {
    if (!onUpdateStockItem) return;
    onUpdateStockItem({
      ...stk,
      quantity: Math.max(0, editQty),
      minStock: Math.max(0, editMin),
    });
    setEditingItemName(null);
  };

  const handleAddNewStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;
    onAddStockItem({
      name: newStockName.trim(),
      hsn: newStockHsn.trim() || '85414300',
      gst: Number(newStockGst) || 18,
      defaultBuy: Number(newStockBuy) || 0,
      quantity: Number(newStockQty) >= 0 ? Number(newStockQty) : 10,
      minStock: Number(newStockMin) >= 0 ? Number(newStockMin) : 5,
      unit: newStockUnit.trim() || 'NOS',
    });
    setNewStockName('');
    setNewStockHsn('');
    setNewStockQty(10);
    setNewStockMin(5);
  };

  // Filtered stocks based on search query and low stock filter
  const filteredStocks = stockLibrary.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.hsn.includes(catalogSearch);
    if (!matchesSearch) return false;
    if (stockFilter === 'low') return isLowStock(s);
    return true;
  });

  return (
    <>
      <div className="relative flex h-full flex-col overflow-y-auto bg-slate-900/95 text-slate-100 p-3 sm:p-4 border-r border-slate-800">
        {/* Header bar with Industry Selector & Collapse Arrow */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 flex-1 mr-2">
            <Briefcase className="h-4 w-4 text-amber-400 shrink-0" />
            <select
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value as IndustryType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none cursor-pointer"
              title="Select Business Category / Industry Mode"
            >
              <option value="solar">☀️ Solar EPC & Rooftop</option>
              <option value="bike_spares">🏍️ Bike & Spare Parts</option>
              <option value="electronics">⚡ Electronics & Electricals</option>
              <option value="hardware">🔩 Hardware & Sanitary</option>
              <option value="automobile">🚗 Automobile & Garage</option>
              <option value="general_trading">🏢 General Trading & Services</option>
            </select>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
              title="Collapse Side Panel to expand bill screen (◀)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dynamic Load Kit Selector (Solar specific) */}
        {industry === 'solar' && (
          <div className="mb-3 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-950 p-3 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Dynamic Solar Load (kW)
              </span>
              <span className="text-[10px] text-slate-400">Customizable</span>
            </div>

            {/* Quick kW Preset Buttons */}
            <div className="flex flex-wrap gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 8, 10, 15].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleApplySolarKw(kw)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                    selectedKw === kw
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {kw} kW
                </button>
              ))}
            </div>

            {/* Custom Load Input + Auto-Generate Kit */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={customKwInput}
                  onChange={(e) => setCustomKwInput(e.target.value)}
                  placeholder="Custom kW"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                  kW
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleApplySolarKw(parseFloat(customKwInput) || 3)}
                className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-slate-950 hover:bg-amber-400 transition"
              >
                ⚡ Load Kit
              </button>
            </div>
            <div className="mt-1 text-[9.5px] text-slate-400 leading-tight">
              Auto-computes modules, inverter, structure, cables & earthing for any capacity!
            </div>
          </div>
        )}

        {/* Target Price Reverse Calculator */}
        <div className="rounded-xl border-2 border-amber-500/70 bg-slate-950 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Calculator className="h-4 w-4" /> Bill Target Amount
            </label>
            <span className="text-[10px] text-slate-400">Total with {countryCfg.taxName}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-400">
                {currency}
              </span>
              <input
                type="number"
                value={targetPrice || ''}
                onChange={(e) => onTargetPriceChange(Number(e.target.value))}
                placeholder="e.g. 180000"
                className="w-full rounded-lg border border-amber-500/50 bg-slate-900 py-2 pl-8 pr-3 text-lg font-black text-amber-400 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              onClick={handleAutoReverseCalculate}
              title="Auto-calculate selling prices from buying rates"
              className="rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto Fill
            </button>
          </div>

          {/* Stats Grid — Clean & Non-Confusing based on Country & Trade */}
          {country === 'IN' && (industry === 'solar' || trade === 'solar') ? (
            /* India Solar EPC Mode: Cost, Profit, 5% Solar PV & 18% BOS */
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="text-[10px] text-slate-400">Cost Price (w/GST)</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-200">
                    {currency} {formatIntegerINR(totalBuyWithGst)}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-2">
                  <div className="text-[10px] text-emerald-400">Estimated Profit</div>
                  <div className="mt-0.5 text-sm font-bold text-emerald-400">
                    {currency} {formatIntegerINR(profit)} ({profitPercent}%)
                  </div>
                </div>
                <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-2">
                  <div className="text-[10px] text-blue-300">5% GST Items</div>
                  <div className="mt-0.5 text-xs font-bold text-blue-300">
                    {currency} {formatIntegerINR(sum5)}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-900/40 bg-orange-950/20 p-2">
                  <div className="text-[10px] text-orange-300">18% GST Items</div>
                  <div className="mt-0.5 text-xs font-bold text-orange-300">
                    {currency} {formatIntegerINR(sum18)}
                  </div>
                </div>
              </div>

              {/* PM Surya Ghar 70:30 Rule Checker */}
              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Sliders className="h-3 w-3 text-amber-400" /> PM Surya Ghar 70:30 Ratio
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {pct5.toFixed(1)}% / {pct18.toFixed(1)}%
                  </span>
                </div>

                {/* Ratio bar */}
                <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{ width: `${pct5}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`5% GST Items: ${pct5.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${pct18}%` }}
                    className="bg-orange-500 transition-all duration-300"
                    title={`18% GST Items: ${pct18.toFixed(1)}%`}
                  />
                </div>

                <div className="mt-1.5 flex justify-between text-[10px]">
                  <span className="text-emerald-400 font-medium">5% Solar PV: {pct5.toFixed(1)}%</span>
                  <span className="text-orange-400 font-medium">18% BOS: {pct18.toFixed(1)}%</span>
                </div>

                {/* Feedback status */}
                <div className="mt-2 text-[10px]">
                  {items.length === 0 ? (
                    <span className="text-slate-500">Add solar items to see compliance</span>
                  ) : pct5 >= 68 && pct5 <= 75 ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/40 p-1.5 rounded">
                      <CheckCircle className="h-3 w-3 shrink-0" />
                      Perfect DISCOM Ratio! (Ideal ~70:30)
                    </div>
                  ) : pct5 < 68 ? (
                    <div className="flex items-center gap-1 text-amber-400 font-medium bg-amber-950/40 p-1.5 rounded">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      5% ratio is low ({pct5.toFixed(0)}%). Increase Panel or Inverter share.
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-400 font-medium bg-amber-950/40 p-1.5 rounded">
                      <Info className="h-3 w-3 shrink-0" />
                      5% ratio is high ({pct5.toFixed(0)}%). Balance with structure/installation.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* General Trade & International Country Mode: Clean, Straightforward, No Clutter */
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-[10px] text-slate-400">Taxable Base</div>
                <div className="mt-0.5 text-sm font-bold text-white">
                  {currency} {formatIntegerINR(taxableSell)}
                </div>
              </div>
              <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-2">
                <div className="text-[10px] text-indigo-300">Total {countryCfg.taxName}</div>
                <div className="mt-0.5 text-sm font-bold text-indigo-300">
                  {currency} {formatIntegerINR(taxAmountSell)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-[10px] text-slate-400">Cost Price (w/{countryCfg.taxName})</div>
                <div className="mt-0.5 text-xs font-bold text-slate-300">
                  {currency} {formatIntegerINR(totalBuyWithGst)}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-2">
                <div className="text-[10px] text-emerald-400">Estimated Profit</div>
                <div className="mt-0.5 text-xs font-bold text-emerald-400">
                  {currency} {formatIntegerINR(profit)} ({profitPercent}%)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment & Goods Catalog (Expandable + Search + Big View) */}
        <div className="mt-4 flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" /> Equipment Catalog ({stockLibrary.length})
            </h4>
            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-slate-700 hover:text-white transition"
              title="Open Fullscreen / Expanded Catalog Modal"
            >
              <Maximize2 className="h-3 w-3" /> ⛶ Expand Box
            </button>
          </div>

          {/* Low Stock Alert Notification Banner */}
          {lowStockCount > 0 && (
            <div className="mb-2.5 flex items-center justify-between rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950/60 to-slate-900 px-3 py-2 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-extrabold text-rose-300 text-[11px]">
                  ⚠️ Low Stock Alert: <b className="text-white">{lowStockCount}</b> {lowStockCount === 1 ? 'item needs' : 'items need'} reorder!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                className={`rounded px-2 py-0.5 text-[10px] font-black transition ${
                  stockFilter === 'low'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-950/80 text-rose-200 border border-rose-500/40 hover:bg-rose-800 hover:text-white'
                }`}
              >
                {stockFilter === 'low' ? 'Show All' : 'Filter Low Stock'}
              </button>
            </div>
          )}

          {/* Search box inside catalog */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search items or HSN code..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Stock List Scrollable with comfortable height */}
          <div className="flex-1 overflow-y-auto space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-2 max-h-[380px]">
            {filteredStocks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                {stockFilter === 'low'
                  ? 'Sabhi items me stock safe hai (koi low stock nahi hai)!'
                  : `Koi item match nahi hua "${catalogSearch}"`}
              </div>
            ) : (
              filteredStocks.map((stk) => {
                const low = isLowStock(stk);
                const out = isOutOfStock(stk);
                const qty = getQty(stk);
                const threshold = getThreshold(stk);
                const unit = stk.unit || 'NOS';

                return (
                  <div
                    key={stk.name}
                    className={`group flex flex-col rounded-lg border p-2 text-xs transition ${
                      low
                        ? 'border-rose-500/80 bg-rose-950/30 shadow-sm shadow-rose-950/50'
                        : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 overflow-hidden pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-100 text-[11px] leading-snug">
                            {stk.name}
                          </span>
                          {out ? (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5" /> Out of Stock (0 {unit})
                            </span>
                          ) : low ? (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/50">
                              <AlertTriangle className="h-2.5 w-2.5 text-rose-400" /> Low Stock ({qty} left)
                            </span>
                          ) : null}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>{countryCfg.itemCodeLabel}: <b>{stk.hsn}</b></span>
                          <span>•</span>
                          <span>{countryCfg.taxName}: <b className={stk.gst === 5 ? 'text-emerald-400' : 'text-orange-400'}>{stk.gst}%</b></span>
                          {stk.defaultBuy ? (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">Buy: {currency}{stk.defaultBuy}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => {
                            const newItem: InvoiceItem = {
                              id: Date.now(),
                              name: stk.name,
                              hsn: stk.hsn,
                              gst: stk.gst,
                              qty: 1,
                              unit: unit || (stk.name.includes('Cable') || stk.name.includes('Pipe') || stk.name.includes('Wire')
                                ? 'Mtr.'
                                : stk.name.includes('Service') || stk.name.includes('Charges') || stk.name.includes('Fee')
                                ? 'Job'
                                : 'NOS'),
                              buyRate: stk.defaultBuy || 1000,
                              rate: Math.round((stk.defaultBuy || 1000) * 1.3),
                              serialNumbers: '',
                            };
                            onItemsChange([...items, newItem]);
                          }}
                          className="rounded bg-amber-500/20 px-2.5 py-1 text-[10px] font-extrabold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition"
                          title="Add to Current Invoice"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => onDeleteStockItem(stk.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete from Catalog"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Level & Threshold Indicator Bar */}
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400">In Stock:</span>
                        <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                          low ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40' : 'bg-slate-800 text-emerald-400'
                        }`}>
                          {qty} {unit}
                        </span>
                        <span className="text-slate-400 text-[9.5px]">
                          (Alert &lt;= <b>{threshold}</b>)
                        </span>
                        {low && (
                          <span className="text-rose-400 font-extrabold text-[9.5px] tracking-tight">
                            ⚡ Reorder Required!
                          </span>
                        )}
                      </div>

                      {/* Quick stock +/- and threshold config */}
                      {onUpdateStockItem && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStockQty(stk, -1)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-black flex items-center justify-center text-xs"
                            title="Quick Reduce Stock (-1)"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStockQty(stk, +1)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-black flex items-center justify-center text-xs"
                            title="Quick Increase Stock (+1)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingItemName === stk.name) {
                                setEditingItemName(null);
                              } else {
                                setEditingItemName(stk.name);
                                setEditQty(qty);
                                setEditMin(threshold);
                              }
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 text-[9.5px] font-bold border border-slate-700"
                            title="Edit Stock Count and Threshold"
                          >
                            {editingItemName === stk.name ? 'Close' : 'Set Threshold'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline Threshold and Quantity Update Popover */}
                    {editingItemName === stk.name && onUpdateStockItem && (
                      <div className="mt-2 rounded-lg border border-amber-500/50 bg-slate-950 p-2 text-xs">
                        <div className="text-[10px] font-extrabold text-amber-400 mb-1.5 flex items-center justify-between">
                          <span>Set Inventory & Reorder Limit for "{stk.name}"</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-[9.5px] text-slate-400 block mb-0.5">Current Stock Qty</label>
                            <input
                              type="number"
                              min="0"
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-400 block mb-0.5">Low Alert Threshold (Min)</label>
                            <input
                              type="number"
                              min="0"
                              value={editMin}
                              onChange={(e) => setEditMin(Number(e.target.value))}
                              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingItemName(null)}
                            className="px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveThresholdEdit(stk)}
                            className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-black text-[10px] hover:bg-amber-400"
                          >
                            Save Threshold
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Custom Stock Item Form with user-defined threshold */}
          <form onSubmit={handleAddNewStock} className="mt-2.5 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
            <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>+ Create Custom Item in Catalog</span>
              <span className="text-[9.5px] text-amber-400">With Low Stock Alert</span>
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Item name (e.g. Wire / Hardware / Module)"
                value={newStockName}
                onChange={(e) => setNewStockName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  placeholder={countryCfg.itemCodeLabel}
                  value={newStockHsn}
                  onChange={(e) => setNewStockHsn(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
                <select
                  value={newStockGst}
                  onChange={(e) => setNewStockGst(Number(e.target.value))}
                  className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-xs text-white focus:border-amber-400 focus:outline-none font-medium"
                >
                  {countryCfg.availableRates.map((r) => (
                    <option key={r} value={r}>
                      {r}% {countryCfg.taxName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Buy Rate"
                  value={newStockBuy || ''}
                  onChange={(e) => setNewStockBuy(Number(e.target.value))}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* User-defined Stock Quantity & Alert Threshold */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div>
                  <label className="text-[9px] text-slate-400 block">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Number(e.target.value))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block">Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min Alert"
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(Number(e.target.value))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block">Unit</label>
                  <input
                    type="text"
                    placeholder="NOS / Mtr"
                    value={newStockUnit}
                    onChange={(e) => setNewStockUnit(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded bg-slate-800 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-700 transition"
            >
              Save to Catalog
            </button>
          </form>
        </div>
      </div>

      {/* FULLSCREEN / EXPANDED CATALOG MODAL */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Full Equipment & Stock Catalog ({stockLibrary.length} Items)
                </h3>
                {lowStockCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/50 px-2.5 py-0.5 text-xs font-extrabold text-rose-300">
                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                    {lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar & Filter Tabs inside Modal */}
            <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search by equipment name, brand, or HSN code..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Low Stock Quick Filter Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    stockFilter === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  All ({stockLibrary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                    stockFilter === 'low'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Low Stock Only ({lowStockCount})
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredStocks.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  {stockFilter === 'low'
                    ? 'All stock levels are above threshold! No low stock warnings.'
                    : `No items found matching "${catalogSearch}"`}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStocks.map((stk) => {
                    const low = isLowStock(stk);
                    const out = isOutOfStock(stk);
                    const qty = getQty(stk);
                    const threshold = getThreshold(stk);
                    const unit = stk.unit || 'NOS';

                    return (
                      <div
                        key={stk.name}
                        className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                          low
                            ? 'border-rose-500/80 bg-rose-950/30 shadow-md shadow-rose-950/40'
                            : 'border-slate-800 bg-slate-900/70 hover:border-amber-500/50 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-white text-xs leading-snug">
                              {stk.name}
                            </div>
                            {out ? (
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                Out of Stock
                              </span>
                            ) : low ? (
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/60">
                                🚨 Low Stock
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span>{countryCfg.itemCodeLabel}: <b className="font-mono text-slate-200">{stk.hsn}</b></span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              stk.gst === 5 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'
                            }`}>
                              {stk.gst}% {countryCfg.taxName}
                            </span>
                          </div>

                          {stk.defaultBuy ? (
                            <div className="mt-1 text-[11px] text-slate-400">
                              Cost: <b className="text-slate-200">{currency}{formatIntegerINR(stk.defaultBuy)}</b>
                            </div>
                          ) : null}

                          {/* Inventory Status Bar with Threshold */}
                          <div className={`mt-2.5 rounded-lg p-2 text-xs border ${
                            low ? 'border-rose-500/50 bg-rose-950/40' : 'border-slate-800 bg-slate-950'
                          }`}>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Inventory Status:</span>
                              <span className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                                low ? 'bg-rose-600 text-white' : 'bg-emerald-950 text-emerald-300'
                              }`}>
                                {qty} {unit}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Min Alert Threshold:</span>
                              <span className="text-amber-400 font-bold">{threshold} {unit}</span>
                            </div>
                            {low && (
                              <div className="mt-1 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                Vendor Reorder Recommended!
                              </div>
                            )}

                            {/* Quick +/- buttons */}
                            {onUpdateStockItem && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStockQty(stk, -1)}
                                  className="h-5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                                  title="Decrease by 1"
                                >
                                  - 1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStockQty(stk, +1)}
                                  className="h-5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                                  title="Increase by 1"
                                >
                                  + 1
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <button
                            onClick={() => {
                              const newItem: InvoiceItem = {
                                id: Date.now(),
                                name: stk.name,
                                hsn: stk.hsn,
                                gst: stk.gst,
                                qty: 1,
                                unit: unit || (stk.name.includes('Cable') || stk.name.includes('Pipe') || stk.name.includes('Wire')
                                  ? 'Mtr.'
                                  : stk.name.includes('Service') || stk.name.includes('Charges')
                                  ? 'Job'
                                  : 'NOS'),
                                buyRate: stk.defaultBuy || 1000,
                                rate: Math.round((stk.defaultBuy || 1000) * 1.3),
                                serialNumbers: '',
                              };
                              onItemsChange([...items, newItem]);
                              setIsCatalogModalOpen(false);
                            }}
                            className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                          >
                            + Add to Bill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
