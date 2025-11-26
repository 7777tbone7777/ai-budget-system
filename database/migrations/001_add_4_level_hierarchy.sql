-- ============================================================================
-- AI BUDGET SYSTEM: 4-LEVEL HIERARCHY MIGRATION
-- ============================================================================
-- Adds support for professional budget structure:
-- Topsheet → Categories → Accounts → Line Items
--
-- Based on professional production budget analysis:
-- - 36 Topsheet categories (high-level summary)
-- - 328 Account codes (mid-level groupings)
-- - 990+ Line items (detailed calculations)
-- - 236+ Global variables (reusable formulas)
-- ============================================================================

-- ============================================================================
-- 1. BUDGET METADATA TABLE
-- ============================================================================
-- Tracks versioning and metadata for each budget
CREATE TABLE IF NOT EXISTS budget_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  budget_uuid VARCHAR(36) UNIQUE NOT NULL,
  version_number INT DEFAULT 1,
  budget_type VARCHAR(20) CHECK (budget_type IN ('original', 'current', 'final')),
  total_topsheet_categories INT,
  total_accounts INT,
  total_detail_lines INT,
  total_fringe_types INT,
  last_calculation_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_metadata_production ON budget_metadata(production_id);
CREATE INDEX idx_budget_metadata_uuid ON budget_metadata(budget_uuid);

-- ============================================================================
-- 2. BUDGET TOPSHEET TABLE (LEVEL 1)
-- ============================================================================
-- High-level categories (e.g., "1100 Story & Rights", "5000 Production Staff")
-- This is what executives see first
CREATE TABLE IF NOT EXISTS budget_topsheet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budget_metadata(id) ON DELETE CASCADE,
  category_number INT NOT NULL,
  -- 1100, 1200, 2000, etc.
  category_name VARCHAR(100) NOT NULL,
  -- "Story & Rights", "Producers", "Direction", etc.
  sort_order INT NOT NULL,

  -- Financial columns
  original_subtotal DECIMAL(12,2) DEFAULT 0,
  original_fringe DECIMAL(12,2) DEFAULT 0,
  original_total DECIMAL(12,2) DEFAULT 0,

  current_subtotal DECIMAL(12,2) DEFAULT 0,
  current_fringe DECIMAL(12,2) DEFAULT 0,
  current_total DECIMAL(12,2) DEFAULT 0,

  variance_subtotal DECIMAL(12,2) DEFAULT 0,
  variance_fringe DECIMAL(12,2) DEFAULT 0,
  variance_total DECIMAL(12,2) DEFAULT 0,

  -- Episodic calculations
  is_amortized BOOLEAN DEFAULT FALSE,
  -- If true, costs spread across all episodes
  amortization_episodes INT,
  -- Number of episodes to spread cost over

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(budget_id, category_number)
);

CREATE INDEX idx_topsheet_budget ON budget_topsheet(budget_id);
CREATE INDEX idx_topsheet_sort ON budget_topsheet(sort_order);
CREATE INDEX idx_topsheet_category_num ON budget_topsheet(category_number);

-- ============================================================================
-- 3. BUDGET ACCOUNTS TABLE (LEVEL 2)
-- ============================================================================
-- Mid-level accounts within categories (e.g., "1105 Story Consultant")
-- Groups related line items together
CREATE TABLE IF NOT EXISTS budget_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topsheet_category_id UUID REFERENCES budget_topsheet(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budget_metadata(id) ON DELETE CASCADE,
  account_code VARCHAR(10) NOT NULL,
  -- "1105", "2800", "5100", etc.
  account_name VARCHAR(255) NOT NULL,
  -- "Story Consultant", "Property", "Line Producer", etc.
  sort_order INT NOT NULL,

  -- Financial columns (rolled up from line items)
  original_subtotal DECIMAL(12,2) DEFAULT 0,
  original_fringe DECIMAL(12,2) DEFAULT 0,
  original_total DECIMAL(12,2) DEFAULT 0,

  current_subtotal DECIMAL(12,2) DEFAULT 0,
  current_fringe DECIMAL(12,2) DEFAULT 0,
  current_total DECIMAL(12,2) DEFAULT 0,

  variance_subtotal DECIMAL(12,2) DEFAULT 0,
  variance_fringe DECIMAL(12,2) DEFAULT 0,
  variance_total DECIMAL(12,2) DEFAULT 0,

  -- Episodic handling
  is_amortized BOOLEAN DEFAULT FALSE,
  amortization_episodes INT,

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(budget_id, account_code)
);

