export interface InvoiceItem {
  id: number;
  name: string;
  hsn: string;
  gst: number; // 0, 5, 12, 18
  qty: number;
  unit: string; // Pcs., NOS, Set, Mtr., Kg., Job
  buyRate: number; // Buying price without GST
  rate: number; // Selling price without GST
  serialNumbers?: string;
  lineTotal?: number;
  cgst?: number;
  sgst?: number;
  totalWithTax?: number;
}

export interface CustomerInfo {
  name: string;
  relation: string; // S/O or W/O
  address: string;
  mobile: string;
  aadhar: string;
  appNo: string; // PM Surya Ghar Application No
  consumerNo: string; // Discom K-Number / Consumer No
  sanctionLoad: string; // e.g. 5 KW
  gstin: string; // Optional B2B
}

export interface FirmInfo {
  id?: string;
  name: string;
  address: string;
  mobile: string;
  gstin: string;
  email: string;
  tagline: string;
  logo: string;
  pan: string;
  signature?: string; // Digital signature image data URL
}

export interface InvoiceHistoryRecord {
  id: string;
  invNo: string;
  date: string;
  docType: DocType;
  customerName: string;
  customerMobile: string;
  customerGstin?: string;
  plantCapacityKw?: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  tax5Amount: number;
  tax18Amount: number;
  grandTotal: number;
  firmName: string;
  itemsCount: number;
  itemsSnapshot: InvoiceItem[];
  customerSnapshot: CustomerInfo;
  createdAt: string;
}

export interface BankInfo {
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId?: string;
}

export interface TermsInfo {
  declaration: string;
  tnc: string;
}

export type DocType = 'invoice' | 'quotation' | 'wcc' | 'estimate' | 'receipt';

export type IndustryType = 'solar' | 'electrical' | 'automobile' | 'finance' | 'general' | 'bike_spares' | 'hardware' | 'electronics' | 'general_trading';

export type TradeKey = 'solar' | 'bike_spares' | 'electronics' | 'hardware' | 'general_trading' | 'automobile';

export interface MarginReceiptDetails {
  receiptNo: string;
  receiptDate: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  consumerNo: string;
  appNo: string;
  totalProjectDealAmount: number;
  expectedSubsidyAmount: number;
  marginMoneyDue: number;
  amountReceived: number;
  amountReceivedWords?: string;
  balanceRemaining: number;
  paymentMode: 'CASH' | 'UPI' | 'NEFT_RTGS' | 'CHEQUE';
  transactionRef: string;
  notes: string;
  towardsDescription?: string;
}

export interface EstimateSpecRow {
  id: string;
  description: string;
  make: string;
  warranty: string;
}

export interface EstimatePriceRow {
  id: string;
  sn: number;
  description: string;
  taxableAmount: number;
  gstRate: number;
  totalAmount: number;
}

export interface InvoiceMeta {
  invNo: string;
  date: string;
  eway: string;
  quotRef: string;
  placeOfSupply: string;
  reverseCharge: string;
  copyType: 'Original for Recipient' | 'Duplicate for Transporter' | 'Triplicate for Supplier';
}

export interface WccDetails {
  plantCapacityKw: string;
  inverterMake: string;
  inverterSerial: string;
  panelMake: string;
  panelWattage: string;
  panelCount: string;
  completionDate: string;
  discomName: string;
}

export interface QuotationDetails {
  plantCapacityKw: string;
  annualGenerationUnits: number;
  annualSavingsRs: number;
  subsidyAmount: number;
  paybackYears: number;
}

export interface StockItem {
  name: string;
  hsn: string;
  gst: number;
  defaultBuy?: number;
}

export interface LicenseInfo {
  key: string;
  clientName: string;
  clientPhone?: string;
  plan: 'Trial' | 'Pro' | 'Business';
  expiry: string;
  invoiceLimit: number;
  isActive: boolean;
  totalInvoicesGenerated?: number;
  boundDeviceId?: string;
  maxDevices?: number;
  isOfflineFallback?: boolean;
  notes?: string;
}

export type TransactionType = 'INFLOW' | 'OUTFLOW';
export type PaymentMode = 'BANK' | 'CASH' | 'UPI' | 'CHEQUE';

export type BookCategory =
  | 'SALES_INVOICE'
  | 'SOLAR_SUBSIDY'
  | 'CUSTOMER_ADVANCE'
  | 'OTHER_INCOME'
  | 'PANEL_PURCHASE'
  | 'INVERTER_PURCHASE'
  | 'HARDWARE_CABLES'
  | 'LABOR_WAGES'
  | 'FREIGHT_TRANSPORT'
  | 'OFFICE_RENT'
  | 'SALARY_STAFF'
  | 'BANK_CHARGES'
  | 'GST_TAX_PAYMENT'
  | 'OWNER_DRAWING'
  | 'MISC_EXPENSE';

export interface BookEntry {
  id: string;
  date: string;
  particulars: string;
  category: BookCategory;
  type: TransactionType; // 'INFLOW' (Credit) | 'OUTFLOW' (Debit)
  mode: PaymentMode; // 'BANK' | 'CASH' | 'UPI' | 'CHEQUE'
  amount: number;
  refNo?: string; // Cheque / UTR / Invoice No.
  partyName?: string;
  notes?: string;
  source?: 'MANUAL' | 'INVOICE_SYNC' | 'BANK_STATEMENT';
}
