-- Migration 006: Add Budget Templates System
-- Stores extracted budget data for template generation and AI training
-- Based on 39 real production budgets from 13 locations

-- ============================================================================
-- BUDGET TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_templates (
  id SERIAL PRIMARY KEY,

  -- Template identification
  name VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  production_type VARCHAR(100), -- 'one_hour_pilot', 'multi_cam', 'cable_series'

  -- Budget metadata
  total_budget DECIMAL(12, 2),
  atl_total DECIMAL(12, 2),
  btl_total DECIMAL(12, 2),
  other_total DECIMAL(12, 2),
  production_total DECIMAL(12, 2),
  post_total DECIMAL(12, 2),

  -- Production details
  shoot_days INTEGER,
  shoot_dates VARCHAR(100),

  -- Template structure (complete JSON from extracted budgets)
  template_data JSONB NOT NULL,

  -- Source information
  source_filename VARCHAR(255),
  source_budget_count INTEGER DEFAULT 1, -- How many budgets were merged
  extraction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Template quality metrics
  department_count INTEGER,
  line_item_count INTEGER,
  completeness_score DECIMAL(5, 2), -- 0-100 score based on data quality

  -- Indexing and search
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TEMPLATE DEPARTMENTS TABLE (Normalized for faster queries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_departments (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES budget_templates(id) ON DELETE CASCADE,

  -- Department info
  name VARCHAR(255) NOT NULL,
  account VARCHAR(50),
  total DECIMAL(12, 2),

  -- Position in budget
  sort_order INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TEMPLATE LINE ITEMS TABLE (Normalized for fast position/rate lookups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_line_items (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES budget_templates(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES template_departments(id) ON DELETE CASCADE,

  -- Line item details
  account VARCHAR(50),
  description TEXT,
  position VARCHAR(255),

  -- Quantities and rates
  quantity DECIMAL(10, 2),
  unit VARCHAR(50), -- 'day', 'week', 'allow', 'hour'
  rate DECIMAL(10, 2),
  subtotal DECIMAL(12, 2),
  total DECIMAL(12, 2),

  -- Detail breakdown (for multi-line items)
  detail_lines JSONB,

  -- Multi-period data (if applicable)
  periods JSONB,

  -- Position in department
  sort_order INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Template lookups
CREATE INDEX idx_templates_location ON budget_templates(location);
CREATE INDEX idx_templates_production_type ON budget_templates(production_type);
CREATE INDEX idx_templates_active ON budget_templates(is_active);
CREATE INDEX idx_templates_budget_range ON budget_templates(total_budget);

-- JSONB search (for AI queries)
CREATE INDEX idx_templates_data_gin ON budget_templates USING gin(template_data);

-- Department lookups
CREATE INDEX idx_template_depts_template ON template_departments(template_id);
CREATE INDEX idx_template_depts_name ON template_departments(name);

-- Line item lookups
CREATE INDEX idx_template_items_template ON template_line_items(template_id);
CREATE INDEX idx_template_items_dept ON template_line_items(department_id);
CREATE INDEX idx_template_items_position ON template_line_items(position);
CREATE INDEX idx_template_items_account ON template_line_items(account);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate template completeness score
CREATE OR REPLACE FUNCTION calculate_template_completeness(template_json JSONB)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  dept_count INTEGER;
  item_count INTEGER;
  items_with_rates INTEGER;
BEGIN
  -- Count departments
  dept_count := jsonb_array_length(template_json->'departments');
  IF dept_count > 0 THEN score := score + 20; END IF;
  IF dept_count >= 10 THEN score := score + 10; END IF;
  IF dept_count >= 15 THEN score := score + 10; END IF;

  -- Count line items
  SELECT COUNT(*) INTO item_count
  FROM jsonb_array_elements(template_json->'departments') dept,
       jsonb_array_elements(dept->'line_items') item;

  IF item_count > 0 THEN score := score + 20; END IF;
  IF item_count >= 30 THEN score := score + 10; END IF;
  IF item_count >= 50 THEN score := score + 10; END IF;

  -- Count items with rates
  SELECT COUNT(*) INTO items_with_rates
  FROM jsonb_array_elements(template_json->'departments') dept,
       jsonb_array_elements(dept->'line_items') item
  WHERE (item->>'rate')::DECIMAL > 0;

  IF items_with_rates::DECIMAL / NULLIF(item_count, 0) > 0.8 THEN
    score := score + 20;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get template by location and production type
CREATE OR REPLACE FUNCTION get_template_by_criteria(
  p_location VARCHAR,
  p_production_type VARCHAR DEFAULT NULL,
  p_budget_min DECIMAL DEFAULT NULL,
  p_budget_max DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  template_id INTEGER,
  template_name VARCHAR,
  location VARCHAR,
  total_budget DECIMAL,
  line_item_count INTEGER,
  completeness_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bt.id,
    bt.name,
    bt.location,
    bt.total_budget,
    bt.line_item_count,
    bt.completeness_score
  FROM budget_templates bt
  WHERE
    bt.is_active = true
    AND bt.location ILIKE '%' || p_location || '%'
    AND (p_production_type IS NULL OR bt.production_type = p_production_type)
    AND (p_budget_min IS NULL OR bt.total_budget >= p_budget_min)
    AND (p_budget_max IS NULL OR bt.total_budget <= p_budget_max)
  ORDER BY
    bt.completeness_score DESC,
    bt.line_item_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Template summary view
CREATE OR REPLACE VIEW template_summary AS
SELECT
  bt.id,
  bt.name,
  bt.location,
  bt.production_type,
  bt.total_budget,
  bt.department_count,
  bt.line_item_count,
  bt.completeness_score,
  bt.shoot_days,
  COUNT(DISTINCT td.id) as actual_dept_count,
  COUNT(DISTINCT tli.id) as actual_item_count
FROM budget_templates bt
LEFT JOIN template_departments td ON bt.id = td.template_id
LEFT JOIN template_line_items tli ON bt.id = tli.template_id
WHERE bt.is_active = true
GROUP BY bt.id, bt.name, bt.location, bt.production_type,
         bt.total_budget, bt.department_count, bt.line_item_count,
         bt.completeness_score, bt.shoot_days;

-- Position rate lookup view (for AI rate suggestions)
CREATE OR REPLACE VIEW position_rates_by_location AS
SELECT
  tli.position,
  bt.location,
  tli.unit,
  AVG(tli.rate) as avg_rate,
  MIN(tli.rate) as min_rate,
  MAX(tli.rate) as max_rate,
  COUNT(*) as sample_count
FROM template_line_items tli
JOIN budget_templates bt ON tli.template_id = bt.id
WHERE
  tli.rate > 0
  AND bt.is_active = true
  AND tli.position IS NOT NULL
GROUP BY tli.position, bt.location, tli.unit
HAVING COUNT(*) >= 2
ORDER BY tli.position, bt.location;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE budget_templates IS 'Stores complete budget templates extracted from real production budgets for template generation and AI training';
COMMENT ON TABLE template_departments IS 'Normalized department data for faster queries and lookups';
COMMENT ON TABLE template_line_items IS 'Normalized line item data for position/rate lookups and AI suggestions';
COMMENT ON FUNCTION calculate_template_completeness IS 'Calculates quality score (0-100) based on department count, line items, and data completeness';
COMMENT ON FUNCTION get_template_by_criteria IS 'Finds best matching templates by location, type, and budget range';
COMMENT ON VIEW position_rates_by_location IS 'Average rates for positions by location - used for AI rate suggestions';
