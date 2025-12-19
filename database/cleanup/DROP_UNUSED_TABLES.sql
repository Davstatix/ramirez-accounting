-- Drop unused tables from Supabase
-- Run this in your Supabase SQL editor to clean up unused tables

-- Drop invoices table (billing handled by Stripe)
DROP TABLE IF EXISTS invoices CASCADE;

-- Drop transactions table if exists (handled by QuickBooks)
DROP TABLE IF EXISTS transactions CASCADE;

-- Drop categories table if exists (handled by QuickBooks)
DROP TABLE IF EXISTS categories CASCADE;

-- Drop accounts table if exists (handled by QuickBooks)
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop reconciliations table if exists (handled by QuickBooks)
DROP TABLE IF EXISTS reconciliations CASCADE;

-- Drop any related indexes (these will be dropped automatically with CASCADE)
-- But just in case:
DROP INDEX IF EXISTS idx_invoices_client_id;

