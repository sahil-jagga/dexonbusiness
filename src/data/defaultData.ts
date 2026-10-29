import { StockItem, FirmInfo, BankInfo, TermsInfo, CustomerInfo, InvoiceHistoryRecord, InvoiceItem, BookEntry } from '../types/solar';

export const DEFAULT_STOCKS: StockItem[] = [
  { name: 'Solar PV Module DCR (ALMM Bifacial 550Wp)', hsn: '85414300', gst: 5, defaultBuy: 11000, quantity: 24, minStock: 10, unit: 'NOS' },
  { name: 'Solar PV Module Non-DCR (Mono PERC)', hsn: '85414300', gst: 5, defaultBuy: 8500, quantity: 4, minStock: 8, unit: 'NOS' }, // Low Stock!
  { name: 'Solar Grid-Tied Inverter 3kW (Polycab / Deye)', hsn: '85044090', gst: 5, defaultBuy: 24000, quantity: 1, minStock: 3, unit: 'Set' }, // Low Stock!
  { name: 'Solar Grid-Tied Inverter 5kW (Polycab / Growatt)', hsn: '85044090', gst: 5, defaultBuy: 33000, quantity: 4, minStock: 2, unit: 'Set' },
  { name: 'Solar Grid-Tied Inverter 10kW 3-Phase (Polycab / Sungrow)', hsn: '85044090', gst: 5, defaultBuy: 52000, quantity: 0, minStock: 2, unit: 'Set' }, // Out of Stock!
  { name: 'MMS GI C-Channel Structure (HDG 80 Micron)', hsn: '73089030', gst: 18, defaultBuy: 12000, quantity: 12, minStock: 5, unit: 'Set' },
  { name: 'C-Channel 4" & 3" HDG (GI)', hsn: '73063090', gst: 18, defaultBuy: 4500, quantity: 25, minStock: 10, unit: 'Pcs.' },
  { name: 'Base Plate & Hardware Kit 150x150x6 MM', hsn: '73061011', gst: 18, defaultBuy: 2200, quantity: 15, minStock: 6, unit: 'Set' },
  { name: 'DC Solar Cable 4 sq.mm Copper (Red & Black)', hsn: '85446020', gst: 18, defaultBuy: 3500, quantity: 300, minStock: 100, unit: 'Mtr.' },
  { name: 'AC Armoured Multistrand Cable 4 Core Copper', hsn: '85446020', gst: 18, defaultBuy: 3200, quantity: 150, minStock: 50, unit: 'Mtr.' },
  { name: 'ACDB Distribution Box with SPD (IP65)', hsn: '85371000', gst: 18, defaultBuy: 2800, quantity: 2, minStock: 4, unit: 'Set' }, // Low Stock!
  { name: 'DCDB Distribution Box with SPD (IP65)', hsn: '85371000', gst: 18, defaultBuy: 2600, quantity: 6, minStock: 4, unit: 'Set' },
  { name: 'Net Meter Box 1-Phase / 3-Phase Discom Standard', hsn: '85371000', gst: 18, defaultBuy: 1800, quantity: 8, minStock: 3, unit: 'Set' },
  { name: 'Lightning Arrester (Copper Bonded with Spike)', hsn: '85354010', gst: 18, defaultBuy: 1600, quantity: 5, minStock: 2, unit: 'Set' },
  { name: 'Earthing Electrode 2.25 Mtr (Pure Copper Coated)', hsn: '83111000', gst: 18, defaultBuy: 3200, quantity: 1, minStock: 4, unit: 'Set' }, // Low Stock!
  { name: 'Backfill Chemical Compound Bag 25 KG', hsn: '73089090', gst: 18, defaultBuy: 1100, quantity: 14, minStock: 5, unit: 'Bag' },
  { name: 'Heavy Duty PVC Conduit Pipe & Accessories', hsn: '392690', gst: 18, defaultBuy: 1500, quantity: 40, minStock: 15, unit: 'Pcs.' },
  { name: 'Complete Installation, Testing & Commissioning Charges', hsn: '9954', gst: 18, defaultBuy: 8000, quantity: 999, minStock: 0, unit: 'Job' },
  { name: 'Net Metering Discom Documentation & Liasioning Service', hsn: '9983', gst: 18, defaultBuy: 3000, quantity: 999, minStock: 0, unit: 'Job' },
];

