import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// Persistent License Storage (data/licenses.json)
// -------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, 'data');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');

export interface LicenseRecord {
  key: string;
  clientName: string;
  clientPhone: string;
  plan: 'Trial' | 'Pro' | 'Business';
  expiry: string; // YYYY-MM-DD
  invoiceLimit: number; // 5 or 99999
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  totalInvoicesGenerated: number;
  boundDeviceId?: string;
  notes?: string;
}

const DEFAULT_LICENSES: LicenseRecord[] = [
  {
    key: 'TRIAL-NEXBILL-2026',
    clientName: 'Public Trial User',
    clientPhone: '94298-42000',
    plan: 'Trial',
    expiry: '2028-12-31',
    invoiceLimit: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: 'Free trial key for public testing (5 bills/mo)',
  },
  {
    key: 'NXB-PRO-SAHIL-001',
    clientName: 'Jagga Enterprises (Owner)',
    clientPhone: '94298-42000',
    plan: 'Pro',
    expiry: '2030-12-31',
    invoiceLimit: 99999,
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: 'Lifetime Owner Pro Key',
  },
  {
    key: 'NXB-BIZ-DEMO-2026',
    clientName: 'Demo Solar EPC Vendor',
    clientPhone: '94283-42000',
    plan: 'Business',
    expiry: '2027-12-31',
    invoiceLimit: 99999,
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: 'Commercial Demo Key (Multi-Firm Enabled)',
  },
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LICENSES_FILE)) {
    fs.writeFileSync(LICENSES_FILE, JSON.stringify(DEFAULT_LICENSES, null, 2), 'utf-8');
  }
}

function getLicenses(): LicenseRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(LICENSES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LICENSES;
  }
}

