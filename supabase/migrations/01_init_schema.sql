-- ==============================================================================
-- NEXBILL PRO SaaS — PostgreSQL & Supabase Database Migration
-- Multi-Tenant Schema with PostgreSQL Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles & Users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  selected_trade TEXT DEFAULT 'solar',
  plan TEXT DEFAULT 'Trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Business Firms (Multi-Firm per user)
CREATE TABLE IF NOT EXISTS public.firms (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  mobile TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  email TEXT,
  tagline TEXT,
  logo_url TEXT,
  signature_url TEXT,
  trade TEXT DEFAULT 'solar',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firms_user ON public.firms(user_id);
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own firms"
  ON public.firms FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id TEXT REFERENCES public.firms(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_no TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  branch TEXT NOT NULL,
  upi_id TEXT,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_user ON public.bank_accounts(user_id);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bank accounts"
  ON public.bank_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Customer Directory
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT,
  address TEXT,
  mobile TEXT,
  aadhar_masked TEXT,
  trade TEXT DEFAULT 'solar',
  trade_meta JSONB DEFAULT '{}'::jsonb, -- appNo, consumerNo, sanctionLoad, vehicleNo, etc.
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(user_id, mobile);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own customers"
  ON public.customers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Invoices & Historical Records
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id TEXT,
  firm_name TEXT NOT NULL,
  inv_no TEXT NOT NULL,
  date DATE NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'invoice', -- 'invoice' | 'quotation' | 'wcc' | 'estimate'
  trade TEXT NOT NULL DEFAULT 'solar',
  customer_name TEXT NOT NULL,
  customer_mobile TEXT,
  customer_gstin TEXT,
  customer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  plant_capacity_kw TEXT,
  taxable_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_5_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_18_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  round_off NUMERIC(6, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  items_count INT NOT NULL DEFAULT 0,
  items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ISSUED', -- 'ISSUED' | 'CANCELLED' | 'PAID'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_invno ON public.invoices(user_id, inv_no);
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON public.invoices(user_id, date DESC);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Daybook & Accounting Entries
CREATE TABLE IF NOT EXISTS public.daybook_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id TEXT,
  date DATE NOT NULL,
  particulars TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL, -- 'INFLOW' | 'OUTFLOW'
  mode TEXT NOT NULL, -- 'BANK' | 'CASH' | 'UPI' | 'CHEQUE'
  amount NUMERIC(14, 2) NOT NULL,
  ref_no TEXT,
  party_name TEXT,
  notes TEXT,
  source TEXT DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daybook_user_date ON public.daybook_entries(user_id, date DESC);
ALTER TABLE public.daybook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daybook"
  ON public.daybook_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Custom Stock / Items Library
CREATE TABLE IF NOT EXISTS public.stock_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL DEFAULT 'solar',
  name TEXT NOT NULL,
  hsn TEXT NOT NULL,
  gst INT NOT NULL DEFAULT 18,
  default_buy NUMERIC(12, 2) DEFAULT 0,
  default_rate NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stocks_user_trade ON public.stock_items(user_id, trade);
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stocks"
  ON public.stock_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
