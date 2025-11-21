-- AI Budget System Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PRODUCTIONS TABLE
-- ============================================================================
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  production_type VARCHAR(50) NOT NULL,
  -- 'feature', 'multi_camera', 'single_camera', 'long_form', 'mow', 'mini_series'
  distribution_platform VARCHAR(50),
  -- 'theatrical', 'network_tv', 'pay_tv', 'hb_svod', 'mb_svod', 'lb_svod', 'hb_avod', 'hb_fast'
  shooting_location VARCHAR(100),
  state VARCHAR(2),
  country VARCHAR(2) DEFAULT 'US',
  budget_target DECIMAL(12,2),
  episode_count INT,
  episode_length_minutes INT,
  season_number INT,
  principal_photography_start DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. UNION AGREEMENTS TABLE
-- ============================================================================
CREATE TABLE union_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  union_name VARCHAR(100) NOT NULL,
  -- 'IATSE', 'DGA', 'WGA', 'SAG-AFTRA', 'TEAMSTERS'
  agreement_type VARCHAR(100) NOT NULL,
  -- 'Basic Agreement', 'Low Budget', 'Multi-Camera Sideletter', etc.
  effective_date_start DATE NOT NULL,
  effective_date_end DATE NOT NULL,
  document_url TEXT,
  rules JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. RATE CARDS TABLE
-- ============================================================================
CREATE TABLE rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  union_local VARCHAR(50) NOT NULL,
  -- 'IATSE Local 44', 'IATSE Local 600', etc.
  job_classification VARCHAR(100) NOT NULL,
  -- 'Property Master', 'Director of Photography', etc.
  rate_type VARCHAR(20) NOT NULL,
  -- 'hourly', 'daily', 'weekly'
  base_rate DECIMAL(10,2) NOT NULL,
  location VARCHAR(100),
  -- 'Los Angeles - Studio', 'Los Angeles - Distant', 'New York', etc.
  production_type VARCHAR(50),
  -- 'theatrical', 'network_tv', 'hb_svod', etc.
  effective_date DATE NOT NULL,
  contract_year INT,
  -- 1, 2, 3 (for multi-year agreements)
  wage_increase_pct DECIMAL(5,2),
  -- 7.0, 4.0, 3.5
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(union_local, job_classification, location, production_type, effective_date)
);

-- ============================================================================
-- 4. SIDELETTER RULES TABLE
-- ============================================================================
CREATE TABLE sideletter_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sideletter_name VARCHAR(100) NOT NULL,
  -- 'Network TV Half-Hour Pilot', 'Multi-Camera HB SVOD', etc.
  production_type VARCHAR(50),
  distribution_platform VARCHAR(50),
  season_number INT,
  location_restriction VARCHAR(100),
  -- 'Los Angeles only', 'Regardless of location', null
  wage_adjustment_pct DECIMAL(5,2) DEFAULT 0.0,
  -- -3.0 (3% reduction), -12.5, 0.0 (full rate)
  holiday_pay_pct DECIMAL(5,2) DEFAULT 100.0,
  -- 0, 50, 100
  vacation_pay_pct DECIMAL(5,2) DEFAULT 100.0,
  -- 0, 50, 100
  overtime_rules JSONB,
  -- {"daily_ot": "1.5x after 8", "double_time": "2x after 12", "triple_time": "3x after 15 elapsed"}
  applies_when JSONB,
  -- Conditions for when this sideletter applies
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. CREW POSITIONS TABLE
-- ============================================================================
CREATE TABLE crew_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(10) NOT NULL,
  -- '2800', '3500', '5000', etc.
  department VARCHAR(50) NOT NULL,
  -- 'Property', 'Camera', 'Editing', 'Grip', etc.
  position_title VARCHAR(100) NOT NULL,
  union_local VARCHAR(50),
  -- 'IATSE Local 44', null (for non-union)
  union_classification VARCHAR(100),
  -- Maps to rate_cards.job_classification
  typical_for_production_types TEXT[],
  -- ['multi_camera', 'single_camera', 'feature']
  atl_or_btl VARCHAR(3) NOT NULL CHECK (atl_or_btl IN ('ATL', 'BTL')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_code, position_title)
);

