-- Guild Agreement: DGC-Ontario-Standard-Agreement-2023-2025-June-5.pdf
-- Union: DGC
-- Agreement: DGC/CMPA Standard Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGC',
  'DGC/CMPA Standard Agreement',
  '2023-01-01',
  '2025-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGC-Ontario-Standard-Agreement-2023-2025-June-5.pdf'
);

-- Rate Cards (8 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Production Manager',
  'daily',
  1108,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Assistant Production Manager',
  'daily',
  775,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'First Assistant Director',
  'daily',
  1054.25,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Second Assistant Director',
  'daily',
  775,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Third Assistant Director',
  'daily',
  504,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Production Designer',
  'daily',
  1336.25,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Picture Editor',
  'daily',
  1055.5,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Sound Editor',
  'daily',
  936.75,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Tier A Television Series Incentives',
  'television',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Fact Based/Lifestyle/Docu-Drama Production',
  'fact_based',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGC',
  'CA',
  'percentage',
  6,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGC',
  'CA',
  'percentage',
  5,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGC',
  'CA',
  'percentage',
  4,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'DGC',
  'CA',
  'percentage',
  2,
  '2023-01-01'
);
