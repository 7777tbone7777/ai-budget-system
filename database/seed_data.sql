-- Seed Data for AI Budget System
-- Based on 2024 IATSE Basic Agreement (August 1, 2024 - July 31, 2027)

-- ============================================================================
-- UNION AGREEMENTS
-- ============================================================================
INSERT INTO union_agreements (union_name, agreement_type, effective_date_start, effective_date_end, rules) VALUES
('IATSE', 'Basic Agreement', '2024-08-01', '2027-07-31',
 '{"wage_increases": {"year_1": 7.0, "year_2": 4.0, "year_3": 3.5}, "locals": ["44", "80", "600", "695", "700", "705", "706", "728", "729", "800", "839", "871", "884", "892"]}'),

('IATSE', 'Multi-Camera Sideletter', '2024-08-01', '2027-07-31',
 '{"wage_adjustment": 0.0, "holiday_pay": 100, "vacation_pay": 100, "overtime": {"daily": "1.5x after 8", "double": "2x after 12", "triple": "3x after 15 elapsed"}}'),

('IATSE', 'Network TV Half-Hour Pilot Sideletter', '2024-08-01', '2027-07-31',
 '{"season_1_wage_adjustment": -3.0, "season_2_wage_adjustment": -3.0, "season_3_wage_adjustment": 0.0}'),

('IATSE', 'Low Budget Agreement', '2024-08-01', '2027-07-31',
 '{"wage_adjustment": -12.5, "holiday_pay": 0, "vacation_pay": 0}'),

('IATSE', 'High Budget SVOD Agreement', '2024-08-01', '2027-07-31',
 '{"min_budget_thresholds": {"20_35_min": 1300000, "36_65_min": 2500000, "66_plus_min": 3000000}}');

-- ============================================================================
-- SIDELETTER RULES
-- ============================================================================

-- Multi-Camera Half-Hour (Network TV, Pay TV, HB SVOD, HB AVOD, HB FAST)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform, season_number, location_restriction, wage_adjustment_pct, holiday_pay_pct, vacation_pay_pct, overtime_rules) VALUES
('Multi-Camera HB SVOD - All Seasons', 'multi_camera', 'hb_svod', NULL, 'Regardless of location', 0.0, 100.0, 100.0,
 '{"daily_ot": "1.5x after 8 hours", "double_time": "2x after 12 hours", "triple_time": "3x after 15 hours elapsed"}'),

('Multi-Camera Network TV - All Seasons', 'multi_camera', 'network_tv', NULL, 'Los Angeles only', 0.0, 100.0, 100.0,
 '{"daily_ot": "Per Videotape Agreement", "triple_time": "3x after 15 hours elapsed"}');

-- Single-Camera Half-Hour (Network TV, Pay TV, HB SVOD)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform, season_number, location_restriction, wage_adjustment_pct, holiday_pay_pct, vacation_pay_pct, overtime_rules) VALUES
('Single-Camera Season 1', 'single_camera', 'network_tv', 1, 'Los Angeles only', -3.0, 0.0, 0.0,
 '{"daily_ot": "1.5x after 8 hours", "double_time": "2x after 12 hours", "triple_time": "3x after 15 hours elapsed"}'),

('Single-Camera Season 2', 'single_camera', 'network_tv', 2, 'Los Angeles only', -3.0, 50.0, 50.0,
 '{"daily_ot": "1.5x after 8 hours", "double_time": "2x after 12 hours", "triple_time": "3x after 15 hours elapsed"}'),

('Single-Camera Season 3+', 'single_camera', 'network_tv', 3, 'Los Angeles only', 0.0, 100.0, 100.0,
 '{"daily_ot": "1.5x after 8 hours", "double_time": "2x after 12 hours", "triple_time": "3x after 15 hours elapsed"}');

-- Low Budget SVOD/AVOD/FAST
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform, season_number, location_restriction, wage_adjustment_pct, holiday_pay_pct, vacation_pay_pct, overtime_rules) VALUES
('Low Budget SVOD - All Seasons', 'single_camera', 'lb_svod', NULL, 'Regardless of location', -12.5, 0.0, 0.0,
 '{"daily_ot": "1.5x after 8 hours", "double_time": "2x after 12 hours", "triple_time": "3x after 15 hours elapsed"}');

-- ============================================================================
-- CREW POSITIONS
-- ============================================================================

