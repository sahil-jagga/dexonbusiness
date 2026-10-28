import { FirmInfo, InvoiceHistoryRecord } from '../types/solar';

/**
 * Calculates current Financial Year string (e.g. "26-27" for FY 2026-2027)
 */
export function getCurrentFinancialYearCode(): string {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 3 = April
  const fullYear = now.getFullYear();
  const startYr = month >= 3 ? fullYear : fullYear - 1;
  const yr1 = String(startYr).slice(-2);
  const yr2 = String(startYr + 1).slice(-2);
  return `${yr1}-${yr2}`;
}

/**
 * Derives a clean uppercase prefix from firm name or configured prefix
 */
export function getFirmInvoicePrefix(firm: FirmInfo): string {
  if (firm.invoicePrefix && firm.invoicePrefix.trim()) {
    return firm.invoicePrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  const name = (firm.name || '').trim();
  if (!name || name === 'My Business Firm' || name === 'Your Business Name') {
    return 'INV';
  }

  // Derive acronym from words (e.g. "Jagga Enterprises & Co." -> "JE", "Dexon Solar" -> "DS")
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0 && !['AND', '&', 'CO', 'CO.', 'LTD', 'PVT'].includes(w.toUpperCase()));

  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return 'INV';
}

/**
 * Parses numeric sequence from an existing invoice number string
 * Supports formats like:
 * - "JE/26-27/001" -> 1
 * - "INV-2026-042" -> 42
 * - "AST/005" -> 5
 * - "105" -> 105
 */
export function parseInvoiceSequenceNumber(invNo: string): number | null {
  if (!invNo) return null;
  // Match trailing sequence of digits
  const match = invNo.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Generates the NEXT strictly guaranteed unique invoice number.
 * Automatically checks firm settings and history records to prevent any duplicate invoice number.
 */
export function generateNextInvoiceNumber(
  firm: FirmInfo,
  history: InvoiceHistoryRecord[],
  forceMinNumber?: number
): string {
  const prefix = getFirmInvoicePrefix(firm);
  const fyCode = getCurrentFinancialYearCode();
  const startNum = forceMinNumber || firm.invoiceStartingNumber || 1;

  // Extract all existing numbers used in history
  const usedNumbers: number[] = [];
  const existingInvNos = new Set(history.map((h) => (h.invNo || '').trim().toUpperCase()));

  history.forEach((h) => {
    const num = parseInvoiceSequenceNumber(h.invNo);
    if (num !== null) {
      usedNumbers.push(num);
    }
  });

  const maxRecorded = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
  let candidateNum = Math.max(maxRecorded + 1, startNum);

  // Format with at least 3 digits padding (e.g. 001, 002, 010, 100)
  const formatInvNo = (num: number) => {
    const padded = String(num).padStart(3, '0');
    return `${prefix}/${fyCode}/${padded}`;
  };

  let candidate = formatInvNo(candidateNum);

  // Safeguard: Ensure candidate never collides with any existing invoice in history
  while (existingInvNos.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = formatInvNo(candidateNum);
  }

  return candidate;
}
