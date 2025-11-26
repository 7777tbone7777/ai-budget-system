# AI Budget System - Database Migration Summary

## Migrations Completed

### Migration 001: 4-Level Budget Hierarchy ✅
**File:** `001_add_4_level_hierarchy.sql`
**Date:** 2025-11-26
**Status:** Successfully executed on Railway PostgreSQL

#### New Tables Created

1. **`budget_metadata`** - Budget versioning and tracking
   - Stores budget UUID, version number, type (original/current/final)
   - Tracks counts: topsheet categories, accounts, detail lines, fringe types
   - References: `productions`

2. **`budget_topsheet`** - Level 1 (High-level categories)
   - 36 high-level categories per budget (e.g., "1100 Story & Rights")
   - Financial columns: original/current/variance for subtotal, fringe, total
   - Amortization support: `is_amortized`, `amortization_episodes`
   - References: `budget_metadata`

3. **`budget_accounts`** - Level 2 (Mid-level accounts)
   - 328 accounts per budget (e.g., "1105 Story Consultant")
   - Groups related line items together
   - Financial columns: original/current/variance
   - References: `budget_topsheet`, `budget_metadata`

4. **`budget_line_items`** - Level 3 (Detailed line items)
   - 990+ line items per budget (enhanced from old table)
   - Full calculation support: quantity, unit_type, rate, multiplier
   - Formula field for complex calculations
   - Fringe breakdown as JSONB
   - Episodic handling: `is_amortized`, `per_episode_cost`
   - References: `budget_accounts`, `budget_metadata`, `productions`, `crew_positions`

5. **`budget_global_variables`** - Reusable formulas
   - Store variables like "SHOW_EPISODES=12", "PREP_WEEKS=2"
   - Types: number, rate, text, date
   - Referenced across budget calculations
   - References: `budget_metadata`

6. **`fringe_calculation_rules`** - Fringe rate definitions
   - Union-specific fringe component breakdowns
   - JSONB structure for flexible fringe rules
   - State-specific rules (e.g., CA workers comp)
   - Effective date ranges for multi-year agreements

#### Triggers Installed (14 total)

**Auto-calculation triggers:**
- `trg_calculate_line_item_totals` - Calculates subtotal, fringe, total, per_episode_cost automatically on INSERT/UPDATE
- `trg_rollup_account_totals` - Rolls up line items to account totals
- `trg_rollup_topsheet_totals` - Rolls up accounts to topsheet totals
- `trg_update_metadata_from_*` - Updates budget metadata counts

**How they work:**
1. You insert a line item with `quantity=24`, `rate=7072`, `multiplier=0.0833`, `total_fringe_rate=0.2938`
2. Trigger calculates: `current_subtotal = 24 × 7072 × 0.0833 = $14,139.26`
3. Trigger calculates: `current_fringe = $14,139.26 × 0.2938 = $4,154.32`
4. Trigger calculates: `current_total = $14,139.26 + $4,154.32 = $18,293.58`
5. Trigger rolls up to account, then to topsheet
6. Trigger updates metadata with new counts

#### Views Created (2 total)

1. **`budget_hierarchy_view`** - Complete budget hierarchy in one view
   - Joins: productions → budgets → topsheet → accounts → line items
   - Shows full drill-down from category to line item detail

2. **`budget_topsheet_summary`** - Executive summary by category
   - Aggregates line item counts, account counts per topsheet category
   - Ordered by `sort_order` for presentation

---

### Migration 002: Fringe Calculation Rules ✅
**File:** `002_seed_fringe_rules.sql`
**Date:** 2025-11-26
**Status:** Successfully executed on Railway PostgreSQL

#### Fringe Rules Seeded (6 rules)

1. **IATSE CA Clerk** - Rate: 29.38%
   - FICA: 6.2% (cap $142,800)
   - Medicare: 1.45%
   - CA Workers Comp (Clerk): 0.38%
   - Payroll Fee: 1.35%
   - **Total: 29.38%**

