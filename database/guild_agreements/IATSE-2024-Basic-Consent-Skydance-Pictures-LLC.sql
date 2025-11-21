-- Guild Agreement: IATSE-2024-Basic-Consent-Skydance-Pictures-LLC.pdf
-- Union: IATSE
-- Agreement: Agreement of Consent
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE',
  'Agreement of Consent',
  '2024-09-24',
  '2027-07-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/IATSE-2024-Basic-Consent-Skydance-Pictures-LLC.pdf'
);

-- Fringe Benefits (2 benefits)
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  4,
  '2024-09-24'
);
INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)
VALUES (
  'vacation_holiday',
  'IATSE',
  'CA',
  'percentage',
  4.583,
  '2024-09-24'
);