export const EMPTY_FIRM: FirmInfo = {
  id: 'firm_primary',
  name: 'My Business Firm',
  address: '',
  mobile: '',
  gstin: '',
  pan: '',
  email: '',
  tagline: '',
  logo: '',
};

export const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
  relation: '',
  address: '',
  mobile: '',
  aadhar: '',
  appNo: '',
  consumerNo: '',
  sanctionLoad: '',
  gstin: '',
};

export const EMPTY_BANK: BankInfo = {
  bankName: '',
  accountNo: '',
  ifsc: '',
  branch: '',
  upiId: '',
};

export const DEFAULT_FIRM: FirmInfo = {
  id: 'firm_1',
  name: 'JAGGA ENTERPRISES & CO.',
  address: 'Vinoba Basti 390B, Near TLT Coaching Centre, Sri Ganganagar, Rajasthan - 335001',
  mobile: '94298-42000 | 94283-42000',
  gstin: '08ERPPK7078L1ZS',
  pan: 'ERPPK7078L',
  email: 'jaggaenterprises.solar@gmail.com',
  tagline: 'Solar Energy Solutions | PM Surya Ghar: Muft Bijli Yojana Empanelled Vendor',
  logo: '',
};

export const DEFAULT_FIRMS_LIST: FirmInfo[] = [
  DEFAULT_FIRM,
  {
    id: 'firm_2',
    name: 'JAGGA SOLAR ENERGY PVT LTD',
    address: 'Near Industrial Area, Suratgarh Road, Sri Ganganagar, Rajasthan - 335001',
    mobile: '94298-42000 | 94283-42000',
    gstin: '08AABCJ1234F1Z5',
    pan: 'AABCJ1234F',
    email: 'info@jaggasolar.com',
    tagline: 'Commercial & Megawatt Rooftop EPC Contracting | ISO 9001:2015 Certified',
    logo: '',
  },
  {
    id: 'firm_3',
    name: 'SURYA SHAKTI EPC SOLUTIONS',
    address: 'Hanumangarh Junction Road, Sector 3, Rajasthan - 335512',
    mobile: '94298-42000',
    gstin: '08BAPPM9876Q1Z8',
    pan: 'BAPPM9876Q',
    email: 'contact@suryashaktiepc.in',
    tagline: 'Residential & Agricultural Solar Pumping Systems Specialist',
    logo: '',
  },
];

export const DEFAULT_BANK: BankInfo = {
  bankName: 'Punjab National Bank',
  accountNo: '6156002100006195',
  ifsc: 'PUNB0615600',
  branch: 'Sadhuali Cantt, Sri Ganganagar',
  upiId: '9429842000@pnb',
};

export const DEFAULT_TERMS: TermsInfo = {
  declaration:
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. All solar PV modules carry 25 years performance warranty, and solar inverters carry 5-8 years manufacturer warranty. PM Surya Ghar subsidy is directly credited by Govt. of India to customer bank account.',
  tnc: '1. E.&O.E. (Errors & Omissions Excepted). 2. Goods once sold will not be returned or exchanged. 3. Subject to Sri Ganganagar Jurisdiction only. 4. Grid connectivity and Net Meter sync subject to DISCOM policy.',
};

export const DEFAULT_CUSTOMER: CustomerInfo = {
  name: 'Sh. Rajesh Kumar Verma',
  relation: 'S/O Rameshwar Dayal Verma',
  address: 'House No. 44, Purani Abadi, Ward No. 12, Sri Ganganagar, Rajasthan - 335001',
  mobile: '98290-XXXXX',
  aadhar: 'XXXX-XXXX-8941',
  appNo: 'RJ-SG-2026-789104',
  consumerNo: '1402/2390/4910',
  sanctionLoad: '3.00 kW',
  gstin: '',
};

export const DEFAULT_CUSTOMERS_LIST: CustomerInfo[] = [
  DEFAULT_CUSTOMER,
  {
    name: 'Smt. Sunita Devi Sharma',
    relation: 'W/O Surender Kumar Sharma',
    address: 'Plot No. 18, Ridhi Sidhi Enclave, Sri Ganganagar, Rajasthan - 335001',
    mobile: '94140-54321',
    aadhar: 'XXXX-XXXX-3412',
    appNo: 'RJ-SG-2026-892110',
    consumerNo: '1402/5512/9810',
    sanctionLoad: '2.00 kW',
    gstin: '',
  },
  {
    name: 'M/s Agarwal Mills & Cold Storage',
    relation: 'Prop. Sh. Ashok Agarwal',
    address: 'Industrial Area Phase 2, Sri Ganganagar, Rajasthan - 335001',
    mobile: '98280-99887',
    aadhar: 'XXXX-XXXX-7721',
    appNo: 'RJ-SG-2026-904123',
    consumerNo: '1402/8821/1102',
    sanctionLoad: '10.00 kW',
    gstin: '08AAACA5555M1Z2',
  },
];

