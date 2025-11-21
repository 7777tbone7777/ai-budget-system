-- Guild Agreement: 2021 IATSE Local 873 Long Term Agreement - July 20, 2021 (FINAL) (00249683xBE9D7).pdf
-- Union: IATSE Local 873
-- Agreement: 2021 IATSE Local 873 Long Term Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE Local 873',
  '2021 IATSE Local 873 Long Term Agreement',
  '2021-04-01',
  '2024-03-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2021 IATSE Local 873 Long Term Agreement - July 20, 2021 (FINAL) (00249683xBE9D7).pdf'
);

-- Rate Cards (6 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 873',
  'Head Carpenter/On-set Carp',
  'daily',
  51.39,
  NULL,
  'theatrical',
  '2021-04-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 873',
  'Assistant Head Carpenter',
  'daily',
  49.06,
  NULL,
  'theatrical',
  '2021-04-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 873',
  'Carpenter',
  'daily',
  48.12,
  NULL,
  'theatrical',
  '2021-04-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 873',
  'Boom Operator',
  'daily',
  51.39,
  NULL,
  'theatrical',
  '2021-04-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 873',
  'Production Labourer',
  'daily',
  35.59,
  NULL,
  'theatrical',
  '2021-04-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (3 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Meals on an Overnight Location',
  'television',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Parking in the Toronto Central Core',
  'television',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Safety and Training',
  'all',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'IATSE Local 873',
  'CA',
  'percentage',
  7,
  '2021-04-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE Local 873',
  'CA',
  'percentage',
  4,
  '2021-04-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE Local 873',
  'CA',
  'percentage',
  8,
  '2021-04-01'
);
