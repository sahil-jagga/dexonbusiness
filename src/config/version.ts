export interface ReleaseNote {
  version: string;
  releaseDate: string;
  isLatest?: boolean;
  highlights: string[];
  bugFixes: string[];
  newFeatures: string[];
}

export const CURRENT_APP_VERSION = '2.5.0';

export const APP_CHANGELOG: ReleaseNote[] = [
  {
    version: '2.5.0',
    releaseDate: 'October 29, 2026',
    isLatest: true,
    highlights: [
      'Template-Based Automated WhatsApp Message Generator with 5 ready-to-use business templates.',
      'Client In-App Bug Report & Feedback Box (Secret owner email delivery without exposing email).',
      'In-App Versioning & 1-Click Update Manager with complete release notes & bug fix list.',
      'Dedicated Tax Summary Table section at the bottom of the invoice preview for statutory GST compliance.',
      'Low Stock Alert & Reorder Warning in Sidebar Calculator with user-defined min stock thresholds.'
    ],
    bugFixes: [
      'Resolved Admin Portal close button issue where visiting #/owner or #/dexonjitender kept the modal trapped on screen.',
      'Prevented duplicate invoice sequence numbers by auto-detecting last saved records in CRM history.',
      'Fixed stock threshold persistence so custom item inventory levels stay saved across restarts.',
      'Unified brand name to "Dexon" across all modals, download packages, and documentation.'
    ],
    newFeatures: [
      'WhatsApp Generator: Choose from Formal Tax Invoice, Payment Reminder, Solar Rooftop Dispatch, or Quick UPI Receipt templates.',
      'Dynamic Placeholders: Customize WhatsApp templates with {customer_name}, {invoice_no}, {grand_total}, {upi_id}, and more.',
      'Secret Bug Reporting: Clients can report issues directly from the app; owner receives alerts with diagnostics.',
      'Owner Email Config: Sahil can edit the support notification email in the Admin Portal anytime.',
      'PWA 1-Click Update: Instant cache purge & reload to bring installed desktop/mobile apps to the latest version.'
    ]
  },
  {
    version: '2.4.0',
    releaseDate: 'October 28, 2026',
    highlights: [
      'Multi-Industry Trade Expansion: Solar EPC, Electrical, Bike Spares, Hardware, Automobile, and CA/Finance.',
      'Invoice Theme Designer with 3 distinct visual layouts (Clean Minimal, Corporate Blue, Midnight Dark & Gold).',
      'Excel/CSV Batch Import of historical invoices directly into CRM database.',
      'Global Keyboard Shortcuts (Ctrl+N, Ctrl+S, Ctrl+P, Ctrl+D, Ctrl+H).'
    ],
    bugFixes: [
      'Fixed category ledger options in Books & ITR so non-solar businesses can write custom business ledgers.',
      'Fixed Aadhaar number masking privacy standards in printable views.'
    ],
    newFeatures: [
      'PWA Install guidance modal for desktop Chrome/Edge and Android/iOS.',
      'Section 44AD presumptive tax calculations in Daybook accounting.'
    ]
  }
];

export function getLatestReleaseInfo(): ReleaseNote {
  return APP_CHANGELOG[0];
}