CREATE INDEX idx_accounts_budget ON budget_accounts(budget_id);
CREATE INDEX idx_accounts_topsheet ON budget_accounts(topsheet_category_id);
CREATE INDEX idx_accounts_code ON budget_accounts(account_code);
CREATE INDEX idx_accounts_sort ON budget_accounts(sort_order);

-- ============================================================================
-- 4. ENHANCED BUDGET LINE ITEMS TABLE (LEVEL 3)
-- ============================================================================
-- Drop existing table and recreate with enhanced structure
DROP TABLE IF EXISTS budget_line_items CASCADE;

CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES budget_accounts(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budget_metadata(id) ON DELETE CASCADE,
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,

  -- Line item details
  line_number INT NOT NULL,
  -- Sequential numbering within account
  description VARCHAR(255) NOT NULL,
  -- "Executive Producer #1", "Property Master", etc.

  -- Calculation components
  quantity DECIMAL(10,2),
  -- Number of units (weeks, days, episodes, etc.)
  unit_type VARCHAR(20),
  -- 'weeks', 'days', 'episodes', 'units', 'allowance'
  rate DECIMAL(10,2),
  -- Rate per unit
  rate_type VARCHAR(20),
  -- 'weekly', 'daily', 'hourly', 'flat'

  -- Formula support
  formula TEXT,
  -- e.g., "24 weeks × 0.0833 episodes × $7,072/week"
  multiplier DECIMAL(10,4),
  -- For episodic calculations (e.g., 0.0833 for 1/12 episode)

  -- Financial columns
  original_subtotal DECIMAL(12,2) DEFAULT 0,
  original_fringe DECIMAL(12,2) DEFAULT 0,
  original_total DECIMAL(12,2) DEFAULT 0,

  current_subtotal DECIMAL(12,2) DEFAULT 0,
  current_fringe DECIMAL(12,2) DEFAULT 0,
  current_total DECIMAL(12,2) DEFAULT 0,

  variance_subtotal DECIMAL(12,2) DEFAULT 0,
  variance_fringe DECIMAL(12,2) DEFAULT 0,
  variance_total DECIMAL(12,2) DEFAULT 0,

  -- Union and fringe details
  union_local VARCHAR(50),
  -- 'IATSE Local 44', 'WGA', etc.
  position_id UUID REFERENCES crew_positions(id),
  -- Link to crew position for rate lookup

  -- Fringe breakdown (JSONB for flexibility)
  fringe_breakdown JSONB,
  -- {"FICA": 0.062, "Medicare": 0.0145, "CA_WC_Clerk": 0.0038, "WGA": 0.1538, etc.}
  total_fringe_rate DECIMAL(6,4),
  -- Sum of all fringe rates (e.g., 0.2938)

  -- Episodic handling
  is_amortized BOOLEAN DEFAULT FALSE,
  -- If true, cost spread across episodes
  amortization_episodes INT,
  -- Number of episodes
  per_episode_cost DECIMAL(12,2),
  -- Cost per episode after amortization

  -- Metadata
  is_corporate_deal BOOLEAN DEFAULT FALSE,
  -- If true, part of corp deal (e.g., "Corp" in Excel)
  is_global_variable BOOLEAN DEFAULT FALSE,
  -- If true, references a global variable
  global_variable_name VARCHAR(50),
  -- e.g., "SHOW_EPISODES", "PREP_WEEKS"

  notes TEXT,
  sort_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_items_account ON budget_line_items(account_id);
CREATE INDEX idx_line_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_line_items_production ON budget_line_items(production_id);
CREATE INDEX idx_line_items_sort ON budget_line_items(sort_order);
CREATE INDEX idx_line_items_union ON budget_line_items(union_local);
CREATE INDEX idx_line_items_position ON budget_line_items(position_id);

-- ============================================================================
-- 5. GLOBAL VARIABLES TABLE
-- ============================================================================
-- Reusable variables/formulas referenced across the budget
-- Examples: SHOW_EPISODES=12, PREP_WEEKS=2, SHOOT_WEEKS=20, IATSE_FRINGE_RATE=0.2938
CREATE TABLE IF NOT EXISTS budget_global_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budget_metadata(id) ON DELETE CASCADE,
  variable_name VARCHAR(50) NOT NULL,
  -- "SHOW_EPISODES", "PREP_WEEKS", "IATSE_FRINGE_RATE", etc.
  variable_type VARCHAR(20) NOT NULL CHECK (variable_type IN ('number', 'rate', 'text', 'date')),
  variable_value TEXT NOT NULL,
  -- Store as text, convert as needed
  description TEXT,
  -- Human-readable explanation
  category VARCHAR(50),
  -- "production", "fringes", "rates", "dates"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(budget_id, variable_name)
);