export const DEFAULT_INVOICE_HISTORY: InvoiceHistoryRecord[] = [
  {
    id: 'hist_1',
    invNo: 'JE/26-27/001',
    date: '2026-10-15',
    docType: 'invoice',
    customerName: 'Sh. Rajesh Kumar Verma',
    customerMobile: '98290-XXXXX',
    customerGstin: '',
    plantCapacityKw: '3.00 kW',
    taxableAmount: 165000,
    cgstAmount: 7500,
    sgstAmount: 7500,
    tax5Amount: 5775,
    tax18Amount: 9225,
    grandTotal: 180000,
    firmName: 'JAGGA ENTERPRISES & CO.',
    itemsCount: 7,
    itemsSnapshot: [],
    customerSnapshot: DEFAULT_CUSTOMER,
    createdAt: '2026-10-15T10:30:00.000Z',
  },
  {
    id: 'hist_2',
    invNo: 'JE/26-27/002',
    date: '2026-10-18',
    docType: 'invoice',
    customerName: 'Smt. Sunita Devi Sharma',
    customerMobile: '94140-54321',
    customerGstin: '',
    plantCapacityKw: '2.00 kW',
    taxableAmount: 114500,
    cgstAmount: 5250,
    sgstAmount: 5250,
    tax5Amount: 4000,
    tax18Amount: 6500,
    grandTotal: 125000,
    firmName: 'JAGGA ENTERPRISES & CO.',
    itemsCount: 6,
    itemsSnapshot: [],
    customerSnapshot: DEFAULT_CUSTOMERS_LIST[1],
    createdAt: '2026-10-18T14:15:00.000Z',
  },
  {
    id: 'hist_3',
    invNo: 'JE/26-27/003',
    date: '2026-10-20',
    docType: 'invoice',
    customerName: 'M/s Agarwal Mills & Cold Storage',
    customerMobile: '98280-99887',
    customerGstin: '08AAACA5555M1Z2',
    plantCapacityKw: '10.00 kW',
    taxableAmount: 440000,
    cgstAmount: 20000,
    sgstAmount: 20000,
    tax5Amount: 15400,
    tax18Amount: 24600,
    grandTotal: 480000,
    firmName: 'JAGGA ENTERPRISES & CO.',
    itemsCount: 9,
    itemsSnapshot: [],
    customerSnapshot: DEFAULT_CUSTOMERS_LIST[2],
    createdAt: '2026-10-20T16:45:00.000Z',
  },
];

export const PM_SURYA_GHAR_SUBSIDY_TABLE = [
  { kw: 1, centralSubsidy: 30000, recommendedCost: 65000 },
  { kw: 2, centralSubsidy: 60000, recommendedCost: 125000 },
  { kw: 3, centralSubsidy: 78000, recommendedCost: 175000 },
  { kw: 4, centralSubsidy: 78000, recommendedCost: 220000 },
  { kw: 5, centralSubsidy: 78000, recommendedCost: 265000 },
];

