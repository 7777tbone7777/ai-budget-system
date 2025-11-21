-- Migration 005: Enhance tax_incentives table for detailed state incentive data
-- Adds support for:
-- - Detailed labor rates (ATL/BTL, Resident/Non-Resident)
-- - Qualified spend percentages
-- - Multiple caps (minimum, project, annual, compensation)
-- - Uplifts (VFX, local hire, veteran-owned, etc.)
-- - Additional requirements and details

BEGIN;

-- Drop old simplified table
DROP TABLE IF EXISTS tax_incentives CASCADE;

-- Create enhanced tax_incentives table
CREATE TABLE tax_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location
  state VARCHAR(100) NOT NULL,
  country VARCHAR(50) DEFAULT 'US',

  -- Incentive basics
  incentive_name VARCHAR(200),
  incentive_min_percent DECIMAL(5,2),
  incentive_max_percent DECIMAL(5,2),
  incentive_type VARCHAR(50),  -- 'Refundable', 'Transferable', 'Non-Transferable'
  incentive_mechanism VARCHAR(50),  -- 'Tax Credit', 'Rebate', 'Grant'

  -- Labor rates
  resident_atl_percent DECIMAL(5,2),
  resident_btl_percent DECIMAL(5,2),
  non_resident_atl_percent DECIMAL(5,2),
  non_resident_btl_percent DECIMAL(5,2),

  -- Qualified spend
  qualified_spend_percent DECIMAL(5,2),

  -- Minimums and Caps
  minimum_spend DECIMAL(15,2),
  project_cap DECIMAL(15,2),
  annual_cap DECIMAL(15,2),
  compensation_cap DECIMAL(15,2),

  -- Uplifts
  labor_uplifts TEXT,
  spend_uplifts TEXT,

  -- Additional details
  requirements JSONB,
  restrictions TEXT,
  application_process TEXT,

  -- Dates
  effective_date_start DATE,
  effective_date_end DATE,
  sunset_date DATE,

  -- Source and metadata
  source VARCHAR(200) DEFAULT 'Entertainment Partners Production Incentive Guide',
  extracted_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tax_incentives_state ON tax_incentives(state);
CREATE INDEX idx_tax_incentives_country ON tax_incentives(country);
CREATE INDEX idx_tax_incentives_effective_dates ON tax_incentives(effective_date_start, effective_date_end);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_incentives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_incentives_updated_at
BEFORE UPDATE ON tax_incentives
FOR EACH ROW
EXECUTE FUNCTION update_tax_incentives_updated_at();

COMMIT;
