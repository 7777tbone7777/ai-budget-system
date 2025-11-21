-- Guild Agreement: DGA240626Rates2024thru2025.pdf
-- Union: DGA
-- Agreement: DGA Minimum Salary Schedule
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGA',
  'DGA Minimum Salary Schedule',
  '2024-07-01',
  '2025-06-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGA240626Rates2024thru2025.pdf'
);

-- Rate Cards (5 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director - Theatrical Motion Picture',
  'weekly',
  23767,
  NULL,
  'theatrical',
  '2024-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director - Television Network Prime-Time',
  'weekly',
  32642,
  NULL,
  'network_tv',
  '2024-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director - Television Non-Network, Non-Prime-Time',
  'weekly',
  14666,
  NULL,
  'network_tv',
  '2024-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director - High Budget SVOD Programs',
  'weekly',
  18509,
  NULL,
  'hb_svod',
  '2024-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Director - Low Budget SVOD Programs',
  'daily',
  880,
  NULL,
  'hb_svod',
  '2024-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Low Budget Side Letter',
  'theatrical',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Paid Post Production',
  'hb_svod',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGA',
  'CA',
  'percentage',
  8.5,
  '2024-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGA',
  'CA',
  'percentage',
  11,
  '2024-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGA',
  'CA',
  'percentage',
  4,
  '2024-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'DGA',
  'CA',
  'percentage',
  2.5,
  '2024-07-01'
);
