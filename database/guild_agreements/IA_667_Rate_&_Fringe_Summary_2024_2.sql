-- Guild Agreement: IA 667 Rate & Fringe Summary 2024 2.pdf
-- Union: Unknown Union
-- Agreement: IATSE Local 667 Minimum Scale 2024
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'Unknown Union',
  'IATSE Local 667 Minimum Scale 2024',
  NULL,
  NULL,
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/IA 667 Rate & Fringe Summary 2024 2.pdf'
);

-- Rate Cards (9 positions)
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Director of Photography',
  'daily',
  118.75,
  NULL,
  'feature',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Director of Photography',
  'weekly',
  8311.9,
  NULL,
  'feature',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Operator',
  'daily',
  81.3,
  NULL,
  'feature',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Operator',
  'weekly',
  7740,
  NULL,
  'television',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Publicist',
  'weekly',
  4605.5,
  NULL,
  'feature',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Publicist',
  'daily',
  810.95,
  NULL,
  'television',
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Digital Engineer',
  'daily',
  99.5,
  NULL,
  NULL,
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)
VALUES (
  'Unknown Union',
  'Camera Trainee',
  'daily',
  18.45,
  'Ontario',
  NULL,
  CURRENT_DATE
) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;

-- Fringe Benefits (8 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'Unknown Union',
  'CA',
  'percentage',
  8,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  4.5,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'Unknown Union',
  'CA',
  'percentage',
  12,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'Unknown Union',
  'CA',
  'percentage',
  6,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'Unknown Union',
  'CA',
  'percentage',
  12,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'Unknown Union',
  'CA',
  'percentage',
  1,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'Unknown Union',
  'CA',
  'percentage',
  0.5,
  CURRENT_DATE
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'payroll_tax',
  'Unknown Union',
  'CA',
  'percentage',
  2,
  CURRENT_DATE
);
