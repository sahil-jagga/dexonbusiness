/**
 * Privacy & Regulatory Compliance Helpers
 * Adheres to Indian UIDAI Aadhaar Act (Masking first 8 digits) and IT Act privacy norms.
 */

export function maskAadhaar(val?: string): string {
  if (!val) return '';
  // Clean all non-digit characters
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  // If user already typed masked format or partial
  if (val.includes('X') || val.includes('x') || val.includes('*')) {
    return val;
  }
  return val;
}

export function formatAadhaarInput(val: string): string {
  // Allow user to type digits, auto-formats into XXXX-XXXX-XXXX spacing
  const cleaned = val.replace(/[^\dXx*]/g, '').slice(0, 14);
  return cleaned;
}
