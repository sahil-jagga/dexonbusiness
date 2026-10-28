/**
 * NexBill Automated Unit Test Suite
 * Run with: node scripts/run-tests.mjs
 */

import assert from 'assert';
import { calculateLineItem, calculateInvoiceTotals, validate7030Ratio } from '../src/utils/calculations.ts';
import { maskAadhaar } from '../src/utils/privacy.ts';
import { TRADE_CONFIGS, getTradeConfig } from '../src/config/trades.ts';
import { calculateKeyChecksum } from '../src/services/licenseService.ts';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 Running NexBill Production Test Suite...\n');

// -------------------------------------------------------------
// 1. Line Item Financial Arithmetic
// -------------------------------------------------------------
console.log('--- Suite 1: Financial & GST Arithmetic ---');

it('calculates line item without GST (0%)', () => {
  const res = calculateLineItem(2, 500, 0);
  assert.strictEqual(res.lineTotal, 1000);
  assert.strictEqual(res.cgst, 0);
  assert.strictEqual(res.sgst, 0);
  assert.strictEqual(res.totalWithTax, 1000);
});

it('calculates 18% intra-state GST (9% CGST + 9% SGST)', () => {
  const res = calculateLineItem(1, 10000, 18, false);
  assert.strictEqual(res.lineTotal, 10000);
  assert.strictEqual(res.cgst, 900);
  assert.strictEqual(res.sgst, 900);
  assert.strictEqual(res.igst, 0);
  assert.strictEqual(res.totalWithTax, 11800);
});

it('calculates 18% inter-state GST (18% IGST)', () => {
  const res = calculateLineItem(1, 10000, 18, true);
  assert.strictEqual(res.lineTotal, 10000);
  assert.strictEqual(res.cgst, 0);
  assert.strictEqual(res.sgst, 0);
  assert.strictEqual(res.igst, 1800);
  assert.strictEqual(res.totalWithTax, 11800);
});

it('handles fractional paise and avoids IEEE floating point drift', () => {
  // 3 * 33.33 = 99.99, 18% GST = 17.9982 -> 18.00 paise
  const res = calculateLineItem(3, 33.33, 18, false);
  assert.strictEqual(res.lineTotal, 99.99);
  assert.strictEqual(res.totalWithTax, 117.99);
});

it('calculates international single-rate tax without CGST/SGST split (UAE VAT 5%)', () => {
  // Rate: 1000, Qty: 2, Tax: 5%, isInterState: false, showCgstSgst: false
  const res = calculateLineItem(2, 1000, 5, false, false);
  assert.strictEqual(res.lineTotal, 2000);
  assert.strictEqual(res.totalTax, 100);
  assert.strictEqual(res.cgst, 0); // No split
  assert.strictEqual(res.sgst, 0); // No split
  assert.strictEqual(res.totalWithTax, 2100);
});

it('calculates international invoice totals with single tax (US Sales Tax 7%)', () => {
  const items = [
    { qty: 2, rate: 500, gst: 7 },
    { qty: 1, rate: 1000, gst: 7 },
  ];
  const totals = calculateInvoiceTotals(items, false, false);
  assert.strictEqual(totals.totalTaxable, 2000);
  assert.strictEqual(totals.totalCgst, 0);
  assert.strictEqual(totals.totalSgst, 0);
  assert.strictEqual(totals.totalTax, 140);
  assert.strictEqual(totals.grandTotal, 2140);
});

// -------------------------------------------------------------
// 2. Invoice Aggregation & Round-Off
// -------------------------------------------------------------
console.log('\n--- Suite 2: Invoice Totals & Round-Off ---');

it('calculates aggregated invoice totals and round-off', () => {
  const items = [
    { qty: 6, rate: 13500, gst: 5 },  // 81000 + 4050 = 85050
    { qty: 1, rate: 32000, gst: 5 },  // 32000 + 1600 = 33600
    { qty: 1, rate: 17500, gst: 18 }, // 17500 + 3150 = 20650
    { qty: 60, rate: 65, gst: 18 },   // 3900 + 702 = 4602
  ];
  const totals = calculateInvoiceTotals(items, false);
  assert.strictEqual(totals.totalTaxable, 134400);
  assert.strictEqual(totals.tax5Amount, 5650);
  assert.strictEqual(totals.tax18Amount, 3852);
  assert.strictEqual(totals.totalCgst, 4751);
  assert.strictEqual(totals.totalSgst, 4751);
  assert.strictEqual(totals.grandTotal, 143902);
});

it('calculates round-off correctly for fractional totals', () => {
  const items = [{ qty: 1, rate: 100.40, gst: 5 }]; // 100.40 + 5.02 = 105.42 -> rounds to 105, roundOff -0.42
  const totals = calculateInvoiceTotals(items, false);
  assert.strictEqual(totals.grandTotal, 105);
  assert.strictEqual(totals.roundOff, -0.42);
});

// -------------------------------------------------------------
// 3. Solar 70:30 Statutory Ratio
// -------------------------------------------------------------
console.log('\n--- Suite 3: Solar 70:30 Composite Supply Validation ---');

