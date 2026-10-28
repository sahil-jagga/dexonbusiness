# NexBill Pro SaaS — Changelog

All notable changes and architectural upgrades to the NexBill platform are documented in this file.

---

## [v3.0.0-PRO] - 2026-10-24 (Production Architecture & Multi-Trade Isolation)

### 🚀 Phase 12: Trade-Wise Separation & Clean Initialization
- **Strict 70:30 Solar Calculation Isolation:**
  - Restricted the PM Surya Ghar 70:30 statutory calculation helper strictly to the Solar EPC trade (`solar`).
  - Completely purged any 70:30 references, ratio bars, or composite supply remarks from non-solar trades.
  - Purged internal calculation notes from customer-facing invoices, PDFs, printouts, and WhatsApp shares.
- **Multi-Trade Support & Engine (`src/config/trades.ts`):**
  - Added full support for 6 specialized industry trades:
    1. ☀️ **Solar EPC & Rooftop Systems** (`solar`): 70:30 statutory helper, WCC certificate, Bank Loan Estimate, Subsidy Proposal.
    2. 🏍️ **Bike & Two-Wheeler Spare Parts** (`bike_spares`): Vehicle reg. no., chassis/engine no., odometer KM, OEM part tracking.
    3. ⚡ **Electronics & Electricals** (`electronics`): Serial number and warranty period tracking.
    4. 🔩 **Hardware, Paints & Sanitary** (`hardware`): Metric units (Mtr, Kg, Set, Nos), civil contractor refs.
    5. 🚗 **Automobile & Garage Services** (`automobile`): 4-wheeler vehicle registration, VIN/chassis, labor charges.
    6. 🏢 **General Trading & Services** (`general_trading`): Wholesale merchandise, consulting, standard B2B/B2C GST.
- **Clean Workspace Initialization (Zero Demo Data Pollution):**
  - Replaced hardcoded initial state (`DEFAULT_FIRM` "Jagga Enterprises", `DEFAULT_CUSTOMER` "Rajesh Kumar Verma", demo invoices) with a clean, isolated initial state for fresh accounts (`EMPTY_FIRM`, `EMPTY_CUSTOMER`).
  - Added onboarding Trade Selection dialog (`TradeSelectionModal.tsx`) when launching for the first time without a preselected trade, preventing default fallback to Solar.
  - Added dedicated on-demand "Load Demo Sample (Jagga Solar Dataset)" action in Settings for safe testing and QA review.
- **Solar Quotation vs. Solar Tax Invoice Separation:**
  - **Solar Quotation:** Renders turnkey package deal amount (lump sum) with clean system specifications summary, expected annual generation, annual electricity bill savings, and PM Surya Ghar central subsidy breakdown. Does NOT expose individual component unit rates or line HSN codes to prospective customers.
  - **Solar Tax Invoice:** Itemized tax invoice with statutory HSN, rates, CGST, SGST, IGST, and slab-wise breakdown.
- **Special Document Isolation:**
  - Work Completion Certificate (WCC) and Bank Loan Margin Estimate are isolated strictly to Solar EPC trade.

---

## [v2.5.0-PRO] - 2026-10-24 (PostgreSQL & Supabase Architecture - Phase 8)
- **Database Schema with Row Level Security (`supabase/migrations/01_init_schema.sql`):**
  - Designed relational PostgreSQL schema: `profiles`, `firms`, `bank_accounts`, `customers`, `invoices`, `daybook_entries`, `stock_items`.
  - Added strict Row Level Security (RLS) policies on all tables (`auth.uid() = user_id`) to ensure tenant isolation.
- **Tenant-Isolated Storage Adapter (`src/lib/supabase.ts`):**
  - Scopes all browser persistence by active user ID (`nb_${userId}_*`), preventing cross-account data leaks.
  - Added graceful offline-first fallback and user workspace manager (`AuthModal.tsx`).

---

## [v2.0.0-PRO] - 2026-10-24 (Security & Licensing Hardening)
- **Cryptographic License Enforcement:**
  - Replaced loose prefix matching with HMAC cryptographic checksum verification (`NXB-[PLAN]-[CLIENT]-[YYMM]-[CHECKSUM]`).
  - Replaced hardcoded plaintext PINs with SHA-256 cryptographic hashes (`AUTHORIZED_ADMIN_PIN_HASHES`).
- **Data Harmonization & Disaster Recovery (`backupService.ts`):**
  - Fixed mismatched storage keys (`nb_customer_directory` vs `nb_saved_customers_list`, `nb_bank_data` vs `nb_bank_details`, `nb_stocks_library` vs `nb_custom_products`, `nb_book_entries` vs `nb_daybook_entries`).
  - Added automated pre-restore backup recovery snapshot (`nb_pre_restore_backup`).
- **UIDAI Privacy Compliance (`src/utils/privacy.ts`):**
  - Masked customer Aadhaar numbers to show only the last 4 digits (`XXXX-XXXX-1234`).
- **Precision Financial Arithmetic (`src/utils/calculations.ts`):**
  - Introduced integer paise arithmetic for subtotal, CGST, SGST, IGST, and round-off calculations to prevent floating point drift.
- **Automated Test Suite (`scripts/run-tests.mjs`):**
  - Added 14 automated unit tests covering financial arithmetic, 70:30 compliance, trade isolation, privacy masking, and licensing.
