-- ============================================================================
-- Migration 003: Add Globals, Groups, and Contractual Charges
-- Purpose: Implement core Movie Magic Budgeting features
-- ============================================================================

-- ============================================================================
-- 1. GLOBALS TABLE
-- Purpose: Store reusable variables that can be used across budget line items
-- Examples: NUM_EPISODES=10, SHOOT_DAYS=45, LA_DAILY_RATE=350
-- ============================================================================

CREATE TABLE IF NOT EXISTS globals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  precision INT DEFAULT 2,
  description TEXT,
  global_group VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique global names per production
  CONSTRAINT unique_global_per_production UNIQUE(production_id, name)
);

CREATE INDEX idx_globals_production ON globals(production_id);
CREATE INDEX idx_globals_group ON globals(production_id, global_group);

COMMENT ON TABLE globals IS 'Reusable variables for budget calculations';
COMMENT ON COLUMN globals.name IS 'Variable name (e.g., NUM_EPISODES, SHOOT_DAYS)';
COMMENT ON COLUMN globals.value IS 'Numeric value of the variable';
COMMENT ON COLUMN globals.precision IS 'Number of decimal places to display';
COMMENT ON COLUMN globals.global_group IS 'Optional grouping (e.g., Production, Rates, Location)';

-- ============================================================================
-- 2. BUDGET GROUPS TABLE
-- Purpose: Organize budget line items for filtering, reporting, and analysis
-- Examples: Prep, Shoot, Wrap, Post-Production
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code (e.g., #FF5733)
  include_in_total BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_group_per_production UNIQUE(production_id, name)
);

CREATE INDEX idx_budget_groups_production ON budget_groups(production_id);
CREATE INDEX idx_budget_groups_sort ON budget_groups(production_id, sort_order);

COMMENT ON TABLE budget_groups IS 'Organizational categories for budget line items';
COMMENT ON COLUMN budget_groups.include_in_total IS 'Whether to include group items in budget totals';
COMMENT ON COLUMN budget_groups.sort_order IS 'Display order (lower numbers first)';

-- ============================================================================
-- 3. BUDGET LINE ITEM GROUPS (Junction Table)
-- Purpose: Many-to-many relationship between line items and groups
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_line_item_groups (
  line_item_id UUID NOT NULL REFERENCES budget_line_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES budget_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (line_item_id, group_id)
);

CREATE INDEX idx_line_item_groups_line ON budget_line_item_groups(line_item_id);
CREATE INDEX idx_line_item_groups_group ON budget_line_item_groups(group_id);

COMMENT ON TABLE budget_line_item_groups IS 'Links budget line items to groups';

-- ============================================================================
-- 4. CONTRACTUAL CHARGES TABLE
-- Purpose: Producer fees, overhead, and other percentage/flat fee charges
-- Examples: 10% Producer Fee, $50,000 Studio Overhead
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractual_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  charge_type VARCHAR(20) NOT NULL CHECK (charge_type IN ('percentage', 'flat_fee')),
  rate DECIMAL(10,4) NOT NULL, -- For percentage: 10.0 = 10%, For flat: actual amount
  applies_to VARCHAR(50) DEFAULT 'all' CHECK (applies_to IN ('all', 'above_line', 'below_line', 'custom')),
  exclusions JSONB DEFAULT '[]', -- Array of excluded account numbers or line item IDs
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contractual_charges_production ON contractual_charges(production_id);
CREATE INDEX idx_contractual_charges_active ON contractual_charges(production_id, active);

COMMENT ON TABLE contractual_charges IS 'Producer fees, overhead, and other budget charges';
COMMENT ON COLUMN contractual_charges.charge_type IS 'percentage or flat_fee';
COMMENT ON COLUMN contractual_charges.rate IS 'Percentage (10.0 = 10%) or flat dollar amount';
COMMENT ON COLUMN contractual_charges.applies_to IS 'Scope of charge application';
COMMENT ON COLUMN contractual_charges.exclusions IS 'JSON array of excluded accounts/items';

-- ============================================================================
-- 5. ENHANCE BUDGET_LINE_ITEMS TABLE
-- Purpose: Add columns for globals, original totals, and enhanced features
-- ============================================================================

-- Add global reference
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS global_reference VARCHAR(100);
COMMENT ON COLUMN budget_line_items.global_reference IS 'Reference to global variable name (if used in amount)';

-- Add original totals for variance tracking
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS original_subtotal DECIMAL(15,2);
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS original_total DECIMAL(15,2);
COMMENT ON COLUMN budget_line_items.original_subtotal IS 'Locked baseline subtotal for variance tracking';
COMMENT ON COLUMN budget_line_items.original_total IS 'Locked baseline total for variance tracking';