it('marks ~70:30 ratio as compliant (between 68% and 75%)', () => {
  const items = [
    { rate: 70000, qty: 1, gst: 5 },  // 73500 with tax
    { rate: 26694, qty: 1, gst: 18 }, // 31498 with tax (~30%)
  ];
  const res = validate7030Ratio(items);
  assert.strictEqual(res.isCompliant, true);
});

it('flags 5% ratio as low when under 68%', () => {
  const items = [
    { rate: 40000, qty: 1, gst: 5 },
    { rate: 60000, qty: 1, gst: 18 },
  ];
  const res = validate7030Ratio(items);
  assert.strictEqual(res.isCompliant, false);
  assert(res.statusText.includes('low'));
});

// -------------------------------------------------------------
// 4. Trade Isolation & Configuration
// -------------------------------------------------------------
console.log('\n--- Suite 4: Trade Isolation Rules ---');

it('enables 70:30 and special documents strictly for Solar EPC', () => {
  const solar = TRADE_CONFIGS.solar;
  assert.strictEqual(solar.supports7030, true);
  assert.strictEqual(solar.supportsWcc, true);
  assert.strictEqual(solar.supportsBankEstimate, true);
  assert.deepStrictEqual(solar.allowedDocTypes, ['invoice', 'quotation', 'wcc', 'estimate', 'receipt']);
});

it('disables 70:30, WCC, and Bank Estimate for non-solar trades', () => {
  const nonSolarTrades = ['bike_spares', 'electronics', 'hardware', 'automobile', 'general_trading'];
  for (const t of nonSolarTrades) {
    const cfg = TRADE_CONFIGS[t];
    assert.strictEqual(cfg.supports7030, false, `${t} must not support 70:30`);
    assert.strictEqual(cfg.supportsWcc, false, `${t} must not support WCC`);
    assert.strictEqual(cfg.supportsBankEstimate, false, `${t} must not support Bank Estimate`);
    assert.deepStrictEqual(cfg.allowedDocTypes, ['invoice', 'quotation'], `${t} doc types`);
  }
});

// -------------------------------------------------------------
// 5. Privacy & Data Masking Compliance
// -------------------------------------------------------------
console.log('\n--- Suite 5: Privacy & Aadhaar Masking ---');

it('masks first 8 digits of Aadhaar number', () => {
  const masked = maskAadhaar('123456789012');
  assert.strictEqual(masked, 'XXXX-XXXX-9012');
});

it('preserves already masked format or empty string', () => {
  assert.strictEqual(maskAadhaar(''), '');
  assert.strictEqual(maskAadhaar('XXXX-XXXX-8941'), 'XXXX-XXXX-8941');
});

// -------------------------------------------------------------
// 6. Cryptographic Key Verification
// -------------------------------------------------------------
console.log('\n--- Suite 6: License Cryptographic Integrity ---');

it('generates deterministic checksum for signed keys', () => {
  const sum1 = calculateKeyChecksum('BIZ', '9429', '3012');
  const sum2 = calculateKeyChecksum('BIZ', '9429', '3012');
  assert.strictEqual(sum1, sum2);
  assert.strictEqual(sum1.length, 4);
});

it('detects tampering in key payload', () => {
  const sumA = calculateKeyChecksum('BIZ', '9429', '3012');
  const sumB = calculateKeyChecksum('PRO', '9429', '3012');
  assert.notStrictEqual(sumA, sumB);
});

// -------------------------------------------------------------
// 7. Auto-Numbering & Duplicate Entry Prevention
// -------------------------------------------------------------
console.log('\n--- Suite 7: Auto-Numbering & Duplicate Entry Prevention ---');

import { generateNextInvoiceNumber, parseInvoiceSequenceNumber, getFirmInvoicePrefix } from '../src/utils/invoiceNumbering.ts';

it('correctly parses sequence numbers from various formats', () => {
  assert.strictEqual(parseInvoiceSequenceNumber('JE/26-27/005'), 5);
  assert.strictEqual(parseInvoiceSequenceNumber('INV-2026-042'), 42);
  assert.strictEqual(parseInvoiceSequenceNumber('AST/100'), 100);
});

it('increments sequentially from last saved history record', () => {
  const firm = { name: 'Jagga Enterprises & Co.', address: '', mobile: '', gstin: '', email: '', tagline: '', logo: '', pan: '' };
  const history = [
    { id: '1', invNo: 'JE/26-27/001' },
    { id: '2', invNo: 'JE/26-27/002' },
    { id: '3', invNo: 'JE/26-27/003' },
  ];
  const next = generateNextInvoiceNumber(firm, history);
  assert.strictEqual(next.endsWith('/004'), true);
});

it('prevents duplicates even when entries have gaps or custom formatting', () => {
  const firm = { name: 'Dexon Solar Tech', invoicePrefix: 'DST', address: '', mobile: '', gstin: '', email: '', tagline: '', logo: '', pan: '' };
  const history = [
    { id: '1', invNo: 'DST/26-27/001' },
    { id: '2', invNo: 'DST/26-27/010' },
  ];
  const next = generateNextInvoiceNumber(firm, history);
  assert.strictEqual(next.endsWith('/011'), true);
});

// -------------------------------------------------------------
// Results Summary
// -------------------------------------------------------------
console.log('\n=============================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('=============================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
