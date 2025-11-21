-- Guild Agreement: DGA-BasicAgreement2020-2023.pdf
-- Union: DGA
-- Agreement: Directors Guild of America Basic Agreement of 2020
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGA',
  'Directors Guild of America Basic Agreement of 2020',
  '2020-07-01',
  '2023-06-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGA-BasicAgreement2020-2023.pdf'
);

-- Rate Cards (6 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Freelance Director',
  'weekly',
  12954,
  NULL,
  'theatrical',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Low Budget Director',
  'weekly',
  12954,
  NULL,
  'theatrical',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Medium Budget Director',
  'weekly',
  14723,
  NULL,
  'theatrical',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'High Budget Director',
  'weekly',
  20616,
  NULL,
  'theatrical',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Network Prime Time Director (1 hour)',
  'weekly',
  48318,
  NULL,
  'network_tv',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Network Prime Time Director (½ hour)',
  'weekly',
  28452,
  NULL,
  'network_tv',
  '2020-07-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (3 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Virtual MVPDs',
  NULL,
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Over-the-Top Delivery of Pay Television Services',
  NULL,
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'New Residual Formula for One-Hour Network Prime Time Dramatic Series',
  'network_tv',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGA',
  'CA',
  'percentage',
  0.5,
  '2020-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGA',
  'CA',
  'percentage',
  0.5,
  '2020-07-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGA',
  'CA',
  'percentage',
  750,
  '2020-07-01'
);
