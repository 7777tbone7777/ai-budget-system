-- Guild Agreement: 600 Rate Card 2023 to 2024 (V4).pdf
-- Union: Unknown Union
-- Agreement: Basic Agreement Amendment Agreement Inside and Outside 'The Corridor' and Videotape Supplemental Agreement Wages, Schedules, and Conditions
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'Unknown Union',
  'Basic Agreement Amendment Agreement Inside and Outside ''The Corridor'' and Videotape Supplemental Agreement Wages, Schedules, and Conditions',
  '2023-07-31',
  '2024-07-29',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/600 Rate Card 2023 to 2024 (V4).pdf'
);

-- Rate Cards (18 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Director of Photography',
  'daily',
  1088.7,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Operator',
  'daily',
  851.52,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Still Photographer',
  'daily',
  677.5,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  '1st Asst. Photographer',
  'daily',
  560.91,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  '2nd Asst. Photographer',
  'daily',
  444.17,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Digital Imaging Technician',
  'daily',
  646.24,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Video Controller (Shader)',
  'daily',
  514.8,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Utility Person',
  'daily',
  490.56,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Digital Utility Person',
  'daily',
  337.44,
  'Inside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Director of Photography',
  'daily',
  1045.68,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Operator',
  'daily',
  646.32,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Still Photographer',
  'daily',
  563.36,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  '1st Asst. Photographer',
  'hourly',
  59.03,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  '2nd Asst. Photographer',
  'hourly',
  54.45,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Digital Imaging Technician',
  'daily',
  646.24,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Video Controller (Shader)',
  'daily',
  514.8,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Utility Person',
  'daily',
  490.56,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Digital Utility Person',
  'daily',
  337.44,
  'Outside the Corridor',
  'theatrical',
  '2023-07-31'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Long-Form Sideletter',
  'Long-Form Television',
  NULL
);

-- Fringe Benefits (4 benefits)
