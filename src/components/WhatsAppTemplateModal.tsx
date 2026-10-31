import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  Sparkles,
  Phone,
  FileText,
  DollarSign,
  Sun,
  Clock,
  Edit3,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { CustomerInfo, FirmInfo, BankInfo, InvoiceMeta, InvoiceItem, TradeKey, DocType, WccDetails } from '../types/solar';
import { formatIntegerINR } from '../services/licenseService';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerInfo;
  firm: FirmInfo;
  bank: BankInfo;
  meta: InvoiceMeta;
  items: InvoiceItem[];
  currency: string;
  trade?: TradeKey;
  docType?: DocType;
  wcc?: WccDetails;
  onRecordHistory?: () => void;
}

interface TemplateOption {
  id: string;
  title: string;
  badge: string;
  icon: any;
  description: string;
  template: string;
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  customer,
  firm,
  bank,
  meta,
  items,
  currency,
  trade = 'solar',
  docType = 'invoice',
  wcc,
  onRecordHistory,
}) => {
  // Compute grand total
  const totalAmount = items.reduce((acc, it) => {
    const line = (it.rate || 0) * (it.qty || 1);
    return acc + line * (1 + (it.gst || 0) / 100);
  }, 0);
  const roundedGrandTotal = Math.round(totalAmount);

  // Clean phone number
  const initialPhone = customer.mobile ? customer.mobile.replace(/[^0-9]/g, '').slice(-10) : '';
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('formal');
  const [customTemplateText, setCustomTemplateText] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('nb_whatsapp_custom_template') ||
        `*⚡ {firm_name} — Bill Invoice*\n\n` +
        `Namaste *{customer_name}* ji,\n` +
        `Aapka bill taiyar hai:\n` +
        `📄 Invoice: *{invoice_no}* | Date: *{date}*\n` +
        `💰 Total Amount: *{currency} {grand_total}*\n\n` +
        `UPI se payment karne ke liye yaha click karein: {upi_pay_link}\n\n` +
        `Dhanyawad!\n_{firm_name}_`
      );
    } catch {
      return '';
    }
  });

  const [editableMessage, setEditableMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // UPI pay link
  const upiPayLink = bank.upiId
    ? `upi://pay?pa=${encodeURIComponent(bank.upiId)}&pn=${encodeURIComponent(firm.name || 'Vendor')}&am=${roundedGrandTotal}&cu=INR&tn=${encodeURIComponent(`Inv ${meta.invNo}`)}`
    : '';

  // All Template Definitions
  const templates: TemplateOption[] = [
    {
      id: 'formal',
      title: 'Formal Tax Invoice & Payment Request',
      badge: 'Recommended',
      icon: FileText,
      description: 'Professional invoice notification with bill details, bank account, and polite greeting.',
      template:
        `*⚡ {firm_name} — TAX INVOICE*\n\n` +
        `Namaste *{customer_name}* ji,\n\n` +
        `Aapki purchase ka tax invoice generate ho gaya hai. Kripya neeche diye details check karein:\n\n` +
        `📄 *Invoice No:* {invoice_no}\n` +
        `📅 *Invoice Date:* {date}\n` +
        `📦 *Total Items:* {items_count} items\n` +
        `💰 *Grand Total (incl. GST):* *{currency} {grand_total}*\n\n` +
        `*🏦 Bank Details for Payment:*\n` +
        `• Bank: {bank_name}\n` +
        `• A/C No: {account_no}\n` +
        `• IFSC: {ifsc}\n` +
        (bank.upiId ? `• UPI ID: *{upi_id}*\n` : '') +
        (upiPayLink ? `🔗 Instant UPI Pay Link: {upi_pay_link}\n\n` : '\n') +
        `Kripya payment complete karke acknowledgement slip share karein.\n\n` +
        `Dhanyawad!\n` +
        `*{firm_name}*\n` +
        `📞 Contact: {firm_phone}`,
    },
    {
      id: 'reminder',
      title: 'Friendly Payment Reminder',
      badge: 'Reminder',
      icon: Clock,
      description: 'Polite reminder message for pending invoice payment with quick UPI pay options.',
      template:
        `*🔔 Payment Reminder — {firm_name}*\n\n` +
        `Dear *{customer_name}*,\n\n` +
        `Yeh gentle reminder hai aapke pending Invoice *#{invoice_no}* ke baare me.\n\n` +
        `📄 *Bill Ref:* {invoice_no} (Dated: {date})\n` +
        `💰 *Outstanding Amount:* *{currency} {grand_total}*\n` +
        ((meta as any).dueDate ? `⏳ *Due Date:* {due_date}\n\n` : `\n`) +
        `Aap neeche diye UPI ya Bank A/C ke dwara payment bhej sakte hain:\n` +
        (bank.upiId ? `📲 *UPI ID:* {upi_id}\n` : '') +
        (upiPayLink ? `🔗 *1-Click Pay:* {upi_pay_link}\n` : '') +
        `🏦 *Bank A/C:* {account_no} ({bank_name})\n` +
        `• *IFSC Code:* {ifsc}\n\n` +
        `Agar aapne pehle hi payment bhej diya hai to kripya is message ko ignore karein.\n\n` +
        `Regards,\n` +
        `*{firm_name}* (Ph: {firm_phone})`,
    },
    {
      id: 'solar_dispatch',
      title: 'Solar EPC Installation & PM Surya Ghar Slip',
      badge: 'Solar EPC',
      icon: Sun,
      description: 'Specially structured for Solar EPC projects, net-metering & DISCOM subsidy documentation.',
      template:
        `*☀️ PM SURYA GHAR ROOFTOP SOLAR — DISPATCH & BILL SLIP*\n\n` +
        `Pranam *{customer_name}* ji,\n\n` +
        `Aapke PM Surya Ghar Muft Bijli Yojana rooftop solar plant ka documentation generate ho gaya hai:\n\n` +
        `📄 *Bill / Ref No:* {invoice_no}\n` +
        `⚡ *Plant Capacity:* {plant_capacity}\n` +
        `📅 *Dated:* {date}\n` +
        `💰 *Total Project Amount:* *{currency} {grand_total}*\n\n` +
        `✅ *Includes:* DCR ALMM Solar PV Modules, Grid-Tie Inverter, Structure, Cables & Earthing System.\n` +
        `📋 *WCC & Net-Metering:* All paperwork has been prepared for DISCOM subsidy inspection.\n\n` +
        `*Payment Account:*\n` +
        `• Bank: {bank_name} | A/C: {account_no} | IFSC: {ifsc}\n` +
        (bank.upiId ? `• UPI: {upi_id}\n\n` : '\n') +
        `Warm Regards,\n` +
        `*{firm_name}* (Authorized Solar EPC Vendor)\n` +
        `📞 Helpline: {firm_phone}`,
    },
    {
      id: 'quick_upi',
      title: 'Quick Compact Receipt (1-Tap UPI Pay)',
      badge: 'Fast & Short',
      icon: DollarSign,
      description: 'Short 4-line mobile-friendly receipt with direct clickable UPI payment link.',
      template:
        `*⚡ Bill from {firm_name}*\n` +
        `Hi {customer_name}, your bill *#{invoice_no}* for *{currency} {grand_total}* is ready.\n\n` +
        (bank.upiId ? `📲 Pay via UPI: *{upi_id}*\n` : '') +
        (upiPayLink ? `🔗 Direct Pay Link: {upi_pay_link}\n\n` : '\n') +
        `Thank you for doing business with us! — _{firm_name}_ ({firm_phone})`,
    },
    {
      id: 'custom',
      title: 'Custom Template (Vendor Editable)',
      badge: 'Editable',
      icon: Edit3,
      description: 'Your own personalized template. Edit placeholders and save for future bills.',
      template: customTemplateText,
    },
  ];

  // Helper to resolve placeholders into final text
  const resolvePlaceholders = (rawTemplate: string): string => {
    const replacements: Record<string, string> = {
      '{customer_name}': customer.name || 'Valued Customer',
      '{customer_phone}': customer.mobile || '',
      '{firm_name}': firm.name || 'Our Firm',
      '{firm_phone}': firm.mobile || '',
      '{invoice_no}': meta.invNo || 'INV-001',
      '{date}': meta.date || new Date().toISOString().split('T')[0],
      '{due_date}': (meta as any).dueDate || meta.date || 'Immediate',
      '{grand_total}': formatIntegerINR(roundedGrandTotal),
      '{currency}': currency || '₹',
      '{items_count}': String(items.length || 0),
      '{bank_name}': bank.bankName || 'Bank',
      '{account_no}': bank.accountNo || 'XXXXXXXXXXXX',
      '{ifsc}': bank.ifsc || 'IFSC0000XXX',
      '{upi_id}': bank.upiId || '',
      '{upi_pay_link}': upiPayLink || (bank.upiId ? `upi://pay?pa=${bank.upiId}` : ''),
      '{plant_capacity}': wcc?.plantCapacityKw || '3 kW',
    };

    let result = rawTemplate;
    Object.entries(replacements).forEach(([tag, val]) => {
      result = result.split(tag).join(val);
    });
    return result;
  };

  // Sync template selection to editable message
  useEffect(() => {
    const selected = templates.find((t) => t.id === selectedTemplateId);
    if (selected) {
      setEditableMessage(resolvePlaceholders(selected.template));
    }
  }, [selectedTemplateId, customer, firm, bank, meta, items, currency]);

  // Keep phone in sync if customer changes
  useEffect(() => {
    if (customer.mobile) {
      setRecipientPhone(customer.mobile.replace(/[^0-9]/g, '').slice(-10));
    }
  }, [customer.mobile]);

  if (!isOpen) return null;

  // Insert placeholder tag into custom template
  const handleInsertTag = (tag: string) => {
    if (selectedTemplateId === 'custom') {
      const updated = customTemplateText + tag;
      setCustomTemplateText(updated);
      try {
        localStorage.setItem('nb_whatsapp_custom_template', updated);
      } catch {}
      setEditableMessage(resolvePlaceholders(updated));
    } else {
      setEditableMessage((prev) => prev + ' ' + tag);
    }
  };

  // Send WhatsApp message
  const handleSendWhatsApp = () => {
    if (onRecordHistory) {
      onRecordHistory();
    }

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(editableMessage);
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  };

  // Copy message
  const handleCopy = () => {
    navigator.clipboard.writeText(editableMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save custom template
  const handleSaveCustom = (newText: string) => {
    setCustomTemplateText(newText);
    try {
      localStorage.setItem('nb_whatsapp_custom_template', newText);
    } catch {}
    setEditableMessage(resolvePlaceholders(newText));
  };

  const placeholderTags = [
    '{customer_name}',
    '{invoice_no}',
    '{date}',
    '{grand_total}',
    '{items_count}',
    '{firm_name}',
    '{bank_name}',
    '{account_no}',
    '{ifsc}',
    '{upi_id}',
    '{upi_pay_link}',
    '{plant_capacity}',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-emerald-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Automated WhatsApp Message Generator
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  Instant Customer Invoicing
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose a pre-built template, customize variables, and send live invoice details directly to customer's WhatsApp.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Template Selector & Settings */}
          <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Recipient Phone Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  Recipient WhatsApp Number
                </span>
                <span className="text-[10px] text-slate-400">Auto-filled from bill</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 10-digit customer mobile number"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-12 pr-3 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {recipientPhone.length === 10
                  ? `✅ Direct chat will open for +91 ${recipientPhone}`
                  : `⚠️ Khali chhodne par WhatsApp open hoga jisme aap kisi ko bhi select kar sakte hain.`}
              </p>
            </div>

            {/* Template Selection Tabs */}
            <div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Select Invoicing Template
              </div>
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`w-full text-left rounded-2xl border p-3 transition flex items-start gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                            {tpl.title}
                          </span>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Tag Injector Chips */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Dynamic Placeholders:</span>
                <span className="text-slate-400 font-normal">Click to insert</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {placeholderTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[9.5px] font-mono text-amber-300 hover:border-amber-400 hover:bg-slate-900 transition"
                    title={`Insert ${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Message Preview & Live Editor */}
          <div className="flex-1 flex flex-col bg-slate-900 p-4 sm:p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                Live Message Preview (WhatsApp Format)
              </span>
              <button
                type="button"
                onClick={() => {
                  const selected = templates.find((t) => t.id === selectedTemplateId);
                  if (selected) {
                    setEditableMessage(resolvePlaceholders(selected.template));
                  }
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset to Template Default"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* WhatsApp Styled Chat Box */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b141a] p-4 relative shadow-inner">
              {/* WhatsApp Chat Bubble */}
              <div className="max-w-xl mx-auto rounded-2xl rounded-tr-xs bg-[#005c4b] text-[#e9edef] p-4 shadow-lg text-xs font-sans leading-relaxed relative">
                {/* Message Header info */}
                <div className="border-b border-[#007a64] pb-2 mb-2 flex items-center justify-between text-[10px] text-[#8696a0]">
                  <span>⚡ Message To: {recipientPhone ? `+91 ${recipientPhone}` : 'Selected Contact'}</span>
                  <span>{meta.date}</span>
                </div>

                {/* Editable Text Area inside Chat Bubble */}
                <textarea
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  rows={13}
                  className="w-full bg-transparent text-[#e9edef] text-xs font-sans leading-relaxed focus:outline-none resize-none placeholder-[#8696a0]"
                  placeholder="Your automated message will appear here..."
                />

                <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                  <span>Delivered via Dexon</span>
                  <Check className="h-3 w-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                </button>

                {selectedTemplateId === 'custom' && (
                  <button
                    type="button"
                    onClick={() => handleSaveCustom(editableMessage)}
                    className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition"
                  >
                    💾 Save as Default
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  <span>Send via WhatsApp ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
