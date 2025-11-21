-- Guild Agreement: PRIVILEGED - MSK 2023 WGA MOA Summary(15888461.3).pdf
-- Union: WGA
-- Agreement: 2023 Writers Guild of America Memorandum of Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'WGA',
  '2023 Writers Guild of America Memorandum of Agreement',
  '2023-09-25',
  '2026-05-01',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/PRIVILEGED - MSK 2023 WGA MOA Summary(15888461.3).pdf'
);

-- Rate Cards (3 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer',
  'weekly',
  200000,
  NULL,
  NULL,
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer-Producer (Lower Tier)',
  'weekly',
  5,
  NULL,
  'series, serials, mini-series',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'WGA',
  'Writer-Producer (Higher Tier)',
  'weekly',
  9.5,
  NULL,
  'series, serials, mini-series',
  '2023-09-25'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Minimum Staffing Requirements for Writers Before a Series is Green-Lit',
  'series, serial, mini-series',
  'SVOD'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Minimum Staffing Requirements for Writers After a Season Order',
  'series, serial, mini-series',
  NULL
);

-- Fringe Benefits (2 benefits)
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
  'pension',
  'WGA',
  'CA',
  'percentage',
  0.5,
  '2023-09-25'
);
