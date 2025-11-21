-- Guild Agreement: DGC-Directors-2023-2025-FINAL-DGC-FINAL-approved-Mar.24.2023.pdf
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
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGC-Directors-2023-2025-FINAL-DGC-FINAL-approved-Mar.24.2023.pdf'
);

-- Rate Cards (9 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  12561,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  11325,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  10530,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  8949,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  2,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  2,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  19101,
  NULL,
  'television',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Director',
  'weekly',
  38298,
  NULL,
  'television',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGC',
  'Second Unit Director',
  'weekly',
  12562,
  NULL,
  'theatrical',
  '2023-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Series Bonus',
  'television',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGC',
  'CA',
  'percentage',
  2,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGC',
  'CA',
  'percentage',
  2,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGC',
  'CA',
  'percentage',
  2,
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
