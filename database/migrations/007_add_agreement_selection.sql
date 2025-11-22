-- Migration 007: Add Agreement Selection to Productions
-- Productions need to specify which union agreements they operate under
-- This affects rate calculations, overtime rules, and fringe benefits

-- ============================================================================
-- 1. ADD AGREEMENT COLUMNS TO PRODUCTIONS TABLE
-- ============================================================================

-- Primary agreements by guild/union
ALTER TABLE productions ADD COLUMN IF NOT EXISTS iatse_agreement_id UUID REFERENCES union_agreements(id);
ALTER TABLE productions ADD COLUMN IF NOT EXISTS sag_aftra_agreement_id UUID REFERENCES union_agreements(id);
ALTER TABLE productions ADD COLUMN IF NOT EXISTS dga_agreement_id UUID REFERENCES union_agreements(id);
ALTER TABLE productions ADD COLUMN IF NOT EXISTS wga_agreement_id UUID REFERENCES union_agreements(id);
ALTER TABLE productions ADD COLUMN IF NOT EXISTS teamsters_agreement_id UUID REFERENCES union_agreements(id);

-- Applicable sideletters (auto-determined or manually specified)
ALTER TABLE productions ADD COLUMN IF NOT EXISTS applied_sideletters JSONB DEFAULT '[]';
-- Format: [{"sideletter_id": "uuid", "sideletter_name": "Multi-Camera HB SVOD", "wage_adjustment_pct": -3.0}]

-- Whether this production is signatory (union) or non-union
ALTER TABLE productions ADD COLUMN IF NOT EXISTS is_union_signatory BOOLEAN DEFAULT true;

-- Comments explaining agreement choices
ALTER TABLE productions ADD COLUMN IF NOT EXISTS agreement_notes TEXT;

-- ============================================================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_productions_iatse_agreement ON productions(iatse_agreement_id);
CREATE INDEX IF NOT EXISTS idx_productions_sag_aftra_agreement ON productions(sag_aftra_agreement_id);
CREATE INDEX IF NOT EXISTS idx_productions_dga_agreement ON productions(dga_agreement_id);

-- ============================================================================
-- 3. CREATE PRODUCTION AGREEMENTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW production_agreements AS
SELECT
  p.id as production_id,
  p.name as production_name,
  p.production_type,
  p.distribution_platform,
  p.is_union_signatory,
  -- IATSE Agreement
  ia.id as iatse_agreement_id,
  ia.agreement_type as iatse_agreement_type,
  ia.effective_date_start as iatse_effective_start,
  ia.effective_date_end as iatse_effective_end,
  -- SAG-AFTRA Agreement
  sa.id as sag_aftra_agreement_id,
  sa.agreement_type as sag_aftra_agreement_type,
  sa.effective_date_start as sag_aftra_effective_start,
  sa.effective_date_end as sag_aftra_effective_end,
  -- DGA Agreement
  da.id as dga_agreement_id,
  da.agreement_type as dga_agreement_type,
  da.effective_date_start as dga_effective_start,
  da.effective_date_end as dga_effective_end,
  -- WGA Agreement
  wa.id as wga_agreement_id,
  wa.agreement_type as wga_agreement_type,
  wa.effective_date_start as wga_effective_start,
  wa.effective_date_end as wga_effective_end,
  -- Applied sideletters
  p.applied_sideletters
FROM productions p
LEFT JOIN union_agreements ia ON p.iatse_agreement_id = ia.id
LEFT JOIN union_agreements sa ON p.sag_aftra_agreement_id = sa.id
LEFT JOIN union_agreements da ON p.dga_agreement_id = da.id
LEFT JOIN union_agreements wa ON p.wga_agreement_id = wa.id;

-- ============================================================================
-- 4. CREATE HELPER FUNCTION TO GET APPLICABLE AGREEMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_applicable_agreements(
  p_production_type VARCHAR,
  p_distribution_platform VARCHAR,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  union_name VARCHAR,
  agreement_id UUID,
  agreement_type VARCHAR,
  effective_date_start DATE,
  effective_date_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ua.union_name)
    ua.union_name,
    ua.id,
    ua.agreement_type,
    ua.effective_date_start,
    ua.effective_date_end
  FROM union_agreements ua
  WHERE
    -- Agreement must be active for the production date
    (ua.effective_date_start IS NULL OR ua.effective_date_start <= p_start_date)
    AND (ua.effective_date_end IS NULL OR ua.effective_date_end >= p_start_date)
    -- For major guilds, get their basic/standard agreements
    AND ua.union_name IN ('IATSE', 'SAG-AFTRA', 'DGA', 'WGA', 'Teamsters Local 399')
    AND (
      ua.agreement_type ILIKE '%Basic Agreement%'
      OR ua.agreement_type ILIKE '%Standard Agreement%'
      OR ua.agreement_type ILIKE '%2024%'
    )
  ORDER BY ua.union_name, ua.effective_date_start DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. ENSURE WE HAVE CORE AGREEMENTS (INSERT IF MISSING)
-- ============================================================================

