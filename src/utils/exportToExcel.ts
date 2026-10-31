import * as XLSX from 'xlsx';
import { InvoiceItem, CustomerInfo, FirmInfo, InvoiceMeta, DocType } from '../types/solar';
import { numberToWordsRupees } from '../services/licenseService';

interface ExportInvoiceExcelOptions {
  items: InvoiceItem[];
  meta: InvoiceMeta;
  firm: FirmInfo;
  customer: CustomerInfo;
  currency?: string;
  showBuyRates?: boolean;
  docType?: DocType;
}

/**
 * Exports current invoice table data into a clean, well-formatted Microsoft Excel (.xlsx) file.
 */
export function exportInvoiceToExcel({
  items,
  meta,
  firm,
  customer,
  currency = '₹',
  showBuyRates = false,
  docType = 'invoice',
}: ExportInvoiceExcelOptions): void {
  const wb = XLSX.utils.book_new();

  const title =
    docType === 'invoice'
      ? 'TAX INVOICE'
      : docType === 'quotation'
      ? 'COMMERCIAL QUOTATION / ESTIMATE'
      : docType === 'wcc'
      ? 'WORK COMPLETION CERTIFICATE'
      : docType === 'receipt'
      ? 'PAYMENT RECEIPT'
      : 'INVOICE';

  // 1. Build Header Section Rows
  const sheetData: (string | number)[][] = [
    [title.toUpperCase()],
    [`Generated via Dexon Billing System — Date: ${meta.date || new Date().toISOString().split('T')[0]}`],
    [],
    ['SELLER (FIRM DETAILS)', '', '', 'BUYER (CUSTOMER DETAILS)', ''],
    [
      `Firm Name: ${firm.name || 'N/A'}`,
      '',
      '',
      `Customer Name: ${customer.name || 'Valued Customer'}`,
      '',
    ],
    [
      `GSTIN: ${firm.gstin || 'Unregistered'}`,
      '',
      '',
      `GSTIN: ${customer.gstin || 'Unregistered'}`,
      '',
    ],
    [
      `Mobile: ${firm.mobile || 'N/A'}`,
      '',
      '',
      `Mobile: ${customer.mobile || 'N/A'}`,
      '',
    ],
    [
      `Address: ${firm.address ? firm.address.replace(/\n/g, ', ') : 'N/A'}`,
      '',
      '',
      `Address: ${customer.address ? customer.address.replace(/\n/g, ', ') : 'N/A'}`,
      '',
    ],
    [
      `Email: ${firm.email || 'N/A'}`,
      '',
      '',
      `Aadhaar / Ref: ${customer.aadhar || customer.appNo || 'N/A'}`,
      '',
    ],
    [],
    ['DOCUMENT METADATA'],
    [`Invoice No: ${meta.invNo || 'INV-001'}`, `Date: ${meta.date || 'N/A'}`, `Place of Supply: ${meta.placeOfSupply || 'State (00)'}`, `Reverse Charge: ${meta.reverseCharge || 'No'}`],
    [],
  ];

  // 2. Table Column Headers
  const tableHeaders: string[] = [
    'S.No',
    'Description of Goods / Services',
    'HSN / SAC Code',
    'Tax Rate (%)',
    'Quantity',
    'Unit',
    `Rate (${currency})`,
    `Taxable Value (${currency})`,
    'CGST Rate (%)',
    `CGST (${currency})`,
    'SGST Rate (%)',
    `SGST (${currency})`,
    `Total Amount (${currency})`,
  ];

  if (showBuyRates && docType !== 'quotation') {
    tableHeaders.splice(6, 0, `Buy Rate (${currency})`, `Estimated Margin (${currency})`);
  }

  sheetData.push(tableHeaders);

  // 3. Populate Rows
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let grandTotal = 0;

  const taxSlabs: { [gst: number]: { taxable: number; cgst: number; sgst: number } } = {};

  items.forEach((it, idx) => {
    const qty = it.qty || 0;
    const rate = it.rate || 0;
    const gstRate = it.gst || 0;
    const taxableLine = Math.round(qty * rate * 100) / 100;
    const halfTaxRate = gstRate / 2;
    const cgst = Math.round(taxableLine * (halfTaxRate / 100) * 100) / 100;
    const sgst = cgst;
    const lineTotal = Math.round((taxableLine + cgst + sgst) * 100) / 100;

    totalTaxable += taxableLine;
    totalCgst += cgst;
    totalSgst += sgst;
    grandTotal += lineTotal;

    if (!taxSlabs[gstRate]) {
      taxSlabs[gstRate] = { taxable: 0, cgst: 0, sgst: 0 };
    }
    taxSlabs[gstRate].taxable += taxableLine;
    taxSlabs[gstRate].cgst += cgst;
    taxSlabs[gstRate].sgst += sgst;

    const row: (string | number)[] = [
      idx + 1,
      it.name || 'Item ' + (idx + 1),
      it.hsn || '',
      `${gstRate}%`,
      qty,
      it.unit || 'NOS',
    ];

    if (showBuyRates && docType !== 'quotation') {
      const buyRate = it.buyRate || 0;
      const margin = rate - buyRate;
      row.push(buyRate, margin);
    }

    row.push(
      rate,
      taxableLine,
      `${halfTaxRate}%`,
      cgst,
      `${halfTaxRate}%`,
      sgst,
      lineTotal
    );

    sheetData.push(row);
  });

  // Round off
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOff = Math.round((roundedGrandTotal - grandTotal) * 100) / 100;

  // 4. Totals Rows
  sheetData.push([]);
  const blankColsCount = (showBuyRates && docType !== 'quotation' ? 8 : 6);
  const totalRow: (string | number)[] = Array(blankColsCount).fill('');
  totalRow.push('Subtotal (Taxable):', totalTaxable, '', totalCgst, '', totalSgst, grandTotal);
  sheetData.push(totalRow);

  if (roundOff !== 0) {
    const roundRow: (string | number)[] = Array(blankColsCount).fill('');
    roundRow.push('Round Off (+/-):', roundOff, '', '', '', '', roundedGrandTotal);
    sheetData.push(roundRow);
  }

  const grandTotalRow: (string | number)[] = Array(blankColsCount).fill('');
  grandTotalRow.push('GRAND TOTAL:', '', '', '', '', '', `${currency} ${roundedGrandTotal.toLocaleString('en-IN')}`);
  sheetData.push(grandTotalRow);

  sheetData.push([]);
  sheetData.push([`Amount in Words: ${numberToWordsRupees(roundedGrandTotal)}`]);
  sheetData.push([]);

  // 5. Tax Summary / Slab Breakdown Table
  sheetData.push(['TAX SLAB SUMMARY BREAKDOWN']);
  sheetData.push([
    'GST Slab Rate',
    `Taxable Amount (${currency})`,
    `CGST Amount (${currency})`,
    `SGST Amount (${currency})`,
    `Total Tax (${currency})`,
  ]);

  Object.entries(taxSlabs)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([slab, vals]) => {
      sheetData.push([
        `GST ${slab}%`,
        Math.round(vals.taxable * 100) / 100,
        Math.round(vals.cgst * 100) / 100,
        Math.round(vals.sgst * 100) / 100,
        Math.round((vals.cgst + vals.sgst) * 100) / 100,
      ]);
    });

  // Convert to Sheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set Column Widths for clean reading
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 38 }, // Description
    { wch: 14 }, // HSN
    { wch: 12 }, // Tax Rate
    { wch: 10 }, // Qty
    { wch: 8 },  // Unit
    ...(showBuyRates && docType !== 'quotation' ? [{ wch: 14 }, { wch: 14 }] : []),
    { wch: 14 }, // Rate
    { wch: 16 }, // Taxable Value
    { wch: 12 }, // CGST %
    { wch: 14 }, // CGST
    { wch: 12 }, // SGST %
    { wch: 14 }, // SGST
    { wch: 18 }, // Total
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Invoice_Table');

  // Trigger Download
  const safeInvNo = (meta.invNo || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Dexon_${safeInvNo}_${meta.date || 'date'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