2. **IATSE CA Craftsperson** - Rate: 30.60%
   - FICA: 6.2% (cap $142,800)
   - Medicare: 1.45%
   - CA Workers Comp (Craft): 6.85%
   - IATSE Pension: 8.5%
   - IATSE Health: 6.25%
   - Payroll Fee: 1.35%
   - **Total: 30.60%**

3. **WGA Writer** - Rate: 24.76%
   - Applied to WGA portion only
   - FICA: 6.2%
   - Medicare: 1.45%
   - CA Workers Comp: 0.38%
   - WGA Pension & Health: 8.38%
   - WGA Health: 7%
   - Payroll Fee: 1.35%
   - **Total: 24.76%**

4. **DGA Director** - Rate: 18.88%
   - FICA: 6.2% (cap $160,200 for 2023)
   - Medicare: 1.45%
   - CA Workers Comp: 0.38%
   - DGA Pension & Health: 8%
   - DGA Creative Rights: 1.5%
   - Payroll Fee: 1.35%
   - **Total: 18.88%**

5. **SAG-AFTRA Actor** - Rate: 26.45%
   - FICA: 6.2% (cap $160,200)
   - Medicare: 1.45%
   - CA Workers Comp (Performer): 1.45%
   - SAG-AFTRA Pension: 8%
   - SAG-AFTRA Health: 8%
   - Payroll Fee: 1.35%
   - **Total: 26.45%**

6. **Non-Union CA** - Rate: 18%
   - Statutory minimum only
   - FICA: 6.2%
   - Medicare: 1.45%
   - CA SUI: 3.4%
   - FUTA: 0.6%
   - CA Workers Comp (Generic): 5%
   - Payroll Fee: 1.35%
   - **Total: 18%**

#### Helper Function Created

**`get_fringe_rule()`** - Smart fringe rule lookup
- Parameters: union_local, state, position_class, effective_date
- Logic:
  1. Try exact match (union + state + position)
  2. Fall back to union + position (any state)
  3. Fall back to non-union for state
- Returns: Full `fringe_calculation_rules` row

**Usage example:**
```sql
SELECT get_fringe_rule('IATSE', 'CA', 'craftsperson', '2023-01-01');
-- Returns rule with 30.60% total_rate and full JSONB component breakdown
```

---

## Database Statistics

**Before migrations:**
- 10 tables
- 1 view (production_budget_summary)
- ~40 line items per budget
- Manual fringe calculations

**After migrations:**
- 16 tables (+6 new)
- 3 views (+2 new)
- 14 triggers (all new)
- Support for 990+ line items per budget
- Automatic fringe calculations
- 4-level hierarchy with auto-rollups

---

## Next Steps

### 1. API Endpoint Updates Needed
Update `backend/server.js` to use the new hierarchy:

**New endpoints to create:**
- `POST /api/budgets` - Create new budget with metadata
- `GET /api/budgets/:id/topsheet` - Get topsheet summary
- `GET /api/budgets/:id/accounts/:account_code` - Get account detail
- `POST /api/budgets/:id/line-items` - Create line item (auto-applies fringes)
- `GET /api/budgets/:id/hierarchy` - Get full budget hierarchy
- `GET /api/fringe-rules/:union/:state/:class` - Get applicable fringe rule

**Endpoints to update:**
- `/api/productions/:id/categories` - Map to new topsheet table
- `/api/ai/crew/recommend` - Return line items with auto-calculated fringes

### 2. Episodic Cost Multiplication
Database trigger already calculates `per_episode_cost` if `is_amortized=true`.

Need to add UI/API logic:
- When creating line items, set `is_amortized=true` for prep costs
- Set `amortization_episodes` = production's `episode_count`
- Trigger will automatically calculate per-episode cost

### 3. Sample Budget Generation
Create seed script to generate a full 990-line multi-camera sitcom budget:
- Read from `/Users/anthonyvazquez/Downloads/2021 Multicam S1 Pattern 12Eps v06_1.xlsx`
- Parse all 990 line items
- Insert into new hierarchy tables
- Use for testing and demonstration