CREATE INDEX idx_global_vars_budget ON budget_global_variables(budget_id);
CREATE INDEX idx_global_vars_name ON budget_global_variables(variable_name);
CREATE INDEX idx_global_vars_category ON budget_global_variables(category);

-- ============================================================================
-- 6. FRINGE CALCULATION RULES TABLE
-- ============================================================================
-- Store the specific fringe rules for different union/position combinations
-- Maps to the "34 fringe types" mentioned in professional budgets
CREATE TABLE IF NOT EXISTS fringe_calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL,
  -- "IATSE CA Clerk", "WGA Writer", "SAG-AFTRA Actor", etc.
  union_local VARCHAR(50),
  state VARCHAR(2),
  position_classification VARCHAR(100),
  -- "clerk", "craftsperson", "writer", "actor", etc.

  -- Fringe components breakdown
  fringe_components JSONB NOT NULL,
  -- [
  --   {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 168600},
  --   {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages"},
  --   {"type": "CA_WC_Clerk", "rate": 0.0038, "applies_to": "gross_wages"},
  --   {"type": "WGA_Pension", "rate": 0.0838, "applies_to": "wga_portion"},
  --   {"type": "WGA_Health", "rate": 0.07, "applies_to": "wga_portion"}
  -- ]

  total_rate DECIMAL(6,4),
  -- Computed sum (e.g., 0.2938)

  effective_date_start DATE NOT NULL,
  effective_date_end DATE,

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fringe_rules_union ON fringe_calculation_rules(union_local);
CREATE INDEX idx_fringe_rules_state ON fringe_calculation_rules(state);
CREATE INDEX idx_fringe_rules_effective ON fringe_calculation_rules(effective_date_start, effective_date_end);

-- ============================================================================
-- 7. UPDATE TRIGGERS FOR CALCULATED FIELDS
-- ============================================================================

-- Trigger to auto-calculate line item totals
CREATE OR REPLACE FUNCTION calculate_line_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal from quantity × rate × multiplier
  NEW.current_subtotal := COALESCE(NEW.quantity, 0) * COALESCE(NEW.rate, 0) * COALESCE(NEW.multiplier, 1.0);

  -- Calculate fringe based on total_fringe_rate
  NEW.current_fringe := NEW.current_subtotal * COALESCE(NEW.total_fringe_rate, 0);

  -- Calculate total
  NEW.current_total := NEW.current_subtotal + NEW.current_fringe;

  -- Calculate variance
  NEW.variance_subtotal := NEW.current_subtotal - COALESCE(NEW.original_subtotal, 0);
  NEW.variance_fringe := NEW.current_fringe - COALESCE(NEW.original_fringe, 0);
  NEW.variance_total := NEW.current_total - COALESCE(NEW.original_total, 0);

  -- Calculate per-episode cost if amortized
  IF NEW.is_amortized AND NEW.amortization_episodes > 0 THEN
    NEW.per_episode_cost := NEW.current_total / NEW.amortization_episodes;
  ELSE
    NEW.per_episode_cost := NEW.current_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_line_item_totals
  BEFORE INSERT OR UPDATE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_totals();

-- Trigger to roll up line items to accounts
CREATE OR REPLACE FUNCTION rollup_account_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent account totals
  UPDATE budget_accounts
  SET
    current_subtotal = (
      SELECT COALESCE(SUM(current_subtotal), 0)
      FROM budget_line_items
      WHERE account_id = COALESCE(NEW.account_id, OLD.account_id)
    ),
    current_fringe = (
      SELECT COALESCE(SUM(current_fringe), 0)
      FROM budget_line_items
      WHERE account_id = COALESCE(NEW.account_id, OLD.account_id)
    ),
    current_total = (
      SELECT COALESCE(SUM(current_total), 0)
      FROM budget_line_items
      WHERE account_id = COALESCE(NEW.account_id, OLD.account_id)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.account_id, OLD.account_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rollup_account_totals
  AFTER INSERT OR UPDATE OR DELETE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION rollup_account_totals();

-- Trigger to roll up accounts to topsheet
CREATE OR REPLACE FUNCTION rollup_topsheet_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent topsheet category totals
  UPDATE budget_topsheet
  SET
    current_subtotal = (
      SELECT COALESCE(SUM(current_subtotal), 0)
      FROM budget_accounts
      WHERE topsheet_category_id = COALESCE(NEW.topsheet_category_id, OLD.topsheet_category_id)
    ),
    current_fringe = (
      SELECT COALESCE(SUM(current_fringe), 0)
      FROM budget_accounts
      WHERE topsheet_category_id = COALESCE(NEW.topsheet_category_id, OLD.topsheet_category_id)
    ),
    current_total = (
      SELECT COALESCE(SUM(current_total), 0)
      FROM budget_accounts
      WHERE topsheet_category_id = COALESCE(NEW.topsheet_category_id, OLD.topsheet_category_id)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.topsheet_category_id, OLD.topsheet_category_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rollup_topsheet_totals
  AFTER INSERT OR UPDATE OR DELETE ON budget_accounts
  FOR EACH ROW
  EXECUTE FUNCTION rollup_topsheet_totals();

-- Trigger to update budget metadata counts
CREATE OR REPLACE FUNCTION update_budget_metadata_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE budget_metadata
  SET
    total_topsheet_categories = (
      SELECT COUNT(*) FROM budget_topsheet WHERE budget_id = NEW.budget_id
    ),
    total_accounts = (
      SELECT COUNT(*) FROM budget_accounts WHERE budget_id = NEW.budget_id
    ),
    total_detail_lines = (
      SELECT COUNT(*) FROM budget_line_items WHERE budget_id = NEW.budget_id
    ),
    last_calculation_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.budget_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply metadata update trigger to all levels
CREATE TRIGGER trg_update_metadata_from_topsheet
  AFTER INSERT OR DELETE ON budget_topsheet
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_metadata_counts();

CREATE TRIGGER trg_update_metadata_from_accounts
  AFTER INSERT OR DELETE ON budget_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_metadata_counts();

CREATE TRIGGER trg_update_metadata_from_line_items
  AFTER INSERT OR DELETE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_metadata_counts();

-- ============================================================================
-- 8. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Complete budget hierarchy for a production
CREATE OR REPLACE VIEW budget_hierarchy_view AS
SELECT
  bm.id as budget_id,
  bm.budget_uuid,
  bm.version_number,
  p.name as production_name,
  p.production_type,
  bt.category_number,
  bt.category_name,
  ba.account_code,
  ba.account_name,
  bli.line_number,
  bli.description,
  bli.quantity,
  bli.unit_type,
  bli.rate,
  bli.rate_type,
  bli.current_subtotal,
  bli.current_fringe,
  bli.current_total,
  bli.union_local,
  bli.is_amortized,
  bli.per_episode_cost
FROM budget_metadata bm
JOIN productions p ON bm.production_id = p.id
JOIN budget_topsheet bt ON bt.budget_id = bm.id
JOIN budget_accounts ba ON ba.topsheet_category_id = bt.id
JOIN budget_line_items bli ON bli.account_id = ba.id
ORDER BY bt.sort_order, ba.sort_order, bli.sort_order;

-- View: Budget summary by topsheet category
CREATE OR REPLACE VIEW budget_topsheet_summary AS
SELECT
  bm.id as budget_id,
  p.name as production_name,
  bt.category_number,
  bt.category_name,
  bt.current_subtotal,
  bt.current_fringe,
  bt.current_total,
  bt.variance_total,
  bt.sort_order,
  COUNT(DISTINCT ba.id) as account_count,
  COUNT(bli.id) as line_item_count
FROM budget_metadata bm
JOIN productions p ON bm.production_id = p.id
JOIN budget_topsheet bt ON bt.budget_id = bm.id
LEFT JOIN budget_accounts ba ON ba.topsheet_category_id = bt.id
LEFT JOIN budget_line_items bli ON bli.account_id = ba.id
GROUP BY bm.id, p.name, bt.category_number, bt.category_name,
         bt.current_subtotal, bt.current_fringe, bt.current_total, bt.variance_total, bt.sort_order
ORDER BY bt.sort_order;

-- View: Fringe detail breakdown
CREATE OR REPLACE VIEW fringe_detail_view AS
SELECT
  bli.id as line_item_id,
  bli.description,
  bli.current_subtotal as gross_wages,
  bli.fringe_breakdown,
  bli.total_fringe_rate,
  bli.current_fringe as total_fringe_amount,
  ba.account_code,
  ba.account_name,
  bt.category_name
FROM budget_line_items bli
JOIN budget_accounts ba ON bli.account_id = ba.id
JOIN budget_topsheet bt ON ba.topsheet_category_id = bt.id
WHERE bli.current_fringe > 0
ORDER BY bli.current_fringe DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Execute this migration: psql $DATABASE_URL < 001_add_4_level_hierarchy.sql
-- 2. Update API endpoints in server.js to use new hierarchy
-- 3. Create seed data for sample multi-camera sitcom budget
-- ============================================================================
