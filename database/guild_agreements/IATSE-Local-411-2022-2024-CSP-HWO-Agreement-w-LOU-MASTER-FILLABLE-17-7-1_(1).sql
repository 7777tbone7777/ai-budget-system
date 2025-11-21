-- Guild Agreement: IATSE-Local-411-2022-2024-CSP-HWO-Agreement-w-LOU-MASTER-FILLABLE-17-7-1 (1).pdf
-- Union: IATSE Local 411
-- Agreement: Craftservice Providers and Honeywagon Operators Collective Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE Local 411',
  'Craftservice Providers and Honeywagon Operators Collective Agreement',
  '2022-02-02',
  '2024-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/IATSE-Local-411-2022-2024-CSP-HWO-Agreement-w-LOU-MASTER-FILLABLE-17-7-1 (1).pdf'
);

-- Rate Cards (4 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 411',
  'Craftservice Provider - Key',
  'weekly',
  1874.27,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 411',
  'Craftservice Provider - Assistant',
  'weekly',
  1788.15,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 411',
  'Honeywagon Operator - Tier A',
  'weekly',
  1681.86,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 411',
  'Honeywagon Operator - Tier B',
  'weekly',
  1615.89,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Productions Made for New Media',
  'new_media',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE Local 411',
  'CA',
  'percentage',
  4,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE Local 411',
  'CA',
  'percentage',
  6,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'retirement',
  'IATSE Local 411',
  'CA',
  'percentage',
  3.5,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'IATSE Local 411',
  'CA',
  'percentage',
  0.5,
  '2022-02-02'
);
