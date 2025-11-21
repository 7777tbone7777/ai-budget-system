-- Guild Agreement: IATSE 411 2024 PC Rate Sheet.pdf
-- Union: IATSE
-- Agreement: IATSE 411 2024 Contract Summary
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE',
  'IATSE 411 2024 Contract Summary',
  '2024-01-01',
  '2024-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/IATSE 411 2024 PC Rate Sheet.pdf'
);

-- Rate Cards (12 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Coordinator',
  'weekly',
  3345.38,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '1st Assistant Production Coordinator',
  'weekly',
  2515.27,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '2nd Assistant Production Coordinator',
  'weekly',
  1779.12,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Travel Coordinator',
  'weekly',
  2515.27,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Script/Story Coordinator',
  'weekly',
  2176.41,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Assistant',
  'weekly',
  1350.6,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Coordinator',
  'daily',
  669.08,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '1st Assistant Production Coordinator',
  'daily',
  503.05,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '2nd Assistant Production Coordinator',
  'daily',
  355.82,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Travel Coordinator',
  'daily',
  503.05,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Script/Story Coordinator',
  'daily',
  435.28,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Assistant',
  'daily',
  270.12,
  NULL,
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Fringe Benefits (11 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  7,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  6,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE',
  'CA',
  'percentage',
  9,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE',
  'CA',
  'percentage',
  2,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'IATSE',
  'CA',
  'percentage',
  6,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'IATSE',
  'CA',
  'percentage',
  5,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'IATSE',
  'CA',
  'percentage',
  2,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'IATSE',
  'CA',
  'percentage',
  1.75,
  '2024-01-01'
);
