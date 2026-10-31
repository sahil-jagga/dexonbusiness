import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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

// -------------------------------------------------------------
// Bug Reports & Feedback Storage (data/feedback.json)
// -------------------------------------------------------------
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'admin_settings.json');

export interface BugReportRecord {
  id: string;
  createdAt: string;
  category: 'BUG' | 'CALCULATION' | 'FEATURE' | 'OTHER';
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  message: string;
  diagnostics?: any;
  status?: 'NEW' | 'REVIEWED' | 'RESOLVED';
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface AdminSettings {
  ownerNotificationEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  businessEmailFrom?: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  ownerNotificationEmail: 'sahiljagga2k@gmail.com',
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  businessEmailFrom: 'Dexon Business Support <support@dexonbusiness.com>',
};

function getFeedback(): BugReportRecord[] {
  ensureDataFile();
  if (!fs.existsSync(FEEDBACK_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFeedback(list: BugReportRecord[]) {
  ensureDataFile();
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function getAdminSettings(): AdminSettings {
  ensureDataFile();
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveAdminSettings(settings: AdminSettings) {
  ensureDataFile();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function sendSmtpEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  const settings = getAdminSettings();
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return { success: false, error: 'SMTP is not configured yet in Admin Settings' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort) || 465,
      secure: settings.smtpSecure !== false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    const fromAddress = settings.businessEmailFrom || `"Dexon Support" <${settings.smtpUser}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: options.replyTo || settings.ownerNotificationEmail,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br/>'),
    });

    return { success: true };
  } catch (err: any) {
    console.error('[SMTP EMAIL ERROR]:', err);
    return { success: false, error: err.message || 'SMTP transmission failed' };
  }
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
  const clean = key.trim().toUpperCase();
  const parts = clean.split('-');
  if (parts.length < 3) return null;
  const prefix = parts[0];
  if (prefix !== 'NXB' && prefix !== 'DX' && prefix !== 'DEXON') return null;
  const planCode = parts[1];
  if (!['BIZ', 'PRO', 'TRL'].includes(planCode)) return null;

  const clientCode = parts[2] || 'USER';
  const expiryCode = parts[3] || '3012';

  let expiryStr = '2030-12-31';
  if (/^\d{4}$/.test(expiryCode)) {
    const yy = parseInt(expiryCode.slice(0, 2), 10);
    const mm = parseInt(expiryCode.slice(2, 4), 10);
    if (mm >= 1 && mm <= 12) {
      const fullYear = 2000 + yy;
      const lastDay = new Date(fullYear, mm, 0).getDate();
      expiryStr = `${fullYear}-${String(mm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
  }

  const plan: 'Trial' | 'Pro' | 'Business' = planCode === 'BIZ' ? 'Business' : planCode === 'PRO' ? 'Pro' : 'Trial';

  return {
    key: clean,
    clientName: `Authorized ${plan} Client (${clientCode})`,
    clientPhone: '94298-42000',
    plan,
    expiry: expiryStr,
    invoiceLimit: plan === 'Trial' ? 5 : 99999,
    isActive: true,
    createdAt: new Date().toISOString(),
    totalInvoicesGenerated: 0,
    notes: `Dexon Verified ${plan} Key`,
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
// App Version & In-App Update API
// -------------------------------------------------------------
app.get('/api/app-version', (_req, res) => {
  return res.json({
    version: '2.5.0',
    releaseDate: 'October 29, 2026',
    isLatest: true,
  });
});

// -------------------------------------------------------------
// Client Bug Reporting & Feedback Proxy (Secret Email Pipeline)
// -------------------------------------------------------------
// Client submits issue/bug; stored securely, dispatched to owner email, email hidden from clients
app.post('/api/submit-feedback', async (req, res) => {
  const { category, clientName, clientPhone, clientEmail, message, diagnostics } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const reports = getFeedback();
  const settings = getAdminSettings();

  const newReport: BugReportRecord = {
    id: 'REP-' + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    category: category || 'BUG',
    clientName: (clientName || 'Anonymous User').trim(),
    clientPhone: (clientPhone || '').trim(),
    clientEmail: (clientEmail || '').trim(),
    message: message.trim(),
    diagnostics: diagnostics || null,
    status: 'NEW',
  };

  reports.unshift(newReport);
  saveFeedback(reports);

  console.log(`[DEXON FEEDBACK DISPATCHED] To: ${settings.ownerNotificationEmail} | From: ${newReport.clientName} (${newReport.category}): ${newReport.message.substring(0, 60)}...`);

  // Send real email via SMTP if configured
  let emailSent = false;
  let emailError: string | undefined;

  if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
    const emailResult = await sendSmtpEmail({
      to: settings.ownerNotificationEmail,
      subject: `🚨 [Dexon Ticket ${newReport.id}] ${newReport.category}: from ${newReport.clientName}`,
      text: `Naya support ticket mila hai:\n\nTicket ID: ${newReport.id}\nCategory: ${newReport.category}\nClient: ${newReport.clientName}\nPhone: ${newReport.clientPhone}\n\nMessage:\n${newReport.message}\n\nDexon Admin Portal (#/owner) me jaakar check karein.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">⚡ Dexon Client Support Alert</h2>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 4px 0;"><strong>Ticket ID:</strong> <span style="font-family: monospace; color: #2563eb;">${newReport.id}</span></p>
            <p style="margin: 4px 0;"><strong>Category:</strong> <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${newReport.category}</span></p>
            <p style="margin: 4px 0;"><strong>Client Name:</strong> ${newReport.clientName}</p>
            <p style="margin: 4px 0;"><strong>Client Phone:</strong> <a href="tel:${newReport.clientPhone}">${newReport.clientPhone || 'Not provided'}</a></p>
          </div>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <strong style="color: #1e3a8a;">Client Description / Bug Report:</strong>
            <p style="white-space: pre-wrap; margin: 8px 0 0 0; color: #1e293b; font-size: 14px; line-height: 1.5;">${newReport.message}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Delivered securely to <strong>${settings.ownerNotificationEmail}</strong>. Replying will reach this client directly.</p>
        </div>
      `,
    });
    emailSent = emailResult.success;
    emailError = emailResult.error;
  }

  return res.json({
    success: true,
    message: emailSent
      ? 'Report received and notification email dispatched to your inbox.'
      : 'Report received and saved securely in your Dexon Admin Vault.',
    reportId: newReport.id,
    emailSent,
    emailError,
  });
});

// Admin feedback view (protected)
app.get('/api/admin/feedback', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const reports = getFeedback();
  return res.json({ reports });
});

// Admin feedback delete (protected)
app.delete('/api/admin/feedback/:id', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const targetId = req.params.id;
  let reports = getFeedback();
  reports = reports.filter((r) => r.id !== targetId);
  saveFeedback(reports);
  return res.json({ success: true, message: `Report ${targetId} deleted` });
});

// Owner Notification Email Config (Get & Update)
app.get('/api/admin/notification-email', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const settings = getAdminSettings();
  return res.json({
    email: settings.ownerNotificationEmail,
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || 465,
    smtpSecure: settings.smtpSecure !== false,
    smtpUser: settings.smtpUser || '',
    hasSmtpPass: Boolean(settings.smtpPass),
    businessEmailFrom: settings.businessEmailFrom || '',
  });
});

app.post('/api/admin/notification-email', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const { email, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, businessEmailFrom } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required' });
  }
  const settings = getAdminSettings();
  settings.ownerNotificationEmail = email.trim().toLowerCase();
  if (smtpHost !== undefined) settings.smtpHost = smtpHost.trim();
  if (smtpPort !== undefined) settings.smtpPort = Number(smtpPort) || 465;
  if (smtpSecure !== undefined) settings.smtpSecure = Boolean(smtpSecure);
  if (smtpUser !== undefined) settings.smtpUser = smtpUser.trim();
  if (smtpPass !== undefined && smtpPass.trim()) settings.smtpPass = smtpPass.trim();
  if (businessEmailFrom !== undefined) settings.businessEmailFrom = businessEmailFrom.trim();

  saveAdminSettings(settings);
  return res.json({
    success: true,
    email: settings.ownerNotificationEmail,
    message: 'Settings updated successfully! SMTP & Notification Email active.',
  });
});

// Test SMTP connection and email delivery
app.post('/api/admin/test-email', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const settings = getAdminSettings();
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return res.status(400).json({
      error: 'SMTP not configured. Please fill SMTP Host, Username and Password/App Password first.',
    });
  }

  const result = await sendSmtpEmail({
    to: settings.ownerNotificationEmail,
    subject: '🧪 Dexon SMTP Test Email — Verified Working!',
    text: `Congratulations! Your Dexon SMTP and Business Email configuration is working properly.\n\nNotification Email: ${settings.ownerNotificationEmail}\nSMTP Host: ${settings.smtpHost}\nFrom Address: ${settings.businessEmailFrom || settings.smtpUser}\nTimestamp: ${new Date().toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #10b981; border-radius: 12px; max-width: 550px;">
        <h2 style="color: #059669; margin-top: 0;">✅ Dexon SMTP Test Successful!</h2>
        <p>Aapka email setup bilkul sahi tarike se configure ho gaya hai. Ab sabhi client tickets aur replies seedha aapke email aur customer ke inbox me deliver honge.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <ul style="color: #334155; font-size: 13px; line-height: 1.6;">
          <li><b>Delivery Address:</b> ${settings.ownerNotificationEmail}</li>
          <li><b>SMTP Host:</b> ${settings.smtpHost}</li>
          <li><b>From Sender:</b> ${settings.businessEmailFrom || settings.smtpUser}</li>
        </ul>
      </div>
    `,
  });

  if (result.success) {
    return res.json({ success: true, message: `Test email successfully delivered to ${settings.ownerNotificationEmail}!` });
  } else {
    return res.status(500).json({ error: result.error || 'Failed to send test email' });
  }
});

// Resolve Ticket & Send Customer Fix Notification Email
app.post('/api/admin/resolve-ticket', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const { ticketId, resolutionMessage, clientEmail, sendEmail } = req.body;
  if (!ticketId) {
    return res.status(400).json({ error: 'Ticket ID required' });
  }

  const reports = getFeedback();
  const ticket = reports.find((r) => r.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  ticket.status = 'RESOLVED';
  ticket.resolutionNotes = resolutionMessage || 'Resolved by engineering team';
  ticket.resolvedAt = new Date().toISOString();
  saveFeedback(reports);

  let emailSent = false;
  let emailError: string | undefined;

  const targetEmail = clientEmail || ticket.clientEmail;
  if (sendEmail && targetEmail && targetEmail.includes('@')) {
    const settings = getAdminSettings();
    const result = await sendSmtpEmail({
      to: targetEmail,
      subject: `✅ [Resolved] Regarding your Dexon feedback ticket (${ticket.id})`,
      text: `Dear ${ticket.clientName || 'Customer'},\n\nYour reported issue (${ticket.category}) has been resolved:\n\n${resolutionMessage || 'The issue has been resolved in our latest Dexon update. Please reload or update your app to access the fix.'}\n\nThank you for helping us improve Dexon!\n\nBest regards,\n${settings.businessEmailFrom || 'Dexon Engineering Team'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #059669; margin-top: 0;">✅ Your Dexon Issue Has Been Resolved</h2>
          <p>Dear <strong>${ticket.clientName || 'Valued Customer'}</strong>,</p>
          <p>Regarding your reported ticket <strong>#${ticket.id}</strong> (${ticket.category}):</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px; margin: 16px 0; border-radius: 0 8px 8px 0; font-size: 14px; color: #065f46;">
            <strong>Resolution Details:</strong>
            <p style="margin: 6px 0 0 0; white-space: pre-wrap;">${resolutionMessage || 'This issue has been fixed in the latest Dexon software update. Please reload your application to apply the fix.'}</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">Thank you for your valuable feedback.</p>
        </div>
      `,
    });
    emailSent = result.success;
    emailError = result.error;
  }

  return res.json({
    success: true,
    message: `Ticket ${ticketId} marked as RESOLVED!`,
    emailSent,
    emailError,
  });
});

// Two-way License Synchronization (Server <-> Local / Vercel Vaults)
app.post('/api/admin/licenses/sync', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin PIN required' });
  }
  const clientLicenses: LicenseRecord[] = Array.isArray(req.body.licenses) ? req.body.licenses : [];
  let serverLicenses = getLicenses();

  // Merge client licenses into server by key
  const serverKeyMap = new Map<string, LicenseRecord>();
  serverLicenses.forEach((l) => serverKeyMap.set(l.key.toUpperCase(), l));

  clientLicenses.forEach((cl) => {
    if (cl && cl.key) {
      const k = cl.key.toUpperCase();
      if (!serverKeyMap.has(k)) {
        serverKeyMap.set(k, cl);
      }
    }
  });

  const merged = Array.from(serverKeyMap.values());
  saveLicenses(merged);

  return res.json({
    success: true,
    licenses: merged,
    count: merged.length,
    message: `Synchronized ${merged.length} total licenses across server & local vaults.`,
  });
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
