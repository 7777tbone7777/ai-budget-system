-- Guild Agreement: 2023_WGA_mba_moa.pdf
-- Union: WGA
-- Agreement: 2023 Writers Guild of America – Alliance of Motion Picture and Television Producers Theatrical and Television Basic Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'WGA',
  '2023 Writers Guild of America – Alliance of Motion Picture and Television Producers Theatrical and Television Basic Agreement',
  '2023-09-25',
  '2026-05-01',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2023_WGA_mba_moa.pdf'
);

-- Rate Cards (3 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer',
  'weekly',
  10000,
  NULL,
  'theatrical',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer',
  'weekly',
  8000,
  NULL,
  'network_tv',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer',
  'weekly',
  6000,
  NULL,
  'hb_svod',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'High Budget SVOD Programs',
  'SVOD',
  'subscription consumer pay platform'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Development Rooms',
  'television',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'WGA',
  'CA',
  'percentage',
  5,
  '2023-09-25'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'WGA',
  'CA',
  'percentage',
  12,
  '2023-09-25'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'WGA',
  'CA',
  'percentage',
  10,
  '2023-09-25'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'WGA',
  'CA',
  'percentage',
  7.65,
  '2023-09-25'
);
