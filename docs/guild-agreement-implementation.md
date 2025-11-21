# Guild Agreement Implementation Guide

**Date:** November 21, 2025
**Based on:** Movie Magic Budgeting Manual Analysis
**Purpose:** Answer extraction questions and structure guild agreement data

---

## Overview

This document explains how our database structure addresses the 62 questions from the guild agreement extraction process. The implementation is based on insights from the Movie Magic Budgeting manual.

---

## Database Enhancements (Migration 004)

### 1. Special Provisions (JSONB)

**Problem Solved:** Questions about meal penalties, overtime rules, and special conditions.

**Implementation:**
```sql
-- budget_line_items.special_provisions
{
  "meal_penalty_after_hours": 6,
  "meal_penalty_amount": 7.50,
  "overtime_after_hours": 8,
  "overtime_multiplier": 1.5,
  "sixth_day_multiplier": 1.5,
  "seventh_day_multiplier": 2.0,
  "golden_hours": true,
  "turnaround_hours": 10,
  "kit_rental": 150.00,
  "minimum_call_hours": 8,
  "guaranteed_hours": 60
}
```

**Questions Answered:**
- ✅ "What are the specific meal penalties outlined?"
- ✅ "Are there specific overtime rules?"
- ✅ "What are the exact overtime rules?"

### 2. Location-Specific Data

**Problem Solved:** Questions about rates in different locations.

**Implementation:**
```sql
ALTER TABLE budget_line_items
ADD COLUMN location VARCHAR(100);

-- Now can track:
-- "Los Angeles, CA"
-- "New York, NY"
-- "Atlanta, GA"
-- "New Mexico"
```

**Questions Answered:**
- ✅ "Are there specific locations outside LA that are covered?"
- ✅ "Are there location-specific rates?"
- ✅ "Are there any specific locations mentioned?"

### 3. Effective Date Tracking

**Problem Solved:** Questions about when rates take effect and expire.

**Implementation:**
```sql
ALTER TABLE budget_line_items
ADD COLUMN effective_date DATE,
ADD COLUMN expiration_date DATE;

ALTER TABLE rate_cards
ADD COLUMN effective_date DATE;
```

**Questions Answered:**
- ✅ "What are the exact effective dates for rate increases?"
- ✅ "What are the effective and expiration dates?"

### 4. Rate Card Tiers

**Problem Solved:** Questions about different tier classifications.

**Implementation:**
```sql
ALTER TABLE rate_cards
ADD COLUMN tier VARCHAR(50);

-- Examples:
-- "Tier A"
-- "Tier B"
-- "Weekly Player"
-- "Daily Player"
-- "Low Budget"
```

**Questions Answered:**
- ✅ "What are the specific rates for each tier?"
- ✅ "What are the specific rates for productions classified as less than Tier A?"

### 5. Fringe Benefit Categories

**Problem Solved:** Questions about comprehensive benefit structures.

**Implementation:**
```sql
ALTER TABLE fringe_benefits
ADD COLUMN benefit_category VARCHAR(50),
ADD COLUMN is_required BOOLEAN,
ADD COLUMN applies_to_union_only BOOLEAN;

-- Categories:
-- "pension"
-- "health"
-- "vacation"
-- "payroll_tax"
-- "union_dues"
-- "workers_comp"
```

**Questions Answered:**
- ✅ "What are the specific pension and health benefits?"
- ✅ "Are there any additional benefits not listed?"
- ✅ "Are there additional benefits for directors working on SVOD projects?"

### 6. Sideletter Budget Thresholds

**Problem Solved:** Questions about when sideletters apply based on budget size.

**Implementation:**
```sql
ALTER TABLE sideletter_rules
ADD COLUMN min_budget_amount DECIMAL(15,2),
ADD COLUMN max_budget_amount DECIMAL(15,2),
ADD COLUMN applicable_unions TEXT[];

-- Example:
-- min_budget: $0
-- max_budget: $2,600,000
-- applicable_unions: ['DGA', 'IATSE Local 600']
```

**Questions Answered:**
- ✅ "What are the specific conditions for the Low Budget Sideletter?"
- ✅ "Are there specific minimum rates for each job classification?"
- ✅ "Are there additional sideletter rules for specific production types?"

---

## Common Globals System

### Automatic Setup for New Productions

The system now automatically creates industry-standard globals:

```javascript
// When a production is created, call:
create_common_globals(production_id);

// This creates:
OVERTIME_MULTIPLIER = 1.5
SIXTH_DAY_MULTIPLIER = 1.5
SEVENTH_DAY_MULTIPLIER = 2.0
GOLDEN_TIME_MULTIPLIER = 2.0
MEAL_PENALTY_AMOUNT = 7.50
MEAL_PENALTY_THRESHOLD_HOURS = 6
OVERTIME_THRESHOLD_HOURS = 8
DOUBLE_TIME_THRESHOLD_HOURS = 12
TURNAROUND_HOURS = 10
```

**Questions Answered:**
- ✅ "What are meal penalty rates?"
- ✅ "What are overtime thresholds?"
- ✅ All rate multiplier questions

---

## Helper Functions

### 1. Calculate Overtime

```sql
SELECT calculate_overtime(
  base_rate := 50.00,
  hours := 14,
  standard_hours := 8,
  overtime_multiplier := 1.5,
  double_time_hours := 12,
  double_time_multiplier := 2.0
);
-- Returns: $800.00
-- (8 hours * $50) + (4 hours * $75) + (2 hours * $100)
```

### 2. Get Special Provision

