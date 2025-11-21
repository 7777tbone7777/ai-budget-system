-- Migration 005: Add Multi-Period Time Tracking
-- Professional budgets break costs into Prep/Shoot/Hiatus/Wrap/Holiday
-- Based on analysis of 33 real production budgets

-- Add periods column to budget_line_items
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS periods JSONB DEFAULT '{
  "prep": {"days": 0, "hours_per_day": 0, "rate": 0},
  "shoot": {"days": 0, "hours_per_day": 0, "rate": 0},
  "hiatus": {"days": 0, "hours_per_day": 0, "rate": 0},
  "wrap": {"days": 0, "hours_per_day": 0, "rate": 0},
  "holiday": {"days": 0, "hours_per_day": 0, "rate": 0}
}';

-- Add box rental column for equipment/computer rentals with caps
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS box_rental JSONB DEFAULT '{
  "weekly_rate": 0,
  "weeks": 0,
  "cap_amount": 1000,
  "total": 0,
  "capped_total": 0
}';

-- Add use_periods flag to indicate if this line item uses period breakdown
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS use_periods BOOLEAN DEFAULT false;

-- Add use_box_rental flag
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS use_box_rental BOOLEAN DEFAULT false;

-- Create helper function to calculate period total
CREATE OR REPLACE FUNCTION calculate_period_total(periods JSONB)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC := 0;
  period_name TEXT;
  period_data JSONB;
BEGIN
  -- Loop through each period (prep, shoot, hiatus, wrap, holiday)
  FOR period_name IN SELECT jsonb_object_keys(periods)
  LOOP
    period_data := periods->period_name;

    -- Calculate: days × hours_per_day × rate
    total := total + (
      COALESCE((period_data->>'days')::NUMERIC, 0) *
      COALESCE((period_data->>'hours_per_day')::NUMERIC, 0) *
      COALESCE((period_data->>'rate')::NUMERIC, 0)
    );
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create helper function to calculate box rental with cap
CREATE OR REPLACE FUNCTION calculate_box_rental(box_rental JSONB)
RETURNS NUMERIC AS $$
DECLARE
  weekly_rate NUMERIC;
  weeks NUMERIC;
  cap_amount NUMERIC;
  total NUMERIC;
BEGIN
  weekly_rate := COALESCE((box_rental->>'weekly_rate')::NUMERIC, 0);
  weeks := COALESCE((box_rental->>'weeks')::NUMERIC, 0);
  cap_amount := COALESCE((box_rental->>'cap_amount')::NUMERIC, 1000);

  total := weekly_rate * weeks;

  -- Apply cap
  IF total > cap_amount THEN
    RETURN cap_amount;
  ELSE
    RETURN total;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for line items with calculated period totals
CREATE OR REPLACE VIEW budget_line_items_with_periods AS
SELECT
  bli.*,
  CASE
    WHEN bli.use_periods THEN calculate_period_total(bli.periods)
    ELSE bli.subtotal
  END as calculated_subtotal,
  CASE
    WHEN bli.use_box_rental THEN calculate_box_rental(bli.box_rental)
    ELSE 0
  END as calculated_box_rental
FROM budget_line_items bli;

-- Add comment
COMMENT ON COLUMN budget_line_items.periods IS 'Multi-period breakdown: prep/shoot/hiatus/wrap/holiday with days, hours, rate per period';
COMMENT ON COLUMN budget_line_items.box_rental IS 'Box rental (equipment/computer) with weekly rate, weeks, and cap amount';
COMMENT ON FUNCTION calculate_period_total IS 'Calculates total cost from period breakdown: SUM(days × hours × rate) across all periods';
COMMENT ON FUNCTION calculate_box_rental IS 'Calculates box rental with automatic cap application';