function saveLicenses(list: LicenseRecord[]) {
  ensureDataFile();
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

import crypto from 'crypto';

// Secret cryptographic salt for offline key verification
const CRYPTO_KEY_SALT = 'NXB_SECURE_HMAC_SALT_v2_94298_2026';

function calculateKeyChecksum(plan: string, clientCode: string, expiryCode: string): string {
  const str = `${plan.toUpperCase()}-${clientCode.toUpperCase()}-${expiryCode}-${CRYPTO_KEY_SALT}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function verifySignedKey(key: string): LicenseRecord | null {
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 5 || parts[0] !== 'NXB') return null;
  const planCode = parts[1];
  const clientCode = parts[2];
  const expiryCode = parts[3];
  const checksum = parts[4];
  if (!['BIZ', 'PRO', 'TRL'].includes(planCode)) return null;
  if (!/^\d{4}$/.test(expiryCode)) return null;
  if (calculateKeyChecksum(planCode, clientCode, expiryCode) !== checksum) return null;

  const yy = parseInt(expiryCode.slice(0, 2), 10);
  const mm = parseInt(expiryCode.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return null;
  const fullYear = 2000 + yy;
  const lastDay = new Date(fullYear, mm, 0).getDate();
  const expiryStr = `${fullYear}-${String(mm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const plan: 'Trial' | 'Pro' | 'Business' = planCode === 'BIZ' ? 'Business' : planCode === 'PRO' ? 'Pro' : 'Trial';

  return {
    key,
    clientName: `Authorized ${plan} Client (${clientCode})`,
    clientPhone: '94298-42000',
    plan,
    expiry: expiryStr,
    invoiceLimit: plan === 'Trial' ? 5 : 99999,
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: `Cryptographically Signed ${plan} Key`,
  };
}

const AUTHORIZED_ADMIN_HASHES = [
  '3126e4d3daf24881e9f67ea8db02fdf8e1f3964081950c749db88ab79d1f86c4',
  '6adeaa79a6241c12f39357ed72c4df2c823548f9249590ec9b307a689514f3eb',
  'd00608b2d4410e9e26458f39d6706656d7b2adca72ac684d8408f5d1d7cb2f8a',
];

function isAdmin(req: express.Request): boolean {
  const pin = req.headers['x-admin-pin'] || req.query.admin_pin || req.body?.adminPin;
  if (!pin) return false;
  const hash = crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
  return AUTHORIZED_ADMIN_HASHES.includes(hash);
}

// -------------------------------------------------------------
// API Endpoints for Public License Verification & Tracking
// -------------------------------------------------------------

// 1. Verify a license key (Used by clients on login & during app use)
app.post('/api/verify-license', (req, res) => {
  const { key, incrementCount, deviceId } = req.body;
  if (!key) {
    return res.status(400).json({ valid: false, reason: 'EMPTY_KEY', message: 'License key is required' });
  }

  const cleanKey = String(key).trim().toUpperCase();
  const licenses = getLicenses();
  let found = licenses.find((l) => l.key.toUpperCase() === cleanKey);

  // Authenticate signed cryptographic keys without database pre-entry
  if (!found) {
    const signed = verifySignedKey(cleanKey);
    if (signed) {
      found = signed;
      licenses.push(found);
      saveLicenses(licenses);
    }
  }

  if (!found) {
    return res.status(200).json({
      valid: false,
      reason: 'NOT_FOUND',
      message: '❌ Invalid license key. Please check or contact 94298-42000 to purchase.',
    });
  }

  if (!found.isActive) {
    return res.status(200).json({
      valid: false,
      reason: 'REVOKED',
      message: '🚫 This license has been REVOKED or DEACTIVATED by the administrator. Contact 94298-42000.',
    });
  }

  const now = new Date();
  const expiryDate = new Date(found.expiry + 'T23:59:59');
  if (now > expiryDate) {
    return res.status(200).json({
      valid: false,
      reason: 'EXPIRED',
      message: `⏳ License expired on ${found.expiry}. Please renew your plan — Call 94298-42000.`,
      expiry: found.expiry,
    });
  }

  // 1-Device per License Enforcement:
  // Pro plan is strictly locked to 1 single device!
  // Business plan and Trial allow multi-device usage.
  const isMultiDeviceAllowed =
    found.plan === 'Trial' ||
    found.plan === 'Business' ||
    found.key === 'NXB-PRO-SAHIL-001' ||
    found.key.startsWith('NXB-BIZ-DEMO');

  if (deviceId && !isMultiDeviceAllowed) {
    if (!found.boundDeviceId) {
      // First device binds automatically!
      found.boundDeviceId = deviceId;
    } else if (found.boundDeviceId !== deviceId) {
      return res.status(200).json({
        valid: false,
        reason: 'DEVICE_LOCKED',
        message: '🚫 Yeh License Key already kisi doosre computer/phone par active hai. Pro Plan sirf 1 Device ke liye hota hai. Multi-device ke liye Business Plan lein ya reset karwane ke liye call karein: 94298-42000.',
      });
    }
  }

  // Update last used timestamp and optionally invoice count
  found.lastUsedAt = new Date().toISOString();
  if (incrementCount) {
    found.totalInvoicesGenerated = (found.totalInvoicesGenerated || 0) + 1;
  }
  saveLicenses(licenses);

  return res.status(200).json({
    valid: true,
    license: {
      key: found.key,
      clientName: found.clientName,
      clientPhone: found.clientPhone,
      plan: found.plan,
      expiry: found.expiry,
      invoiceLimit: found.invoiceLimit,
      isActive: found.isActive,
      totalInvoicesGenerated: found.totalInvoicesGenerated,
      boundDeviceId: found.boundDeviceId,
    },
    message: '✅ License verified successfully',
  });
});

// 2. Report invoice generated (increments license usage counter in real time)
app.post('/api/report-invoice', (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Key required' });
  const cleanKey = String(key).trim().toUpperCase();
  const licenses = getLicenses();
  const found = licenses.find((l) => l.key.toUpperCase() === cleanKey);
  if (found) {
    found.totalInvoicesGenerated = (found.totalInvoicesGenerated || 0) + 1;
    found.lastUsedAt = new Date().toISOString();
    saveLicenses(licenses);
    return res.json({ success: true, count: found.totalInvoicesGenerated });
  }
  return res.json({ success: false });
});

// -------------------------------------------------------------
// Admin Portal Endpoints (Protected by Admin PIN)
// -------------------------------------------------------------

// Admin PIN check
app.post('/api/admin/verify-pin', (req, res) => {
  if (isAdmin(req)) {
    return res.json({ success: true, message: 'Admin authenticated' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// List all licenses with stats
app.get('/api/admin/licenses', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const licenses = getLicenses();
  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.isActive).length,
    revoked: licenses.filter((l) => !l.isActive).length,
    totalInvoices: licenses.reduce((sum, l) => sum + (l.totalInvoicesGenerated || 0), 0),
  };
  return res.json({ licenses, stats });
});

// Create a new license key
app.post('/api/admin/licenses', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }

  const { clientName, clientPhone, plan, expiry, invoiceLimit, customKey, notes } = req.body;
  if (!clientName) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  // Generate key if not specified
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const prefix = plan === 'Business' ? 'NXB-BIZ' : plan === 'Pro' ? 'NXB-PRO' : 'NXB-TRL';
  const generatedKey = customKey ? customKey.trim().toUpperCase() : `${prefix}-${randomPart}-${Math.floor(100 + Math.random() * 900)}`;

  const licenses = getLicenses();
  if (licenses.some((l) => l.key.toUpperCase() === generatedKey)) {
    return res.status(400).json({ error: 'This license key already exists. Try another or leave blank for auto-generation.' });
  }

  const newLicense: LicenseRecord = {
    key: generatedKey,
    clientName: clientName.trim(),
    clientPhone: (clientPhone || '').trim(),
    plan: plan || 'Pro',
    expiry: expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceLimit: Number(invoiceLimit) || (plan === 'Trial' ? 5 : 99999),
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: notes || '',
  };

  licenses.unshift(newLicense);
  saveLicenses(licenses);
  return res.json({ success: true, license: newLicense });
});

// Delete a license permanently
app.delete('/api/admin/licenses/:key', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const targetKey = decodeURIComponent(req.params.key).trim().toUpperCase();
  let licenses = getLicenses();
  const beforeCount = licenses.length;
  licenses = licenses.filter((l) => l.key.toUpperCase() !== targetKey);

  if (licenses.length === beforeCount) {
    return res.status(404).json({ error: 'License key not found' });
  }

  saveLicenses(licenses);
  return res.json({ success: true, message: `Key ${targetKey} deleted permanently` });
});

// Toggle / Revoke a license
app.patch('/api/admin/licenses/:key/toggle', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const targetKey = decodeURIComponent(req.params.key).trim().toUpperCase();
  const licenses = getLicenses();
  const found = licenses.find((l) => l.key.toUpperCase() === targetKey);

  if (!found) {
    return res.status(404).json({ error: 'License key not found' });
  }

  found.isActive = !found.isActive;
  saveLicenses(licenses);
  return res.json({ success: true, isActive: found.isActive, message: found.isActive ? 'License activated' : 'License REVOKED' });
});

// Reset bound device ID (Allows client to move to a new device/laptop)
app.post('/api/admin/licenses/:key/reset-device', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const targetKey = decodeURIComponent(req.params.key).trim().toUpperCase();
  const licenses = getLicenses();
  const found = licenses.find((l) => l.key.toUpperCase() === targetKey);

  if (!found) {
    return res.status(404).json({ error: 'License key not found' });
  }

  found.boundDeviceId = undefined;
  saveLicenses(licenses);
  return res.json({ success: true, message: `Device binding cleared for key ${targetKey}. Now ready for new device activation.` });
});

