export type CountryCode = 'IN' | 'AE' | 'US' | 'GB' | 'NP' | 'BD' | 'PK' | 'SA';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol?: string;
  currencyCode: string;
  taxName: string; // 'GST', 'VAT', 'Sales Tax', 'Local Tax'
  taxLabel: string;
  taxIdLabel: string; // e.g., GSTIN, TRN, Tax ID
  showCgstSgst: boolean; // Only true for India
  defaultTaxRate: number;
  availableRates: number[];
  itemCodeLabel: string; // 'HSN/SAC' or 'Item Code / SKU'
  taxSummaryTitle: string;
  taxRuleNote: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: '₹',
    currencyCode: 'INR',
    taxName: 'GST',
    taxLabel: 'GST',
    taxIdLabel: 'GSTIN',
    showCgstSgst: true,
    defaultTaxRate: 18,
    availableRates: [0, 5, 12, 18, 28],
    itemCodeLabel: 'HSN/SAC',
    taxSummaryTitle: 'Tax Summary (CGST & SGST Breakdown)',
    taxRuleNote:
      'GST calculated under statutory CGST & SGST Rules 2017 & applicable HSN/SAC classifications.',
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates / Gulf',
    flag: '🇦🇪',
    currency: 'AED',
    currencyCode: 'AED',
    taxName: 'VAT',
    taxLabel: 'VAT 5%',
    taxIdLabel: 'TRN (Tax Registration Number)',
    showCgstSgst: false,
    defaultTaxRate: 5,
    availableRates: [0, 5],
    itemCodeLabel: 'Item Code / SKU',
    taxSummaryTitle: 'VAT Summary (Single-line 5%)',
    taxRuleNote:
      'Value Added Tax calculated under UAE Federal Decree-Law No. (8) on Value Added Tax (standard 5% rate).',
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: '$',
    currencyCode: 'USD',
    taxName: 'Sales Tax',
    taxLabel: 'Tax %',
    taxIdLabel: 'Federal EIN / State Tax ID',
    showCgstSgst: false,
    defaultTaxRate: 7,
    availableRates: [0, 5, 6, 7, 8.25, 10],
    itemCodeLabel: 'SKU / Part #',
    taxSummaryTitle: 'Sales Tax Summary',
    taxRuleNote:
      'Applicable State & Local Sales Tax applied to taxable items & services.',
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom & Europe',
    flag: '🇬🇧',
    currency: '£',
    currencyCode: 'GBP',
    taxName: 'VAT',
    taxLabel: 'VAT %',
    taxIdLabel: 'VAT Registration No',
    showCgstSgst: false,
    defaultTaxRate: 20,
    availableRates: [0, 5, 20],
    itemCodeLabel: 'Commodity Code',
    taxSummaryTitle: 'VAT Summary',
    taxRuleNote:
      'Value Added Tax (VAT) applied under HMRC / European Tax Authority standards.',
  },
  NP: {
    code: 'NP',
    name: 'Nepal',
    flag: '🇳🇵',
    currency: 'रू',
    currencyCode: 'NPR',
    taxName: 'Local Tax',
    taxLabel: 'VAT 13%',
    taxIdLabel: 'PAN / VAT Registration No',
    showCgstSgst: false,
    defaultTaxRate: 13,
    availableRates: [0, 13],
    itemCodeLabel: 'Harmonized Code',
    taxSummaryTitle: 'Local Tax / VAT Summary',
    taxRuleNote:
      'Local Value Added Tax under Inland Revenue Department (IRD) of Nepal (13%).',
  },
  BD: {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    currency: '৳',
    currencyCode: 'BDT',
    taxName: 'Local Tax',
    taxLabel: 'VAT 15%',
    taxIdLabel: 'BIN (Business Identification Number)',
    showCgstSgst: false,
    defaultTaxRate: 15,
    availableRates: [0, 5, 7.5, 10, 15],
    itemCodeLabel: 'HS Code',
    taxSummaryTitle: 'Local Tax / VAT Summary',
    taxRuleNote:
      'Value Added Tax and Supplementary Duty Act of National Board of Revenue (NBR) Bangladesh.',
  },
  PK: {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    currency: 'Rs',
    currencyCode: 'PKR',
    taxName: 'Sales Tax',
    taxLabel: 'Sales Tax',
    taxIdLabel: 'STRN / NTN Number',
    showCgstSgst: false,
    defaultTaxRate: 18,
    availableRates: [0, 18],
    itemCodeLabel: 'PCT Code / Ref',
    taxSummaryTitle: 'Sales Tax Summary',
    taxRuleNote:
      'Sales Tax applied under Federal Board of Revenue (FBR) regulations.',
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    currencyCode: 'SAR',
    taxName: 'VAT',
    taxLabel: 'VAT 15%',
    taxIdLabel: 'ZATCA VAT Account Number',
    showCgstSgst: false,
    defaultTaxRate: 15,
    availableRates: [0, 15],
    itemCodeLabel: 'Item Code',
    taxSummaryTitle: 'VAT Summary (ZATCA 15%)',
    taxRuleNote:
      'VAT calculated under Zakat, Tax and Customs Authority (ZATCA) regulations (15%).',
  },
};

export const DEFAULT_COUNTRY: CountryCode = 'IN';

export const COUNTRIES_LIST: CountryConfig[] = Object.values(COUNTRIES).map((c) => ({
  ...c,
  currencySymbol: c.currency,
}));

export function getCountryConfig(codeOrCurrency?: string | null): CountryConfig {
  if (!codeOrCurrency) {
    return { ...COUNTRIES.IN, currencySymbol: COUNTRIES.IN.currency };
  }

  const upper = codeOrCurrency.trim().toUpperCase();
  if (upper in COUNTRIES) {
    const found = COUNTRIES[upper as CountryCode];
    return { ...found, currencySymbol: found.currency };
  }

  // Lookup by currency symbol or currency code
  const match = COUNTRIES_LIST.find(
    (c) =>
      c.currency.toUpperCase() === upper ||
      c.currencyCode.toUpperCase() === upper ||
      codeOrCurrency.includes(c.currency)
  );

  return match || { ...COUNTRIES.IN, currencySymbol: COUNTRIES.IN.currency };
}