-- IATSE Basic Agreement 2024-2027
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, rules)
SELECT
  gen_random_uuid(),
  'IATSE',
  'IATSE Basic Agreement 2024-2027',
  '2024-08-04',
  '2027-07-31',
  '{
    "wage_increases": [
      {"year": 1, "effective_date": "2024-08-04", "increase_pct": 7.0},
      {"year": 2, "effective_date": "2025-08-04", "increase_pct": 4.0},
      {"year": 3, "effective_date": "2026-08-04", "increase_pct": 3.5}
    ],
    "pension_contribution": 8.0,
    "health_contribution": 8.5,
    "overtime_rules": {
      "daily_ot": "1.5x after 8 hours",
      "double_time": "2x after 12 hours",
      "triple_time": "3x after 15 elapsed hours",
      "sixth_day": "1.5x first 8, 2x after 8",
      "seventh_day": "2x all hours"
    }
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM union_agreements
  WHERE union_name = 'IATSE'
  AND agreement_type = 'IATSE Basic Agreement 2024-2027'
);

-- SAG-AFTRA TV/Theatrical Agreement 2023-2026
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, rules)
SELECT
  gen_random_uuid(),
  'SAG-AFTRA',
  'SAG-AFTRA TV/Theatrical Agreement 2023-2026',
  '2023-11-09',
  '2026-06-30',
  '{
    "wage_increases": [
      {"year": 1, "effective_date": "2023-11-09", "increase_pct": 7.0},
      {"year": 2, "effective_date": "2024-07-01", "increase_pct": 4.0},
      {"year": 3, "effective_date": "2025-07-01", "increase_pct": 3.5}
    ],
    "background_increases": [
      {"year": 1, "effective_date": "2023-11-09", "increase_pct": 11.0}
    ],
    "pension_health_pct": 21.0,
    "digital_replica_rules": "Consent required for all AI/digital replica use"
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM union_agreements
  WHERE union_name = 'SAG-AFTRA'
  AND agreement_type LIKE '%2023-2026%'
);

-- DGA Basic Agreement 2023-2026
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, rules)
SELECT
  gen_random_uuid(),
  'DGA',
  'DGA Basic Agreement 2023-2026',
  '2023-07-01',
  '2026-06-30',
  '{
    "wage_increases": [
      {"year": 1, "effective_date": "2023-07-01", "increase_pct": 5.0},
      {"year": 2, "effective_date": "2024-07-01", "increase_pct": 4.0},
      {"year": 3, "effective_date": "2025-07-01", "increase_pct": 3.5}
    ],
    "pension_contribution": 8.5,
    "health_contribution": 8.5
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM union_agreements
  WHERE union_name = 'DGA'
  AND agreement_type LIKE '%Basic Agreement 2023%'
);

-- WGA Basic Agreement 2023-2026
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, rules)
SELECT
  gen_random_uuid(),
  'WGA',
  'WGA Theatrical and Television Basic Agreement 2023-2026',
  '2023-09-25',
  '2026-05-01',
  '{
    "wage_increases": [
      {"year": 1, "effective_date": "2023-09-25", "increase_pct": 5.0},
      {"year": 2, "effective_date": "2024-05-02", "increase_pct": 4.0},
      {"year": 3, "effective_date": "2025-05-02", "increase_pct": 3.5}
    ],
    "pension_contribution": 8.5,
    "health_contribution": 8.5,
    "ai_disclosure_requirements": true
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM union_agreements
  WHERE union_name = 'WGA'
  AND agreement_type LIKE '%2023-2026%'
);

-- Teamsters Local 399 Agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, rules)
SELECT
  gen_random_uuid(),
  'Teamsters Local 399',
  'Teamsters Local 399 Agreement 2024-2027',
  '2024-08-01',
  '2027-07-31',
  '{
    "wage_increases": [
      {"year": 1, "effective_date": "2024-08-01", "increase_pct": 7.0},
      {"year": 2, "effective_date": "2025-08-01", "increase_pct": 4.0},
      {"year": 3, "effective_date": "2026-08-01", "increase_pct": 3.5}
    ],
    "pension_contribution": 8.0,
    "health_contribution": 9.0
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM union_agreements
  WHERE union_name = 'Teamsters Local 399'
  AND agreement_type LIKE '%2024-2027%'
);

-- ============================================================================
-- 6. ADD UNION_NAME TO SIDELETTER_RULES IF MISSING
-- ============================================================================

ALTER TABLE sideletter_rules ADD COLUMN IF NOT EXISTS union_name VARCHAR(100) DEFAULT 'IATSE';

-- Update existing sideletters to specify union
UPDATE sideletter_rules
SET union_name = 'IATSE'
WHERE union_name IS NULL;

COMMENT ON COLUMN productions.iatse_agreement_id IS 'IATSE agreement governing BTL crew (grips, electric, props, camera, etc.)';
COMMENT ON COLUMN productions.sag_aftra_agreement_id IS 'SAG-AFTRA agreement governing performers/talent';
COMMENT ON COLUMN productions.dga_agreement_id IS 'DGA agreement governing directors and UPMs';
COMMENT ON COLUMN productions.wga_agreement_id IS 'WGA agreement governing writers';
COMMENT ON COLUMN productions.teamsters_agreement_id IS 'Teamsters agreement governing drivers and transportation';
COMMENT ON COLUMN productions.applied_sideletters IS 'JSON array of applicable sideletters with wage adjustments';
COMMENT ON COLUMN productions.is_union_signatory IS 'Whether this production is signatory to union contracts';