INSERT INTO crew_positions (account_code, department, position_title, union_local, union_classification, typical_for_production_types, atl_or_btl) VALUES
-- Property Department (Local 44)
('2800', 'Property', 'Property Master', 'IATSE Local 44', 'Property Master', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('2800', 'Property', 'Assistant Property Master', 'IATSE Local 44', 'Assistant Property Master', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),

-- Grip Department (Local 80)
('2500', 'Grip', 'Key Grip', 'IATSE Local 80', 'Key Grip', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('2500', 'Grip', 'Best Boy Grip', 'IATSE Local 80', 'Best Boy Grip', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('2500', 'Grip', 'Dolly Grip', 'IATSE Local 80', 'Dolly Grip', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),

-- Camera Department (Local 600)
('3500', 'Camera', 'Director of Photography', 'IATSE Local 600', 'Director of Photography', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('3500', 'Camera', 'Camera Operator', 'IATSE Local 600', 'Camera Operator', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('3500', 'Camera', '1st Assistant Camera', 'IATSE Local 600', '1st Assistant Camera', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('3500', 'Camera', '2nd Assistant Camera', 'IATSE Local 600', '2nd Assistant Camera', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),

-- Editing Department (Local 700)
('5000', 'Editing', 'Editor', 'IATSE Local 700', 'Editor', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('5000', 'Editing', 'Assistant Editor', 'IATSE Local 700', 'Assistant Editor', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),

-- Makeup & Hair (Local 706)
('3100', 'Makeup & Hair', 'Department Head Makeup', 'IATSE Local 706', 'Department Head Makeup', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('3100', 'Makeup & Hair', 'Department Head Hair', 'IATSE Local 706', 'Department Head Hair', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),

-- Electricians (Local 728)
('3400', 'Electrical', 'Gaffer', 'IATSE Local 728', 'Gaffer', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL'),
('3400', 'Electrical', 'Best Boy Electric', 'IATSE Local 728', 'Best Boy Electric', ARRAY['multi_camera', 'single_camera', 'feature'], 'BTL');

-- ============================================================================
-- RATE CARDS - IATSE 2024 (Year 1 with 7% increase)
-- Based on 2024 IATSE Basic Agreement effective August 1, 2024
-- ============================================================================

-- Local 44 - Property Department
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 44', 'Property Master', 'weekly', 2812.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 44', 'Property Master', 'weekly', 2812.50, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 44', 'Property Master', 'weekly', 2812.50, 'Los Angeles - Studio', 'hb_svod', '2024-08-01', 1, 7.0),
('IATSE Local 44', 'Assistant Property Master', 'weekly', 2145.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 44', 'Assistant Property Master', 'weekly', 2145.50, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0);

-- Local 80 - Grips
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 80', 'Key Grip', 'weekly', 2987.25, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 80', 'Key Grip', 'weekly', 2987.25, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 80', 'Best Boy Grip', 'weekly', 2467.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 80', 'Dolly Grip', 'weekly', 2145.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0);

-- Local 600 - Camera
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 600', 'Director of Photography', 'weekly', 4987.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 600', 'Director of Photography', 'weekly', 4987.50, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 600', 'Camera Operator', 'weekly', 3127.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 600', 'Camera Operator', 'weekly', 3127.50, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 600', '1st Assistant Camera', 'weekly', 2645.75, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 600', '2nd Assistant Camera', 'weekly', 2145.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0);

-- Local 700 - Editors
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 700', 'Editor', 'weekly', 3456.75, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 700', 'Editor', 'weekly', 3456.75, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 700', 'Assistant Editor', 'weekly', 2345.25, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0);

-- Local 706 - Makeup & Hair
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 706', 'Department Head Makeup', 'weekly', 2987.25, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 706', 'Department Head Hair', 'weekly', 2987.25, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0);

-- Local 728 - Electricians
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct) VALUES
('IATSE Local 728', 'Gaffer', 'weekly', 3245.50, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0),
('IATSE Local 728', 'Gaffer', 'weekly', 3245.50, 'Los Angeles - Studio', 'network_tv', '2024-08-01', 1, 7.0),
('IATSE Local 728', 'Best Boy Electric', 'weekly', 2687.25, 'Los Angeles - Studio', 'theatrical', '2024-08-01', 1, 7.0);

-- ============================================================================
-- FRINGE BENEFITS
-- ============================================================================

-- IATSE Pension & Health (varies by local, using averages)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date) VALUES
('pension', 'IATSE Local 44', 'CA', 'percentage', 8.5, '2024-08-01'),
('pension', 'IATSE Local 80', 'CA', 'percentage', 8.5, '2024-08-01'),
('pension', 'IATSE Local 600', 'CA', 'percentage', 10.0, '2024-08-01'),
('pension', 'IATSE Local 700', 'CA', 'percentage', 9.5, '2024-08-01'),
('pension', 'IATSE Local 706', 'CA', 'percentage', 8.5, '2024-08-01'),
('pension', 'IATSE Local 728', 'CA', 'percentage', 9.0, '2024-08-01');

-- Health & Welfare (typically flat amounts, but simplified as %)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date) VALUES
('health', 'IATSE Local 44', 'CA', 'percentage', 10.5, '2024-08-01'),
('health', 'IATSE Local 80', 'CA', 'percentage', 10.5, '2024-08-01'),
('health', 'IATSE Local 600', 'CA', 'percentage', 11.0, '2024-08-01'),
('health', 'IATSE Local 700', 'CA', 'percentage', 10.5, '2024-08-01'),
('health', 'IATSE Local 706', 'CA', 'percentage', 10.5, '2024-08-01'),
('health', 'IATSE Local 728', 'CA', 'percentage', 10.5, '2024-08-01');

-- Statutory Payroll Taxes (apply to all employees)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date) VALUES
('fica', NULL, NULL, 'percentage', 7.65, '2024-01-01'),
('futa', NULL, NULL, 'percentage', 0.6, '2024-01-01'),
('sui', NULL, 'CA', 'percentage', 3.4, '2024-01-01'),
('sui', NULL, 'GA', 'percentage', 2.7, '2024-01-01'),
('sui', NULL, 'NM', 'percentage', 3.1, '2024-01-01'),
('sui', NULL, 'NY', 'percentage', 4.1, '2024-01-01');

-- Workers Compensation (varies by state and classification)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date) VALUES
('workers_comp', NULL, 'CA', 'percentage', 5.5, '2024-01-01'),
('workers_comp', NULL, 'GA', 'percentage', 3.2, '2024-01-01'),
('workers_comp', NULL, 'NM', 'percentage', 3.8, '2024-01-01'),
('workers_comp', NULL, 'NY', 'percentage', 4.5, '2024-01-01');

-- ============================================================================
-- TAX INCENTIVES
-- ============================================================================

INSERT INTO tax_incentives (state, country, incentive_name, incentive_type, rate_pct, min_spend_required, effective_date_start, effective_date_end, restrictions) VALUES
('GA', 'US', 'Georgia Film Tax Credit', 'transferable_credit', 30.0, 500000, '2024-01-01', '2025-12-31',
 'Must spend $500K minimum. 30% transferable credit on qualified spend. Additional 10% if Georgia promotional logo included.'),

('NM', 'US', 'New Mexico Film Production Tax Credit', 'refundable_credit', 35.0, 0, '2024-01-01', '2025-12-31',
 '35% refundable credit. No minimum spend. Additional 5% for TV series filming multiple seasons.'),

('NY', 'US', 'New York Film Production Tax Credit', 'refundable_credit', 30.0, 0, '2024-01-01', '2025-12-31',
 '30% refundable credit on qualified production costs. 35% for production outside NYC metro.'),

('CA', 'US', 'California Film & Television Tax Credit', 'transferable_credit', 25.0, 1000000, '2024-01-01', '2025-12-31',
 '20-25% transferable credit. Allocation by lottery. $1M minimum spend.');

-- ============================================================================
-- CREW TEMPLATES (Multi-Camera Sitcom)
-- ============================================================================

DO $$
DECLARE
  prop_master_id UUID;
  key_grip_id UUID;
  gaffer_id UUID;
  dp_id UUID;
  camera_op_id UUID;
  editor_id UUID;
BEGIN
  -- Get position IDs
  SELECT id INTO prop_master_id FROM crew_positions WHERE position_title = 'Property Master';
  SELECT id INTO key_grip_id FROM crew_positions WHERE position_title = 'Key Grip';
  SELECT id INTO gaffer_id FROM crew_positions WHERE position_title = 'Gaffer';
  SELECT id INTO dp_id FROM crew_positions WHERE position_title = 'Director of Photography';
  SELECT id INTO camera_op_id FROM crew_positions WHERE position_title = 'Camera Operator';
  SELECT id INTO editor_id FROM crew_positions WHERE position_title = 'Editor';

  -- Multi-camera sitcom crew template (3 Rehearsal / 1 Block / 1 Shoot per episode)
  INSERT INTO crew_templates (production_type, position_id, typical_prep_weeks, typical_shoot_weeks, typical_wrap_weeks, quantity, notes) VALUES
  ('multi_camera', prop_master_id, 3, 1, 1, 1, '3 rehearsal + 1 block + 1 shoot pattern per episode'),
  ('multi_camera', key_grip_id, 3, 1, 1, 1, '3 rehearsal + 1 block + 1 shoot pattern per episode'),
  ('multi_camera', gaffer_id, 3, 1, 1, 1, '3 rehearsal + 1 block + 1 shoot pattern per episode'),
  ('multi_camera', dp_id, 3, 1, 1, 1, '3 rehearsal + 1 block + 1 shoot pattern per episode'),
  ('multi_camera', camera_op_id, 0, 1, 0, 3, '3 camera operators for multi-camera (shoot weeks only)'),
  ('multi_camera', editor_id, 0, 0, 2, 1, 'Post-production work (2 weeks per episode)');
END $$;