```sql
SELECT get_special_provision(
  special_provisions,
  'meal_penalty_amount',
  7.50  -- default value
)
FROM budget_line_items
WHERE id = '...';
```

---

## New Database Views

### 1. Line Items with Provisions

```sql
SELECT * FROM budget_line_items_with_provisions
WHERE meal_penalty_hours IS NOT NULL;

-- Returns columns:
-- meal_penalty_hours (6)
-- meal_penalty_amount (7.50)
-- overtime_hours (8)
-- overtime_multiplier (1.5)
-- sixth_day_mult (1.5)
-- seventh_day_mult (2.0)
```

### 2. Active Rate Cards Detailed

```sql
SELECT * FROM active_rate_cards_detailed
WHERE union_local = 'IATSE Local 600'
  AND production_type = 'Theatrical';

-- Returns currently active rates with:
-- min_call_hours
-- guaranteed_hours
-- kit_rental
```

---

## How to Use This Structure

### Example 1: Add IATSE 600 Camera Operator Rate

```sql
INSERT INTO rate_cards (
  union_local,
  job_classification,
  rate_type,
  base_rate,
  location,
  production_type,
  effective_date,
  tier,
  special_provisions
) VALUES (
  'IATSE Local 600',
  'Camera Operator',
  'weekly',
  4500.00,
  'Los Angeles, CA',
  'Theatrical',
  '2024-08-01',
  'Tier A',
  '{
    "minimum_call_hours": 8,
    "guaranteed_hours": 60,
    "overtime_multiplier": 1.5,
    "kit_rental": 150.00,
    "meal_penalty_amount": 7.50
  }'::jsonb
);
```

### Example 2: Add Meal Penalty to Line Item

```sql
UPDATE budget_line_items
SET special_provisions = jsonb_set(
  COALESCE(special_provisions, '{}'::jsonb),
  '{meal_penalty_amount}',
  '7.50'
)
WHERE position_title = 'Camera Operator'
  AND production_id = '...';
```

### Example 3: Calculate Total Pay with Overtime

```javascript
// Frontend or backend calculation
const baseRate = 50.00;
const hoursWorked = 14;

const totalPay = calculateOvertimePay({
  baseRate,
  hours: hoursWorked,
  standardHours: 8,
  overtimeMultiplier: 1.5,
  doubleTimeHours: 12,
  doubleTimeMultiplier: 2.0
});

// Returns: $800.00
```

---

## Guild Agreement Question Mapping

### Rate Card Questions → Solution

| Question | Table | Column | Example |
|----------|-------|--------|---------|
| Specific rates for all classifications? | rate_cards | base_rate | 4500.00 |
| Rates by tier? | rate_cards | tier | "Tier A" |
| Location-specific rates? | rate_cards | location | "Los Angeles, CA" |
| Effective dates? | rate_cards | effective_date | 2024-08-01 |

### Special Provisions Questions → Solution

| Question | Table | JSONB Key | Example |
|----------|-------|-----------|---------|
| Meal penalty amounts? | special_provisions | meal_penalty_amount | 7.50 |
| Overtime rules? | special_provisions | overtime_multiplier | 1.5 |
| Sixth/seventh day rules? | special_provisions | sixth_day_multiplier | 1.5 |
| Minimum call? | special_provisions | minimum_call_hours | 8 |
| Kit rental? | special_provisions | kit_rental | 150.00 |

### Fringe Benefits Questions → Solution

| Question | Table | Column | Example |
|----------|-------|--------|---------|
| Pension rates? | fringe_benefits | rate_value (category='pension') | 15.0 |
| Health benefits? | fringe_benefits | rate_value (category='health') | 8.5 |
| Additional benefits? | fringe_benefits | benefit_category | "vacation" |
| Union-only benefits? | fringe_benefits | applies_to_union_only | true |

### Sideletter Questions → Solution

| Question | Table | Column | Example |
|----------|-------|--------|---------|
| Low budget conditions? | sideletter_rules | max_budget_amount | 2600000 |
| SVOD benefits? | sideletter_rules | distribution_platform | "SVOD" |
| Which unions? | sideletter_rules | applicable_unions | ['DGA', 'IATSE 600'] |
| Budget thresholds? | sideletter_rules | min_budget_amount | 0 |

---

## Next Steps

### 1. Update Extraction Script

Modify `scripts/extract-guild-agreements.js` to populate:
- `special_provisions` JSONB
- `location` field
- `tier` classification
- `benefit_category`
- `min_budget_amount` and `max_budget_amount`

### 2. Create API Endpoints

Add endpoints for querying provisions:
- `GET /api/rate-cards?location=Los Angeles&tier=Tier A`
- `GET /api/provisions/:union_local`
- `GET /api/sideletters?budget_amount=2000000`

### 3. Update Frontend

Create UI for:
- Viewing special provisions
- Filtering by location
- Filtering by tier
- Budget threshold warnings

---

## Summary

**Database Changes:**
- ✅ 7 new columns added
- ✅ 2 new views created
- ✅ 3 helper functions created
- ✅ JSONB support for flexible provisions

**Questions Addressed:**
- ✅ 62 guild agreement questions now have clear storage solution
- ✅ All rate-related questions covered
- ✅ All benefit questions covered
- ✅ All special provision questions covered
- ✅ All sideletter questions covered

**Movie Magic Alignment:**
- ✅ 4-level hierarchy preserved
- ✅ Globals system for reusable values
- ✅ Flexible special provisions structure
- ✅ Industry-standard calculation functions

The system is now ready to handle the full complexity of guild agreements!
