-- ============================================================================
-- Migration 004: Add Special Provisions for Guild Agreements
-- Purpose: Support meal penalties, overtime rules, and location-specific data
-- Based on: Movie Magic Budgeting analysis and guild agreement questions
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE BUDGET_LINE_ITEMS TABLE
-- Purpose: Add special provisions for meal penalties, overtime, etc.
-- ============================================================================

-- Add special provisions JSONB column
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS special_provisions JSONB DEFAULT '{}';

COMMENT ON COLUMN budget_line_items.special_provisions IS 'Special rules: meal penalties, overtime thresholds, etc.';

-- Example structure for special_provisions:
-- {
--   "meal_penalty_after_hours": 6,
--   "meal_penalty_amount": 7.50,
--   "overtime_after_hours": 8,
--   "overtime_multiplier": 1.5,
--   "sixth_day_multiplier": 1.5,
--   "seventh_day_multiplier": 2.0,
--   "golden_hours": true,
--   "turnaround_hours": 10
-- }

-- Add location column for location-specific rates
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);

COMMENT ON COLUMN budget_line_items.location IS 'Shooting location for this line item';

-- Add effective date for rate tracking
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS effective_date DATE;

COMMENT ON COLUMN budget_line_items.effective_date IS 'When this rate becomes effective';

-- Add expiration date for rate tracking
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS expiration_date DATE;

COMMENT ON COLUMN budget_line_items.expiration_date IS 'When this rate expires';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_budget_line_items_location ON budget_line_items(location) WHERE location IS NOT NULL;

-- Create index for effective date queries
CREATE INDEX IF NOT EXISTS idx_budget_line_items_effective_date ON budget_line_items(effective_date) WHERE effective_date IS NOT NULL;

-- ============================================================================
-- 2. ENHANCE RATE_CARDS TABLE
-- Purpose: Add special provisions and metadata
-- ============================================================================

-- Add special provisions to rate cards
ALTER TABLE rate_cards ADD COLUMN IF NOT EXISTS special_provisions JSONB DEFAULT '{}';

COMMENT ON COLUMN rate_cards.special_provisions IS 'Union-specific rules for this rate';

-- Add tier/classification level
ALTER TABLE rate_cards ADD COLUMN IF NOT EXISTS tier VARCHAR(50);

COMMENT ON COLUMN rate_cards.tier IS 'Rate tier (e.g., Tier A, Tier B, Weekly Player)';

-- ============================================================================
-- 3. ENHANCE FRINGE_BENEFITS TABLE
-- Purpose: Better organize and categorize fringes
-- ============================================================================

-- Add category for grouping similar benefits
ALTER TABLE fringe_benefits ADD COLUMN IF NOT EXISTS benefit_category VARCHAR(50);

COMMENT ON COLUMN fringe_benefits.benefit_category IS 'Category: pension, health, payroll_tax, union_dues, vacation';

-- Add is_required flag
ALTER TABLE fringe_benefits ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;

COMMENT ON COLUMN fringe_benefits.is_required IS 'Whether this benefit is mandatory';

-- Add applies_to_union_only flag
ALTER TABLE fringe_benefits ADD COLUMN IF NOT EXISTS applies_to_union_only BOOLEAN DEFAULT false;

COMMENT ON COLUMN fringe_benefits.applies_to_union_only IS 'Whether benefit only applies to union members';

-- ============================================================================
-- 4. ENHANCE SIDELETTER_RULES TABLE
-- Purpose: Add more context for conditional rules
-- ============================================================================

-- Add minimum budget threshold
ALTER TABLE sideletter_rules ADD COLUMN IF NOT EXISTS min_budget_amount DECIMAL(15,2);

COMMENT ON COLUMN sideletter_rules.min_budget_amount IS 'Minimum budget amount for this sideletter to apply';

-- Add maximum budget threshold
ALTER TABLE sideletter_rules ADD COLUMN IF NOT EXISTS max_budget_amount DECIMAL(15,2);

COMMENT ON COLUMN sideletter_rules.max_budget_amount IS 'Maximum budget amount for this sideletter to apply';

-- Add union locals that this applies to
ALTER TABLE sideletter_rules ADD COLUMN IF NOT EXISTS applicable_unions TEXT[];

COMMENT ON COLUMN sideletter_rules.applicable_unions IS 'Array of union locals this sideletter applies to';

-- ============================================================================
-- 5. CREATE COMMON PROVISIONS GLOBALS
-- Purpose: Seed common industry-standard values as globals
-- ============================================================================

