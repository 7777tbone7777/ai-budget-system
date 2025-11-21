-- Guild Agreement: 2022-2024-CSP-HWO-Contract-Summary-Final-1 (2).pdf
-- Union: Unknown Union
-- Agreement: Craftservice Providers & Honeywagon Operators Contract Summary
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'Unknown Union',
  'Craftservice Providers & Honeywagon Operators Contract Summary',
  '2022-02-02',
  '2024-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2022-2024-CSP-HWO-Contract-Summary-Final-1 (2).pdf'
);

-- Rate Cards (9 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Key',
  'weekly',
  1874.27,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Assistant',
  'weekly',
  1788.15,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Honeywagon Operator',
  'weekly',
  1681.86,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Key',
  'weekly',
  1930.5,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Assistant',
  'weekly',
  1841.8,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Honeywagon Operator',
  'weekly',
  1732.32,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Key',
  'weekly',
  1988.42,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Craftservice Provider - Assistant',
  'weekly',
  1897.05,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Honeywagon Operator',
  'weekly',
  1784.29,
  NULL,
  'theatrical',
  '2022-02-02'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'New Media Rates',
  'webisodes/podcasts/interstitials',
  NULL
);

-- Fringe Benefits (8 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation',
  'Unknown Union',
  'CA',
  'percentage',
  4,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  6,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  5.5,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  5,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  4.5,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  6,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'retirement',
  'Unknown Union',
  'CA',
  'percentage',
  3.5,
  '2022-02-02'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'retirement',
  'Unknown Union',
  'CA',
  'percentage',
  2,
  '2022-02-02'
);