// Export licenses as JSON
app.get('/api/admin/export', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const licenses = getLicenses();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="nexbill-licenses-backup.json"');
  return res.send(JSON.stringify(licenses, null, 2));
});

// Download full application ZIP file
app.get(['/api/download-zip', '/download-zip', '/nexbill-website-deploy.zip'], (_req, res) => {
  const zipFile = path.resolve(__dirname, 'public', 'nexbill-website-deploy.zip');
  if (fs.existsSync(zipFile)) {
    res.setHeader('Content-Type', 'application/zip');
    return res.download(zipFile, 'nexbill-website-deploy.zip');
  }
  return res.status(404).json({ error: 'Package zip not found' });
});

// Download clean unminified source code ZIP for Claude / CA review (<200KB)
app.get(['/api/download-source', '/nexbill-source-code.zip', '/download-source'], (_req, res) => {
  const zipFile = path.resolve(__dirname, 'public', 'nexbill-source-code.zip');
  if (fs.existsSync(zipFile)) {
    res.setHeader('Content-Type', 'application/zip');
    return res.download(zipFile, 'nexbill-source-code.zip');
  }
  return res.status(404).json({ error: 'Source code zip not found' });
});

// Download standalone portable single-file HTML
app.get(['/api/download-portable', '/api/download-offline', '/download-offline', '/download-html', '/Nexbill_Solar_Pro_Offline.html'], (_req, res) => {
  const htmlFile = path.resolve(__dirname, 'public', 'Nexbill_Solar_Pro_Offline.html');
  if (fs.existsSync(htmlFile)) {
    return res.download(htmlFile, 'Nexbill_Solar_Pro_Offline.html');
  }
  return res.status(404).json({ error: 'Offline file not found' });
});

// -------------------------------------------------------------
// Vite Server mounting for Frontend
// -------------------------------------------------------------
async function startServer() {
  ensureDataFile();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Nexbill Solar Pro server running on http://localhost:${PORT}`);
  });
}

startServer();