// Helper: Dynamic Solar Kit Generator for ANY kW (1 kW to 50 kW)
export const generateSolarKitForKw = (kw: number): { targetPrice: number; items: InvoiceItem[] } => {
  const safeKw = Math.max(0.5, Number(kw) || 3);
  const panelCount = Math.ceil((safeKw * 1000) / 550);
  const cableMtrs = safeKw <= 3 ? 60 : safeKw <= 5 ? 100 : Math.round(safeKw * 22);
  const earthingSets = safeKw <= 3 ? 2 : safeKw <= 6 ? 3 : 4;

  const targetPrice =
    safeKw <= 1
      ? 65000
      : safeKw <= 2
      ? 125000
      : safeKw <= 3
      ? 175000
      : safeKw <= 5
      ? Math.round(safeKw * 57000)
      : Math.round(safeKw * 50000);

  const panelBuy = 11000;
  const panelSell = Math.round(panelBuy * 1.25);

  const invBuy = Math.round(safeKw * 8000 + 4000);
  const invSell = Math.round(invBuy * 1.3);

  const structBuy = Math.round(safeKw * 4000);
  const structSell = Math.round(structBuy * 1.35);

  const cableBuy = 45;
  const cableSell = 65;

  const dcdbBuy = safeKw > 5 ? 7500 : 5000;
  const dcdbSell = Math.round(dcdbBuy * 1.35);

  const earthBuy = 3200;
  const earthSell = 4600;

  const laborBuy = Math.round(safeKw * 2500 + 1500);
  const laborSell = Math.round(laborBuy * 1.4);

  const items: InvoiceItem[] = [
    {
      id: 1,
      name: `Solar PV Module DCR ALMM Bifacial 550Wp (${panelCount} Nos)`,
      hsn: '85414300',
      gst: 5,
      qty: panelCount,
      unit: 'NOS',
      buyRate: panelBuy,
      rate: panelSell,
      serialNumbers: `WAAREE-DCR-550W-01 to ${String(panelCount).padStart(2, '0')}`,
    },
    {
      id: 2,
      name: `Solar Grid-Tied Inverter ${safeKw}kW (Polycab / Deye / Growatt)`,
      hsn: '85044090',
      gst: 5,
      qty: 1,
      unit: 'Set',
      buyRate: invBuy,
      rate: invSell,
      serialNumbers: `POLYCAB-INV-${safeKw}KW-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    {
      id: 3,
      name: `MMS GI C-Channel Structure Kit (${safeKw}kW HDG 80 Micron)`,
      hsn: '73089030',
      gst: 18,
      qty: 1,
      unit: 'Set',
      buyRate: structBuy,
      rate: structSell,
    },
    {
      id: 4,
      name: 'DC Solar Cable 4 sq.mm Copper (Red & Black UV Resistant)',
      hsn: '85446020',
      gst: 18,
      qty: cableMtrs,
      unit: 'Mtr.',
      buyRate: cableBuy,
      rate: cableSell,
    },
    {
      id: 5,
      name: 'ACDB & DCDB Distribution Box with SPD & MCB Protection (IP65)',
      hsn: '85371000',
      gst: 18,
      qty: 1,
      unit: 'Set',
      buyRate: dcdbBuy,
      rate: dcdbSell,
    },
    {
      id: 6,
      name: 'Chemical Earthing Kit + 2.25M GI Electrode & Compound',
      hsn: '83111000',
      gst: 18,
      qty: earthingSets,
      unit: 'Set',
      buyRate: earthBuy,
      rate: earthSell,
    },
    {
      id: 7,
      name: `Complete Installation, Testing & DISCOM Net-Metering Commissioning (${safeKw}kW)`,
      hsn: '9954',
      gst: 18,
      qty: 1,
      unit: 'Job',
      buyRate: laborBuy,
      rate: laborSell,
    },
  ];

  return { targetPrice, items };
};

// Multi-Industry Stock Presets & Ready Kits
export const INDUSTRY_CATALOGS = {
  solar: {
    label: '☀️ Solar EPC & Rooftop',
    desc: 'PM Surya Ghar 70:30 Rule, Panels, Inverters, Structures & WCC',
    defaultStocks: DEFAULT_STOCKS,
  },
  electrical: {
    label: '⚡ Electricals, Wire & Hardware',
    desc: 'Polycab/Havells Wires, MCB, Switches, Cables, Conduits & Lighting',
    defaultStocks: [
      { name: 'Polycab 2.5 sq.mm FR Multistrand Copper Wire 90M', hsn: '85444990', gst: 18, defaultBuy: 2200 },
      { name: 'Polycab 1.5 sq.mm FR Copper Wire 90M Roll', hsn: '85444990', gst: 18, defaultBuy: 1450 },
      { name: 'Havells 32A Double Pole MCB C-Curve', hsn: '85362030', gst: 18, defaultBuy: 420 },
      { name: 'Havells 16A Single Pole MCB C-Curve', hsn: '85362030', gst: 18, defaultBuy: 160 },
      { name: 'Anchor Roma 6A Modular Switch (White)', hsn: '85365020', gst: 18, defaultBuy: 28 },
      { name: 'Anchor Roma 16A Power Socket + Switch Combined', hsn: '85366910', gst: 18, defaultBuy: 140 },
      { name: 'PVC Conduit Pipe 25mm Medium (3 Mtr Length)', hsn: '39172310', gst: 18, defaultBuy: 65 },
      { name: 'Crompton 1200mm High Speed Ceiling Fan', hsn: '84145120', gst: 18, defaultBuy: 1650 },
      { name: 'Philips 15W Round LED Concealed Panel Light', hsn: '94054090', gst: 18, defaultBuy: 280 },
      { name: '8-Way SPN Distribution Board (Metal Enclosure)', hsn: '85371000', gst: 18, defaultBuy: 750 },
      { name: 'Complete Residential Internal Wiring & Testing Labor Charges', hsn: '9954', gst: 18, defaultBuy: 7000 },
    ],
  },
  automobile: {
    label: '🏍️ Automobile & Bike / Spares',
    desc: 'Engine Oils, Batteries, Tyres, Helmets, Spare Parts & Servicing',
    defaultStocks: [
      { name: 'Castrol Activ 4T 20W-40 1 Litre Engine Oil', hsn: '27101980', gst: 18, defaultBuy: 340 },
      { name: 'Motul 7100 4T 10W-50 1L Fully Synthetic Oil', hsn: '27101980', gst: 18, defaultBuy: 680 },
      { name: 'Exide Xpress 12V 5Ah Two-Wheeler Maintenance Free Battery', hsn: '85071000', gst: 28, defaultBuy: 1100 },
      { name: 'MRF Nylogrip Zapper 100/90-17 Rear Tubeless Bike Tyre', hsn: '40114010', gst: 28, defaultBuy: 1750 },
      { name: 'Front & Rear Brake Shoe Set (Bajaj / Hero Genuine)', hsn: '87141090', gst: 28, defaultBuy: 220 },
      { name: 'Rolon Heavy Duty Chain & Sprocket Kit', hsn: '87141090', gst: 28, defaultBuy: 950 },
      { name: 'Bosch Spark Plug Twin Electrode', hsn: '85111000', gst: 18, defaultBuy: 110 },
      { name: 'Studds Ninja Full Face Helmet (ISI Certified)', hsn: '65061000', gst: 18, defaultBuy: 1250 },
      { name: 'General Bike Periodic Service, Carburetor Clean & Tuning', hsn: '9987', gst: 18, defaultBuy: 350 },
    ],
  },
  finance: {
    label: '💰 Finance, CA & Services',
    desc: 'Consultancy Fees, Loan Processing, Audit, GST Filing & Legal',
    defaultStocks: [
      { name: 'Commercial & Home Loan Processing & Advisory Charges', hsn: '997159', gst: 18, defaultBuy: 5000 },
      { name: 'Detailed Project Report (DPR) & CMA Data Preparation for Bank', hsn: '998311', gst: 18, defaultBuy: 10000 },
      { name: 'Monthly GST Return Filing & Reconciliation Services', hsn: '998231', gst: 18, defaultBuy: 2500 },
      { name: 'Statutory Income Tax Audit & Balance Sheet Certification', hsn: '998222', gst: 18, defaultBuy: 12000 },
      { name: 'Private Limited / LLP Company Registration Fee', hsn: '998211', gst: 18, defaultBuy: 8000 },
      { name: 'Trademark & Brand Intellectual Property Filing Service', hsn: '998399', gst: 18, defaultBuy: 6500 },
    ],
  },
  general: {
    label: '🏢 General Trading & Wholesale',
    desc: 'Multi-purpose Goods, Retail Products, Trading with Custom GST',
    defaultStocks: [
      { name: 'Standard Wholesale Commercial Goods Lot', hsn: '999999', gst: 18, defaultBuy: 10000 },
      { name: 'Packaging, Freight & Handling Charges', hsn: '9965', gst: 18, defaultBuy: 1500 },
      { name: 'Hardware & Consumable Assortment Set', hsn: '7318', gst: 18, defaultBuy: 2500 },
      { name: 'Annual Maintenance & Support Contract (AMC)', hsn: '9987', gst: 18, defaultBuy: 5000 },
    ],
  },
};

export const DEFAULT_BOOK_ENTRIES: BookEntry[] = [
  {
    id: 'book_1',
    date: '2026-04-02',
    particulars: 'Sale: 3kW Solar Rooftop Installation (Tax Inv JE/26-27/001)',
    category: 'SALES_INVOICE',
    type: 'INFLOW',
    mode: 'BANK',
    amount: 180000,
    refNo: 'JE/26-27/001',
    partyName: 'RAMESH KUMAR SHARMA',
    source: 'INVOICE_SYNC',
    notes: 'Surya Ghar Rooftop commissioning payment received via NEFT',
  },
  {
    id: 'book_2',
    date: '2026-04-05',
    particulars: 'Purchase: Waaree ALMM DCR Bifacial 550Wp Modules (12 NOS)',
    category: 'PANEL_PURCHASE',
    type: 'OUTFLOW',
    mode: 'BANK',
    amount: 98400,
    refNo: 'WAAREE/INV/2026/891',
    partyName: 'Waaree Solar Distributor',
    source: 'MANUAL',
    notes: 'DCR Tier-1 Solar Panels for residential projects',
  },
  {
    id: 'book_3',
    date: '2026-04-08',
    particulars: 'Purchase: Polycab 3kW & 5kW On-Grid Inverters',
    category: 'INVERTER_PURCHASE',
    type: 'OUTFLOW',
    mode: 'BANK',
    amount: 49500,
    refNo: 'INV-PLY-7712',
    partyName: 'Polycab Electricals & Solar',
    source: 'MANUAL',
    notes: 'String inverters with WiFi datalogger',
  },
  {
    id: 'book_4',
    date: '2026-04-10',
    particulars: 'GI C-Channel Structure, Base Plates & Stainless Steel Fasteners',
    category: 'HARDWARE_CABLES',
    type: 'OUTFLOW',
    mode: 'CASH',
    amount: 14500,
    refNo: 'CASH-REC-104',
    partyName: 'Suratgarh Hardware Traders',
    source: 'MANUAL',
    notes: 'HDG 80 Micron heavy structure fabrication material',
  },
  {
    id: 'book_5',
    date: '2026-04-12',
    particulars: 'Labor & Rooftop Mounting Installation Charges Paid to Electrician Team',
    category: 'LABOR_WAGES',
    type: 'OUTFLOW',
    mode: 'CASH',
    amount: 12000,
    refNo: 'VOUCHER-081',
    partyName: 'Site Installation Team (Mohan & Team)',
    source: 'MANUAL',
    notes: '3kW site installation, chemical earthing & wiring',
  },
  {
    id: 'book_6',
    date: '2026-04-14',
    particulars: 'Customer Token Advance for 5kW Solar System',
    category: 'CUSTOMER_ADVANCE',
    type: 'INFLOW',
    mode: 'UPI',
    amount: 35000,
    refNo: 'UPI/20260414981',
    partyName: 'Suresh Verma (Hanumangarh)',
    source: 'MANUAL',
    notes: 'Advance booking amount for subsidy rooftop project',
  },
  {
    id: 'book_7',
    date: '2026-04-15',
    particulars: 'Vehicle Fuel & Tempo Freight for Solar Panel Transportation',
    category: 'FREIGHT_TRANSPORT',
    type: 'OUTFLOW',
    mode: 'CASH',
    amount: 2800,
    refNo: 'PETROL-PUMP-BILL',
    partyName: 'Local Transport & Delivery',
    source: 'MANUAL',
    notes: 'Site delivery of modules and inverters',
  },
  {
    id: 'book_8',
    date: '2026-04-18',
    particulars: 'Direct Central Solar Subsidy DBT Credited via DISCOM Net-Meter',
    category: 'SOLAR_SUBSIDY',
    type: 'INFLOW',
    mode: 'BANK',
    amount: 78000,
    refNo: 'DBT/MNRE/2026/8124',
    partyName: 'MNRE / PM Surya Ghar DBT Portal',
    source: 'BANK_STATEMENT',
    notes: 'Direct beneficiary subsidy processed after meter sync',
  },
  {
    id: 'book_9',
    date: '2026-04-20',
    particulars: 'Commercial Office / Godown Monthly Rent',
    category: 'OFFICE_RENT',
    type: 'OUTFLOW',
    mode: 'BANK',
    amount: 8500,
    refNo: 'NEFT-RENT-APR26',
    partyName: 'Building Owner',
    source: 'MANUAL',
    notes: 'Office and solar panel godown rent',
  },
  {
    id: 'book_10',
    date: '2026-04-22',
    particulars: 'Bank Current Account Maintenance & SMS Service Charges',
    category: 'BANK_CHARGES',
    type: 'OUTFLOW',
    mode: 'BANK',
    amount: 885,
    refNo: 'CHG-PNB-APRIL',
    partyName: 'Punjab National Bank',
    source: 'BANK_STATEMENT',
    notes: 'Quarterly ledger folio & portal fee',
  },
];

