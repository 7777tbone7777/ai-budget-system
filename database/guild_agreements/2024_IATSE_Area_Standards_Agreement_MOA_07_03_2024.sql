-- Guild Agreement: 2024_IATSE_Area_Standards_Agreement_MOA_07_03_2024.pdf
-- Union: IATSE
-- Agreement: 2024 IATSE Area Standards Agreement MOA
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE',
  '2024 IATSE Area Standards Agreement MOA',
  '2024-08-04',
  '2027-07-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2024_IATSE_Area_Standards_Agreement_MOA_07_03_2024.pdf'
);

-- Rate Cards (7 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Assistant Production Office Coordinator',
  'hourly',
  28.5,
  NULL,
  'theatrical',
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Assistant Production Office Coordinator',
  'hourly',
  30,
  NULL,
  'theatrical',
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Nearby Hire Living Allowance',
  'weekly',
  637,
  NULL,
  NULL,
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Nearby Hire Living Allowance',
  'weekly',
  707,
  NULL,
  NULL,
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Nearby Hire Living Allowance',
  'weekly',
  777,
  NULL,
  NULL,
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Per Diem',
  'daily',
  70,
  NULL,
  NULL,
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE',
  'Per Diem',
  'daily',
  75,
  NULL,
  NULL,
  '2024-08-04'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (3 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'High Budget AVOD or FAST Channel Programs',
  'AVOD or FAST Channel',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Low Budget AVOD or FAST Channel Programs',
  'AVOD or FAST Channel',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Productions Made for Basic Cable or The CW',
  'Basic Cable or The CW',
  NULL
);

-- Fringe Benefits (3 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'IATSE',
  'CA',
  'percentage',
  19,
  '2024-08-04'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE',
  'CA',
  'percentage',
  136,
  '2024-08-04'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'annuity',
  'IATSE',
  'CA',
  'percentage',
  20,
  '2024-08-04'
);
