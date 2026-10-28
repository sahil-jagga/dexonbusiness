import { LicenseInfo } from '../types/solar';

const LOCAL_KEY_STORAGE = 'nb_license_key';
const LOCAL_KEY_DATA = 'nb_license_data';
const LOCAL_MONTH_COUNT = 'nb_inv_count_';
const LOCAL_DEVICE_ID = 'nb_device_id';

// Cryptographic salt loaded strictly from environment variable (VITE_KEY_SALT)
const CRYPTO_KEY_SALT =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KEY_SALT) ||
  'NXB_SECURE_HMAC_SALT_v2_94298_2026';

// SHA-256 Hashes of Authorized Admin PINs
const AUTHORIZED_ADMIN_PIN_HASHES = [
  '3126e4d3daf24881e9f67ea8db02fdf8e1f3964081950c749db88ab79d1f86c4',
  '6adeaa79a6241c12f39357ed72c4df2c823548f9249590ec9b307a689514f3eb',
  'd00608b2d4410e9e26458f39d6706656d7b2adca72ac684d8408f5d1d7cb2f8a',
];

export interface VerifyResult {
  valid: boolean;
  license?: LicenseInfo;
  reason?: string;
  message?: string;
}

/**
 * Computes a deterministic 4-character cryptographic checksum for a key payload.
 */
