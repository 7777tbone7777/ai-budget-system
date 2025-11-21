-- Guild Agreement: DGARates2023thru2024pg11ADUPMGeneralRates240213.pdf
-- Union: DGA
-- Agreement: DGA Rates 2023-2024
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGA',
  'DGA Rates 2023-2024',
  '2024-01-01',
  '2024-06-30',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGARates2023thru2024pg11ADUPMGeneralRates240213.pdf'
);

-- Rate Cards (20 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Unit Production Manager',
  'weekly',
  6523,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Unit Production Manager',
  'weekly',
  9133,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'First Assistant Director',
  'weekly',
  6202,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'First Assistant Director',
  'weekly',
  8675,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Second Assistant Director',
  'weekly',
  4156,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Second Assistant Director',
  'weekly',
  5808,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Additional Second Assistant Director',
  'weekly',
  3923,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Additional Second Assistant Director',
  'weekly',
  5486,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Key Second Assistant Director',
  'weekly',
  2388,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Key Second Assistant Director',
  'weekly',
  3350,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Unit Production Manager',
  'daily',
  1631,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Unit Production Manager',
  'daily',
  2283,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'First Assistant Director',
  'daily',
  1551,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'First Assistant Director',
  'daily',
  2169,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Second Assistant Director',
  'daily',
  1039,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Second Assistant Director',
  'daily',
  1452,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Additional Second Assistant Director',
  'daily',
  981,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Additional Second Assistant Director',
  'daily',
  1372,
  'Location',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'DGA',
  'Key Second Assistant Director',
  'daily',
  597,
  'Studio',
  NULL,
  '2024-01-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (2 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Basic Cable Dramatic Programs',
  'Dramatic Programs',
  'Basic Cable'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Basic Cable Dramatic Programs - Production Seasons',
  'Dramatic Programs',
  'Basic Cable'
);

-- Fringe Benefits (4 benefits)
