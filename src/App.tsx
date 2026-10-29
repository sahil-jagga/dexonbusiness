import React, { useState, useEffect, useCallback } from 'react';
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
  StockItem,
  LicenseInfo,
  InvoiceHistoryRecord,
  IndustryType,
  TradeKey,
  BookEntry,
  MarginReceiptDetails
} from './types/solar';
import {
  DEFAULT_STOCKS,
  DEFAULT_FIRM,
  DEFAULT_FIRMS_LIST,
  DEFAULT_BANK,
  DEFAULT_TERMS,
  DEFAULT_CUSTOMER,
  DEFAULT_CUSTOMERS_LIST,
  DEFAULT_INVOICE_HISTORY,
  DEFAULT_BOOK_ENTRIES,
  EMPTY_FIRM,
  EMPTY_CUSTOMER,
  EMPTY_BANK,
  INDUSTRY_CATALOGS
} from './data/defaultData';
import { TRADE_CONFIGS, getTradeConfig } from './config/trades';
import { CountryCode, getCountryConfig } from './config/countries';
import { authService, tenantStorage, AuthUser } from './lib/supabase';
import { licenseService, formatIntegerINR } from './services/licenseService';
import { generateDocumentPdf } from './services/pdfService';
import { generateNextInvoiceNumber } from './utils/invoiceNumbering';
import { HeaderNav } from './components/HeaderNav';
import { SidebarCalculator } from './components/SidebarCalculator';
import { CustomerDrawer } from './components/CustomerDrawer';
import { FirmSettingsDrawer } from './components/FirmSettingsDrawer';
import { DocumentViewer } from './components/DocumentViewer';
import { AdminPortalModal } from './components/AdminPortalModal';
import { PublicLandingModal } from './components/PublicLandingModal';
import { UpgradeModal } from './components/UpgradeModal';
import { UnlockModal } from './components/UnlockModal';
import { MultiFirmModal } from './components/MultiFirmModal';
import { CustomerCrmModal } from './components/CustomerCrmModal';
import { Gstr1Modal } from './components/Gstr1Modal';
import { CustomBrandingModal } from './components/CustomBrandingModal';
import { BooksAccountingModal } from './components/BooksAccountingModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { InvoiceThemeDesignerModal } from './components/InvoiceThemeDesignerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TradeSelectionModal } from './components/TradeSelectionModal';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  // License & Modals
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isLandingOpen, setIsLandingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [monthInvoiceCount, setMonthInvoiceCount] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // User & Workspace Account
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Multi-Trade Architecture & Modal
  const [trade, setTrade] = useState<TradeKey>(() => {
    return (localStorage.getItem('nb_selected_trade') as TradeKey) || 'solar';
  });
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isInitialTradeSetup, setIsInitialTradeSetup] = useState(false);

  // Business Suite Modals
  const [isMultiFirmOpen, setIsMultiFirmOpen] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [isGstr1Open, setIsGstr1Open] = useState(false);
  const [isBooksOpen, setIsBooksOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isThemeDesignerOpen, setIsThemeDesignerOpen] = useState(false);

  // App Layout State
  const [docType, setDocType] = useState<DocType>('invoice');
  const [templateStyle, setTemplateStyle] = useState<1 | 2 | 3>(() => {
    try {
      const saved = localStorage.getItem('nb_preferred_theme');
      if (saved === '1' || saved === '2' || saved === '3') {
        return Number(saved) as 1 | 2 | 3;
      }
    } catch {}
    return 1;
  });
  const [activeSidebarTab, setActiveSidebarTab] = useState<'calc' | 'customer' | 'firm'>('calc');
  const [showBuyRates, setShowBuyRates] = useState(true);
  const [currency, setCurrency] = useState('₹');
  const [country, setCountry] = useState<CountryCode>(() => {
    try {
      return (localStorage.getItem('nb_country') as CountryCode) || 'IN';
    } catch {
      return 'IN';
    }
  });

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    const cfg = getCountryConfig(newCountry);
    const sym = cfg.currencySymbol || cfg.currency;
    setCurrency(sym);
    try {
      localStorage.setItem('nb_country', newCountry);
      localStorage.setItem('nb_currency', sym);
    } catch {}
  };

  // Business Data — Clean Initial State (Zero Hardcoded Demo Data Leakage)
  const [targetPrice, setTargetPrice] = useState<number>(180000);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [firm, setFirm] = useState<FirmInfo>(EMPTY_FIRM);
  const [firmsList, setFirmsList] = useState<FirmInfo[]>([]);
  const [customerList, setCustomerList] = useState<CustomerInfo[]>([]);
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceHistoryRecord[]>([]);
  const [bank, setBank] = useState<BankInfo>(EMPTY_BANK);
  const [terms, setTerms] = useState<TermsInfo>(DEFAULT_TERMS);
  const [stockLibrary, setStockLibrary] = useState<StockItem[]>(() => {
    return TRADE_CONFIGS[trade]?.defaultStocks || DEFAULT_STOCKS;
  });
  const [bookEntries, setBookEntries] = useState<BookEntry[]>(() => {
    try {
      const saved = localStorage.getItem('nb_book_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleBookEntriesChange = (newEntries: BookEntry[]) => {
    setBookEntries(newEntries);
    localStorage.setItem('nb_book_entries', JSON.stringify(newEntries));
  };

  // Branding Customization (Persisted Globally)
  const [accentColor, setAccentColor] = useState<string>(() => {
    try {
      return localStorage.getItem('nb_accent_color') || '#1a3a6e';
    } catch {
      return '#1a3a6e';
    }
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    try {
      return localStorage.getItem('nb_watermark') || '';
    } catch {
      return '';
    }
  });

  // Sidebar collapse toggle and Industry selector
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [industry, setIndustry] = useState<IndustryType>(() => {
    return (localStorage.getItem('nb_industry') as IndustryType) || 'solar';
  });

  const [meta, setMeta] = useState<InvoiceMeta>({
    invNo: 'INV/26-27/001',
    date: new Date().toISOString().split('T')[0],
    eway: '',
    quotRef: 'QUOT/2026/001',
    placeOfSupply: 'State (00)',
    reverseCharge: 'No',
    copyType: 'Original for Recipient',
  });

  const [wcc, setWcc] = useState<WccDetails>({
    plantCapacityKw: '3.00 kW',
    inverterMake: 'Solar Grid Inverter 3kW',
    inverterSerial: 'INV-2026-98124',
    panelMake: 'Bifacial DCR 550Wp ALMM',
    panelWattage: '550 Wp',
    panelCount: '6 NOS',
    completionDate: new Date().toISOString().split('T')[0],
    discomName: 'State DISCOM',
  });

  const [quotation, setQuotation] = useState<QuotationDetails>({
    plantCapacityKw: '3 kW',
    annualGenerationUnits: 4380,
    annualSavingsRs: 35000,
    subsidyAmount: 78000,
    paybackYears: 2.8,
  });

  const [marginReceipt, setMarginReceipt] = useState<MarginReceiptDetails>({
    receiptNo: 'REC/26-27/001',
    receiptDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerMobile: '',
    customerAddress: '',
    consumerNo: '',
    appNo: '',
    totalProjectDealAmount: 180000,
    expectedSubsidyAmount: 78000,
    marginMoneyDue: 102000,
    amountReceived: 50000,
    amountReceivedWords: '',
    balanceRemaining: 52000,
    paymentMode: 'CASH',
    transactionRef: 'CASH-SLIP-01',
    notes: 'Received token margin money for PM Surya Ghar Rooftop Solar installation.',
  });

  const [lang, setLang] = useState<'en' | 'hi'>(() => {
    try {
      return (localStorage.getItem('nb_language') as 'en' | 'hi') || 'en';
    } catch {
      return 'en';
    }
  });

  const handleLanguageToggle = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('nb_language', nextLang);
    } catch {}
  };

  const handleCurrencyToggle = () => {
    const currencies = ['₹', 'Rs', '$', 'AED', '£', 'SAR', 'रू', '৳'];
    const currentIdx = currencies.indexOf(currency);
    const nextCurrency = currencies[(currentIdx + 1) % currencies.length];
    setCurrency(nextCurrency);
    try {
      localStorage.setItem('nb_currency', nextCurrency);
    } catch {}
  };

  // -------------------------------------------------------------
  // Initialization & LocalStorage Persistence (Clean User State)
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Check if user has selected a trade; if not, open Trade Selector
    const savedTrade = localStorage.getItem('nb_selected_trade');
    if (!savedTrade) {
      setIsInitialTradeSetup(true);
      setIsTradeModalOpen(true);
    }

    // 2. Load Month Invoices Count
    setMonthInvoiceCount(licenseService.getMonthInvoiceCount());

    // 3. Load Local Data safely without hardcoded demo pollution
    try {
      const savedFirmsList = localStorage.getItem('nb_firms_list');
      if (savedFirmsList) {
        const parsed = JSON.parse(savedFirmsList);
        setFirmsList(parsed);
      }

      let loadedFirm = firm;
      const savedFirm = localStorage.getItem('nb_firm_data');
      if (savedFirm) {
        loadedFirm = JSON.parse(savedFirm);
        setFirm(loadedFirm);
      }

      const savedCustomerList = localStorage.getItem('nb_customer_directory');
      if (savedCustomerList) {
        setCustomerList(JSON.parse(savedCustomerList));
      }

      let loadedHistory: InvoiceHistoryRecord[] = [];
      const savedHistory = localStorage.getItem('nb_invoices_history');
      if (savedHistory) {
        loadedHistory = JSON.parse(savedHistory);
        setInvoicesHistory(loadedHistory);
      }

      // Auto-increment invoice number based on firm settings and history to prevent duplicate entry numbers
      const nextInvNo = generateNextInvoiceNumber(loadedFirm, loadedHistory);
      setMeta((prev) => ({
        ...prev,
        invNo: nextInvNo,
      }));

      const savedAccent = localStorage.getItem('nb_accent_color');
      if (savedAccent) setAccentColor(savedAccent);

      const savedWatermark = localStorage.getItem('nb_watermark');
      if (savedWatermark) setWatermarkText(savedWatermark);

      const savedBank = localStorage.getItem('nb_bank_data');
      if (savedBank) setBank(JSON.parse(savedBank));

      const savedTerms = localStorage.getItem('nb_terms_data');
      if (savedTerms) setTerms(JSON.parse(savedTerms));

      const savedCustomer = localStorage.getItem('nb_customer_data');
      if (savedCustomer) setCustomer(JSON.parse(savedCustomer));

      const savedStocks = localStorage.getItem('nb_stocks_library');
      if (savedStocks) {
        setStockLibrary(JSON.parse(savedStocks));
      } else {
        const currentTrade = (localStorage.getItem('nb_selected_trade') as TradeKey) || 'solar';
        const defaultTradeStocks = TRADE_CONFIGS[currentTrade]?.defaultStocks || DEFAULT_STOCKS;
        setStockLibrary(defaultTradeStocks);
        localStorage.setItem('nb_stocks_library', JSON.stringify(defaultTradeStocks));
      }

      const savedCurrency = localStorage.getItem('nb_currency');
      if (savedCurrency) setCurrency(savedCurrency);

      const savedItems = localStorage.getItem('nb_active_items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (e) {
      console.warn('Initialization cache reading error:', e);
    }

    // 4. Verify License Key
    checkInitialLicense();
  }, []);

  // Sync active items to local cache
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('nb_active_items', JSON.stringify(items));
    }
  }, [items]);

  // Periodic license re-check (checks if key was revoked by admin)
  useEffect(() => {
    const interval = setInterval(async () => {
      const key = license?.key;
      if (key) {
        const res = await licenseService.verifyKey(key);
        if (!res.valid) {
          setLicense(null);
          setIsLandingOpen(true);
          alert(res.message || 'License has been revoked or expired.');
        }
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [license]);

  const loadDefaultItems = () => {
    setItems([
      {
        id: 1,
        name: 'Solar PV Module DCR (ALMM Bifacial 550Wp)',
        hsn: '85414300',
        gst: 5,
        qty: 6,
        unit: 'NOS',
        buyRate: 11000,
        rate: 13500,
        serialNumbers: 'WAAREE-DCR-550W-01 to 06',
      },
      {
        id: 2,
        name: 'Solar Grid-Tied Inverter 3kW (Polycab / Deye)',
        hsn: '85044090',
        gst: 5,
        qty: 1,
        unit: 'Set',
        buyRate: 24000,
        rate: 32000,
        serialNumbers: 'PC-3KW-98124',
      },
      {
        id: 3,
        name: 'MMS GI C-Channel Structure (HDG 80 Micron)',
        hsn: '73089030',
        gst: 18,
        qty: 1,
        unit: 'Set',
        buyRate: 12000,
        rate: 17500,
      },
      {
        id: 4,
        name: 'DC Solar Cable 4 sq.mm Copper (Red & Black)',
        hsn: '85446020',
        gst: 18,
        qty: 60,
        unit: 'Mtr.',
        buyRate: 45,
        rate: 65,
      },
      {
        id: 5,
        name: 'ACDB & DCDB Distribution Box with SPD (IP65)',
        hsn: '85371000',
        gst: 18,
        qty: 1,
        unit: 'Set',
        buyRate: 5000,
        rate: 7200,
      },
      {
        id: 6,
        name: 'Chemical Earthing Kit + 2.25M GI Electrode',
        hsn: '83111000',
        gst: 18,
        qty: 2,
        unit: 'Set',
        buyRate: 3200,
        rate: 4800,
      },
      {
        id: 7,
        name: 'Complete Installation, Testing & Commissioning Charges',
        hsn: '9954',
        gst: 18,
        qty: 1,
        unit: 'Job',
        buyRate: 8000,
        rate: 12000,
      },
    ]);
  };

  const checkInitialLicense = async () => {
    const stored = licenseService.getStoredKey();
    if (stored) {
      const res = await licenseService.verifyKey(stored);
      if (res.valid && res.license) {
        setLicense(res.license);
        return;
      }
    }
    // No valid key found -> show public landing / pricing modal
    setIsLandingOpen(true);
  };

  const handleUnlockWithKey = async (key: string): Promise<{ success: boolean; message?: string }> => {
    const res = await licenseService.verifyKey(key);
    if (res.valid && res.license) {
      setLicense(res.license);
      setIsLandingOpen(false);
      setIsUnlockOpen(false);

      // Onboarding for new client keys: Give clean fresh state and auto-open Firm Info drawer
      const isFreshActivation = !localStorage.getItem(`nb_firm_configured_${key}`) && (firm.name === 'JAGGA ENTERPRISES & CO.' || !firm.name);
      if (isFreshActivation && key !== 'NXB-TRL-DEMO-2812-1A40') {
        const freshFirm: FirmInfo = {
          id: `firm_${Date.now()}`,
          name: res.license.clientName && res.license.clientName !== 'Trial Demo User' && !res.license.clientName.includes('Jagga') ? res.license.clientName : '',
          address: '',
          mobile: res.license.clientPhone || '',
          gstin: '',
          pan: '',
          email: '',
          tagline: '',
          logo: '',
        };
        setFirm(freshFirm);
        setFirmsList([freshFirm]);
        localStorage.setItem('nb_firm_data', JSON.stringify(freshFirm));
        localStorage.setItem('nb_firms_list', JSON.stringify([freshFirm]));
        localStorage.setItem(`nb_firm_configured_${key}`, 'true');

        // Reset items to fresh clean template
        setItems([
          {
            id: 1,
            name: '',
            hsn: '',
            gst: country === 'IN' ? 18 : 5,
            qty: 1,
            unit: 'NOS',
            buyRate: 0,
            rate: 0,
          },
        ]);

        // Auto open Firm Info drawer so the user immediately fills their own company data
        setActiveSidebarTab('firm');
        setIsSidebarCollapsed(false);
      }

      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const handleTryTrial = async () => {
    await handleUnlockWithKey('NXB-TRL-DEMO-2812-1A40');
  };

  // Stock library handlers
  const handleAddStockItem = (newItem: StockItem) => {
    const updated = [newItem, ...stockLibrary.filter((s) => s.name !== newItem.name)];
    setStockLibrary(updated);
    localStorage.setItem('nb_stocks_library', JSON.stringify(updated));
  };

  const handleUpdateStockItem = (updatedItem: StockItem) => {
    const updated = stockLibrary.map((s) => (s.name === updatedItem.name ? updatedItem : s));
    setStockLibrary(updated);
    localStorage.setItem('nb_stocks_library', JSON.stringify(updated));
  };

  const handleDeleteStockItem = (name: string) => {
    const updated = stockLibrary.filter((s) => s.name !== name);
    setStockLibrary(updated);
    localStorage.setItem('nb_stocks_library', JSON.stringify(updated));
  };

  // Safe handler to close admin modal and clean any #/owner or ?admin query params from URL
  const handleCloseAdmin = useCallback(() => {
    setIsAdminOpen(false);
    try {
      const cleanPath = window.location.pathname.replace(/\/(owner|dexonjitender|xyz)/gi, '') || '/';
      window.history.replaceState(null, '', cleanPath);
      if (window.location.hash) {
        window.location.hash = '';
      }
    } catch {}
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminOpen(true);
  }, []);

  // Save Settings handler
  const handleSaveFirmSettings = () => {
    localStorage.setItem('nb_firm_data', JSON.stringify(firm));
    localStorage.setItem('nb_bank_data', JSON.stringify(bank));
    localStorage.setItem('nb_terms_data', JSON.stringify(terms));
    localStorage.setItem('nb_currency', currency);
    alert('✅ Firm and bank details saved successfully!');
  };

  // Record an invoice into historical CRM & GSTR-1 registry
  const recordInvoiceHistory = () => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let tax5Amount = 0;
    let tax18Amount = 0;

    items.forEach((it) => {
      const line = (it.rate || 0) * (it.qty || 1);
      const taxRate = it.gst || 0;
      const taxAmount = line * (taxRate / 100);
      totalTaxable += line;
      if (taxRate === 5) tax5Amount += taxAmount;
      if (taxRate === 18) tax18Amount += taxAmount;
      totalCgst += taxAmount / 2;
      totalSgst += taxAmount / 2;
    });

    const grandTotal = Math.round(totalTaxable + totalCgst + totalSgst);

    const guaranteedInvNo = meta.invNo && meta.invNo.trim()
      ? meta.invNo.trim()
      : generateNextInvoiceNumber(firm, invoicesHistory);

    if (!meta.invNo || meta.invNo !== guaranteedInvNo) {
      setMeta((prev) => ({ ...prev, invNo: guaranteedInvNo }));
    }

    const newRecord: InvoiceHistoryRecord = {
      id: 'inv_' + Date.now(),
      invNo: guaranteedInvNo,
      date: meta.date || new Date().toISOString().split('T')[0],
      docType,
      customerName: customer.name || 'Valued Customer',
      customerMobile: customer.mobile || '',
      customerGstin: customer.gstin || '',
      plantCapacityKw: wcc.plantCapacityKw || '3.00 kW',
      taxableAmount: totalTaxable,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      tax5Amount,
      tax18Amount,
      grandTotal,
      firmName: firm.name,
      itemsCount: items.length,
      itemsSnapshot: [...items],
      customerSnapshot: { ...customer },
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...invoicesHistory.filter((h) => h.invNo !== newRecord.invNo)];
    setInvoicesHistory(updated);
    localStorage.setItem('nb_invoices_history', JSON.stringify(updated));

    // Also auto-add customer to directory if not present
    if (customer.name.trim()) {
      const updatedCusts = [customer, ...customerList.filter((c) => c.name !== customer.name)];
      setCustomerList(updatedCusts);
      localStorage.setItem('nb_customer_directory', JSON.stringify(updatedCusts));
    }

    // Also auto-post sales entry into Books & Daybook
    const existsInBooks = bookEntries.some((b) => b.refNo === newRecord.invNo);
    if (!existsInBooks && newRecord.invNo) {
      const newBookEntry: BookEntry = {
        id: 'sale_' + Date.now(),
        date: newRecord.date,
        particulars: `Tax Invoice Sale: ${newRecord.invNo} (${newRecord.customerName})`,
        category: 'SALES_INVOICE',
        type: 'INFLOW',
        mode: 'BANK',
        amount: newRecord.grandTotal,
        refNo: newRecord.invNo,
        partyName: newRecord.customerName,
        source: 'INVOICE_SYNC',
        notes: `Auto-posted from Billing Engine (${newRecord.itemsCount} items)`,
      };
      const updatedBooks = [newBookEntry, ...bookEntries];
      setBookEntries(updatedBooks);
      localStorage.setItem('nb_book_entries', JSON.stringify(updatedBooks));
    }
  };

  // Direct High-Resolution PDF Download using jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    // Check usage limits
    const check = licenseService.canGenerateInvoice(license);
    if (!check.allowed) {
      setIsUpgradeOpen(true);
      return;
    }

    try {
      setIsGeneratingPdf(true);

      // Record invoice generation
      const newCount = await licenseService.recordInvoiceGenerated(license?.key);
      setMonthInvoiceCount(newCount);

      // Save to CRM history & GSTR-1
      recordInvoiceHistory();

      const docNamePrefix =
        docType === 'invoice'
          ? 'Tax_Invoice'
          : docType === 'quotation'
          ? 'Quotation'
          : docType === 'wcc'
          ? 'WCC'
          : 'Bank_Estimate';
      const cleanCustomer = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${docNamePrefix}_${meta.invNo || 'Doc'}_${cleanCustomer}.pdf`;

      await generateDocumentPdf({
        elementId: 'printable-document',
        filename,
        signatureDataUrl: firm.signature,
      });
    } catch (err) {
      console.error('PDF generation error, falling back to print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print Handler
  const handlePrint = async () => {
    // Check usage limits
    const check = licenseService.canGenerateInvoice(license);
    if (!check.allowed) {
      setIsUpgradeOpen(true);
      return;
    }

    // Record invoice generation
    const newCount = await licenseService.recordInvoiceGenerated(license?.key);
    setMonthInvoiceCount(newCount);

    // Save to CRM history & GSTR-1
    recordInvoiceHistory();

    // Trigger Print
    window.print();
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const totalAmount = items.reduce((acc, it) => {
      const line = (it.rate || 0) * (it.qty || 1);
      return acc + line * (1 + (it.gst || 0) / 100);
    }, 0);

    // Save to CRM history
    recordInvoiceHistory();

    const tradeTitle = TRADE_CONFIGS[trade]?.title || 'Business Invoice';
    const countryCfg = getCountryConfig(country);
    const docLabel =
      docType === 'invoice'
        ? (country === 'IN' ? 'Tax Invoice' : `${countryCfg.taxName} Invoice`)
        : docType === 'quotation'
        ? (trade === 'solar' ? 'Solar Quotation' : `Quotation — ${TRADE_CONFIGS[trade]?.shortName || 'Estimate'}`)
        : docType === 'receipt'
        ? 'Payment / Margin Receipt'
        : 'Estimate';

    const text = encodeURIComponent(
      `*⚡ ${firm.name || 'NexBill'} — ${docLabel}*\n\n` +
      `👤 *Customer:* ${customer.name || 'Valued Customer'}\n` +
      `📄 *Doc No:* ${meta.invNo} | *Date:* ${meta.date}\n` +
      (trade === 'solar' && wcc.plantCapacityKw ? `☀️ *Plant:* ${wcc.plantCapacityKw}\n` : '') +
      `💰 *Grand Total:* ${currency} ${formatIntegerINR(totalAmount)}\n\n` +
      `*Bank Details:*\n` +
      `Bank: ${bank.bankName || 'Available on request'}\n` +
      (bank.accountNo ? `A/C: ${bank.accountNo} | IFSC: ${bank.ifsc}\n` : '') +
      (bank.upiId ? `UPI: ${bank.upiId}\n\n` : '\n') +
      (firm.mobile ? `_Contact: ${firm.mobile}_\n` : '') +
      (trade === 'solar' ? `_PM Surya Ghar Muft Bijli Yojana Vendor_` : `_${tradeTitle} Vendor_`)
    );

    const phone = customer.mobile ? customer.mobile.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Logout key handler
  const handleLogoutKey = () => {
    licenseService.logout();
    setLicense(null);
    setIsLandingOpen(true);
  };

  // Switch key handler for simulator
  const handleSwitchKey = async (key: string) => {
    const res = await licenseService.verifyKey(key);
    if (res.valid && res.license) {
      setLicense(res.license);
      setIsLandingOpen(false);
      alert(`✅ Switched View to: ${res.license.plan} (${res.license.clientName})`);
    } else {
      alert(res.message || 'Key invalid');
    }
  };

  // Multi-Firm Handlers
  const handleSelectFirmFromModal = (selected: FirmInfo) => {
    setFirm(selected);
    localStorage.setItem('nb_firm_data', JSON.stringify(selected));
    const nextInvNo = generateNextInvoiceNumber(selected, invoicesHistory);
    setMeta((prev) => ({ ...prev, invNo: nextInvNo }));
    setIsMultiFirmOpen(false);
  };

  const handleSaveFirmList = (newList: FirmInfo[]) => {
    setFirmsList(newList);
    localStorage.setItem('nb_firms_list', JSON.stringify(newList));
  };

  // Customer CRM Handlers
  const handleSelectCustomerFromCrm = (cust: CustomerInfo) => {
    setCustomer(cust);
    localStorage.setItem('nb_customer_data', JSON.stringify(cust));
    setIsCrmOpen(false);
    alert(`✅ Customer "${cust.name}" loaded into current document!`);
  };

  const handleSaveCustomerList = (newList: CustomerInfo[]) => {
    setCustomerList(newList);
    localStorage.setItem('nb_customer_directory', JSON.stringify(newList));
  };

  const handleLoadInvoiceRecord = (record: InvoiceHistoryRecord) => {
    if (record.itemsSnapshot && record.itemsSnapshot.length > 0) {
      setItems(record.itemsSnapshot);
    }
    if (record.customerSnapshot) {
      setCustomer(record.customerSnapshot);
    }
    setMeta((prev) => ({
      ...prev,
      invNo: record.invNo,
      date: record.date,
    }));
    setIsCrmOpen(false);
    alert(`✅ Loaded past invoice "${record.invNo}" into editor!`);
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const updated = invoicesHistory.filter((h) => h.id !== id);
    setInvoicesHistory(updated);
    localStorage.setItem('nb_invoices_history', JSON.stringify(updated));
  };

  // Branding Customization Handlers
  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('nb_accent_color', color);
  };

  const handleWatermarkTextChange = (text: string) => {
    setWatermarkText(text);
    localStorage.setItem('nb_watermark', text);
  };

  // Trade Selection handler — COMPLETE RESET on trade switch to prevent solar content leakage
  const handleSelectTrade = (newTrade: TradeKey) => {
    setTrade(newTrade);
    setIndustry(newTrade as any);
    localStorage.setItem('nb_selected_trade', newTrade);
    localStorage.setItem('nb_industry', newTrade);

    // Update stock library to match new trade
    const tradeStocks = TRADE_CONFIGS[newTrade]?.defaultStocks || DEFAULT_STOCKS;
    setStockLibrary(tradeStocks);
    localStorage.setItem('nb_stocks_library', JSON.stringify(tradeStocks));

    // 1. Wipe customer and solar specific fields (appNo, consumerNo, sanctionLoad) completely
    const cleanCustomer: CustomerInfo = {
      name: '',
      relation: '',
      mobile: '',
      address: '',
      aadhar: '',
      gstin: '',
      appNo: '',
      consumerNo: '',
      sanctionLoad: '',
    };
    setCustomer(cleanCustomer);
    try {
      localStorage.setItem('nb_customer_data', JSON.stringify(cleanCustomer));
    } catch {}

    // 2. Reset meta & quotation references
    setMeta((prev) => ({
      ...prev,
      quotRef: '',
      eway: '',
    }));

    // 3. Reset target price & quotation
    setTargetPrice(0);

    // 4. Reset items to 1 clean blank row for fresh start (no pre-filled dummy items)
    const countryCfg = getCountryConfig(country);
    const defaultTaxRate = country === 'IN' ? (tradeStocks[0]?.gst || 18) : (countryCfg.availableRates[0] || 0);
    const freshStarter: InvoiceItem[] = [
      {
        id: Date.now(),
        name: '',
        hsn: tradeStocks[0]?.hsn || '',
        gst: defaultTaxRate,
        qty: 1,
        unit: 'NOS',
        buyRate: tradeStocks[0]?.defaultBuy || 0,
        rate: tradeStocks[0]?.defaultBuy ? Math.round(tradeStocks[0].defaultBuy * 1.25) : 0,
        serialNumbers: '',
      },
    ];
    setItems(freshStarter);
    localStorage.setItem('nb_active_items', JSON.stringify(freshStarter));

    // 5. Reset sidebar tab
    setActiveSidebarTab('calc');

    // 6. Auto-switch away from Solar-only doc types if new trade does not support them
    const allowed = TRADE_CONFIGS[newTrade]?.allowedDocTypes || ['invoice', 'quotation'];
    if (!allowed.includes(docType)) {
      setDocType('invoice');
    }
  };

  // Optional Demo Data Loader for Testing & Audit
  const handleLoadDemoSolarData = () => {
    setFirm(DEFAULT_FIRM);
    setFirmsList(DEFAULT_FIRMS_LIST);
    setCustomer(DEFAULT_CUSTOMER);
    setCustomerList(DEFAULT_CUSTOMERS_LIST);
    setInvoicesHistory(DEFAULT_INVOICE_HISTORY);
    setBank(DEFAULT_BANK);
    setTerms(DEFAULT_TERMS);
    setStockLibrary(DEFAULT_STOCKS);
    setTrade('solar');
    setIndustry('solar');
    localStorage.setItem('nb_firm_data', JSON.stringify(DEFAULT_FIRM));
    localStorage.setItem('nb_firms_list', JSON.stringify(DEFAULT_FIRMS_LIST));
    localStorage.setItem('nb_customer_data', JSON.stringify(DEFAULT_CUSTOMER));
    localStorage.setItem('nb_customer_directory', JSON.stringify(DEFAULT_CUSTOMERS_LIST));
    localStorage.setItem('nb_invoices_history', JSON.stringify(DEFAULT_INVOICE_HISTORY));
    localStorage.setItem('nb_selected_trade', 'solar');
    alert('✅ Loaded Jagga Enterprises Solar Demo dataset successfully!');
  };

  // Industry Mode Change handler
  const handleIndustryChange = (newInd: IndustryType) => {
    handleSelectTrade(newInd as TradeKey);
  };

  // New Bill handler (saves current in CRM & History, resets editor)
  const handleNewBill = () => {
    if (items.length > 0) {
      recordInvoiceHistory();
    }
    setItems([]);
    setTargetPrice(0);
    const newInvNo = generateNextInvoiceNumber(firm, invoicesHistory);
    setMeta((prev) => ({
      ...prev,
      invNo: newInvNo,
      date: new Date().toISOString().split('T')[0],
      eway: '',
      quotRef: '',
    }));
    setCustomer({ ...EMPTY_CUSTOMER });
    alert(`✨ New Bill Initialized!\n• Doc No: ${newInvNo}\n• Previous bill safely saved to CRM & Invoices History.`);
  };

  // CSV Bulk Invoices Import handler
  const handleImportInvoicesHistory = (imported: InvoiceHistoryRecord[]) => {
    const existing = [...invoicesHistory];
    const existingNos = new Set(existing.map((h) => h.invNo));
    const filteredNew = imported.filter((rec) => !existingNos.has(rec.invNo));
    const combined = [...filteredNew, ...existing];
    setInvoicesHistory(combined);
    localStorage.setItem('nb_invoices_history', JSON.stringify(combined));
    alert(`✅ ${imported.length} invoices processed: ${filteredNew.length} imported into history, ${imported.length - filteredNew.length} duplicates avoided.`);
  };

  // Global Keyboard Shortcuts (Ctrl+N: New Bill, Ctrl+S: Save, Ctrl+P: Print, Ctrl+D: PDF, Ctrl+H: History/CRM)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();

      if (key === 'n') {
        e.preventDefault();
        handleNewBill();
      } else if (key === 's') {
        e.preventDefault();
        recordInvoiceHistory();
        alert(`💾 Active Bill [${meta.invNo}] saved to CRM, History & Books!`);
      } else if (key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (key === 'd') {
        e.preventDefault();
        handleDownloadPdf();
      } else if (key === 'h') {
        e.preventDefault();
        setIsCrmOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meta.invNo, firm, customer, items, invoicesHistory, license, docType]);

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 font-sans antialiased text-slate-100 overflow-hidden">
      {/* Top Header Navigation */}
      <HeaderNav
        docType={docType}
        onDocTypeChange={setDocType}
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
        templateStyle={templateStyle}
        onTemplateStyleChange={(tpl) => {
          setTemplateStyle(tpl);
          try {
            localStorage.setItem('nb_preferred_theme', String(tpl));
          } catch {}
        }}
        onOpenThemeDesigner={() => setIsThemeDesignerOpen(true)}
        showBuyRates={showBuyRates}
        onToggleBuyRates={() => setShowBuyRates(!showBuyRates)}
        license={license}
        monthInvoiceCount={monthInvoiceCount}
        activeFirm={firm}
        trade={trade}
        onOpenTradeModal={() => setIsTradeModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenMultiFirm={() => setIsMultiFirmOpen(true)}
        onOpenCrm={() => setIsCrmOpen(true)}
        onOpenGstr1={() => setIsGstr1Open(true)}
        onOpenBooks={() => setIsBooksOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenBranding={() => setIsBrandingOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenLicenseChange={() => setIsUnlockOpen(true)}
        onLogoutKey={handleLogoutKey}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        onWhatsAppShare={handleWhatsAppShare}
        onNewBill={handleNewBill}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        lang={lang}
        onLanguageToggle={handleLanguageToggle}
        currency={currency}
        onCurrencyChange={handleCurrencyToggle}
        country={country}
        onCountryChange={handleCountryChange}
      />

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Drawer - Smooth Collapsible */}
        <aside
          className={`transition-all duration-300 ease-in-out shrink-0 h-full overflow-hidden print:hidden border-r border-slate-800 ${
            isSidebarCollapsed ? 'w-0 border-r-0' : 'w-80 sm:w-96'
          }`}
        >
          {activeSidebarTab === 'calc' && (
            <SidebarCalculator
              items={items}
              onItemsChange={setItems}
              targetPrice={targetPrice}
              onTargetPriceChange={setTargetPrice}
              stockLibrary={stockLibrary}
              onAddStockItem={handleAddStockItem}
              onUpdateStockItem={handleUpdateStockItem}
              onDeleteStockItem={handleDeleteStockItem}
              currency={currency}
              country={country}
              trade={trade}
              industry={industry}
              onIndustryChange={handleIndustryChange}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(true)}
            />
          )}

          {activeSidebarTab === 'customer' && (
            <CustomerDrawer
              customer={customer}
              onCustomerChange={(c) => {
                setCustomer(c);
                localStorage.setItem('nb_customer_data', JSON.stringify(c));
              }}
              onOpenCrm={() => setIsCrmOpen(true)}
            />
          )}

          {activeSidebarTab === 'firm' && (
            <FirmSettingsDrawer
              firm={firm}
              onFirmChange={(f) => {
                setFirm(f);
                localStorage.setItem('nb_firm_data', JSON.stringify(f));
              }}
              bank={bank}
              onBankChange={setBank}
              terms={terms}
              onTermsChange={setTerms}
              currency={currency}
              onCurrencyChange={setCurrency}
              license={license}
              onChangeLicense={() => setIsUnlockOpen(true)}
              onSaveAll={handleSaveFirmSettings}
              onOpenMultiFirm={() => setIsMultiFirmOpen(true)}
              onLoadDemoData={handleLoadDemoSolarData}
            />
          )}
        </aside>

        {/* Center Canvas / Document Preview */}
        <main className="flex-1 overflow-y-auto bg-slate-900/60 p-4 sm:p-8 print:p-0 print:bg-white print:overflow-visible">
          <div id="printable-document" className="w-full">
            <DocumentViewer
              docType={docType}
              templateStyle={templateStyle}
              showBuyRates={showBuyRates}
              currency={currency}
              items={items}
              onItemsChange={setItems}
              customer={customer}
              onCustomerChange={setCustomer}
              firm={firm}
              bank={bank}
              terms={terms}
              meta={meta}
              onMetaChange={setMeta}
              wcc={wcc}
              onWccChange={setWcc}
              quotation={quotation}
              onQuotationChange={setQuotation}
              marginReceipt={marginReceipt}
              onMarginReceiptChange={setMarginReceipt}
              stockLibrary={stockLibrary}
              accentColor={accentColor}
              watermarkText={watermarkText}
              trade={trade}
              country={country}
              lang={lang}
            />
          </div>
        </main>
      </div>

      {/* Business Feature 1: Multi-Firm Manager Modal (Unlimited Firms) */}
      <MultiFirmModal
        isOpen={isMultiFirmOpen}
        onClose={() => setIsMultiFirmOpen(false)}
        firmsList={firmsList}
        activeFirm={firm}
        onSelectFirm={handleSelectFirmFromModal}
        onSaveFirmList={handleSaveFirmList}
        isBusinessPlan={license?.plan === 'Business'}
        plan={license?.plan || 'Trial'}
        onUpgradePrompt={() => {
          setIsMultiFirmOpen(false);
          setIsUpgradeOpen(true);
        }}
      />

      {/* Business Feature 2: Customer Database CRM & Invoices History Modal */}
      <CustomerCrmModal
        isOpen={isCrmOpen}
        onClose={() => setIsCrmOpen(false)}
        customerList={customerList}
        onSaveCustomerList={handleSaveCustomerList}
        onSelectCustomer={handleSelectCustomerFromCrm}
        invoicesHistory={invoicesHistory}
        onLoadInvoiceRecord={handleLoadInvoiceRecord}
        onDeleteHistoryRecord={handleDeleteHistoryRecord}
        onImportInvoicesHistory={handleImportInvoicesHistory}
      />

      {/* Business Feature 3: Monthly GST Return Export (GSTR-1 Format) */}
      <Gstr1Modal
        isOpen={isGstr1Open}
        onClose={() => setIsGstr1Open(false)}
        invoicesHistory={invoicesHistory}
        firmName={firm.name}
      />

      {/* Business Feature: Books Maintain, Day Book, Bank Statement Parser & ITR */}
      <ErrorBoundary fallbackTitle="Books & Daybook Ledger">
        <BooksAccountingModal
          isOpen={isBooksOpen}
          onClose={() => setIsBooksOpen(false)}
          entries={bookEntries}
          onEntriesChange={handleBookEntriesChange}
          invoicesHistory={invoicesHistory}
          firmName={firm?.name || 'My Business Firm'}
          trade={trade}
        />
      </ErrorBoundary>

      {/* Global Invoice Theme Designer Studio Modal */}
      <InvoiceThemeDesignerModal
        isOpen={isThemeDesignerOpen}
        onClose={() => setIsThemeDesignerOpen(false)}
        activeTheme={templateStyle}
        onThemeSelect={(tpl) => {
          setTemplateStyle(tpl);
          try {
            localStorage.setItem('nb_preferred_theme', String(tpl));
          } catch {}
        }}
        accentColor={accentColor}
        onAccentColorChange={handleAccentColorChange}
        watermarkText={watermarkText}
        onWatermarkTextChange={handleWatermarkTextChange}
        firm={firm}
      />

      {/* Enterprise Feature: JSON Disaster Backup, Restore, Excel CSV & Claude Source Export */}
      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataRestored={() => window.location.reload()}
      />

      {/* Business Feature 4: Custom Branding & 24x7 Priority Support Modal */}
      <CustomBrandingModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        accentColor={accentColor}
        onAccentColorChange={handleAccentColorChange}
        watermarkText={watermarkText}
        onWatermarkTextChange={handleWatermarkTextChange}
        isBusinessPlan={license?.plan === 'Business'}
      />

      {/* Public Sales / Landing Modal */}
      <PublicLandingModal
        isOpen={isLandingOpen}
        onUnlockWithKey={handleUnlockWithKey}
        onTryTrial={handleTryTrial}
        currentIndustry={industry}
        onSelectIndustry={handleIndustryChange}
        country={country}
        onCountryChange={handleCountryChange}
        onOpenAdmin={() => {
          setIsLandingOpen(false);
          handleOpenAdmin();
        }}
      />

      {/* Owner / Admin License Manager Modal */}
      <AdminPortalModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        onLicenseChanged={checkInitialLicense}
        onSwitchKey={handleSwitchKey}
        onLogout={handleLogoutKey}
      />

      {/* Upgrade Modal (Shown when trial limits hit) */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onEnterKey={() => setIsUnlockOpen(true)}
      />

      {/* Change / Re-enter License Key Modal */}
      <UnlockModal
        isOpen={isUnlockOpen}
        onClose={() => setIsUnlockOpen(false)}
        onVerifyKey={handleUnlockWithKey}
      />

      {/* Multi-Trade Onboarding & Switcher Modal */}
      <TradeSelectionModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setIsInitialTradeSetup(false);
        }}
        activeTrade={trade}
        onSelectTrade={handleSelectTrade}
        isInitialSetup={isInitialTradeSetup}
      />

      {/* User Session & Tenant Database Workspace Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(usr) => setCurrentUser(usr)}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