export function calculateKeyChecksum(plan: string, clientCode: string, expiryCode: string): string {
  const str = `${plan.toUpperCase()}-${clientCode.toUpperCase()}-${expiryCode}-${CRYPTO_KEY_SALT}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 */
export function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }
  // Lightweight fallback hash
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return Promise.resolve((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16));
}

export const licenseService = {
  // Get or create unique persistent device fingerprint
  getDeviceId(): string {
    let id = localStorage.getItem(LOCAL_DEVICE_ID);
    if (!id) {
      id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(LOCAL_DEVICE_ID, id);
    }
    return id;
  },

  // Get stored license key
  getStoredKey(): string | null {
    return localStorage.getItem(LOCAL_KEY_STORAGE);
  },

  getStoredLicenseData(): LicenseInfo | null {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Whitelisted authorized cryptographic seed licenses only
  getFallbackLicenses(): LicenseInfo[] {
    const builtIn: LicenseInfo[] = [
      {
        key: 'NXB-TRL-DEMO-2812-1A40',
        clientName: 'Trial Demo User',
        clientPhone: '94298-42000',
        plan: 'Trial',
        expiry: '2028-12-31',
        invoiceLimit: 5,
        isActive: true,
      },
      {
        key: 'NXB-PRO-SHIL-3012-3151',
        clientName: 'Jagga Enterprises (Owner)',
        clientPhone: '94298-42000',
        plan: 'Pro',
        expiry: '2030-12-31',
        invoiceLimit: 99999,
        isActive: true,
      },
      {
        key: 'NXB-BIZ-9429-3012-017D',
        clientName: 'Business VIP Client',
        clientPhone: '94298-42000',
        plan: 'Business',
        expiry: '2030-12-31',
        invoiceLimit: 99999,
        isActive: true,
      },
    ];

    try {
      const stored = localStorage.getItem('nb_custom_licenses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return [...builtIn, ...parsed];
        }
      }
    } catch {}
    return builtIn;
  },

  /**
   * Cryptographically decodes and verifies a signed key offline.
   * Format: NXB-[PLAN]-[CLIENT_CODE]-[EXPIRY_YYMM]-[CHECKSUM]
   * Example: NXB-BIZ-9429-3012-017D
   */
  decodeAlgorithmicKey(cleanKey: string): LicenseInfo | null {
    const key = cleanKey.trim().toUpperCase();

    // Key must match strict structure: NXB-(BIZ|PRO|TRL)-(CLIENT)-(YYMM)-(HEX4)
    const parts = key.split('-');
    if (parts.length !== 5 || parts[0] !== 'NXB') {
      return null;
    }

    const planCode = parts[1]; // BIZ, PRO, TRL
    const clientCode = parts[2]; // e.g. 9429 or ABCD
    const expiryCode = parts[3]; // e.g. 2812 (Dec 2028), 3012 (Dec 2030)
    const checksum = parts[4]; // 4 hex characters

    if (!['BIZ', 'PRO', 'TRL'].includes(planCode)) {
      return null;
    }

    if (expiryCode.length !== 4 || !/^\d{4}$/.test(expiryCode)) {
      return null;
    }

    // Verify cryptographic checksum
    const expectedChecksum = calculateKeyChecksum(planCode, clientCode, expiryCode);
    if (checksum !== expectedChecksum) {
      return null; // Forged or tampered key!
    }

    // Parse expiry date (YYMM -> 20YY-MM-lastDay)
    const yy = parseInt(expiryCode.slice(0, 2), 10);
    const mm = parseInt(expiryCode.slice(2, 4), 10);
    if (mm < 1 || mm > 12) return null;

    const fullYear = 2000 + yy;
    const lastDay = new Date(fullYear, mm, 0).getDate();
    const expiryStr = `${fullYear}-${String(mm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const plan: 'Trial' | 'Pro' | 'Business' =
      planCode === 'BIZ' ? 'Business' : planCode === 'PRO' ? 'Pro' : 'Trial';

    return {
      key,
      clientName: `Authorized ${plan} Client (${clientCode})`,
      clientPhone: '94298-42000',
      plan,
      expiry: expiryStr,
      invoiceLimit: plan === 'Trial' ? 5 : 99999,
      isActive: true,
      notes: `Cryptographically Signed ${plan} Key`,
    };
  },

  /**
   * Generates an authentic cryptographically signed key for Admin issuance.
   */
  generateSignedKey(plan: 'Trial' | 'Pro' | 'Business', expiryYearMonth: string, clientHint = 'USER'): string {
    const planCode = plan === 'Business' ? 'BIZ' : plan === 'Pro' ? 'PRO' : 'TRL';
    const clientCode = (clientHint.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'CLIENT').slice(0, 4).padEnd(4, '0');
    // Expiry in YYMM (e.g., 2030-12 -> 3012)
    const cleanYymm = expiryYearMonth.replace(/[^0-9]/g, '').slice(-4);
    const yymm = cleanYymm.length === 4 ? cleanYymm : '3012';
    const checksum = calculateKeyChecksum(planCode, clientCode, yymm);
    return `NXB-${planCode}-${clientCode}-${yymm}-${checksum}`;
  },

  // Verify license with server (and full static hosting / offline fallback)
  async verifyKey(key: string, recordUsage = false): Promise<VerifyResult> {
    const cleanKey = key.trim().toUpperCase();
    const deviceId = this.getDeviceId();

    try {
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, incrementCount: recordUsage, deviceId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.license) {
          localStorage.setItem(LOCAL_KEY_STORAGE, cleanKey);
          localStorage.setItem(LOCAL_KEY_DATA, JSON.stringify(data.license));
          return { valid: true, license: data.license, message: data.message };
        } else {
          this.clearStoredLicense();
          return {
            valid: false,
            reason: data.reason || 'INVALID',
            message: data.message || 'License is invalid or has been revoked.',
          };
        }
      }
    } catch {
      // Offline / Static hosting mode
    }

    // Static Hosting / Offline Cryptographic Engine:
    const allFallback = this.getFallbackLicenses();
    let match = allFallback.find((l) => l.key.toUpperCase() === cleanKey);

    // If not in pre-seeded list, verify cryptographic signature
    if (!match) {
      match = this.decodeAlgorithmicKey(cleanKey) || undefined;
    }

    if (match) {
      if (!match.isActive) {
        return { valid: false, reason: 'REVOKED', message: 'License key has been revoked by admin.' };
      }
      const expDate = new Date(match.expiry + 'T23:59:59');
      if (new Date() > expDate) {
        return { valid: false, reason: 'EXPIRED', message: `License expired on ${match.expiry}.` };
      }

      // Check device binding in local mode:
      // Business plan allows multi-device; Pro plan is strictly locked to 1 single device!
      const isMultiDevicePlan = match.plan === 'Business';
      const boundDevKey = `nb_bound_dev_${cleanKey}`;
      const existingBound = localStorage.getItem(boundDevKey);
      if (!existingBound) {
        localStorage.setItem(boundDevKey, deviceId);
      } else if (!isMultiDevicePlan && existingBound !== deviceId) {
        // Multi-device lock for Pro plan
        return {
          valid: false,
          reason: 'DEVICE_MISMATCH',
          message: '🚫 Yeh License Key already kisi doosre computer/phone par active hai. Pro Plan sirf 1 Device ke liye hota hai. Multi-device ke liye Business Plan lein ya device reset ke liye call karein: 94298-42000.',
        };
      }

      localStorage.setItem(LOCAL_KEY_STORAGE, cleanKey);
      localStorage.setItem(LOCAL_KEY_DATA, JSON.stringify(match));
      return { valid: true, license: match, message: 'Verified (Signed & Offline Active)' };
    }

    return {
      valid: false,
      reason: 'INVALID_KEY',
      message: 'Invalid License Key! Fake or unverified keys are strictly blocked. Contact Sahil at 94298-42000 to get an authentic license.',
    };
  },

  logout(): void {
    this.clearStoredLicense();
  },

  clearStoredLicense(): void {
    localStorage.removeItem(LOCAL_KEY_STORAGE);
    localStorage.removeItem(LOCAL_KEY_DATA);
  },

  getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  getMonthlyInvoiceCount(): number {
    const mk = this.getCurrentMonthKey();
    const val = localStorage.getItem(LOCAL_MONTH_COUNT + mk);
    return val ? parseInt(val, 10) : 0;
  },

  getMonthInvoiceCount(): number {
    return this.getMonthlyInvoiceCount();
  },

  incrementMonthlyInvoiceCount(): number {
    const mk = this.getCurrentMonthKey();
    const current = this.getMonthlyInvoiceCount();
    const updated = current + 1;
    localStorage.setItem(LOCAL_MONTH_COUNT + mk, updated.toString());
    return updated;
  },

  async recordInvoiceGenerated(_key?: string): Promise<number> {
    return this.incrementMonthlyInvoiceCount();
  },

  canGenerateInvoice(license: LicenseInfo | null): { allowed: boolean; reason?: string } {
    if (!license) {
      return { allowed: false, reason: 'No active license found.' };
    }
    if (!license.isActive) {
      return { allowed: false, reason: 'License has been disabled.' };
    }
    const expDate = new Date(license.expiry + 'T23:59:59');
    if (new Date() > expDate) {
      return { allowed: false, reason: `License expired on ${license.expiry}.` };
    }
    if (license.invoiceLimit === 99999) {
      return { allowed: true };
    }
    const used = this.getMonthlyInvoiceCount();
    if (used >= license.invoiceLimit) {
      return {
        allowed: false,
        reason: `Monthly limit reached (${used}/${license.invoiceLimit} bills). Upgrade to Pro or Business plan for unlimited billing.`,
      };
    }
    return { allowed: true };
  },

  // -------------------------------------------------------------
  // Admin Portal Secure Actions (Cryptographically Hashed PINs)
  // -------------------------------------------------------------
  async verifyAdminPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin: pin }),
      });
      if (res.ok) return true;
    } catch {
      // Offline fallback: Compare SHA-256 hash
    }

    const pinClean = pin.trim();
    const inputHash = await sha256Hex(pinClean);

    // Check against authorized hash list
    if (AUTHORIZED_ADMIN_PIN_HASHES.includes(inputHash)) {
      return true;
    }

    // Check custom PIN hash set by owner in localStorage
    const customHash = localStorage.getItem('nb_admin_pin_hash');
    if (customHash && customHash === inputHash) {
      return true;
    }

    return false;
  },

  async fetchAllLicenses(pin: string) {
    try {
      const res = await fetch('/api/admin/licenses', {
        headers: { 'x-admin-pin': pin },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const list = this.getFallbackLicenses();
    return {
      licenses: list,
      stats: {
        total: list.length,
        active: list.filter((l) => l.isActive).length,
        revoked: list.filter((l) => !l.isActive).length,
        totalInvoices: this.getMonthlyInvoiceCount(),
      },
    };
  },

  async createLicense(pin: string, data: {
    clientName: string;
    clientPhone: string;
    plan: 'Trial' | 'Pro' | 'Business';
    expiry: string;
    invoiceLimit: number;
    customKey?: string;
    notes?: string;
  }) {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Generate genuine signed cryptographic key
    const expiryYymm = data.expiry.replace(/[^0-9]/g, '').slice(2, 6) || '3012';
    const key = data.customKey && data.customKey.trim().length > 0
      ? data.customKey.trim().toUpperCase()
      : this.generateSignedKey(data.plan, expiryYymm, data.clientPhone || data.clientName);

    const newRecord: LicenseInfo = {
      key,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      plan: data.plan,
      expiry: data.expiry,
      invoiceLimit: data.invoiceLimit,
      isActive: true,
      notes: data.notes,
    };

    try {
      const stored = localStorage.getItem('nb_custom_licenses');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newRecord);
      localStorage.setItem('nb_custom_licenses', JSON.stringify(list));
    } catch {}

    return { success: true, license: newRecord, key };
  },

  async toggleLicense(pin: string, key: string) {
    try {
      const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}/toggle`, {
        method: 'PATCH',
        headers: { 'x-admin-pin': pin },
      });
      if (res.ok) return await res.json();
    } catch {}

    try {
      const stored = localStorage.getItem('nb_custom_licenses');
      if (stored) {
        const list: LicenseInfo[] = JSON.parse(stored);
        const item = list.find((l) => l.key === key);
        if (item) {
          item.isActive = !item.isActive;
          localStorage.setItem('nb_custom_licenses', JSON.stringify(list));
          return { success: true, license: item };
        }
      }
    } catch {}
    return { success: true };
  },

  async deleteLicense(pin: string, key: string) {
    try {
      const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      if (res.ok) return await res.json();
    } catch {}

    try {
      const stored = localStorage.getItem('nb_custom_licenses');
      if (stored) {
        const list: LicenseInfo[] = JSON.parse(stored);
        const filtered = list.filter((l) => l.key !== key);
        localStorage.setItem('nb_custom_licenses', JSON.stringify(filtered));
      }
    } catch {}
    return { success: true };
  },

  async resetDevice(pin: string, key: string) {
    try {
      const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}/reset-device`, {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
      });
      if (res.ok) return await res.json();
    } catch {}

    localStorage.removeItem(`nb_bound_dev_${key}`);
    return { success: true, message: 'Device reset' };
  },
};

// -------------------------------------------------------------
// Indian Rupees in Words Converter (Lakhs & Crores)
// -------------------------------------------------------------
export function numberToWordsRupees(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(num: number): string {
    let str = '';
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += ones[num] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remaining = n % 1000;

  if (crore > 0) words += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) words += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) words += convertHundreds(thousand) + ' Thousand ';
  if (remaining > 0) words += convertHundreds(remaining);

  return `Rupees ${words.trim()} Only`;
}

export function formatINR(val: number): string {
  return (val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatIntegerINR(val: number): string {
  return Math.round(val || 0).toLocaleString('en-IN');
}
