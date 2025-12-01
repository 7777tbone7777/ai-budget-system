-- =====================================================
-- FIX MIGRATION 002: Add Legacy Columns for Auto-Generate Compatibility
-- =====================================================
-- This adds back legacy columns to budget_line_items to maintain
-- compatibility with the auto-generate budget feature until it's
-- refactored to use the full 4-level hierarchy
-- =====================================================

-- Add legacy columns to budget_line_items for backward compatibility
ALTER TABLE budget_line_items
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS fringes DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS total DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS atl_or_btl VARCHAR(10);

-- Add index for account_code ordering
CREATE INDEX IF NOT EXISTS idx_budget_line_items_account_code ON budget_line_items(account_code);

-- Add comments
COMMENT ON COLUMN budget_line_items.account_code IS 'Legacy column for backward compatibility with auto-generate feature';
COMMENT ON COLUMN budget_line_items.subtotal IS 'Legacy column - duplicates current_subtotal';
COMMENT ON COLUMN budget_line_items.fringes IS 'Legacy column - duplicates current_fringe';
COMMENT ON COLUMN budget_line_items.total IS 'Legacy column - duplicates current_total';
COMMENT ON COLUMN budget_line_items.atl_or_btl IS 'Legacy column - Above/Below the Line classification';

-- =====================================================
-- Migration complete!
-- =====================================================