-- Add aggregate fringe percentage
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS aggregate_fringe_pct DECIMAL(5,2);
COMMENT ON COLUMN budget_line_items.aggregate_fringe_pct IS 'Calculated aggregate fringe percentage';

-- Add applied fringes (store which fringes are applied)
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS applied_fringes JSONB DEFAULT '[]';
COMMENT ON COLUMN budget_line_items.applied_fringes IS 'Array of fringe IDs applied to this line item';

-- Add applied groups (for quick lookup)
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS applied_groups JSONB DEFAULT '[]';
COMMENT ON COLUMN budget_line_items.applied_groups IS 'Array of group IDs for quick filtering';

-- Create index for global references
CREATE INDEX IF NOT EXISTS idx_budget_line_items_global ON budget_line_items(global_reference) WHERE global_reference IS NOT NULL;

-- ============================================================================
-- 6. ENHANCE PRODUCTIONS TABLE
-- Purpose: Add production-level settings for new features
-- ============================================================================

-- Lock original totals flag
ALTER TABLE productions ADD COLUMN IF NOT EXISTS lock_original_totals BOOLEAN DEFAULT false;
COMMENT ON COLUMN productions.lock_original_totals IS 'Prevent accidental changes to baseline budget';

-- Add contractual charges total (cached)
ALTER TABLE productions ADD COLUMN IF NOT EXISTS total_contractual_charges DECIMAL(15,2) DEFAULT 0;
COMMENT ON COLUMN productions.total_contractual_charges IS 'Cached total of all contractual charges';

-- Add applied credits total (cached)
ALTER TABLE productions ADD COLUMN IF NOT EXISTS total_applied_credits DECIMAL(15,2) DEFAULT 0;
COMMENT ON COLUMN productions.total_applied_credits IS 'Cached total of all tax credits';

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate aggregate fringe percentage for a line item
CREATE OR REPLACE FUNCTION calculate_aggregate_fringe(
  p_line_item_id UUID,
  p_subtotal DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_total_fringes DECIMAL := 0;
  v_aggregate_pct DECIMAL := 0;
BEGIN
  -- This is a placeholder - actual implementation would:
  -- 1. Get all applied fringes for the line item
  -- 2. Calculate total fringe contribution
  -- 3. Return (total_fringes / subtotal) * 100

  -- For now, return 0
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve global value
CREATE OR REPLACE FUNCTION resolve_global_value(
  p_production_id UUID,
  p_global_name VARCHAR
) RETURNS DECIMAL AS $$
DECLARE
  v_value DECIMAL;
BEGIN
  SELECT value INTO v_value
  FROM globals
  WHERE production_id = p_production_id
    AND name = p_global_name;

  RETURN COALESCE(v_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update applied_groups JSONB when line_item_groups changes
CREATE OR REPLACE FUNCTION update_applied_groups_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add group ID to applied_groups array
    UPDATE budget_line_items
    SET applied_groups = applied_groups || jsonb_build_array(NEW.group_id::text)
    WHERE id = NEW.line_item_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove group ID from applied_groups array
    UPDATE budget_line_items
    SET applied_groups = applied_groups - OLD.group_id::text
    WHERE id = OLD.line_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applied_groups
AFTER INSERT OR DELETE ON budget_line_item_groups
FOR EACH ROW
EXECUTE FUNCTION update_applied_groups_trigger();

-- ============================================================================
-- 8. SAMPLE DATA (for development)
-- ============================================================================

-- Insert sample globals for testing
-- (Only if no globals exist for the production)
/*
INSERT INTO globals (production_id, name, value, description, global_group)
SELECT
  id,
  'NUM_EPISODES',
  10,
  'Total number of episodes',
  'Production'
FROM productions
LIMIT 1
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- ROLLBACK SCRIPT (commented out - uncomment to rollback)
-- ============================================================================
/*
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_applied_groups ON budget_line_item_groups;

-- Drop functions
DROP FUNCTION IF EXISTS update_applied_groups_trigger();
DROP FUNCTION IF EXISTS resolve_global_value(UUID, VARCHAR);
DROP FUNCTION IF EXISTS calculate_aggregate_fringe(UUID, DECIMAL);

-- Drop tables
DROP TABLE IF EXISTS budget_line_item_groups CASCADE;
DROP TABLE IF EXISTS budget_groups CASCADE;
DROP TABLE IF EXISTS contractual_charges CASCADE;
DROP TABLE IF EXISTS globals CASCADE;

-- Remove columns from budget_line_items
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS global_reference;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS original_subtotal;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS original_total;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS aggregate_fringe_pct;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS applied_fringes;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS applied_groups;

-- Remove columns from productions
ALTER TABLE productions DROP COLUMN IF EXISTS lock_original_totals;
ALTER TABLE productions DROP COLUMN IF EXISTS total_contractual_charges;
ALTER TABLE productions DROP COLUMN IF EXISTS total_applied_credits;
*/
