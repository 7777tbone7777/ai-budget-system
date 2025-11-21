-- Guild Agreement: 2024-Casting-Directors-MOA-2024-09-30-00324386xBE9D7.pdf
-- Union: Teamsters Local 399/IATSE Local 817
-- Agreement: 2024 Casting Directors Memorandum of Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'Teamsters Local 399/IATSE Local 817',
  '2024 Casting Directors Memorandum of Agreement',
  '2024-10-01',
  '2027-09-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2024-Casting-Directors-MOA-2024-09-30-00324386xBE9D7.pdf'
);

-- Rate Cards (5 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Teamsters Local 399/IATSE Local 817',
  'Casting Director',
  'weekly',
  7000,
  'New York, NY or Los Angeles, CA',
  'theatrical|svod',
  '2024-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Teamsters Local 399/IATSE Local 817',
  'Casting Director (Children''s Programming)',
  'weekly',
  5850,
  'New York, NY or Los Angeles, CA',
  'theatrical|svod',
  '2024-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Teamsters Local 399/IATSE Local 817',
  'Casting Director (Subsequent Episodes)',
  'weekly',
  4500,
  'New York, NY or Los Angeles, CA',
  'theatrical|svod',
  '2024-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Teamsters Local 399/IATSE Local 817',
  'Associate Casting Director',
  'weekly',
  2210,
  'New York, NY or Los Angeles, CA',
  'theatrical|svod',
  '2024-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Teamsters Local 399/IATSE Local 817',
  'Casting Assistant',
  'hourly',
  21,
  'New York, NY or Los Angeles, CA',
  NULL,
  '2024-10-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Casting Directors on Multi-Camera Series',
  'multi-camera',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'Teamsters Local 399/IATSE Local 817',
  'CA',
  'percentage',
  1.8,
  '2024-10-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Teamsters Local 399/IATSE Local 817',
  'CA',
  'percentage',
  4.51,
  '2024-10-01'
);
