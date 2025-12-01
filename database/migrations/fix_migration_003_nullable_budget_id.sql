-- =====================================================
-- FIX MIGRATION 003: Make budget_id Nullable for Legacy Compatibility
-- =====================================================
-- The auto-generate feature doesn't create budget_metadata records,
-- so we need to make budget_id nullable for backward compatibility
-- =====================================================

-- Make budget_id nullable in budget_line_items
ALTER TABLE budget_line_items
  ALTER COLUMN budget_id DROP NOT NULL;

-- Add comment explaining this is temporary
COMMENT ON COLUMN budget_line_items.budget_id IS 'Foreign key to budget_metadata - nullable for legacy auto-generate compatibility';

-- =====================================================
-- Migration complete!
-- =====================================================
