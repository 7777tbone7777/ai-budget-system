-- Guild Agreement: 2024_EPC_ON_Ratebook_SDTV[60].pdf
-- Union: EPC
-- Agreement: 2024 EPC ON Ratebook
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'EPC',
  '2024 EPC ON Ratebook',
  '2024-01-01',
  '2024-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2024_EPC_ON_Ratebook_SDTV[60].pdf'
);

-- Rate Cards (4 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'EPC',
  'Principal Actor',
  'daily',
  882.25,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'EPC',
  'Actor',
  'daily',
  595.5,
  NULL,
  'theatrical',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'EPC',
  'Boom Operator',
  'hourly',
  37.23,
  NULL,
  'network_tv',
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Meal Penalty',
  'all',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Turnaround Time',
  'all',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'EPC',
  'CA',
  'percentage',
  7,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'EPC',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'EPC',
  'CA',
  'percentage',
  4,
  '2024-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'EPC',
  'CA',
  'percentage',
  2.64,
  '2024-01-01'
);
