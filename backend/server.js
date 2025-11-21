// AI Budget System - Backend API
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./db');
const { parseFormula, extractGlobalNames, calculateLineItemTotal } = require('./formula-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - RATE CARDS
// ============================================================================

// Get all rate cards (with filters)
app.get('/api/rate-cards', async (req, res) => {
  try {
    const { union_local, location, production_type } = req.query;

    let query = 'SELECT * FROM current_rate_cards WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (union_local) {
      query += ` AND union_local = $${paramCount++}`;
      params.push(union_local);
    }

    if (location) {
      query += ` AND location = $${paramCount++}`;
      params.push(location);
    }

    if (production_type) {
      query += ` AND production_type = $${paramCount++}`;
      params.push(production_type);
    }

    query += ' ORDER BY union_local, job_classification';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get rate for specific position
app.get('/api/rate-cards/position/:classification', async (req, res) => {
  try {
    const { classification } = req.params;
    const { union_local, location, production_type } = req.query;

    const result = await db.query(
      `SELECT * FROM current_rate_cards
       WHERE job_classification = $1
       AND union_local = $2
       AND location = $3
       AND production_type = $4`,
      [classification, union_local, location, production_type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rate card not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - SIDELETTER RULES
// ============================================================================

// Get all sideletter rules
app.get('/api/sideletters', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sideletter_rules ORDER BY sideletter_name'
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching sideletter rules:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get applicable sideletter based on production parameters
app.post('/api/sideletters/determine', async (req, res) => {
  try {
    const { production_type, distribution_platform, season_number, location } = req.body;

    const result = await db.query(
      `SELECT * FROM sideletter_rules
       WHERE production_type = $1
       AND distribution_platform = $2
       AND (season_number = $3 OR season_number IS NULL)
       AND (location_restriction = $4 OR location_restriction IS NULL OR location_restriction = 'Regardless of location')
       ORDER BY season_number DESC NULLS LAST
       LIMIT 1`,
      [production_type, distribution_platform, season_number, location]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No applicable sideletter found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error determining sideletter:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - CREW POSITIONS
// ============================================================================

// Get all crew positions (with filters)
app.get('/api/crew-positions', async (req, res) => {
  try {
    const { department, production_type } = req.query;

    let query = 'SELECT * FROM crew_positions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (department) {
      query += ` AND department = $${paramCount++}`;
      params.push(department);
    }

    if (production_type) {
      query += ` AND $${paramCount++} = ANY(typical_for_production_types)`;
      params.push(production_type);
    }

    query += ' ORDER BY account_code, position_title';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching crew positions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - FRINGE BENEFITS
// ============================================================================

// Calculate total fringe benefits for a position
app.post('/api/fringes/calculate', async (req, res) => {
  try {
    const { union_local, state, gross_wages } = req.body;

    // Get all applicable fringes
    const result = await db.query(
      `SELECT benefit_type, rate_type, rate_value
       FROM fringe_benefits
       WHERE (union_local = $1 OR union_local IS NULL)
       AND (state = $2 OR state IS NULL)
       AND effective_date <= CURRENT_DATE
       ORDER BY effective_date DESC`,
      [union_local, state]
    );

    let totalFringes = 0;
    const breakdown = [];

    result.rows.forEach(fringe => {
      let amount = 0;
      if (fringe.rate_type === 'percentage') {
        amount = (gross_wages * fringe.rate_value) / 100;
      } else {
        amount = fringe.rate_value;
      }

      totalFringes += amount;
      breakdown.push({
        type: fringe.benefit_type,
        rate: fringe.rate_value,
        rate_type: fringe.rate_type,
        amount: amount.toFixed(2),
      });
    });

    res.json({
      success: true,
      gross_wages,
      total_fringes: totalFringes.toFixed(2),
      total_with_fringes: (gross_wages + totalFringes).toFixed(2),
      breakdown,
    });
  } catch (error) {
    console.error('Error calculating fringes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - TAX INCENTIVES
// ============================================================================

// Get tax incentives by state
app.get('/api/tax-incentives', async (req, res) => {
  try {
    const { state, country } = req.query;

    let query = `SELECT * FROM tax_incentives
                 WHERE effective_date_start <= CURRENT_DATE
                 AND (effective_date_end IS NULL OR effective_date_end >= CURRENT_DATE)`;
    const params = [];
    let paramCount = 1;

    if (state) {
      query += ` AND state = $${paramCount++}`;
      params.push(state);
    }

    if (country) {
      query += ` AND country = $${paramCount++}`;
      params.push(country);
    }

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tax incentives:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - GLOBALS
// ============================================================================

// Get all globals for a production
app.get('/api/productions/:production_id/globals', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { global_group } = req.query;

    let query = 'SELECT * FROM globals WHERE production_id = $1';
    const params = [production_id];

    if (global_group) {
      query += ' AND global_group = $2';
      params.push(global_group);
    }

    query += ' ORDER BY global_group NULLS LAST, name';

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching globals:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single global by ID
app.get('/api/globals/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM globals WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Global not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching global:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new global
app.post('/api/productions/:production_id/globals', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { name, value, precision, description, global_group } = req.body;

    // Validate required fields
    if (!name || value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Name and value are required',
      });
    }

    const result = await db.query(
      `INSERT INTO globals
       (production_id, name, value, precision, description, global_group)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [production_id, name, value, precision || 2, description, global_group]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating global:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'A global with this name already exists for this production',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update global
app.put('/api/globals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, precision, description, global_group } = req.body;

    const result = await db.query(
      `UPDATE globals
       SET name = COALESCE($1, name),
           value = COALESCE($2, value),
           precision = COALESCE($3, precision),
           description = COALESCE($4, description),
           global_group = COALESCE($5, global_group),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, value, precision, description, global_group, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Global not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating global:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'A global with this name already exists for this production',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete global
app.delete('/api/globals/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any line items reference this global
    const lineItemCheck = await db.query(
      `SELECT COUNT(*) as count
       FROM budget_line_items bli
       JOIN globals g ON bli.global_reference = g.name
       WHERE g.id = $1`,
      [id]
    );

    if (lineItemCheck.rows[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete global: ${lineItemCheck.rows[0].count} line item(s) reference this global`,
      });
    }

    const result = await db.query(
      'DELETE FROM globals WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Global not found',
      });
    }

    res.json({
      success: true,
      message: 'Global deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting global:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Resolve global value by name
app.get('/api/productions/:production_id/globals/:name/value', async (req, res) => {
  try {
    const { production_id, name } = req.params;

    const result = await db.query(
      'SELECT resolve_global_value($1, $2) as value',
      [production_id, name]
    );

    res.json({
      success: true,
      name,
      value: result.rows[0].value,
    });
  } catch (error) {
    console.error('Error resolving global value:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - FORMULA EVALUATION
// ============================================================================

// Evaluate a formula with globals
app.post('/api/productions/:production_id/formulas/evaluate', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { formula } = req.body;

    if (!formula) {
      return res.status(400).json({
        success: false,
        error: 'Formula is required',
      });
    }

    const result = await parseFormula(formula, production_id);

    res.json({
      success: true,
      formula,
      value: result.value,
      resolved: result.resolved,
      globals_used: result.globals,
    });
  } catch (error) {
    console.error('Error evaluating formula:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Extract global names from a formula
app.post('/api/formulas/extract-globals', async (req, res) => {
  try {
    const { formula } = req.body;

    if (!formula) {
      return res.status(400).json({
        success: false,
        error: 'Formula is required',
      });
    }

    const globalNames = extractGlobalNames(formula);

    res.json({
      success: true,
      formula,
      globals: globalNames,
    });
  } catch (error) {
    console.error('Error extracting globals:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Calculate line item total with formulas
app.post('/api/productions/:production_id/line-items/calculate', async (req, res) => {
  try {
    const { production_id } = req.params;
    const lineItemData = req.body;

    const totals = await calculateLineItemTotal(lineItemData, production_id);

    res.json({
      success: true,
      ...totals,
    });
  } catch (error) {
    console.error('Error calculating line item:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - BUDGET GROUPS
// ============================================================================

// Get all groups for a production
app.get('/api/productions/:production_id/groups', async (req, res) => {
  try {
    const { production_id } = req.params;

    const result = await db.query(
      `SELECT * FROM budget_groups
       WHERE production_id = $1
       ORDER BY sort_order, name`,
      [production_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching budget groups:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single group by ID
app.get('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM budget_groups WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget group not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching budget group:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new group
app.post('/api/productions/:production_id/groups', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { name, description, color, include_in_total, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required',
      });
    }

    const result = await db.query(
      `INSERT INTO budget_groups
       (production_id, name, description, color, include_in_total, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [production_id, name, description, color, include_in_total !== false, sort_order || 0]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating budget group:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'A group with this name already exists for this production',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update group
app.put('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, include_in_total, sort_order } = req.body;

    const result = await db.query(
      `UPDATE budget_groups
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           include_in_total = COALESCE($4, include_in_total),
           sort_order = COALESCE($5, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, color, include_in_total, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget group not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating budget group:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'A group with this name already exists for this production',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete group
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any line items are in this group
    const lineItemCheck = await db.query(
      'SELECT COUNT(*) as count FROM budget_line_item_groups WHERE group_id = $1',
      [id]
    );

    if (lineItemCheck.rows[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete group: ${lineItemCheck.rows[0].count} line item(s) are in this group`,
      });
    }

    const result = await db.query(
      'DELETE FROM budget_groups WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget group not found',
      });
    }

    res.json({
      success: true,
      message: 'Budget group deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting budget group:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add line item to group
app.post('/api/groups/:group_id/line-items/:line_item_id', async (req, res) => {
  try {
    const { group_id, line_item_id } = req.params;

    await db.query(
      `INSERT INTO budget_line_item_groups (line_item_id, group_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [line_item_id, group_id]
    );

    res.status(201).json({
      success: true,
      message: 'Line item added to group',
    });
  } catch (error) {
    console.error('Error adding line item to group:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove line item from group
app.delete('/api/groups/:group_id/line-items/:line_item_id', async (req, res) => {
  try {
    const { group_id, line_item_id } = req.params;

    const result = await db.query(
      'DELETE FROM budget_line_item_groups WHERE line_item_id = $1 AND group_id = $2',
      [line_item_id, group_id]
    );

    res.json({
      success: true,
      message: 'Line item removed from group',
    });
  } catch (error) {
    console.error('Error removing line item from group:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all line items in a group
app.get('/api/groups/:group_id/line-items', async (req, res) => {
  try {
    const { group_id } = req.params;

    const result = await db.query(
      `SELECT bli.*
       FROM budget_line_items bli
       JOIN budget_line_item_groups blig ON bli.id = blig.line_item_id
       WHERE blig.group_id = $1
       ORDER BY bli.account_code, bli.position_title`,
      [group_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching group line items:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - CONTRACTUAL CHARGES
// ============================================================================

// Get all contractual charges for a production
app.get('/api/productions/:production_id/contractual-charges', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { active } = req.query;

    let query = 'SELECT * FROM contractual_charges WHERE production_id = $1';
    const params = [production_id];

    if (active !== undefined) {
      query += ' AND active = $2';
      params.push(active === 'true');
    }

    query += ' ORDER BY sort_order, name';

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching contractual charges:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single contractual charge by ID
app.get('/api/contractual-charges/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM contractual_charges WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contractual charge not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching contractual charge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new contractual charge
app.post('/api/productions/:production_id/contractual-charges', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { name, charge_type, rate, applies_to, exclusions, sort_order, active } = req.body;

    // Validate required fields
    if (!name || !charge_type || rate === undefined || rate === null) {
      return res.status(400).json({
        success: false,
        error: 'Name, charge_type, and rate are required',
      });
    }

    // Validate charge_type
    if (!['percentage', 'flat_fee'].includes(charge_type)) {
      return res.status(400).json({
        success: false,
        error: 'charge_type must be either "percentage" or "flat_fee"',
      });
    }

    const result = await db.query(
      `INSERT INTO contractual_charges
       (production_id, name, charge_type, rate, applies_to, exclusions, sort_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        production_id,
        name,
        charge_type,
        rate,
        applies_to || 'all',
        JSON.stringify(exclusions || []),
        sort_order || 0,
        active !== false
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating contractual charge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update contractual charge
app.put('/api/contractual-charges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, charge_type, rate, applies_to, exclusions, sort_order, active } = req.body;

    // Validate charge_type if provided
    if (charge_type && !['percentage', 'flat_fee'].includes(charge_type)) {
      return res.status(400).json({
        success: false,
        error: 'charge_type must be either "percentage" or "flat_fee"',
      });
    }

    const result = await db.query(
      `UPDATE contractual_charges
       SET name = COALESCE($1, name),
           charge_type = COALESCE($2, charge_type),
           rate = COALESCE($3, rate),
           applies_to = COALESCE($4, applies_to),
           exclusions = COALESCE($5, exclusions),
           sort_order = COALESCE($6, sort_order),
           active = COALESCE($7, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name,
        charge_type,
        rate,
        applies_to,
        exclusions ? JSON.stringify(exclusions) : null,
        sort_order,
        active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contractual charge not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating contractual charge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete contractual charge
app.delete('/api/contractual-charges/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM contractual_charges WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contractual charge not found',
      });
    }

    res.json({
      success: true,
      message: 'Contractual charge deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting contractual charge:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Calculate total contractual charges for a production
app.get('/api/productions/:production_id/contractual-charges/calculate', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { budget_total } = req.query;

    if (!budget_total) {
      return res.status(400).json({
        success: false,
        error: 'budget_total query parameter is required',
      });
    }

    // Get all active contractual charges
    const charges = await db.query(
      `SELECT * FROM contractual_charges
       WHERE production_id = $1 AND active = true
       ORDER BY sort_order`,
      [production_id]
    );

    let totalCharges = 0;
    const breakdown = [];

    charges.rows.forEach(charge => {
      let amount = 0;

      if (charge.charge_type === 'percentage') {
        amount = (parseFloat(budget_total) * charge.rate) / 100;
      } else {
        amount = parseFloat(charge.rate);
      }

      totalCharges += amount;
      breakdown.push({
        id: charge.id,
        name: charge.name,
        charge_type: charge.charge_type,
        rate: charge.rate,
        applies_to: charge.applies_to,
        amount: amount.toFixed(2),
      });
    });

    res.json({
      success: true,
      budget_total: parseFloat(budget_total),
      total_charges: totalCharges.toFixed(2),
      grand_total: (parseFloat(budget_total) + totalCharges).toFixed(2),
      breakdown,
    });
  } catch (error) {
    console.error('Error calculating contractual charges:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - PRODUCTIONS
// ============================================================================

// Create new production
app.post('/api/productions', async (req, res) => {
  try {
    const {
      name,
      production_type,
      distribution_platform,
      shooting_location,
      state,
      budget_target,
      episode_count,
      episode_length_minutes,
      season_number,
      principal_photography_start,
    } = req.body;

    const result = await db.query(
      `INSERT INTO productions
       (name, production_type, distribution_platform, shooting_location, state,
        budget_target, episode_count, episode_length_minutes, season_number, principal_photography_start)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, production_type, distribution_platform, shooting_location, state,
       budget_target, episode_count, episode_length_minutes, season_number, principal_photography_start]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating production:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all productions
app.get('/api/productions', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM production_budget_summary ORDER BY production_name'
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching productions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single production by ID
app.get('/api/productions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - TAX INCENTIVES
// ============================================================================

// Get all tax incentives
app.get('/api/tax-incentives', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        state,
        country,
        incentive_min_percent,
        incentive_max_percent,
        incentive_type,
        incentive_mechanism,
        minimum_spend,
        project_cap,
        annual_cap
      FROM tax_incentives
      ORDER BY state
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching tax incentives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax incentives'
    });
  }
});

// Get detailed tax incentive information for a specific state
app.get('/api/tax-incentives/:state', async (req, res) => {
  try {
    const { state } = req.params;

    const result = await db.query(`
      SELECT *
      FROM tax_incentives
      WHERE LOWER(state) = LOWER($1)
    `, [state]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No tax incentive found for state: ${state}`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching tax incentive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax incentive'
    });
  }
});

// Calculate estimated tax incentive for a production
app.post('/api/tax-incentives/calculate', async (req, res) => {
  try {
    const {
      state,
      totalBudget,
      residentAtlSpend = 0,
      residentBtlSpend = 0,
      nonResidentAtlSpend = 0,
      nonResidentBtlSpend = 0,
      qualifiedSpend,
      hasVfx = false,
      vfxSpend = 0,
      hasLocalHire = false,
      isVeteranOwned = false
    } = req.body;

    // Get state tax incentive details
    const incentiveResult = await db.query(`
      SELECT *
      FROM tax_incentives
      WHERE LOWER(state) = LOWER($1)
    `, [state]);

    if (incentiveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No tax incentive found for state: ${state}`
      });
    }

    const incentive = incentiveResult.rows[0];

    // Check minimum spend requirement
    if (incentive.minimum_spend && totalBudget < incentive.minimum_spend) {
      return res.json({
        success: true,
        eligible: false,
        reason: `Budget ($${totalBudget.toLocaleString()}) is below minimum spend requirement ($${incentive.minimum_spend.toLocaleString()})`,
        minimumSpend: incentive.minimum_spend
      });
    }

    // Calculate base credit from labor
    let laborCredit = 0;
    if (incentive.resident_atl_percent) {
      laborCredit += residentAtlSpend * (incentive.resident_atl_percent / 100);
    }
    if (incentive.resident_btl_percent) {
      laborCredit += residentBtlSpend * (incentive.resident_btl_percent / 100);
    }
    if (incentive.non_resident_atl_percent) {
      laborCredit += nonResidentAtlSpend * (incentive.non_resident_atl_percent / 100);
    }
    if (incentive.non_resident_btl_percent) {
      laborCredit += nonResidentBtlSpend * (incentive.non_resident_btl_percent / 100);
    }

    // Calculate credit from qualified spend
    let spendCredit = 0;
    if (incentive.qualified_spend_percent && qualifiedSpend) {
      spendCredit = qualifiedSpend * (incentive.qualified_spend_percent / 100);
    }

    // Calculate base credit
    let baseCredit = laborCredit + spendCredit;

    // Apply project cap if exists
    if (incentive.project_cap && baseCredit > incentive.project_cap) {
      baseCredit = incentive.project_cap;
    }

    // Calculate uplifts (simplified)
    const uplifts = [];
    let totalUplifts = 0;

    const finalCredit = baseCredit + totalUplifts;
    const effectiveCreditRate = totalBudget > 0 ? (finalCredit / totalBudget) * 100 : 0;

    res.json({
      success: true,
      eligible: true,
      calculation: {
        state: incentive.state,
        totalBudget,
        laborCredit,
        spendCredit,
        baseCredit,
        uplifts,
        totalUplifts,
        finalCredit,
        effectiveCreditRate: effectiveCreditRate.toFixed(2),
        incentiveType: incentive.incentive_type,
        mechanism: incentive.incentive_mechanism
      },
      details: {
        minimumSpend: incentive.minimum_spend,
        projectCap: incentive.project_cap,
        annualCap: incentive.annual_cap,
        compensationCap: incentive.compensation_cap
      }
    });
  } catch (error) {
    console.error('Error calculating tax incentive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate tax incentive'
    });
  }
});

// Compare tax incentives across multiple states
app.post('/api/tax-incentives/compare', async (req, res) => {
  try {
    const {
      states,
      totalBudget,
      residentAtlSpend = 0,
      residentBtlSpend = 0,
      nonResidentAtlSpend = 0,
      nonResidentBtlSpend = 0,
      qualifiedSpend
    } = req.body;

    if (!Array.isArray(states) || states.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'States array is required'
      });
    }

    const comparisons = [];

    for (const state of states) {
      // Get state tax incentive details
      const incentiveResult = await db.query(`
        SELECT *
        FROM tax_incentives
        WHERE LOWER(state) = LOWER($1)
      `, [state]);

      if (incentiveResult.rows.length === 0) {
        comparisons.push({
          state,
          eligible: false,
          reason: 'No tax incentive program found'
        });
        continue;
      }

      const incentive = incentiveResult.rows[0];

      // Check minimum spend
      if (incentive.minimum_spend && totalBudget < incentive.minimum_spend) {
        comparisons.push({
          state: incentive.state,
          eligible: false,
          reason: `Below minimum spend ($${incentive.minimum_spend.toLocaleString()})`,
          minimumSpend: incentive.minimum_spend
        });
        continue;
      }

      // Calculate credit
      let laborCredit = 0;
      if (incentive.resident_atl_percent) {
        laborCredit += residentAtlSpend * (incentive.resident_atl_percent / 100);
      }
      if (incentive.resident_btl_percent) {
        laborCredit += residentBtlSpend * (incentive.resident_btl_percent / 100);
      }
      if (incentive.non_resident_atl_percent) {
        laborCredit += nonResidentAtlSpend * (incentive.non_resident_atl_percent / 100);
      }
      if (incentive.non_resident_btl_percent) {
        laborCredit += nonResidentBtlSpend * (incentive.non_resident_btl_percent / 100);
      }

      let spendCredit = 0;
      if (incentive.qualified_spend_percent && qualifiedSpend) {
        spendCredit = qualifiedSpend * (incentive.qualified_spend_percent / 100);
      }

      let totalCredit = laborCredit + spendCredit;

      // Apply project cap
      if (incentive.project_cap && totalCredit > incentive.project_cap) {
        totalCredit = incentive.project_cap;
      }

      const effectiveRate = totalBudget > 0 ? (totalCredit / totalBudget) * 100 : 0;

      comparisons.push({
        state: incentive.state,
        eligible: true,
        totalCredit,
        effectiveRate: effectiveRate.toFixed(2),
        incentiveType: incentive.incentive_type,
        mechanism: incentive.incentive_mechanism,
        minPercent: incentive.incentive_min_percent,
        maxPercent: incentive.incentive_max_percent,
        projectCap: incentive.project_cap,
        annualCap: incentive.annual_cap
      });
    }

    // Sort by total credit (highest first)
    comparisons.sort((a, b) => {
      if (!a.eligible) return 1;
      if (!b.eligible) return -1;
      return (b.totalCredit || 0) - (a.totalCredit || 0);
    });

    res.json({
      success: true,
      data: comparisons,
      summary: {
        totalStatesCompared: states.length,
        eligibleStates: comparisons.filter(c => c.eligible).length,
        bestState: comparisons.find(c => c.eligible)?.state || null,
        bestCredit: comparisons.find(c => c.eligible)?.totalCredit || 0
      }
    });
  } catch (error) {
    console.error('Error comparing tax incentives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare tax incentives'
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🚀 AI Budget System API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api\n`);
});
