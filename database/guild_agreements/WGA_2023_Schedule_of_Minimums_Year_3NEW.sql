-- Guild Agreement: WGA 2023_Schedule_of_Minimums_Year_3NEW.pdf
-- Union: WGA
-- Agreement: WGA 2023 Theatrical and Television Basic Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'WGA',
  'WGA 2023 Theatrical and Television Basic Agreement',
  '2023-09-25',
  '2026-05-01',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/WGA 2023_Schedule_of_Minimums_Year_3NEW.pdf'
);

-- Rate Cards (4 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Original Screenplay, Including Treatment (High Budget)',
  'weekly',
  160084,
  NULL,
  'theatrical',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Original Screenplay, Including Treatment (Low Budget)',
  'weekly',
  85281,
  NULL,
  'theatrical',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Teleplay (30 minutes or less)',
  'weekly',
  21389,
  NULL,
  'network_tv',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Teleplay (60 minutes or less)',
  'weekly',
  28858,
  NULL,
  'network_tv',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'High Budget SVOD Programs',
  'SVOD',
  'Various'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'High Budget AVOD Programs',
  'AVOD',
  'Various'
);

-- Fringe Benefits (3 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'WGA',
  'CA',
  'percentage',
  11.25,
  '2023-09-25'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'WGA',
  'CA',
  'percentage',
  11.5,
  '2023-09-25'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'WGA',
  'CA',
  'percentage',
  0.5,
  '2023-09-25'
);
