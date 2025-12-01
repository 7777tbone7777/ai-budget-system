-- =====================================================
-- FIX MIGRATION 001: Clean and Recreate 4-Level Budget Hierarchy
-- =====================================================
-- This script safely drops and recreates the budget hierarchy tables
-- to fix the partial migration that failed on Railway
--
-- Run with: railway run --service backend node database/migrations/run_migration.js fix_migration_001.sql
-- =====================================================

-- Step 1: Drop existing objects (if they exist) in reverse dependency order
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_calculate_line_item_totals ON budget_line_items CASCADE;
DROP TRIGGER IF EXISTS trg_rollup_to_accounts ON budget_line_items CASCADE;
DROP TRIGGER IF EXISTS trg_rollup_to_topsheet ON budget_accounts CASCADE;
DROP TRIGGER IF EXISTS trg_update_metadata_counts ON budget_line_items CASCADE;
DROP TRIGGER IF EXISTS trg_update_metadata_counts_accounts ON budget_accounts CASCADE;
DROP TRIGGER IF EXISTS trg_update_metadata_counts_topsheet ON budget_topsheet CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS fn_calculate_line_item_totals() CASCADE;
DROP FUNCTION IF EXISTS fn_rollup_to_accounts() CASCADE;
DROP FUNCTION IF EXISTS fn_rollup_to_topsheet() CASCADE;
DROP FUNCTION IF EXISTS fn_update_metadata_counts() CASCADE;

-- Drop views
DROP VIEW IF EXISTS budget_summary CASCADE;
DROP VIEW IF EXISTS budget_full_hierarchy CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS budget_line_items CASCADE;
DROP TABLE IF EXISTS budget_accounts CASCADE;
DROP TABLE IF EXISTS budget_topsheet CASCADE;
DROP TABLE IF EXISTS budget_metadata CASCADE;
DROP TABLE IF EXISTS fringe_calculation_rules CASCADE;
DROP TABLE IF EXISTS budget_global_variables CASCADE;

-- Drop any remaining indexes
DROP INDEX IF EXISTS idx_budget_metadata_production CASCADE;
DROP INDEX IF EXISTS idx_budget_metadata_uuid CASCADE;
DROP INDEX IF EXISTS idx_budget_topsheet_budget CASCADE;
DROP INDEX IF EXISTS idx_budget_accounts_budget CASCADE;
DROP INDEX IF EXISTS idx_budget_accounts_topsheet CASCADE;
DROP INDEX IF EXISTS idx_budget_line_items_budget CASCADE;
DROP INDEX IF EXISTS idx_budget_line_items_account CASCADE;
DROP INDEX IF EXISTS idx_budget_line_items_production CASCADE;
DROP INDEX IF EXISTS idx_fringe_rules_union CASCADE;
DROP INDEX IF EXISTS idx_fringe_rules_effective CASCADE;

-- Step 2: Create tables
-- =====================================================

-- Budget Metadata (top level)
CREATE TABLE budget_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  budget_uuid UUID UNIQUE DEFAULT gen_random_uuid(),

  -- Budget version tracking
  version_number INTEGER DEFAULT 1,
  budget_type VARCHAR(50) DEFAULT 'original', -- 'original', 'revised', 'final'
  budget_name VARCHAR(255),

  -- Aggregate totals (calculated by triggers)
  total_topsheet_categories INTEGER DEFAULT 0,
  total_accounts INTEGER DEFAULT 0,
  total_detail_lines INTEGER DEFAULT 0,

  grand_total_subtotal DECIMAL(15,2) DEFAULT 0,
  grand_total_fringe DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  last_calculation_date TIMESTAMP,

  notes TEXT
);

