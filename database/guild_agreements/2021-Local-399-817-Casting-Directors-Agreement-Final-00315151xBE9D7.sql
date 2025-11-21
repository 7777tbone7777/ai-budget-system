-- Guild Agreement: 2021-Local-399-817-Casting-Directors-Agreement-Final-00315151xBE9D7.pdf
-- Union: IATSE Local 399
-- Agreement: 2021 Local 399 & 817 Casting Directors Agreement
-- Extracted: 2025-11-21
-- Confidence: HIGH

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE Local 399',
  '2021 Local 399 & 817 Casting Directors Agreement',
  '2021-10-01',
  '2024-09-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2021-Local-399-817-Casting-Directors-Agreement-Final-00315151xBE9D7.pdf'
);

-- Rate Cards (4 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 399',
  'Casting Director',
  'weekly',
  3080,
  'New York, Los Angeles',
  'theatrical',
  '2021-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 399',
  'Casting Director',
  'weekly',
  2550,
  'New York, Los Angeles',
  'television',
  '2021-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 399',
  'Associate Casting Director',
  'weekly',
  1000,
  'New York, Los Angeles',
  'theatrical',
  '2021-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 399',
  'Associate Casting Director',
  'hourly',
  19,
  'New York, Los Angeles',
  'television',
  '2021-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Casting Directors in Episodic Television',
  'episodic television',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Casting Directors on Multi-Camera Series',
  'multi-camera series',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'IATSE Local 399',
  'CA',
  'percentage',
  1.8065,
  '2021-10-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'IATSE Local 399',
  'CA',
  'percentage',
  4.513,
  '2021-10-01'
);
