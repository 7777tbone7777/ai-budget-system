-- ============================================================================
-- AI BUDGET SYSTEM: TEST SAMPLE BUDGET
-- ============================================================================
-- Creates a sample budget demonstrating the 4-level hierarchy
-- Based on the professional multi-camera sitcom budget analyzed
-- Tests auto-calculation triggers and fringe application
-- ============================================================================

-- Clean up any existing test data
DELETE FROM budget_line_items WHERE budget_id IN (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025');
DELETE FROM budget_accounts WHERE budget_id IN (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025');
DELETE FROM budget_topsheet WHERE budget_id IN (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025');
DELETE FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025';

-- ============================================================================
-- STEP 1: Create a test production
-- ============================================================================
INSERT INTO productions (
  name,
  production_type,
  distribution_platform,
  shooting_location,
  state,
  country,
  budget_target,
  episode_count,
  episode_length_minutes,
  season_number,
  principal_photography_start
) VALUES (
  'Test Multi-Camera Sitcom Season 1',
  'multi_camera',
  'network_tv',
  'Los Angeles',
  'CA',
  'US',
  25000000,
  12,
  22,
  1,
  '2025-06-01'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 2: Create budget metadata
-- ============================================================================
INSERT INTO budget_metadata (
  production_id,
  budget_uuid,
  version_number,
  budget_type,
  notes
) VALUES (
  (SELECT id FROM productions WHERE name = 'Test Multi-Camera Sitcom Season 1' LIMIT 1),
  'test-multicam-2025',
  1,
  'original',
  'Sample budget demonstrating 4-level hierarchy with auto-calculations'
);

-- ============================================================================
-- STEP 3: Create topsheet categories (high-level)
-- ============================================================================

-- Category 1100: Story & Rights
INSERT INTO budget_topsheet (
  budget_id,
  category_number,
  category_name,
  sort_order,
  is_amortized
) VALUES (
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  1100,
  'Story & Rights',
  1,
  TRUE  -- Amortize across all episodes
);

-- Category 1200: Producers
INSERT INTO budget_topsheet (
  budget_id,
  category_number,
  category_name,
  sort_order,
  is_amortized
) VALUES (
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  1200,
  'Producers',
  2,
  TRUE
);

-- Category 2800: Property
INSERT INTO budget_topsheet (
  budget_id,
  category_number,
  category_name,
  sort_order,
  is_amortized
) VALUES (
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  2800,
  'Property',
  3,
  FALSE  -- Per-episode costs
);

-- ============================================================================
-- STEP 4: Create accounts (mid-level)
-- ============================================================================

-- Account 1105: Story Consultant (under Story & Rights)
INSERT INTO budget_accounts (
  topsheet_category_id,
  budget_id,
  account_code,
  account_name,
  sort_order,
  is_amortized,
  amortization_episodes
) VALUES (
  (SELECT id FROM budget_topsheet WHERE category_number = 1100 AND budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  '1105',
  'Story Consultant',
  1,
  TRUE,
  12
);

-- Account 1200: Executive Producer (under Producers)
INSERT INTO budget_accounts (
  topsheet_category_id,
  budget_id,
  account_code,
  account_name,
  sort_order,
  is_amortized,
  amortization_episodes
) VALUES (
  (SELECT id FROM budget_topsheet WHERE category_number = 1200 AND budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  '1200',
  'Executive Producer',
  1,
  TRUE,
  12
);

-- Account 2800: Property Master (under Property)
INSERT INTO budget_accounts (
  topsheet_category_id,
  budget_id,
  account_code,
  account_name,
  sort_order,
  is_amortized
) VALUES (
  (SELECT id FROM budget_topsheet WHERE category_number = 2800 AND budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  '2800',
  'Property Master',
  1,
  FALSE
);

-- ============================================================================
-- STEP 5: Create line items (detailed level)
-- ============================================================================
-- These will test the auto-calculation triggers!

-- Line Item 1: Executive Producer #1 - WGA Portion
-- Formula: 24 weeks × 0.0833 episodes × $7,072/week
-- Expected subtotal: $14,139.26
-- Expected fringe (29.38%): $4,154.32
-- Expected total: $18,293.58
INSERT INTO budget_line_items (
  account_id,
  budget_id,
  production_id,
  line_number,
  description,
  quantity,
  unit_type,
  rate,
  rate_type,
  multiplier,
  formula,
  union_local,
  total_fringe_rate,
  fringe_breakdown,
  is_amortized,
  amortization_episodes,
  sort_order
) VALUES (
  (SELECT id FROM budget_accounts WHERE account_code = '1105'),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  (SELECT production_id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  1,
  'Executive Producer #1 - WGA Portion',
  24,
  'weeks',
  7072,
  'weekly',
  0.0833,
  '24 weeks × 0.0833 episodes × $7,072/week',
  'WGA',
  0.2938,
  '{"FICA": 0.062, "Medicare": 0.0145, "CA_WC_Clerk": 0.0038, "WGA_Pension": 0.0838, "WGA_Health": 0.07, "Payroll_Fee": 0.0135}'::jsonb,
  TRUE,
  12,
  1
);

-- Line Item 2: Executive Producer #1 - Producer Portion (Corporate Deal)
-- Formula: 1 Corp × 1 Episode × $20,856
-- Expected subtotal: $20,856
-- Expected fringe: $0 (corporate deal, no fringes)
-- Expected total: $20,856
INSERT INTO budget_line_items (
  account_id,
  budget_id,
  production_id,
  line_number,
  description,
  quantity,
  unit_type,
  rate,
  rate_type,
  multiplier,
  formula,
  total_fringe_rate,
  is_corporate_deal,
  is_amortized,
  amortization_episodes,
  sort_order
) VALUES (
  (SELECT id FROM budget_accounts WHERE account_code = '1105'),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  (SELECT production_id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  2,
  'Executive Producer #1 - Producer Portion (Corp)',
  1,
  'episodes',
  20856,
  'flat',
  1.0,
  '1 Corp × 1 Episode × $20,856',
  0.0,
  TRUE,
  TRUE,
  12,
  2
);

-- Line Item 3: Property Master - Per Episode
-- Formula: 5 days × 12 episodes × $825/day
-- Expected subtotal: $49,500
-- Expected fringe (30.60%): $15,147
-- Expected total: $64,647
INSERT INTO budget_line_items (
  account_id,
  budget_id,
  production_id,
  line_number,
  description,
  quantity,
  unit_type,
  rate,
  rate_type,
  multiplier,
  formula,
  union_local,
  total_fringe_rate,
  fringe_breakdown,
  is_amortized,
  sort_order
) VALUES (
  (SELECT id FROM budget_accounts WHERE account_code = '2800'),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  (SELECT production_id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025'),
  1,
  'Property Master',
  60,
  'days',
  825,
  'daily',
  1.0,
  '5 days × 12 episodes × $825/day',
  'IATSE',
  0.3060,
  '{"FICA": 0.062, "Medicare": 0.0145, "CA_WC_Craft": 0.0685, "IATSE_Pension": 0.085, "IATSE_Health": 0.0625, "Payroll_Fee": 0.0135}'::jsonb,
  FALSE,
  1
);

-- ============================================================================
-- STEP 6: Verify the auto-calculations worked!
-- ============================================================================

-- Check line items
SELECT
  'Line Item Results' as test_section,
  description,
  quantity,
  rate,
  multiplier,
  current_subtotal,
  total_fringe_rate,
  current_fringe,
  current_total,
  CASE
    WHEN is_amortized THEN CONCAT('Amortized over ', amortization_episodes, ' episodes = $', ROUND(per_episode_cost, 2), '/ep')
    ELSE 'Per episode cost'
  END as amortization_notes
FROM budget_line_items
WHERE budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')
ORDER BY sort_order;

-- Check accounts rolled up
SELECT
  'Account Rollups' as test_section,
  account_code,
  account_name,
  current_subtotal,
  current_fringe,
  current_total,
  (SELECT COUNT(*) FROM budget_line_items WHERE account_id = budget_accounts.id) as line_item_count
FROM budget_accounts
WHERE budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')
ORDER BY sort_order;

-- Check topsheet rolled up
SELECT
  'Topsheet Rollups' as test_section,
  category_number,
  category_name,
  current_subtotal,
  current_fringe,
  current_total,
  (SELECT COUNT(*) FROM budget_accounts WHERE topsheet_category_id = budget_topsheet.id) as account_count
FROM budget_topsheet
WHERE budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-multicam-2025')
ORDER BY sort_order;

-- Check metadata
SELECT
  'Budget Metadata' as test_section,
  budget_uuid,
  version_number,
  budget_type,
  total_topsheet_categories,
  total_accounts,
  total_detail_lines,
  last_calculation_date
FROM budget_metadata
WHERE budget_uuid = 'test-multicam-2025';

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
/*
LINE ITEM 1: Executive Producer #1 - WGA Portion
- current_subtotal: $14,139.26 (24 × 7072 × 0.0833)
- current_fringe: $4,154.32 (14139.26 × 0.2938)
- current_total: $18,293.58
- per_episode_cost: $1,524.47 (18293.58 ÷ 12 episodes)

LINE ITEM 2: Executive Producer #1 - Producer Portion
- current_subtotal: $20,856.00
- current_fringe: $0.00 (corporate deal)
- current_total: $20,856.00
- per_episode_cost: $1,738.00 (20856 ÷ 12 episodes)

LINE ITEM 3: Property Master
- current_subtotal: $49,500.00 (60 × 825 × 1.0)
- current_fringe: $15,147.00 (49500 × 0.3060)
- current_total: $64,647.00
- per_episode_cost: $64,647.00 (not amortized)

ACCOUNT 1105: Story Consultant
- current_subtotal: $35,000.00 (sum of line items 1 & 2)
- current_fringe: $4,154.32
- current_total: $39,154.32

ACCOUNT 2800: Property Master
- current_subtotal: $49,500.00
- current_fringe: $15,147.00
- current_total: $64,647.00

TOPSHEET 1100: Story & Rights
- current_subtotal: $35,000.00
- current_fringe: $4,154.32
- current_total: $39,154.32

TOPSHEET 2800: Property
- current_subtotal: $49,500.00
- current_fringe: $15,147.00
- current_total: $64,647.00

METADATA:
- total_topsheet_categories: 3
- total_accounts: 3
- total_detail_lines: 3
- last_calculation_date: (current timestamp)
*/

-- ============================================================================
-- TEST COMPLETE
-- ============================================================================
