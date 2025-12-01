/**
 * Migration 006: Chart of Accounts (COA) System
 *
 * Allows users to choose different account code structures (COAs) when creating productions.
 * Different studios/companies use different COA formats:
 * - Standard Film/TV (Movie Magic default)
 * - AICP (Advertising/Commercials)
 * - Studio-specific (Netflix, Disney, Warner Bros, etc.)
 *
 * This ensures sequential account codes within departments.
 */

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create account_code_structure table (defines the structure for each COA)
CREATE TABLE IF NOT EXISTS account_code_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coa_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  category_code VARCHAR(10) NOT NULL, -- e.g., "10", "20", "33"
  category_name VARCHAR(100) NOT NULL, -- e.g., "Story & Rights", "Production Staff", "Camera"
  sort_order INTEGER DEFAULT 0,
  is_above_the_line BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add coa_id to productions table
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS coa_id UUID REFERENCES chart_of_accounts(id);

-- Add account_code to production_type_crews table
ALTER TABLE production_type_crews
ADD COLUMN IF NOT EXISTS account_code VARCHAR(10);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_account_code_structure_coa ON account_code_structure(coa_id);
CREATE INDEX IF NOT EXISTS idx_productions_coa ON productions(coa_id);
CREATE INDEX IF NOT EXISTS idx_production_type_crews_account_code ON production_type_crews(account_code);

-- Insert standard COAs
INSERT INTO chart_of_accounts (name, description, is_default, is_active) VALUES
('Standard Film/TV', 'Industry-standard COA used by Movie Magic Budgeting, EP Budgeting, and most productions', true, true),
('AICP', 'AICP COA for commercials and advertising production', false, true),
('Netflix', 'Netflix custom COA structure', false, true),
('Disney', 'Disney/ABC custom COA structure', false, true);

-- Get the Standard Film/TV COA ID for reference
DO $$
DECLARE
  standard_coa_id UUID;
BEGIN
  SELECT id INTO standard_coa_id FROM chart_of_accounts WHERE name = 'Standard Film/TV';

  -- Insert Standard Film/TV account structure
  INSERT INTO account_code_structure (coa_id, category_code, category_name, sort_order, is_above_the_line) VALUES
  (standard_coa_id, '10', 'Story & Rights', 10, true),
  (standard_coa_id, '11', 'ATL - Producers', 11, true),
  (standard_coa_id, '12', 'ATL - Director', 12, true),
  (standard_coa_id, '13', 'ATL - Cast', 13, true),
  (standard_coa_id, '14', 'ATL - Travel & Living', 14, true),
  (standard_coa_id, '20', 'Production Staff', 20, false),
  (standard_coa_id, '21', 'Extra Talent', 21, false),
  (standard_coa_id, '22', 'Art Department', 22, false),
  (standard_coa_id, '23', 'Set Construction', 23, false),
  (standard_coa_id, '24', 'Set Operations', 24, false),
  (standard_coa_id, '25', 'Grip', 25, false),
  (standard_coa_id, '26', 'Property', 26, false),
  (standard_coa_id, '27', 'Set Dressing', 27, false),
  (standard_coa_id, '29', 'Wardrobe', 29, false),
  (standard_coa_id, '30', 'Makeup', 30, false),
  (standard_coa_id, '31', 'Hair', 31, false),
  (standard_coa_id, '32', 'Electric', 32, false),
  (standard_coa_id, '33', 'Camera', 33, false),
  (standard_coa_id, '34', 'Sound', 34, false),
  (standard_coa_id, '35', 'Transportation', 35, false),
  (standard_coa_id, '36', 'Location', 36, false),
  (standard_coa_id, '38', 'Special Effects', 38, false),
  (standard_coa_id, '40', 'Stunts', 40, false),
  (standard_coa_id, '42', 'Editorial', 42, false),
  (standard_coa_id, '43', 'Post Production', 43, false),
  (standard_coa_id, '44', 'Music', 44, false),
  (standard_coa_id, '45', 'Post Audio', 45, false),
  (standard_coa_id, '50', 'Fringes', 50, false),
  (standard_coa_id, '60', 'Insurance', 60, false),
  (standard_coa_id, '65', 'General Expenses', 65, false),
  (standard_coa_id, '70', 'Publicity', 70, false),
  (standard_coa_id, '90', 'Indirect Costs', 90, false);
END $$;

-- Insert AICP account structure
DO $$
DECLARE
  aicp_coa_id UUID;
BEGIN
  SELECT id INTO aicp_coa_id FROM chart_of_accounts WHERE name = 'AICP';

  -- AICP uses different category codes
  INSERT INTO account_code_structure (coa_id, category_code, category_name, sort_order, is_above_the_line) VALUES
  (aicp_coa_id, '01', 'Pre-Production & Wrap Labor', 1, false),
  (aicp_coa_id, '02', 'Shooting Labor', 2, false),
  (aicp_coa_id, '03', 'Location & Travel Expenses', 3, false),
  (aicp_coa_id, '04', 'Props, Wardrobe & Animals', 4, false),
  (aicp_coa_id, '05', 'Studio & Set Construction', 5, false),
  (aicp_coa_id, '06', 'Equipment', 6, false),
  (aicp_coa_id, '07', 'Film & Lab', 7, false),
  (aicp_coa_id, '08', 'Miscellaneous', 8, false),
  (aicp_coa_id, '09', 'Director/Creative Fees', 9, true),
  (aicp_coa_id, '10', 'Editorial & Finishing', 10, false),
  (aicp_coa_id, '11', 'Post Production Sound', 11, false),
  (aicp_coa_id, '12', 'Music', 12, false),
  (aicp_coa_id, '13', 'Talent', 13, false),
  (aicp_coa_id, '14', 'Insurance & Benefits', 14, false);
END $$;

COMMENT ON TABLE chart_of_accounts IS 'Different Chart of Accounts structures (Standard, AICP, Studio-specific)';
COMMENT ON TABLE account_code_structure IS 'Category codes and names for each COA';
COMMENT ON COLUMN productions.coa_id IS 'Chart of Accounts to use for this production';
COMMENT ON COLUMN production_type_crews.account_code IS 'Account code for this position (assigned based on COA and sort_order)';