-- Budget Topsheet Categories (high-level groupings)
CREATE TABLE budget_topsheet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budget_metadata(id) ON DELETE CASCADE,

  -- Category identification
  category_number VARCHAR(10),
  category_name VARCHAR(255) NOT NULL,

  -- Totals (auto-calculated from accounts)
  current_subtotal DECIMAL(15,2) DEFAULT 0,
  current_fringe DECIMAL(15,2) DEFAULT 0,
  current_total DECIMAL(15,2) DEFAULT 0,

  -- Amortization support
  is_amortized BOOLEAN DEFAULT false,
  amortization_episodes INTEGER,

  -- Display
  sort_order INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Accounts (mid-level groupings)
CREATE TABLE budget_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topsheet_category_id UUID REFERENCES budget_topsheet(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budget_metadata(id) ON DELETE CASCADE,

  -- Account identification
  account_code VARCHAR(20),
  account_name VARCHAR(255) NOT NULL,

  -- Totals (auto-calculated from line items)
  current_subtotal DECIMAL(15,2) DEFAULT 0,
  current_fringe DECIMAL(15,2) DEFAULT 0,
  current_total DECIMAL(15,2) DEFAULT 0,

  -- Amortization
  is_amortized BOOLEAN DEFAULT false,
  amortization_episodes INTEGER,

  -- Display
  sort_order INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Line Items (detailed entries)
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES budget_accounts(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budget_metadata(id) ON DELETE CASCADE,
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  -- Line identification
  line_number VARCHAR(20),
  description VARCHAR(500) NOT NULL,

  -- Calculation inputs
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_type VARCHAR(50) DEFAULT 'allow', -- 'allow', 'week', 'day', 'hour', 'unit', 'flat'
  rate DECIMAL(10,2) DEFAULT 0,
  rate_type VARCHAR(50) DEFAULT 'weekly', -- 'weekly', 'daily', 'hourly', 'flat'
  multiplier DECIMAL(10,2) DEFAULT 1,

  -- Formula support (for complex calculations)
  formula TEXT,

  -- Calculated totals (auto-calculated by trigger)
  current_subtotal DECIMAL(15,2) DEFAULT 0,
  total_fringe_rate DECIMAL(5,2) DEFAULT 0, -- Total fringe % (sum of all fringes)
  current_fringe DECIMAL(15,2) DEFAULT 0,
  current_total DECIMAL(15,2) DEFAULT 0,

  -- Union/Position info (for fringe lookup)
  union_local VARCHAR(100),
  position_id UUID REFERENCES crew_positions(id),

  -- Fringe breakdown (JSONB)
  fringe_breakdown JSONB,

  -- Amortization
  is_amortized BOOLEAN DEFAULT false,
  amortization_episodes INTEGER,
  per_episode_cost DECIMAL(15,2),

  -- Special flags
  is_corporate_deal BOOLEAN DEFAULT false,

  -- Display
  sort_order INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fringe Calculation Rules
CREATE TABLE fringe_calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Applicability
  union_local VARCHAR(100),
  state VARCHAR(2),
  position_classification VARCHAR(255),

  -- Fringe rates (as percentages)
  total_fringe_rate DECIMAL(5,2) NOT NULL,

  -- Breakdown (JSONB for flexibility)
  fringe_breakdown JSONB,

  -- Effective dates
  effective_date_start DATE NOT NULL,
  effective_date_end DATE,

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Global Variables (optional - for formulas)
CREATE TABLE budget_global_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budget_metadata(id) ON DELETE CASCADE,

  variable_name VARCHAR(100) NOT NULL,
  variable_value DECIMAL(15,2),
  variable_type VARCHAR(50) DEFAULT 'number', -- 'number', 'percentage', 'days', etc.

  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(budget_id, variable_name)
);

-- Step 3: Create indexes
-- =====================================================

CREATE INDEX idx_budget_metadata_production ON budget_metadata(production_id);
CREATE INDEX idx_budget_metadata_uuid ON budget_metadata(budget_uuid);

CREATE INDEX idx_budget_topsheet_budget ON budget_topsheet(budget_id);

CREATE INDEX idx_budget_accounts_budget ON budget_accounts(budget_id);
CREATE INDEX idx_budget_accounts_topsheet ON budget_accounts(topsheet_category_id);

CREATE INDEX idx_budget_line_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_line_items_account ON budget_line_items(account_id);
CREATE INDEX idx_budget_line_items_production ON budget_line_items(production_id);

CREATE INDEX idx_fringe_rules_union ON fringe_calculation_rules(union_local);
CREATE INDEX idx_fringe_rules_effective ON fringe_calculation_rules(effective_date_start, effective_date_end);

-- Step 4: Create trigger functions
-- =====================================================

-- Function to calculate line item totals
CREATE OR REPLACE FUNCTION fn_calculate_line_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal
  NEW.current_subtotal = COALESCE(NEW.quantity, 0) * COALESCE(NEW.rate, 0) * COALESCE(NEW.multiplier, 1);

  -- Calculate fringe
  NEW.current_fringe = NEW.current_subtotal * (COALESCE(NEW.total_fringe_rate, 0) / 100);

  -- Calculate total
  NEW.current_total = NEW.current_subtotal + NEW.current_fringe;

  -- Calculate per-episode cost if amortized
  IF NEW.is_amortized AND NEW.amortization_episodes > 0 THEN
    NEW.per_episode_cost = NEW.current_total / NEW.amortization_episodes;
  ELSE
    NEW.per_episode_cost = NEW.current_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to rollup line items to accounts
CREATE OR REPLACE FUNCTION fn_rollup_to_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Get account_id (works for INSERT, UPDATE, DELETE)
  v_account_id = COALESCE(NEW.account_id, OLD.account_id);

  IF v_account_id IS NOT NULL THEN
    UPDATE budget_accounts
    SET
      current_subtotal = COALESCE((
        SELECT SUM(current_subtotal)
        FROM budget_line_items
        WHERE account_id = v_account_id
      ), 0),
      current_fringe = COALESCE((
        SELECT SUM(current_fringe)
        FROM budget_line_items
        WHERE account_id = v_account_id
      ), 0),
      current_total = COALESCE((
        SELECT SUM(current_total)
        FROM budget_line_items
        WHERE account_id = v_account_id
      ), 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_account_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to rollup accounts to topsheet
CREATE OR REPLACE FUNCTION fn_rollup_to_topsheet()
RETURNS TRIGGER AS $$
DECLARE
  v_topsheet_id UUID;
BEGIN
  v_topsheet_id = COALESCE(NEW.topsheet_category_id, OLD.topsheet_category_id);

  IF v_topsheet_id IS NOT NULL THEN
    UPDATE budget_topsheet
    SET
      current_subtotal = COALESCE((
        SELECT SUM(current_subtotal)
        FROM budget_accounts
        WHERE topsheet_category_id = v_topsheet_id
      ), 0),
      current_fringe = COALESCE((
        SELECT SUM(current_fringe)
        FROM budget_accounts
        WHERE topsheet_category_id = v_topsheet_id
      ), 0),
      current_total = COALESCE((
        SELECT SUM(current_total)
        FROM budget_accounts
        WHERE topsheet_category_id = v_topsheet_id
      ), 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_topsheet_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update metadata counts
CREATE OR REPLACE FUNCTION fn_update_metadata_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_id UUID;
BEGIN
  v_budget_id = COALESCE(NEW.budget_id, OLD.budget_id);

  UPDATE budget_metadata
  SET
    total_topsheet_categories = (
      SELECT COUNT(*) FROM budget_topsheet WHERE budget_id = v_budget_id
    ),
    total_accounts = (
      SELECT COUNT(*) FROM budget_accounts WHERE budget_id = v_budget_id
    ),
    total_detail_lines = (
      SELECT COUNT(*) FROM budget_line_items WHERE budget_id = v_budget_id
    ),
    grand_total_subtotal = COALESCE((
      SELECT SUM(current_subtotal) FROM budget_topsheet WHERE budget_id = v_budget_id
    ), 0),
    grand_total_fringe = COALESCE((
      SELECT SUM(current_fringe) FROM budget_topsheet WHERE budget_id = v_budget_id
    ), 0),
    grand_total = COALESCE((
      SELECT SUM(current_total) FROM budget_topsheet WHERE budget_id = v_budget_id
    ), 0),
    last_calculation_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_budget_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers
-- =====================================================

-- Trigger to calculate line item totals on INSERT/UPDATE
CREATE TRIGGER trg_calculate_line_item_totals
  BEFORE INSERT OR UPDATE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_calculate_line_item_totals();

-- Trigger to rollup line items to accounts
CREATE TRIGGER trg_rollup_to_accounts
  AFTER INSERT OR UPDATE OR DELETE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_rollup_to_accounts();

-- Trigger to rollup accounts to topsheet
CREATE TRIGGER trg_rollup_to_topsheet
  AFTER INSERT OR UPDATE OR DELETE ON budget_accounts
  FOR EACH ROW
  EXECUTE FUNCTION fn_rollup_to_topsheet();

-- Trigger to update metadata counts (for line items)
CREATE TRIGGER trg_update_metadata_counts
  AFTER INSERT OR DELETE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_metadata_counts();

-- Trigger to update metadata counts (for accounts)
CREATE TRIGGER trg_update_metadata_counts_accounts
  AFTER INSERT OR DELETE ON budget_accounts
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_metadata_counts();

-- Trigger to update metadata counts (for topsheet)
CREATE TRIGGER trg_update_metadata_counts_topsheet
  AFTER INSERT OR DELETE ON budget_topsheet
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_metadata_counts();

-- Step 6: Create views
-- =====================================================

-- Budget summary view
CREATE OR REPLACE VIEW budget_summary AS
SELECT
  bm.id AS budget_id,
  bm.production_id,
  p.name AS production_name,
  bm.budget_type,
  bm.version_number,
  bm.total_topsheet_categories,
  bm.total_accounts,
  bm.total_detail_lines,
  bm.grand_total_subtotal,
  bm.grand_total_fringe,
  bm.grand_total,
  bm.last_calculation_date
FROM budget_metadata bm
JOIN productions p ON bm.production_id = p.id;

-- Full hierarchy view
CREATE OR REPLACE VIEW budget_full_hierarchy AS
SELECT
  bm.id AS budget_id,
  bm.production_id,
  p.name AS production_name,
  bt.id AS topsheet_id,
  bt.category_name,
  ba.id AS account_id,
  ba.account_code,
  ba.account_name,
  bli.id AS line_item_id,
  bli.line_number,
  bli.description,
  bli.quantity,
  bli.rate,
  bli.current_subtotal,
  bli.current_fringe,
  bli.current_total
FROM budget_metadata bm
JOIN productions p ON bm.production_id = p.id
LEFT JOIN budget_topsheet bt ON bt.budget_id = bm.id
LEFT JOIN budget_accounts ba ON ba.topsheet_category_id = bt.id
LEFT JOIN budget_line_items bli ON bli.account_id = ba.id;

-- Step 7: Add comments
-- =====================================================

COMMENT ON TABLE budget_metadata IS 'Top-level budget tracking with version control and aggregate totals';
COMMENT ON TABLE budget_topsheet IS 'High-level budget categories (Above the Line, Below the Line, etc.)';
COMMENT ON TABLE budget_accounts IS 'Mid-level account groupings (departments, services, etc.)';
COMMENT ON TABLE budget_line_items IS 'Detailed budget line items with automatic fringe calculation';
COMMENT ON TABLE fringe_calculation_rules IS 'Union-specific fringe benefit calculation rules';

-- =====================================================
-- Migration complete!
-- =====================================================
