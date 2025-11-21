-- Guild Agreement: Local 600 Rate Sheet.pdf
-- Union: IATSE Local 600
-- Agreement: IATSE Local 600 Rate Sheet
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE Local 600',
  'IATSE Local 600 Rate Sheet',
  '2023-07-31',
  '2024-07-29',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/Local 600 Rate Sheet.pdf'
);

-- Rate Cards (12 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Director of Photography',
  'daily',
  1045.68,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Camera Operator',
  'daily',
  646.32,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Portrait Photographer',
  'daily',
  646.32,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Still Photographer',
  'daily',
  563.36,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  '1st Asst. Photographer',
  'daily',
  56.93,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  '2nd Asst. Photographer',
  'daily',
  52.64,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Technician',
  'daily',
  66.77,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Digital Imaging Technician',
  'daily',
  646.24,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Video Controller (Shader)',
  'daily',
  514.8,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Camera Utility Person',
  'daily',
  490.56,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'IATSE Local 600',
  'Digital Utility Person',
  'daily',
  337.44,
  'Eastern Region',
  'hb_svod',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Special Conditions Sideletter',
  'Pilots & Season 1',
  'hb_svod'
);

-- Fringe Benefits (4 benefits)
