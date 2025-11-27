-- Migration: Add Custom Sideletter Support
-- Created: 2025-11-27
-- Description: Allows productions to create and store custom sideletter agreements
--              that override or supplement standard sideletter rules

-- =====================================================
-- CUSTOM SIDELETTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_sideletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  -- Base information
  sideletter_name VARCHAR(255) NOT NULL,
  based_on_standard_id UUID REFERENCES sideletter_rules(id), -- If cloned from standard
  union_name VARCHAR(100) NOT NULL, -- IATSE, SAG-AFTRA, DGA, WGA, Teamsters

  -- Custom terms
  wage_adjustment_pct DECIMAL(5,2) DEFAULT 0, -- e.g., -20.00 for 20% reduction
  holiday_pay_pct DECIMAL(5,2) DEFAULT 0,
  vacation_pay_pct DECIMAL(5,2) DEFAULT 0,
  pension_pct DECIMAL(5,2),
  health_welfare_pct DECIMAL(5,2),

  -- Custom rules (JSONB for flexibility)
  overtime_rules JSONB, -- Custom overtime formulas
  meal_penalty_rules JSONB, -- Custom meal penalty terms
  turnaround_rules JSONB, -- Custom turnaround requirements
  location_provisions JSONB, -- Distant location, per diem, etc.

  -- Approval tracking
  negotiated_by VARCHAR(255), -- Name of labor relations person
  negotiated_date DATE,
  union_approved BOOLEAN DEFAULT false,
  union_approval_date DATE,
  union_contact VARCHAR(255),

  -- Documentation
  agreement_notes TEXT,
  document_url TEXT, -- Link to signed sideletter PDF

  -- Audit trail
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX idx_custom_sideletters_production ON custom_sideletters(production_id);
CREATE INDEX idx_custom_sideletters_union ON custom_sideletters(union_name);
CREATE INDEX idx_custom_sideletters_active ON custom_sideletters(is_active);

-- =====================================================
-- UPDATE PRODUCTIONS TABLE
-- =====================================================
-- Add column to track which custom sideletters are applied to a production
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS custom_sideletters JSONB DEFAULT '[]'::jsonb;

-- Add column to indicate if production uses any custom agreements
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS has_custom_agreements BOOLEAN DEFAULT false;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE custom_sideletters IS 'Production-specific custom sideletter agreements that override or supplement standard union sideletters';
COMMENT ON COLUMN custom_sideletters.based_on_standard_id IS 'Reference to standard sideletter this was cloned from (if any)';
COMMENT ON COLUMN custom_sideletters.union_approved IS 'Whether the union has formally approved this custom agreement';
COMMENT ON COLUMN custom_sideletters.agreement_notes IS 'Free-form notes about negotiation, special provisions, or implementation guidance';
COMMENT ON COLUMN productions.custom_sideletters IS 'Array of custom sideletter IDs applied to this production';
COMMENT ON COLUMN productions.has_custom_agreements IS 'Flag indicating production uses custom agreements (for reporting/audit purposes)';

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- This section can be commented out for production deployment

-- Example: Custom IATSE sideletter for a specific production
-- INSERT INTO custom_sideletters (
--   production_id,
--   sideletter_name,
--   union_name,
--   wage_adjustment_pct,
--   holiday_pay_pct,
--   vacation_pay_pct,
--   negotiated_by,
--   negotiated_date,
--   agreement_notes
-- ) VALUES (
--   (SELECT id FROM productions LIMIT 1), -- Replace with actual production_id
--   'Custom IATSE Agreement - Project Alpha',
--   'IATSE',
--   -15.00, -- 15% wage reduction
--   8.00,   -- 8% holiday pay
--   6.00,   -- 6% vacation pay
--   'Jane Doe - Labor Relations',
--   '2025-11-15',
--   'Negotiated custom terms due to extended shooting schedule and remote location. Union Local 80 approved 11/20/2025.'
-- );

-- =====================================================
-- ROLLBACK SCRIPT (for reference)
-- =====================================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS custom_sideletters CASCADE;
-- ALTER TABLE productions DROP COLUMN IF EXISTS custom_sideletters;
-- ALTER TABLE productions DROP COLUMN IF EXISTS has_custom_agreements;
