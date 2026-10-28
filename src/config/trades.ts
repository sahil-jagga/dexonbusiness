import { DocType, StockItem } from '../types/solar';

export type TradeKey =
  | 'solar'
  | 'bike_spares'
  | 'electronics'
  | 'hardware'
  | 'general_trading'
  | 'automobile';

export interface TradeConfig {
  key: TradeKey;
  title: string;
  shortName: string;
  icon: string;
  tagline: string;
  description: string;
  supports7030: boolean;
  supportsWcc: boolean;
  supportsBankEstimate: boolean;
  supportsSolarBenefits: boolean;
  lumpSumQuotation: boolean;
  allowedDocTypes: DocType[];
  defaultStocks: StockItem[];
  tradeSpecificFields: {
    customerFields?: Array<{ key: string; label: string; placeholder: string; required?: boolean }>;
    itemFields?: Array<{ key: string; label: string; placeholder: string }>;
  };
}

export const TRADE_CONFIGS: Record<TradeKey, TradeConfig> = {
  solar: {
    key: 'solar',
    title: 'Solar EPC & Rooftop Systems',
    shortName: 'Solar EPC',
    icon: '☀️',
    tagline: 'Solar EPC, Rooftop On-Grid / Off-Grid & PM Surya Ghar Muft Bijli Yojana',
    description: 'Full Solar EPC suite with 70:30 statutory calculation aid, WCC, Bank Loan Margin Estimate, and Subsidy Quotations.',
    supports7030: true,
    supportsWcc: true,
    supportsBankEstimate: true,
    supportsSolarBenefits: true,
    lumpSumQuotation: true,
    allowedDocTypes: ['invoice', 'quotation', 'wcc', 'estimate', 'receipt'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'PM Surya Ghar App No', placeholder: 'RJ-SG-2026-XXXXX' },
        { key: 'consumerNo', label: 'Electricity K-No / CA No', placeholder: '1402/2390/4910' },
        { key: 'sanctionLoad', label: 'Sanctioned Load (kW)', placeholder: '3.00 kW' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Serial / Model Nos', placeholder: 'e.g. WAAREE-550W-01 to 06' }
      ]
    },
    defaultStocks: [
      { name: 'Solar PV Module DCR (ALMM Bifacial 550Wp)', hsn: '85414300', gst: 5, defaultBuy: 11000 },
      { name: 'Solar PV Module Non-DCR (Mono PERC 540Wp)', hsn: '85414300', gst: 5, defaultBuy: 8500 },
      { name: 'Solar Grid-Tied Inverter 3kW (Deye / Polycab)', hsn: '85044090', gst: 5, defaultBuy: 24000 },
      { name: 'Solar Grid-Tied Inverter 5kW (Growatt / Polycab)', hsn: '85044090', gst: 5, defaultBuy: 33000 },
      { name: 'MMS GI C-Channel Structure (HDG 80 Micron)', hsn: '73089030', gst: 18, defaultBuy: 12000 },
      { name: 'DC Solar Cable 4 sq.mm Copper (Red & Black)', hsn: '85446020', gst: 18, defaultBuy: 45 },
      { name: 'ACDB & DCDB Distribution Box with SPD (IP65)', hsn: '85371000', gst: 18, defaultBuy: 5000 },
      { name: 'Chemical Earthing Kit + 2.25M GI Electrode', hsn: '83111000', gst: 18, defaultBuy: 3200 },
      { name: 'Complete Installation, Testing & Commissioning Charges', hsn: '9954', gst: 18, defaultBuy: 8000 },
      { name: 'Net Metering Discom Documentation Service', hsn: '9983', gst: 18, defaultBuy: 3000 },
    ],
  },

  bike_spares: {
    key: 'bike_spares',
    title: 'Bike & Two-Wheeler Spare Parts',
    shortName: 'Bike & Spares',
    icon: '🏍️',
    tagline: 'Motorcycle & Scooter Parts, Lubricants, Batteries & Workshop Services',
    description: 'Designed for two-wheeler spare parts dealers, garages, and service centers with vehicle & chassis number tracking.',
    supports7030: false,
    supportsWcc: false,
    supportsBankEstimate: false,
    supportsSolarBenefits: false,
    lumpSumQuotation: false,
    allowedDocTypes: ['invoice', 'quotation'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'Vehicle Reg. No.', placeholder: 'RJ-13-SA-1234' },
        { key: 'consumerNo', label: 'Chassis / Engine No.', placeholder: 'MD625... / 12345' },
        { key: 'sanctionLoad', label: 'Odometer (KM)', placeholder: '18,500 KM' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Part OEM No / Brand', placeholder: 'e.g. Hero OEM / Bosch / Castrol' }
      ]
    },
    defaultStocks: [
      { name: '4T 10W-30 Premium Engine Oil (900ml / 1L)', hsn: '27101981', gst: 18, defaultBuy: 280 },
      { name: 'Front / Rear Brake Shoe Set (Genuine)', hsn: '87141090', gst: 18, defaultBuy: 140 },
      { name: 'Drive Chain & Sprocket Kit Heavy Duty', hsn: '84839000', gst: 18, defaultBuy: 650 },
      { name: 'Spark Plug Resistive Type (M10/M12)', hsn: '85111000', gst: 18, defaultBuy: 85 },
      { name: 'Clutch Plate Set & Friction Discs', hsn: '87141090', gst: 18, defaultBuy: 320 },
      { name: 'Two-Wheeler Maintenance Free Battery (12V 4Ah/5Ah)', hsn: '85071000', gst: 28, defaultBuy: 950 },
      { name: 'Air Filter Element Foam / Paper', hsn: '84213100', gst: 18, defaultBuy: 110 },
      { name: 'Tubeless Tyre 90/90-12 (Scooter / Bike)', hsn: '40114000', gst: 28, defaultBuy: 1050 },
      { name: 'Periodic General Servicing & Tuning Labor', hsn: '9987', gst: 18, defaultBuy: 200 },
      { name: 'Brake Overhaul & Wheel Greasing Labor', hsn: '9987', gst: 18, defaultBuy: 150 },
    ],
  },

  electronics: {
    key: 'electronics',
    title: 'Electronics & Electricals',
    shortName: 'Electronics',
    icon: '⚡',
    tagline: 'Home Appliances, Wiring, Lighting, Inverters & Consumer Electronics',
    description: 'Ideal for consumer electronics stores, distributors, and electrical contractors with serial warranty tracking.',
    supports7030: false,
    supportsWcc: false,
    supportsBankEstimate: false,
    supportsSolarBenefits: false,
    lumpSumQuotation: false,
    allowedDocTypes: ['invoice', 'quotation'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'Installation Address / Site', placeholder: 'Floor / Flat / Commercial Unit' },
        { key: 'consumerNo', label: 'Sales Order / PO Ref', placeholder: 'PO-2026-XXXX' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Serial No / Warranty Details', placeholder: 'e.g. SN-89210-2026 (2 Yrs Warranty)' }
      ]
    },
    defaultStocks: [
      { name: 'Pure Sine Wave Home Inverter 900VA / 12V', hsn: '85044090', gst: 18, defaultBuy: 4200 },
      { name: 'Tubular Tall Battery 150Ah (36M Warranty)', hsn: '85072000', gst: 28, defaultBuy: 9800 },
      { name: 'Copper Multistrand FR Wire 1.5 sq.mm (90m Roll)', hsn: '85444999', gst: 18, defaultBuy: 1450 },
      { name: 'Copper Multistrand FR Wire 2.5 sq.mm (90m Roll)', hsn: '85444999', gst: 18, defaultBuy: 2350 },
      { name: 'LED Ceiling Panel Light 12W (Round / Square)', hsn: '94054090', gst: 18, defaultBuy: 180 },
      { name: 'Modular Switch 6A 1-Way (Pack of 10)', hsn: '85365020', gst: 18, defaultBuy: 210 },
      { name: 'Double Pole MCB 32A C-Curve (10kA)', hsn: '85362030', gst: 18, defaultBuy: 280 },
      { name: 'Ceiling Fan 1200mm High Speed (5-Star BLDC)', hsn: '84145120', gst: 18, defaultBuy: 2100 },
      { name: 'Electrical Concealed Conduit Fitting Labor', hsn: '9954', gst: 18, defaultBuy: 2500 },
    ],
  },

  hardware: {
    key: 'hardware',
    title: 'Hardware, Paints & Sanitary',
    shortName: 'Hardware',
    icon: '🔩',
    tagline: 'Construction Hardware, Sanitaryware, CPVC Pipes, Tools & Industrial Fasteners',
    description: 'Built for hardware stores, paint shops, plumbing, and sanitary ware merchants.',
    supports7030: false,
    supportsWcc: false,
    supportsBankEstimate: false,
    supportsSolarBenefits: false,
    lumpSumQuotation: false,
    allowedDocTypes: ['invoice', 'quotation'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'Site Location / Project', placeholder: 'Civil Site / Colony Name' },
        { key: 'consumerNo', label: 'Contractor / Mason Ref', placeholder: 'Contractor Name / Mobile' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Batch / Grade / Size', placeholder: 'e.g. Schedule 80 / Grade SS304' }
      ]
    },
    defaultStocks: [
      { name: 'CPVC SDR 11 Pipe 1" (3 Meter Length)', hsn: '39172390', gst: 18, defaultBuy: 240 },
      { name: 'CPVC Brass Elbow 1" x 1/2" Threaded', hsn: '39174000', gst: 18, defaultBuy: 95 },
      { name: 'Ball Valve Full Bore Brass / SS 1" Heavy', hsn: '84818090', gst: 18, defaultBuy: 340 },
      { name: 'SS Door Hinges 4" x 3" x 3mm (Pair)', hsn: '83021010', gst: 18, defaultBuy: 110 },
      { name: 'Mortise Door Lock Set with Brass Handles', hsn: '83014090', gst: 18, defaultBuy: 850 },
      { name: 'Premium Acrylic Exterior Emulsion Paint (20L)', hsn: '32091000', gst: 18, defaultBuy: 3400 },
      { name: 'Waterproofing Chemical Compound (5 Liter)', hsn: '38244090', gst: 18, defaultBuy: 750 },
      { name: 'GI Hex Nut & Bolt SS304 (Per KG)', hsn: '73181500', gst: 18, defaultBuy: 190 },
      { name: 'Sanitary Wall Mixer Single Lever with Bend', hsn: '84818020', gst: 18, defaultBuy: 1650 },
    ],
  },

  automobile: {
    key: 'automobile',
    title: 'Automobile Service & 4-Wheeler Spares',
    shortName: 'Automobile',
    icon: '🚗',
    tagline: 'Car Workshop, Fleet Maintenance, Tyres, Auto Spares & Bodywork',
    description: 'Designed for car workshops, garages, multi-brand auto spares, and body paint shops.',
    supports7030: false,
    supportsWcc: false,
    supportsBankEstimate: false,
    supportsSolarBenefits: false,
    lumpSumQuotation: false,
    allowedDocTypes: ['invoice', 'quotation'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'Vehicle Registration No.', placeholder: 'RJ-14-CB-9009' },
        { key: 'consumerNo', label: 'VIN / Chassis Number', placeholder: 'MA3... (17 digits)' },
        { key: 'sanctionLoad', label: 'Make / Model / KM', placeholder: 'Swift VDI / 62,400 KM' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Part Number / OEM Brand', placeholder: 'e.g. Maruti MGP / Mobil 1' }
      ]
    },
    defaultStocks: [
      { name: 'Fully Synthetic 5W-30 Engine Oil (3.5L Can)', hsn: '27101981', gst: 18, defaultBuy: 1450 },
      { name: 'Spin-On Oil Filter Element (OEM)', hsn: '84212300', gst: 18, defaultBuy: 120 },
      { name: 'Front Disc Brake Pad Set (Ceramic / Metallic)', hsn: '87083000', gst: 18, defaultBuy: 850 },
      { name: 'Coolant Glycol Premix 1:3 (1 Liter Can)', hsn: '38200000', gst: 18, defaultBuy: 180 },
      { name: 'Car Battery 12V 45Ah (55 Months Warranty)', hsn: '85071000', gst: 28, defaultBuy: 3800 },
      { name: 'Passenger Radial Tyre 185/65 R15 (Tubeless)', hsn: '40111010', gst: 28, defaultBuy: 3400 },
      { name: 'Wheel Alignment & Computerised Balancing', hsn: '9987', gst: 18, defaultBuy: 450 },
      { name: 'Complete Periodic Car Servicing & Inspection', hsn: '9987', gst: 18, defaultBuy: 1200 },
      { name: 'AC Gas Charging (R134a) & Filter Cleaning', hsn: '9987', gst: 18, defaultBuy: 850 },
    ],
  },

  general_trading: {
    key: 'general_trading',
    title: 'General Trading, Wholesale & Services',
    shortName: 'General Trading',
    icon: '🏢',
    tagline: 'FMCG, Wholesale Goods, Professional Consulting & General Supplies',
    description: 'Clean GST invoicing for wholesalers, traders, consulting services, and general retail stores.',
    supports7030: false,
    supportsWcc: false,
    supportsBankEstimate: false,
    supportsSolarBenefits: false,
    lumpSumQuotation: false,
    allowedDocTypes: ['invoice', 'quotation'],
    tradeSpecificFields: {
      customerFields: [
        { key: 'appNo', label: 'Purchase Order (PO) No', placeholder: 'PO/2026/001' },
        { key: 'consumerNo', label: 'Delivery Challan / Note', placeholder: 'DC-9812' },
      ],
      itemFields: [
        { key: 'serialNumbers', label: 'Batch / Lot / Remarks', placeholder: 'Lot #2026-A' }
      ]
    },
    defaultStocks: [
      { name: 'Standard Commercial Goods / Merchandise', hsn: '84713010', gst: 18, defaultBuy: 1000 },
      { name: 'Consumable Supplies & Office Materials', hsn: '48202000', gst: 18, defaultBuy: 450 },
      { name: 'Professional Consultancy & Management Service', hsn: '998311', gst: 18, defaultBuy: 5000 },
      { name: 'Technical Support & Annual Maintenance Contract', hsn: '998717', gst: 18, defaultBuy: 3500 },
      { name: 'Freight & Transportation Handling Charges', hsn: '996511', gst: 5, defaultBuy: 800 },
    ],
  },
};

export const DEFAULT_TRADE: TradeKey = 'solar';

export function getTradeConfig(key?: string | null): TradeConfig {
  if (key && key in TRADE_CONFIGS) {
    return TRADE_CONFIGS[key as TradeKey];
  }
  return TRADE_CONFIGS.general_trading;
}
