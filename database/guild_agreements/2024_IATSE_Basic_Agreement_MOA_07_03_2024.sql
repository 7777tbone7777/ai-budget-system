-- Guild Agreement: 2024_IATSE_Basic_Agreement_MOA_07_03_2024.pdf
-- Union: IATSE
-- Agreement: 2024 IATSE Basic Agreement MOA
-- Extracted: 2025-11-21
-- Confidence: MEDIUM

-- Insert union agreement
INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)
VALUES (
  gen_random_uuid(),
  'IATSE',
  '2024 IATSE Basic Agreement MOA',
  '2024-08-01',
  '2027-07-31',
  '/Users/anthonyvazquez/Documents/budgets/Guild Agreements/2024_IATSE_Basic_Agreement_MOA_07_03_2024.pdf'
);

-- Rate Cards (1 positions)

-- Sideletter Rules (3 rules)
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Half-Hour and One-Hour Pilots',
  'network_tv|pay_tv|hb_svod|hb_avod|hb_fast_channel',
  'varies'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Single Camera Half-Hour Series',
  'network_tv|pay_tv|hb_svod|hb_avod|hb_fast_channel',
  'varies'
);
INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)
VALUES (
  'Multi-Camera Half-Hour Series',
  'network_tv|pay_tv|hb_svod|hb_avod|hb_fast_channel',
  'varies'
);

-- Fringe Benefits (4 benefits)