-- ============================================================================
-- 6. FRINGE BENEFITS TABLE
-- ============================================================================
CREATE TABLE fringe_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_type VARCHAR(50) NOT NULL,
  -- 'pension', 'health', 'fica', 'sui', 'futa', 'workers_comp'
  union_local VARCHAR(50),
  -- 'IATSE Local 44', null (for statutory taxes)
  state VARCHAR(2),
  -- For state-specific taxes like SUI
  rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('percentage', 'flat_amount')),
  rate_value DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. CREW TEMPLATES TABLE
-- ============================================================================
CREATE TABLE crew_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_type VARCHAR(50) NOT NULL,
  -- 'multi_camera', 'single_camera', 'feature', 'long_form'
  position_id UUID REFERENCES crew_positions(id) ON DELETE CASCADE,
  typical_prep_weeks DECIMAL(5,2),
  typical_shoot_weeks DECIMAL(5,2),
  typical_wrap_weeks DECIMAL(5,2),
  quantity INT DEFAULT 1,
  -- Number of people in this position (e.g., 3 camera operators)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. BUDGET LINE ITEMS TABLE
-- ============================================================================
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  account_code VARCHAR(10) NOT NULL,
  description VARCHAR(255) NOT NULL,
  position_id UUID REFERENCES crew_positions(id),
  quantity DECIMAL(10,2),
  -- weeks, days, units
  rate DECIMAL(10,2),
  subtotal DECIMAL(12,2),
  fringes DECIMAL(12,2),
  total DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. TAX INCENTIVES TABLE
-- ============================================================================
CREATE TABLE tax_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(2),
  country VARCHAR(50) DEFAULT 'US',
  incentive_name VARCHAR(100),
  incentive_type VARCHAR(50),
  -- 'refundable_credit', 'transferable_credit', 'grant', 'rebate'
  rate_pct DECIMAL(5,2),
  -- 30.0, 35.0, 40.0
  min_spend_required DECIMAL(12,2),
  max_credit_amount DECIMAL(12,2),
  restrictions TEXT,
  effective_date_start DATE,
  effective_date_end DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. BUDGET SCENARIOS TABLE
-- ============================================================================
CREATE TABLE budget_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  scenario_name VARCHAR(100),
  -- 'Los Angeles Union', 'Georgia with Tax Incentive', etc.
  location VARCHAR(100),
  state VARCHAR(2),
  applied_sideletter VARCHAR(100),
  total_atl DECIMAL(12,2),
  total_btl DECIMAL(12,2),
  total_post DECIMAL(12,2),
  total_other DECIMAL(12,2),
  grand_total DECIMAL(12,2),
  tax_incentive_amount DECIMAL(12,2),
  effective_budget DECIMAL(12,2),
  -- Grand total minus tax incentive
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_rate_cards_lookup ON rate_cards(union_local, job_classification, location, effective_date);
CREATE INDEX idx_budget_line_items_production ON budget_line_items(production_id);
CREATE INDEX idx_crew_positions_account ON crew_positions(account_code);
CREATE INDEX idx_crew_positions_union ON crew_positions(union_local);
CREATE INDEX idx_fringe_benefits_lookup ON fringe_benefits(benefit_type, union_local, state);
CREATE INDEX idx_productions_created ON productions(created_at DESC);
CREATE INDEX idx_sideletter_rules_lookup ON sideletter_rules(production_type, distribution_platform, season_number);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Current Rate Cards (most recent effective date)
CREATE VIEW current_rate_cards AS
SELECT DISTINCT ON (union_local, job_classification, location, production_type)
  id, union_local, job_classification, rate_type, base_rate,
  location, production_type, effective_date, contract_year
FROM rate_cards
ORDER BY union_local, job_classification, location, production_type, effective_date DESC;

-- View: Production Budget Summary
CREATE VIEW production_budget_summary AS
SELECT
  p.id as production_id,
  p.name as production_name,
  p.production_type,
  p.distribution_platform,
  COUNT(bli.id) as line_item_count,
  SUM(bli.subtotal) as total_labor,
  SUM(bli.fringes) as total_fringes,
  SUM(bli.total) as grand_total
FROM productions p
LEFT JOIN budget_line_items bli ON p.id = bli.production_id
GROUP BY p.id, p.name, p.production_type, p.distribution_platform;
