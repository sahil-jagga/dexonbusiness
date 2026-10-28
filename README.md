# NexBill Pro SaaS — Multi-Trade Business Invoicing & ERP Suite

A high-performance commercial billing, multi-trade ERP, statutory GST accounting, and client licensing platform built for modern Indian businesses.

---

## 🚀 Key Features

### 1. Multi-Trade Architecture (Phase 12)
NexBill provides 6 specialized industry trade modes:
1. ☀️ **Solar EPC & Rooftop Systems (`solar`):** Statutory 70:30 composite supply calculation helper, Work Completion Certificate (WCC), Bank Loan Margin Estimate, and PM Surya Ghar subsidy quotations.
2. 🏍️ **Bike & Two-Wheeler Spare Parts (`bike_spares`):** Two-wheeler spare parts inventory, vehicle registration numbers, chassis/engine numbers, and odometer tracking.
3. ⚡ **Electronics & Electricals (`electronics`):** Serial numbers, warranty period tracking, and electrical contractor billing.
4. 🔩 **Hardware, Paints & Sanitary (`hardware`):** Metric units (Mtr, Kg, Set, Nos), civil contractor and site delivery tracking.
5. 🚗 **Automobile & Garage Services (`automobile`):** 4-wheeler workshop repairs, VIN numbers, and labor charges.
6. 🏢 **General Trading & Services (`general_trading`):** Wholesale trading, consulting, and standard B2B/B2C GST invoicing.

### 2. Trade Isolation & Compliance
- **70:30 Solar Rule Isolated:** The 70:30 composite supply calculator is strictly restricted to the Solar EPC trade. It is completely hidden in non-solar trades and never appears on customer-facing invoices, PDFs, or printouts.
- **Solar Quotation vs Tax Invoice:**
  - **Quotation:** Turnkey package deal proposal (lump sum) with clean system specifications, annual electricity generation, savings, and PM Surya Ghar subsidy details (does not expose itemized unit prices or HSN lines to prospective customers).
  - **Tax Invoice:** Full statutory tax invoice with itemized HSN codes, rates, CGST, SGST, IGST, and slab-wise breakdown.
- **WCC & Bank Estimates:** Work Completion Certificates and Bank Estimates are accessible strictly in Solar EPC mode.

### 3. Clean Initialization & Multi-Tenant Isolation
- Fresh user accounts initialize with an empty, clean state (no prefilled demo firms or dummy invoices).
- New sessions prompt the user to choose their trade via `TradeSelectionModal`.
- On-demand "Load Demo Sample (Jagga Solar Dataset)" action available in Settings for testing.
- Multi-tenant storage adapter (`src/lib/supabase.ts`) namespaces all data by user ID (`nb_${userId}_*`).

### 4. PostgreSQL & Supabase Database (Phase 8)
- Complete PostgreSQL migration script in `supabase/migrations/01_init_schema.sql`.
- Includes tables for `profiles`, `firms`, `bank_accounts`, `customers`, `invoices`, `daybook_entries`, and `stock_items`.
- Hardened with PostgreSQL Row Level Security (RLS) policies (`auth.uid() = user_id`).

### 5. Privacy & Regulatory UIDAI Compliance
- Customer Aadhaar numbers are automatically masked (`XXXX-XXXX-1234`) according to UIDAI regulations.

### 6. Disaster Recovery & Backup Integrity
- Automated pre-restore backup recovery snapshot (`nb_pre_restore_backup`) before any restore operation.
- Harmonized storage keys preventing data loss during backup/restore.

---

## 🛠️ Quick Start (Local Setup)

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (14 Unit Tests)
npm test

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🧪 Automated Testing

NexBill includes an automated unit test suite covering financial arithmetic, GST slab calculations, 70:30 ratio validation, trade isolation rules, Aadhaar privacy masking, and cryptographic licensing:

```bash
npm test
```

---

## 📦 Production Build & Source Export

```bash
# Compile and build standard bundle, single-file offline HTML, and Source ZIP
npm run build
```

Build outputs:
- `dist/`: Production web app bundle
- `dist/Nexbill_Solar_Pro_Offline.html`: Standalone single-file offline HTML application (~1.6 MB)
- `public/NexBill-Fixed-Source-v1.zip`: Complete unminified source code ZIP for audit and development
- `public/nexbill-website-deploy.zip`: Ready-to-deploy web hosting ZIP
