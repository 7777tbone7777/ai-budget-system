-- Guild Agreement: 2024_SUMMARY_OF_BASIC_AGREEMENT_NEGOTIATIONS_6.28.24_FINAL.pdf
-- Union: Unknown Union
-- Agreement: Basic Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'Unknown Union',
  'Basic Agreement',
  '2024-08-01',
  '2027-07-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2024_SUMMARY_OF_BASIC_AGREEMENT_NEGOTIATIONS_6.28.24_FINAL.pdf'
);

-- Rate Cards (1 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'General Wage Improvements',
  'percentage',
  7,
  NULL,
  NULL,
  '2024-08-01'
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Sideletter Rules (3 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Streaming Improvements',
  'Streaming',
  'SVOD'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Long-Form/Movie of the Week Rates',
  'Long-Form',
  NULL
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Mini-Series Wage Rates',
  'Mini-Series',
  NULL
);

-- Fringe Benefits (3 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'Unknown Union',
  'CA',
  'percentage',
  15,
  '2024-08-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  1.09,
  '2024-08-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'Unknown Union',
  'CA',
  'percentage',
  4.583,
  '2024-08-01'
);
