-- Guild Agreement: IATSE 411 2024 PC Agreement - MASTER FILLABLE.pdf
-- Union: IATSE
-- Agreement: I.A.T.S.E. Local 411 Production Coordinators Collective Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE',
  'I.A.T.S.E. Local 411 Production Coordinators Collective Agreement',
  '2024-01-01',
  '2024-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/IATSE 411 2024 PC Agreement - MASTER FILLABLE.pdf'
);

-- Rate Cards (6 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Coordinator',
  'weekly',
  3345.38,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '1st Assistant Production Coordinator',
  'weekly',
  2515.27,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  '2nd Assistant Production Coordinator',
  'weekly',
  1779.12,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Travel Coordinator',
  'weekly',
  2515.27,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Script/Story Coordinator',
  'weekly',
  2176.41,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Production Assistant',
  'weekly',
  1350.6,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Fringe Benefits (4 benefits)
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
  'health',
  'IATSE',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  7,
  '2024-01-01'
);
