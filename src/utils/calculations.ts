/**
 * NexBill Financial Arithmetic & GST Calculation Engine
 * Uses decimal-safe integer paise arithmetic to avoid JavaScript floating point errors.
 */

export interface LineItemCalculation {
  lineTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
}

export interface InvoiceTotals {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  tax5Amount: number;
  tax12Amount: number;
  tax18Amount: number;
  tax28Amount: number;
  rawGrandTotal: number;
  grandTotal: number;
  roundOff: number;
}

/**
 * Calculates financial totals for an individual line item with 2-decimal precision (paise/cents).
 */
export function calculateLineItem(
  qty: number,
  rate: number,
  taxRate: number,
  isInterState = false,
  showCgstSgst = true
): LineItemCalculation {
  const safeQty = Math.max(0, Number(qty) || 0);
  const safeRate = Math.max(0, Number(rate) || 0);
  const safeTax = Math.max(0, Number(taxRate) || 0);

  // Line total in cents/paise to prevent floating point drift
  const lineTotalPaise = Math.round(safeQty * safeRate * 100);
  const lineTotal = lineTotalPaise / 100;

  // Non-India single tax rate (VAT / Sales Tax / Local Tax)
  if (!showCgstSgst) {
    const taxPaise = Math.round((lineTotalPaise * safeTax) / 100);
    const tax = taxPaise / 100;
    return {
      lineTotal,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: tax,
      totalWithTax: (lineTotalPaise + taxPaise) / 100,
    };
  }

  if (isInterState) {
    const igstPaise = Math.round((lineTotalPaise * safeTax) / 100);
    const igst = igstPaise / 100;
    return {
      lineTotal,
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
      totalWithTax: (lineTotalPaise + igstPaise) / 100,
    };
  }

  // Intra-state: half CGST + half SGST
  const halfGst = safeTax / 2;
  const halfTaxPaise = Math.round((lineTotalPaise * halfGst) / 100);
  const cgst = halfTaxPaise / 100;
  const sgst = halfTaxPaise / 100;
  const totalTax = (halfTaxPaise * 2) / 100;

  return {
    lineTotal,
    cgst,
    sgst,
    igst: 0,
    totalTax,
    totalWithTax: (lineTotalPaise + halfTaxPaise * 2) / 100,
  };
}

/**
 * Calculates aggregated invoice totals, tax slabs, and legal round-off.
 */
export function calculateInvoiceTotals(
  items: Array<{ qty: number; rate: number; gst: number }>,
  isInterState = false,
  showCgstSgst = true
): InvoiceTotals {
  let totalTaxablePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalTaxPaise = 0;
  let tax5Paise = 0;
  let tax12Paise = 0;
  let tax18Paise = 0;
  let tax28Paise = 0;

  items.forEach((it) => {
    const calc = calculateLineItem(it.qty, it.rate, it.gst, isInterState, showCgstSgst);
    const linePaise = Math.round(calc.lineTotal * 100);
    const taxPaise = Math.round(calc.totalTax * 100);

    totalTaxablePaise += linePaise;
    totalTaxPaise += taxPaise;
    totalCgstPaise += Math.round(calc.cgst * 100);
    totalSgstPaise += Math.round(calc.sgst * 100);
    totalIgstPaise += Math.round(calc.igst * 100);

    if (it.gst === 5) tax5Paise += taxPaise;
    else if (it.gst === 12) tax12Paise += taxPaise;
    else if (it.gst === 18) tax18Paise += taxPaise;
    else if (it.gst === 28) tax28Paise += taxPaise;
  });

  const rawGrandTotalPaise = totalTaxablePaise + totalTaxPaise;
  const rawGrandTotal = rawGrandTotalPaise / 100;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

  return {
    totalTaxable: totalTaxablePaise / 100,
    totalCgst: totalCgstPaise / 100,
    totalSgst: totalSgstPaise / 100,
    totalIgst: totalIgstPaise / 100,
    totalTax: totalTaxPaise / 100,
    tax5Amount: tax5Paise / 100,
    tax12Amount: tax12Paise / 100,
    tax18Amount: tax18Paise / 100,
    tax28Amount: tax28Paise / 100,
    rawGrandTotal,
    grandTotal,
    roundOff,
  };
}

/**
 * 70:30 Solar EPC Ratio Validator
 * Verifies composite supply statutory compliance: 70% goods + 30% services.
 */
export function validate7030Ratio(items: Array<{ rate: number; qty: number; gst: number }>): {
  pct5: number;
  pct18: number;
  isCompliant: boolean;
  statusText: string;
} {
  let sum5 = 0;
  let sum18 = 0;

  items.forEach((it) => {
    const lineWithTax = (it.rate || 0) * (it.qty || 1) * (1 + (it.gst || 0) / 100);
    if (it.gst === 5 || it.gst === 12) sum5 += lineWithTax;
    else if (it.gst === 18) sum18 += lineWithTax;
  });

  const total = sum5 + sum18;
  if (total <= 0) {
    return { pct5: 0, pct18: 0, isCompliant: false, statusText: 'No items' };
  }

  const pct5 = (sum5 / total) * 100;
  const pct18 = (sum18 / total) * 100;
  const isCompliant = pct5 >= 68 && pct5 <= 75;

  let statusText = 'Optimal Ratio';
  if (pct5 < 68) statusText = 'Goods ratio low (Increase Panel/Inverter)';
  else if (pct5 > 75) statusText = 'Goods ratio high (Balance with BOS/Installation)';

  return {
    pct5: Math.round(pct5 * 10) / 10,
    pct18: Math.round(pct18 * 10) / 10,
    isCompliant,
    statusText,
  };
}