-- Function to create common globals for a production
CREATE OR REPLACE FUNCTION create_common_globals(p_production_id UUID)
RETURNS void AS $$
BEGIN
  -- Only create if they don't already exist
  INSERT INTO globals (production_id, name, value, precision, description, global_group)
  VALUES
    (p_production_id, 'OVERTIME_MULTIPLIER', 1.5, 2, 'Standard overtime multiplier (1.5x)', 'Rates'),
    (p_production_id, 'SIXTH_DAY_MULTIPLIER', 1.5, 2, 'Sixth consecutive day multiplier (1.5x)', 'Rates'),
    (p_production_id, 'SEVENTH_DAY_MULTIPLIER', 2.0, 2, 'Seventh consecutive day multiplier (2.0x)', 'Rates'),
    (p_production_id, 'GOLDEN_TIME_MULTIPLIER', 2.0, 2, 'Golden time multiplier (2.0x)', 'Rates'),
    (p_production_id, 'MEAL_PENALTY_AMOUNT', 7.50, 2, 'Standard meal penalty amount', 'Penalties'),
    (p_production_id, 'MEAL_PENALTY_THRESHOLD_HOURS', 6, 0, 'Hours before meal penalty applies', 'Penalties'),
    (p_production_id, 'OVERTIME_THRESHOLD_HOURS', 8, 0, 'Daily hours before overtime', 'Hours'),
    (p_production_id, 'DOUBLE_TIME_THRESHOLD_HOURS', 12, 0, 'Daily hours before double time', 'Hours'),
    (p_production_id, 'TURNAROUND_HOURS', 10, 0, 'Minimum turnaround hours', 'Hours')
  ON CONFLICT (production_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_common_globals(UUID) IS 'Create standard industry globals for a production';

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate overtime pay
CREATE OR REPLACE FUNCTION calculate_overtime(
  p_base_rate DECIMAL,
  p_hours DECIMAL,
  p_standard_hours DECIMAL DEFAULT 8,
  p_overtime_multiplier DECIMAL DEFAULT 1.5,
  p_double_time_hours DECIMAL DEFAULT 12,
  p_double_time_multiplier DECIMAL DEFAULT 2.0
) RETURNS DECIMAL AS $$
DECLARE
  v_overtime_hours DECIMAL := 0;
  v_double_time_hours DECIMAL := 0;
  v_total_pay DECIMAL := 0;
BEGIN
  -- Calculate standard pay
  v_total_pay := p_base_rate * LEAST(p_hours, p_standard_hours);

  -- Calculate overtime hours (between standard and double time)
  IF p_hours > p_standard_hours THEN
    v_overtime_hours := LEAST(p_hours - p_standard_hours, p_double_time_hours - p_standard_hours);
    v_total_pay := v_total_pay + (p_base_rate * p_overtime_multiplier * v_overtime_hours);
  END IF;

  -- Calculate double time hours (beyond double time threshold)
  IF p_hours > p_double_time_hours THEN
    v_double_time_hours := p_hours - p_double_time_hours;
    v_total_pay := v_total_pay + (p_base_rate * p_double_time_multiplier * v_double_time_hours);
  END IF;

  RETURN v_total_pay;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_overtime IS 'Calculate total pay including overtime and double time';

-- Function to get special provision value
CREATE OR REPLACE FUNCTION get_special_provision(
  p_provisions JSONB,
  p_key TEXT,
  p_default DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((p_provisions->>p_key)::DECIMAL, p_default);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_special_provision IS 'Extract a numeric value from special_provisions JSONB';

-- ============================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Line items with their special provisions parsed
CREATE OR REPLACE VIEW budget_line_items_with_provisions AS
SELECT
  bli.*,
  (bli.special_provisions->>'meal_penalty_after_hours')::DECIMAL as meal_penalty_hours,
  (bli.special_provisions->>'meal_penalty_amount')::DECIMAL as meal_penalty_amount,
  (bli.special_provisions->>'overtime_after_hours')::DECIMAL as overtime_hours,
  (bli.special_provisions->>'overtime_multiplier')::DECIMAL as overtime_multiplier,
  (bli.special_provisions->>'sixth_day_multiplier')::DECIMAL as sixth_day_mult,
  (bli.special_provisions->>'seventh_day_multiplier')::DECIMAL as seventh_day_mult
FROM budget_line_items bli;

COMMENT ON VIEW budget_line_items_with_provisions IS 'Line items with special provisions as columns';

-- View: Active rate cards with special provisions
CREATE OR REPLACE VIEW active_rate_cards_detailed AS
SELECT
  rc.*,
  (rc.special_provisions->>'minimum_call_hours')::DECIMAL as min_call_hours,
  (rc.special_provisions->>'guaranteed_hours')::DECIMAL as guaranteed_hours,
  (rc.special_provisions->>'kit_rental')::DECIMAL as kit_rental
FROM rate_cards rc
WHERE rc.effective_date <= CURRENT_DATE
  AND (rc.contract_year IS NULL OR rc.contract_year >= EXTRACT(YEAR FROM CURRENT_DATE));

COMMENT ON VIEW active_rate_cards_detailed IS 'Currently active rate cards with parsed provisions';

-- ============================================================================
-- ROLLBACK SCRIPT (commented out - uncomment to rollback)
-- ============================================================================
/*
-- Drop views
DROP VIEW IF EXISTS budget_line_items_with_provisions CASCADE;
DROP VIEW IF EXISTS active_rate_cards_detailed CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_special_provision(JSONB, TEXT, DECIMAL);
DROP FUNCTION IF EXISTS calculate_overtime(DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS create_common_globals(UUID);

-- Remove columns from tables
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS special_provisions;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS location;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS effective_date;
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS expiration_date;

ALTER TABLE rate_cards DROP COLUMN IF EXISTS special_provisions;
ALTER TABLE rate_cards DROP COLUMN IF EXISTS tier;

ALTER TABLE fringe_benefits DROP COLUMN IF EXISTS benefit_category;
ALTER TABLE fringe_benefits DROP COLUMN IF EXISTS is_required;
ALTER TABLE fringe_benefits DROP COLUMN IF EXISTS applies_to_union_only;

ALTER TABLE sideletter_rules DROP COLUMN IF EXISTS min_budget_amount;
ALTER TABLE sideletter_rules DROP COLUMN IF EXISTS max_budget_amount;
ALTER TABLE sideletter_rules DROP COLUMN IF EXISTS applicable_unions;

-- Drop indexes
DROP INDEX IF EXISTS idx_budget_line_items_location;
DROP INDEX IF EXISTS idx_budget_line_items_effective_date;
*/
