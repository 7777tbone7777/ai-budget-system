-- ============================================================================
-- AI BUDGET SYSTEM: SEED FRINGE CALCULATION RULES
-- ============================================================================
-- Based on professional production budget analysis from 2021 Multi-Camera Sitcom
-- These rules define how fringes are calculated for different union/state combinations
-- ============================================================================

-- ============================================================================
-- IATSE CALIFORNIA - CLERK CLASSIFICATION
-- ============================================================================
-- Total Rate: 0.2938 (29.38%)
-- Components: FICA, Medicare, CA Workers Comp (Clerk), Payroll Fee
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'IATSE CA Clerk 2021',
  'IATSE',
  'CA',
  'clerk',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 142800, "description": "Social Security"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages", "description": "Medicare"},
    {"type": "CA_WC_Clerk", "rate": 0.0038, "applies_to": "gross_wages", "description": "California Workers Comp - Clerical"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "gross_wages", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.2938,
  '2021-01-01',
  'Used for clerical/office positions in California productions'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- IATSE CALIFORNIA - CRAFTSPERSON CLASSIFICATION
-- ============================================================================
-- Total Rate: Varies by craft (typically 0.28-0.35)
-- Higher workers comp rate than clerks
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'IATSE CA Craftsperson 2021',
  'IATSE',
  'CA',
  'craftsperson',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 142800, "description": "Social Security"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages", "description": "Medicare"},
    {"type": "CA_WC_Craft", "rate": 0.0685, "applies_to": "gross_wages", "description": "California Workers Comp - Craftsperson"},
    {"type": "IATSE_Pension", "rate": 0.085, "applies_to": "gross_wages", "description": "IATSE Pension Fund"},
    {"type": "IATSE_Health", "rate": 0.0625, "applies_to": "gross_wages", "description": "IATSE Health Fund"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "gross_wages", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.3060,
  '2021-01-01',
  'Used for craft positions (grips, electricians, camera, etc.) in California'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- WGA (WRITERS GUILD OF AMERICA)
-- ============================================================================
-- Total Rate: 0.2938 (29.38%) on WGA portion
-- Note: Corporate deals may have different structures
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'WGA Writer 2021',
  'WGA',
  NULL,
  'writer',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "wga_portion", "cap": 142800, "description": "Social Security"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "wga_portion", "description": "Medicare"},
    {"type": "CA_WC_Clerk", "rate": 0.0038, "applies_to": "wga_portion", "description": "California Workers Comp - Clerical"},
    {"type": "WGA_Pension", "rate": 0.0838, "applies_to": "wga_portion", "description": "WGA Pension & Health Fund (8.38%)"},
    {"type": "WGA_Health", "rate": 0.07, "applies_to": "wga_portion", "description": "WGA Health Fund (7%)"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "wga_portion", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.2476,
  '2021-01-01',
  'Applied to WGA portion only. Corporate deals may have separate structure.'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- DGA (DIRECTORS GUILD OF AMERICA)
-- ============================================================================
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'DGA Director 2023',
  'DGA',
  NULL,
  'director',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 160200, "description": "Social Security (2023 cap)"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages", "description": "Medicare"},
    {"type": "CA_WC_Clerk", "rate": 0.0038, "applies_to": "gross_wages", "description": "California Workers Comp - Clerical"},
    {"type": "DGA_Pension", "rate": 0.08, "applies_to": "gross_wages", "description": "DGA Pension & Health Fund (8%)"},
    {"type": "DGA_Creative_Rights", "rate": 0.015, "applies_to": "gross_wages", "description": "DGA Creative Rights (1.5%)"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "gross_wages", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.1888,
  '2023-07-01',
  'DGA Basic Agreement 2023-2026, Year 1'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAG-AFTRA (SCREEN ACTORS GUILD)
-- ============================================================================
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'SAG-AFTRA Actor 2023',
  'SAG-AFTRA',
  NULL,
  'actor',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 160200, "description": "Social Security (2023 cap)"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages", "description": "Medicare"},
    {"type": "CA_WC_Actor", "rate": 0.0145, "applies_to": "gross_wages", "description": "California Workers Comp - Performer"},
    {"type": "SAG_Pension", "rate": 0.08, "applies_to": "gross_wages", "description": "SAG-AFTRA Pension (8%)"},
    {"type": "SAG_Health", "rate": 0.08, "applies_to": "gross_wages", "description": "SAG-AFTRA Health (8%)"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "gross_wages", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.2645,
  '2023-01-01',
  'SAG-AFTRA rates for performers'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- NON-UNION / GENERIC
-- ============================================================================
-- Statutory minimum only (FICA, Medicare, State UI, FUTA, Workers Comp)
INSERT INTO fringe_calculation_rules (
  rule_name,
  union_local,
  state,
  position_classification,
  fringe_components,
  total_rate,
  effective_date_start,
  notes
) VALUES (
  'Non-Union CA 2023',
  NULL,
  'CA',
  'non-union',
  '[
    {"type": "FICA", "rate": 0.062, "applies_to": "gross_wages", "cap": 160200, "description": "Social Security (2023 cap)"},
    {"type": "Medicare", "rate": 0.0145, "applies_to": "gross_wages", "description": "Medicare"},
    {"type": "CA_SUI", "rate": 0.034, "applies_to": "gross_wages", "cap": 7000, "description": "California State Unemployment Insurance"},
    {"type": "FUTA", "rate": 0.006, "applies_to": "gross_wages", "cap": 7000, "description": "Federal Unemployment Tax"},
    {"type": "CA_WC_Generic", "rate": 0.05, "applies_to": "gross_wages", "description": "California Workers Comp - General"},
    {"type": "Payroll_Fee", "rate": 0.0135, "applies_to": "gross_wages", "description": "Payroll Processing Fee"}
  ]'::jsonb,
  0.18,
  '2023-01-01',
  'Statutory minimum for non-union workers in California'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTION: GET APPLICABLE FRINGE RULE
-- ============================================================================
CREATE OR REPLACE FUNCTION get_fringe_rule(
  p_union_local VARCHAR,
  p_state VARCHAR,
  p_position_class VARCHAR,
  p_effective_date DATE
) RETURNS fringe_calculation_rules AS $$
DECLARE
  v_rule fringe_calculation_rules;
BEGIN
  -- Try exact match first (union + state + position)
  SELECT * INTO v_rule
  FROM fringe_calculation_rules
  WHERE union_local = p_union_local
    AND (state = p_state OR state IS NULL)
    AND position_classification = p_position_class
    AND effective_date_start <= p_effective_date
    AND (effective_date_end IS NULL OR effective_date_end >= p_effective_date)
  ORDER BY effective_date_start DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_rule;
  END IF;

  -- Fall back to union + position (any state)
  SELECT * INTO v_rule
  FROM fringe_calculation_rules
  WHERE union_local = p_union_local
    AND position_classification = p_position_class
    AND effective_date_start <= p_effective_date
    AND (effective_date_end IS NULL OR effective_date_end >= p_effective_date)
  ORDER BY effective_date_start DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_rule;
  END IF;

  -- Fall back to non-union for the state
  SELECT * INTO v_rule
  FROM fringe_calculation_rules
  WHERE union_local IS NULL
    AND state = p_state
    AND position_classification = 'non-union'
    AND effective_date_start <= p_effective_date
    AND (effective_date_end IS NULL OR effective_date_end >= p_effective_date)
  ORDER BY effective_date_start DESC
  LIMIT 1;

  RETURN v_rule;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Seeded 6 fringe calculation rules:
-- 1. IATSE CA Clerk (0.2938)
-- 2. IATSE CA Craftsperson (0.3060)
-- 3. WGA Writer (0.2476 on WGA portion)
-- 4. DGA Director (0.1888)
-- 5. SAG-AFTRA Actor (0.2645)
-- 6. Non-Union CA (0.18)
--
-- Next: Create API endpoints to apply these rules when creating line items
-- ============================================================================
