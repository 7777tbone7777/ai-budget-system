-- =====================================================
-- MIGRATION 004B: Fix Production Type Crews Schema
-- =====================================================
-- The table exists but has wrong schema
-- Drop and recreate with correct structure
-- =====================================================

-- Drop existing table (will lose 42 single_camera positions, but we'll replace with theatrical)
DROP TABLE IF EXISTS production_type_crews CASCADE;

-- Create production_type_crews table with CORRECT schema
CREATE TABLE production_type_crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Production type this template applies to
  production_type VARCHAR(50) NOT NULL, -- 'theatrical', 'single_camera', 'multi_camera', 'commercial', etc.

  -- Budget range this template is for (for scaling)
  min_budget DECIMAL(15,2), -- Minimum budget this template applies to
  max_budget DECIMAL(15,2), -- Maximum budget this template applies to

  -- Position details
  position_title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL, -- 'Camera', 'Grip', 'Electric', 'Art', 'Production', etc.
  union_local VARCHAR(100), -- 'IATSE 600', 'IATSE 728', 'DGA', etc.

  -- Typical work days for this position
  typical_prep_days INTEGER DEFAULT 0, -- Days before principal photography
  typical_shoot_days INTEGER, -- Days during principal photography
  typical_wrap_days INTEGER DEFAULT 0, -- Days after principal photography

  -- Number of this position typically needed
  typical_quantity INTEGER DEFAULT 1, -- e.g., 2 ACs, 3 grips, etc.

  -- Pay structure
  typical_rate_type VARCHAR(50) DEFAULT 'weekly', -- 'weekly', 'daily', 'hourly', 'flat'

  -- Fringe estimates
  typical_fringe_rate DECIMAL(5,2) DEFAULT 32.00, -- Default 32%

  -- Metadata
  sort_order INTEGER DEFAULT 0, -- For ordering within department
  is_essential BOOLEAN DEFAULT true, -- True = always include, False = budget-dependent
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prod_crews_type ON production_type_crews(production_type);
CREATE INDEX IF NOT EXISTS idx_prod_crews_budget ON production_type_crews(min_budget, max_budget);
CREATE INDEX IF NOT EXISTS idx_prod_crews_dept ON production_type_crews(department);
CREATE INDEX IF NOT EXISTS idx_prod_crews_essential ON production_type_crews(is_essential);

-- Add comments
COMMENT ON TABLE production_type_crews IS 'Template crew positions for different production types and budget ranges';
COMMENT ON COLUMN production_type_crews.production_type IS 'Type of production: theatrical, single_camera, multi_camera, commercial, etc.';
COMMENT ON COLUMN production_type_crews.min_budget IS 'Minimum budget this template applies to (NULL = no minimum)';
COMMENT ON COLUMN production_type_crews.max_budget IS 'Maximum budget this template applies to (NULL = no maximum)';
COMMENT ON COLUMN production_type_crews.is_essential IS 'Always include this position regardless of budget constraints';

-- =====================================================
-- Migration complete!
-- =====================================================
