-- Guild Agreement: DGC-Core-Standard-Agreement-2023-2025-Apr.122023.pdf
-- Union: DGC
-- Agreement: DGC/CMPA Standard Agreement
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'DGC',
  'DGC/CMPA Standard Agreement',
  '2023-01-01',
  '2025-12-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/DGC-Core-Standard-Agreement-2023-2025-Apr.122023.pdf'
);

-- Rate Cards (3 positions)

-- Sideletter Rules (1 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Documentary Production',
  'Documentary',
  NULL
);

-- Fringe Benefits (4 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'pension',
  'DGC',
  'CA',
  'percentage',
  2,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'health',
  'DGC',
  'CA',
  'percentage',
  2,
  '2023-01-01'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'DGC',
  'CA',
  'percentage',
  4,
  '2023-01-01'
);