### 4. Frontend Updates
Update frontend to display:
- Topsheet view (36 categories)
- Drill-down to accounts (328 accounts)
- Line item detail (990+ lines)
- Fringe breakdown tooltip (show FICA, Medicare, etc.)

---

## Testing the Migration

### Verify tables exist:
```bash
railway run --service backend psql $DATABASE_URL -c "\\dt budget_*"
```

### Check fringe rules:
```bash
railway run --service backend psql $DATABASE_URL -c "SELECT rule_name, total_rate FROM fringe_calculation_rules;"
```

### Test auto-calculation:
```sql
-- Create a test budget
INSERT INTO budget_metadata (production_id, budget_uuid, budget_type)
VALUES ((SELECT id FROM productions LIMIT 1), 'test-budget-001', 'original');

-- Create a topsheet category
INSERT INTO budget_topsheet (budget_id, category_number, category_name, sort_order)
VALUES ((SELECT id FROM budget_metadata WHERE budget_uuid = 'test-budget-001'), 1100, 'Story & Rights', 1);

-- Create an account
INSERT INTO budget_accounts (topsheet_category_id, budget_id, account_code, account_name, sort_order)
VALUES (
  (SELECT id FROM budget_topsheet WHERE budget_id = (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-budget-001')),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-budget-001'),
  '1105',
  'Story Consultant',
  1
);

-- Create a line item (trigger will auto-calculate totals!)
INSERT INTO budget_line_items (
  account_id,
  budget_id,
  production_id,
  line_number,
  description,
  quantity,
  unit_type,
  rate,
  multiplier,
  total_fringe_rate,
  union_local,
  sort_order
) VALUES (
  (SELECT id FROM budget_accounts WHERE account_code = '1105'),
  (SELECT id FROM budget_metadata WHERE budget_uuid = 'test-budget-001'),
  (SELECT production_id FROM budget_metadata WHERE budget_uuid = 'test-budget-001'),
  1,
  'Executive Producer #1 - WGA Portion',
  24,
  'weeks',
  7072,
  0.0833,
  0.2938,
  'WGA',
  1
);

-- Check the auto-calculated results:
SELECT
  description,
  quantity,
  rate,
  multiplier,
  current_subtotal,  -- Should be $14,139.26
  total_fringe_rate,
  current_fringe,    -- Should be $4,154.32
  current_total      -- Should be $18,293.58
FROM budget_line_items
WHERE description LIKE 'Executive Producer%';
```

---

## Migration Files Location
```
/Users/anthonyvazquez/ai-budget-system/database/migrations/
├── 001_add_4_level_hierarchy.sql (18.13 KB)
├── 002_seed_fringe_rules.sql (10.22 KB)
├── run_migration.js (Node.js migration runner)
└── MIGRATION_SUMMARY.md (this file)
```

---

## Rollback (if needed)

**WARNING:** This will delete all budget hierarchy data!

```sql
-- Drop new tables (cascades to dependent objects)
DROP TABLE IF EXISTS budget_line_items CASCADE;
DROP TABLE IF EXISTS budget_accounts CASCADE;
DROP TABLE IF EXISTS budget_topsheet CASCADE;
DROP TABLE IF EXISTS budget_metadata CASCADE;
DROP TABLE IF EXISTS budget_global_variables CASCADE;
DROP TABLE IF EXISTS fringe_calculation_rules CASCADE;

-- Drop views
DROP VIEW IF EXISTS budget_hierarchy_view CASCADE;
DROP VIEW IF EXISTS budget_topsheet_summary CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS get_fringe_rule CASCADE;

-- Recreate old budget_line_items table from schema.sql lines 153-167
```

---

## Success Metrics

The migration successfully achieves:

✅ **4-level hierarchy** matching professional budgets
✅ **Automatic calculations** via database triggers
✅ **Fringe auto-application** with 6 union rules
✅ **990+ line item support** per budget
✅ **Amortization support** for multi-episode productions
✅ **Variance tracking** (Original vs Current vs Variance)
✅ **Global variables** for reusable formulas
✅ **JSONB fringe breakdown** for detailed reporting

Next: Implement API endpoints and test with sample budget data!
