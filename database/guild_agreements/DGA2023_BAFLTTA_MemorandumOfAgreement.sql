-- Guild Agreement: DGA2023_BAFLTTA_MemorandumOfAgreement.pdf
-- Union: DGA
-- Agreement: DGA 2023 Basic Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGA',
  'DGA 2023 Basic Agreement',
  '2023-07-01',
  '2026-06-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGA2023_BAFLTTA_MemorandumOfAgreement.pdf'
);

-- Rate Cards (3 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director',
  'weekly',
  5000,
  NULL,
  'theatrical',
  '2023-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Assistant Director',
  'weekly',
  3000,
  NULL,
  'network_tv',
  '2023-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Production Manager',
  'weekly',
  4000,
  NULL,
  'hb_svod',
  '2023-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Multi-Camera Production Rate',
  'multi-camera',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Single-Camera Production Rate',
  'single-camera',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGA',
  'CA',
  'percentage',
  12,
  '2023-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGA',
  'CA',
  'percentage',
  5,
  '2023-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGA',
  'CA',
  'percentage',
  10,
  '2023-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'DGA',
  'CA',
  'percentage',
  7.65,
  '2023-07-01'
);
