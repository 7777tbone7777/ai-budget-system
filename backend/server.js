// AI Budget System - Backend API
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const db = require('./db');
const { parseFormula, extractGlobalNames, calculateLineItemTotal } = require('./formula-parser');
const { requestLogger, errorLogger, createLogger } = require('./logger');
const { generateBudget, parseNaturalLanguage } = require('./ai-budget-generator');
const { recommendCrew, optimizeCrew, parseCrewRequest, PRODUCTION_CONFIGS } = require('./smart-crew-builder');
const { analyzeScenario, compareScenarios, predictVariance, summarizeScenario, parseScenarioRequest, HISTORICAL_VARIANCE } = require('./what-if-analyzer');
const { auditBudget, checkRate, calculateTaxIncentives, getTaxIncentivePrograms, summarizeAudit, TAX_INCENTIVES, COMPLIANCE_RULES } = require('./budget-guardian');
const { VIEW_TEMPLATES, getFilteredView, saveView, getSavedViews, updateView, deleteView, getFilterOptions, ensureViewsTable } = require('./budget-views');
const { ROLES, ensureAccessTables, grantAccess, revokeAccess, getProductionAccess, checkPermission, getUserRole, createShareLink, validateShareLink, getShareLinks, deactivateShareLink, logAccess, getAccessLog, getUserProductions } = require('./access-control');
const { calculateProductionFringes, applyCalculatedFringes, estimatePositionFringes, getFringeRates, DEFAULT_FRINGE_RATES } = require('./schedule-fringe-calculator');

// Create context-specific loggers
const appLogger = createLogger('APP');
const apiLogger = createLogger('API');
const templateLogger = createLogger('TEMPLATES');
const budgetLogger = createLogger('BUDGETS');
const dbLogger = createLogger('DATABASE');
const aiLogger = createLogger('AI');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Logging middleware - logs all requests and responses
app.use(requestLogger(appLogger));

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');

    appLogger.debug('Health check passed', {
      database: 'connected'
    });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    appLogger.error('Health check failed', error, {
      database: 'disconnected'
    });

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================================================
// BUDGET HIERARCHY API ROUTES
// ============================================================================
// Register the budget hierarchy router
const budgetRouter = require('./api/budgets');
app.locals.pool = db; // Make db pool available to router
app.use('/api/budgets', budgetRouter);
app.use('/api/fringe-rules', budgetRouter); // Fringe rules endpoints

appLogger.info('Budget hierarchy API routes registered', {
  routes: [
    'POST /api/budgets',
    'GET /api/budgets/:budget_id',
    'GET /api/budgets/:budget_id/topsheet',
    'POST /api/budgets/:budget_id/topsheet',
    'GET /api/budgets/:budget_id/accounts',
    'POST /api/budgets/:budget_id/accounts',
    'GET /api/budgets/:budget_id/line-items',
    'POST /api/budgets/:budget_id/line-items',
    'GET /api/budgets/:budget_id/hierarchy',
    'GET /api/fringe-rules',
    'GET /api/fringe-rules/lookup'
  ]
});

// ============================================================================
// DATABASE MIGRATIONS
// ============================================================================

// Add atl_or_btl column to budget_line_items if it doesn't exist
app.post('/api/migrate/add-atl-btl-column', async (req, res) => {
  try {
    // Check if column exists
    const checkColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'budget_line_items'
      AND column_name = 'atl_or_btl'
    `);

    if (checkColumn.rows.length === 0) {
      // Column doesn't exist, add it
      await db.query(`
        ALTER TABLE budget_line_items
        ADD COLUMN atl_or_btl VARCHAR(10)
      `);

      res.json({
        success: true,
        message: 'Column atl_or_btl added successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Column atl_or_btl already exists'
      });
    }
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update existing line items to set atl_or_btl based on account code
app.post('/api/migrate/categorize-existing-items', async (req, res) => {
  try {
    // Update ATL items (account codes starting with 1)
    await db.query(`
      UPDATE budget_line_items
      SET atl_or_btl = 'ATL'
      WHERE account_code ~ '^1[0-9]+'
      AND (atl_or_btl IS NULL OR atl_or_btl = '')
    `);

    // Update BTL items (account codes starting with 2 or 3)
    await db.query(`
      UPDATE budget_line_items
      SET atl_or_btl = 'BTL'
      WHERE account_code ~ '^[23][0-9]+'
      AND (atl_or_btl IS NULL OR atl_or_btl = '')
    `);

    // Update Other items (account codes starting with 4, 5, 6, 7, 8, 9)
    await db.query(`
      UPDATE budget_line_items
      SET atl_or_btl = 'Other'
      WHERE account_code ~ '^[456789][0-9]+'
      AND (atl_or_btl IS NULL OR atl_or_btl = '')
    `);

    // Get count of updated items
    const result = await db.query(`
      SELECT
        atl_or_btl,
        COUNT(*) as count
      FROM budget_line_items
      WHERE atl_or_btl IS NOT NULL
      GROUP BY atl_or_btl
    `);

    res.json({
      success: true,
      message: 'Existing items categorized successfully',
      categories: result.rows
    });
  } catch (error) {
    console.error('Categorization migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// API ROUTES - RATE CARDS
// ============================================================================

// Get all rate cards (with filters)
app.get('/api/rate-cards', async (req, res) => {
  try {
    const { union_local, location, production_type, agreement_id } = req.query;

    let query = `
      SELECT rc.*,
             a.name as agreement_name,
             a.short_name as agreement_short_name,
             a.effective_start as agreement_start,
             a.effective_end as agreement_end
      FROM rate_cards rc
      LEFT JOIN agreements a ON rc.agreement_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (union_local) {
      query += ` AND rc.union_local = $${paramCount++}`;
      params.push(union_local);
    }

    if (location) {
      query += ` AND rc.location = $${paramCount++}`;
      params.push(location);
    }

    if (production_type) {
      query += ` AND rc.production_type = $${paramCount++}`;
      params.push(production_type);
    }

    if (agreement_id) {
      query += ` AND rc.agreement_id = $${paramCount++}`;
      params.push(agreement_id);
    }

    query += ' ORDER BY rc.union_local, rc.job_classification';

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

// Get all agreements
app.get('/api/agreements', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*,
             (SELECT COUNT(*) FROM rate_cards WHERE agreement_id = a.id) as rate_card_count
      FROM agreements a
      ORDER BY a.union_name, a.short_name
    `);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching agreements:', error);
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

// Smart rate lookup - fuzzy matches aliases and job titles
app.get('/api/rate-cards/smart-lookup', async (req, res) => {
  try {
    const { query, location, production_type, rate_type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    // First check aliases table
    const aliasResult = await db.query(
      `SELECT canonical_name, union_local
       FROM job_classification_aliases
       WHERE LOWER(alias) = LOWER($1)
       LIMIT 1`,
      [query]
    );

    let searchTerms = [query];
    let preferredUnion = null;

    if (aliasResult.rows.length > 0) {
      searchTerms = [aliasResult.rows[0].canonical_name, query];
      preferredUnion = aliasResult.rows[0].union_local;
    }

    // Build query with fuzzy matching
    let sqlQuery = `
      SELECT DISTINCT ON (job_classification, union_local, rate_type)
        r.*,
        CASE
          WHEN LOWER(job_classification) = LOWER($1) THEN 100
          WHEN LOWER(job_classification) LIKE LOWER($1) || '%' THEN 80
          WHEN LOWER(job_classification) LIKE '%' || LOWER($1) || '%' THEN 60
          ELSE 40
        END as match_score
      FROM current_rate_cards r
      WHERE (
        LOWER(job_classification) LIKE '%' || LOWER($1) || '%'
        ${searchTerms.length > 1 ? "OR LOWER(job_classification) LIKE '%' || LOWER($2) || '%'" : ''}
      )
    `;

    const params = searchTerms;
    let paramCount = searchTerms.length + 1;

    if (location) {
      sqlQuery += ` AND LOWER(location) LIKE '%' || LOWER($${paramCount++}) || '%'`;
      params.push(location);
    }

    if (production_type) {
      sqlQuery += ` AND LOWER(production_type) LIKE '%' || LOWER($${paramCount++}) || '%'`;
      params.push(production_type);
    }

    if (rate_type) {
      sqlQuery += ` AND rate_type = $${paramCount++}`;
      params.push(rate_type);
    }

    sqlQuery += ` ORDER BY job_classification, union_local, rate_type, match_score DESC LIMIT 20`;

    const result = await db.query(sqlQuery, params);

    // Sort by match score and preferred union
    let sortedResults = result.rows.sort((a, b) => {
      // Prefer exact union match from alias
      if (preferredUnion) {
        if (a.union_local === preferredUnion && b.union_local !== preferredUnion) return -1;
        if (b.union_local === preferredUnion && a.union_local !== preferredUnion) return 1;
      }
      return b.match_score - a.match_score;
    });

    res.json({
      success: true,
      query,
      alias_match: aliasResult.rows.length > 0 ? aliasResult.rows[0] : null,
      count: sortedResults.length,
      data: sortedResults,
    });
  } catch (error) {
    console.error('Error in smart lookup:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all job classification aliases
app.get('/api/rate-cards/aliases', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT alias, canonical_name, union_local
       FROM job_classification_aliases
       ORDER BY alias`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching aliases:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Rate comparison - compare rates across locations/production types
app.get('/api/rate-cards/compare', async (req, res) => {
  try {
    const { job_classification, compare_by } = req.query;

    if (!job_classification) {
      return res.status(400).json({
        success: false,
        error: 'job_classification is required',
      });
    }

    let groupBy = compare_by || 'location';

    const result = await db.query(`
      SELECT
        ${groupBy},
        rate_type,
        union_local,
        AVG(base_rate::numeric)::decimal(10,2) as avg_rate,
        MIN(base_rate::numeric)::decimal(10,2) as min_rate,
        MAX(base_rate::numeric)::decimal(10,2) as max_rate,
        COUNT(*) as sample_count
      FROM current_rate_cards
      WHERE LOWER(job_classification) LIKE '%' || LOWER($1) || '%'
      GROUP BY ${groupBy}, rate_type, union_local
      ORDER BY ${groupBy}, rate_type
    `, [job_classification]);

    res.json({
      success: true,
      job_classification,
      compare_by: groupBy,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error comparing rates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES - SAVED BUDGETS
// ============================================================================

// Get all saved budgets
app.get('/api/saved-budgets', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, production_weeks, fringe_rate,
              total_labor, total_fringes, grand_total, created_at, updated_at,
              jsonb_array_length(crew_data) as crew_count
       FROM saved_budgets
       ORDER BY updated_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching saved budgets:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get a single saved budget by ID
app.get('/api/saved-budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM saved_budgets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Save a new budget
app.post('/api/saved-budgets', async (req, res) => {
  try {
    const { name, description, production_weeks, fringe_rate, crew_data, total_labor, total_fringes, grand_total } = req.body;

    if (!name || !crew_data) {
      return res.status(400).json({
        success: false,
        error: 'Name and crew_data are required',
      });
    }

    const result = await db.query(
      `INSERT INTO saved_budgets (name, description, production_weeks, fringe_rate, crew_data, total_labor, total_fringes, grand_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, production_weeks || 12, fringe_rate || 30, JSON.stringify(crew_data), total_labor, total_fringes, grand_total]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update an existing budget
app.put('/api/saved-budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, production_weeks, fringe_rate, crew_data, total_labor, total_fringes, grand_total } = req.body;

    const result = await db.query(
      `UPDATE saved_budgets
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           production_weeks = COALESCE($3, production_weeks),
           fringe_rate = COALESCE($4, fringe_rate),
           crew_data = COALESCE($5, crew_data),
           total_labor = COALESCE($6, total_labor),
           total_fringes = COALESCE($7, total_fringes),
           grand_total = COALESCE($8, grand_total),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, production_weeks, fringe_rate, crew_data ? JSON.stringify(crew_data) : null, total_labor, total_fringes, grand_total, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete a saved budget
app.delete('/api/saved-budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM saved_budgets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found',
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
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

// Get suggested fringe rate for a union
app.get('/api/fringes/suggest', async (req, res) => {
  try {
    const { union_local, state } = req.query;

    // Get percentage-based fringes for the union
    const result = await db.query(
      `SELECT DISTINCT ON (benefit_type) benefit_type, rate_value
       FROM fringe_benefits
       WHERE (union_local ILIKE $1 OR union_local IS NULL)
       AND rate_type = 'percentage'
       AND effective_date <= CURRENT_DATE
       ORDER BY benefit_type, union_local NULLS LAST, effective_date DESC`,
      [`%${union_local || ''}%`]
    );

    // Sum all percentage-based fringes
    let suggestedRate = 0;
    const breakdown = [];

    // Standard fringe components (typical industry rates if no union-specific)
    const defaultFringes = {
      'Health & Welfare': 7.5,
      'Pension': 6.0,
      'Vacation/Holiday': 4.0,
      'Employer Taxes': 10.0, // FICA, FUTA, SUI
    };

    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        // Cap individual components at reasonable values
        const value = Math.min(parseFloat(row.rate_value), 25);
        suggestedRate += value;
        breakdown.push({ type: row.benefit_type, rate: value });
      });
    } else {
      // Use defaults if no union-specific data
      Object.entries(defaultFringes).forEach(([type, rate]) => {
        suggestedRate += rate;
        breakdown.push({ type, rate });
      });
    }

    // Cap total at reasonable range (20-45%)
    suggestedRate = Math.max(20, Math.min(45, suggestedRate));

    res.json({
      success: true,
      union_local: union_local || 'Default',
      suggested_rate: Math.round(suggestedRate * 100) / 100,
      breakdown,
      note: result.rows.length === 0 ? 'Using industry standard rates' : 'Based on union agreement data'
    });
  } catch (error) {
    console.error('Error suggesting fringes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      suggested_rate: 30 // Default fallback
    });
  }
});

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
// AI SCHEDULE-AWARE FRINGE CALCULATOR
// ============================================================================

// Calculate fringes for entire production with schedule awareness
app.post('/api/ai/fringes/calculate/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { schedule } = req.body;

    aiLogger.info('Schedule-aware fringe calculation requested', { productionId });

    // Validate schedule structure
    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule is required. Provide prep, shoot, wrap, post durations.'
      });
    }

    // Default schedule if incomplete
    const fullSchedule = {
      prep: { duration: schedule.prep?.duration || 0 },
      shoot: { duration: schedule.shoot?.duration || 0 },
      wrap: { duration: schedule.wrap?.duration || 0 },
      post: { duration: schedule.post?.duration || 0 }
    };

    const result = await calculateProductionFringes(db, productionId, fullSchedule);

    res.json(result);
  } catch (error) {
    aiLogger.error('Schedule-aware fringe calculation failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply calculated fringes to production line items
app.post('/api/ai/fringes/apply/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { positions, schedule } = req.body;

    aiLogger.info('Applying calculated fringes', { productionId, positionCount: positions?.length });

    // If positions not provided, recalculate first
    let positionResults = positions;
    if (!positionResults) {
      if (!schedule) {
        return res.status(400).json({
          success: false,
          error: 'Either positions or schedule is required'
        });
      }
      const calcResult = await calculateProductionFringes(db, productionId, schedule);
      positionResults = calcResult.positions;
    }

    const result = await applyCalculatedFringes(db, productionId, positionResults);

    // Recalculate production totals
    await db.query(`
      UPDATE productions p
      SET total_budget = (
        SELECT COALESCE(SUM(total), 0)
        FROM budget_line_items
        WHERE production_id = p.id
      ),
      updated_at = NOW()
      WHERE id = $1
    `, [productionId]);

    res.json({
      success: true,
      ...result,
      message: `Applied fringes to ${result.updated} line items`
    });
  } catch (error) {
    aiLogger.error('Apply fringes failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick estimate for a single position (real-time preview)
app.post('/api/ai/fringes/estimate', async (req, res) => {
  try {
    const { unionLocal, rate, rateType, schedule } = req.body;

    if (!rate || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'rate and schedule are required'
      });
    }

    const result = await estimatePositionFringes(
      db,
      unionLocal || 'Non-Union',
      parseFloat(rate),
      rateType || 'weekly',
      schedule
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    aiLogger.error('Fringe estimate failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get default fringe rates by union type
app.get('/api/ai/fringes/rates', async (req, res) => {
  try {
    const { unionLocal, state } = req.query;

    if (unionLocal) {
      const rates = await getFringeRates(db, unionLocal, state || 'CA');
      res.json({
        success: true,
        unionLocal,
        rates
      });
    } else {
      // Return all default rates
      res.json({
        success: true,
        rates: DEFAULT_FRINGE_RATES
      });
    }
  } catch (error) {
    aiLogger.error('Get fringe rates failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Audit existing fringes against calculated values
app.post('/api/ai/fringes/audit/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { schedule } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule is required for audit'
      });
    }

    aiLogger.info('Fringe audit requested', { productionId });

    const result = await calculateProductionFringes(db, productionId, schedule);

    // Format as audit report
    const audit = {
      success: true,
      productionId,
      productionName: result.productionName,
      summary: {
        totalPositions: result.summary.totalPositions,
        positionsWithDiscrepancies: result.summary.positionsWithDiscrepancies,
        calculatedFringes: result.summary.totalCalculatedFringes,
        enteredFringes: result.summary.totalEnteredFringes,
        difference: result.summary.totalDifference,
        averageEffectiveRate: result.summary.averageEffectiveRate + '%'
      },
      discrepancies: result.discrepancies.map(d => ({
        position: d.position,
        union: d.union,
        entered: d.enteredFringes,
        calculated: d.totals.totalFringes,
        difference: d.difference,
        effectiveRate: d.totals.effectiveRate + '%'
      })),
      byUnion: result.summary.byUnion,
      recommendation: result.summary.positionsWithDiscrepancies > 0
        ? `${result.summary.positionsWithDiscrepancies} position(s) have fringe discrepancies totaling $${Math.abs(result.summary.totalDifference).toFixed(2)}. Consider applying calculated fringes.`
        : 'All fringe calculations match entered values within tolerance.'
    };

    res.json(audit);
  } catch (error) {
    aiLogger.error('Fringe audit failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// API ROUTES - CREW TEMPLATES
// ============================================================================

// Get all crew templates
app.get('/api/crew-templates', async (req, res) => {
  try {
    const { category, production_type } = req.query;

    let query = `SELECT * FROM crew_templates WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (production_type) {
      query += ` AND production_type = $${paramCount++}`;
      params.push(production_type);
    }

    query += ` ORDER BY category, name`;

    const result = await db.query(query, params);

    // Get unique categories for filtering
    const categories = await db.query(`SELECT DISTINCT category FROM crew_templates ORDER BY category`);

    res.json({
      success: true,
      count: result.rows.length,
      categories: categories.rows.map(r => r.category),
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching crew templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a single crew template by ID
app.get('/api/crew-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM crew_templates WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching crew template:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

    let query = `SELECT * FROM tax_incentives WHERE 1=1`;
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

    query += ` ORDER BY state`;

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

// Initialize default globals for a production
app.post('/api/productions/:production_id/globals/initialize', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { production_type } = req.body;

    // Default globals based on production type (following Movie Magic Budgeting workflow)
    const defaultGlobals = {
      // Production Group - Common to all
      common: [
        { name: 'PREP_DAYS', value: 14, description: 'Number of prep days', global_group: 'Production' },
        { name: 'SHOOT_DAYS', value: 20, description: 'Number of shooting days', global_group: 'Production' },
        { name: 'WRAP_DAYS', value: 5, description: 'Number of wrap days', global_group: 'Production' },
        { name: 'POST_WEEKS', value: 8, description: 'Weeks of post-production', global_group: 'Production' },
        { name: 'TRAVEL_DAYS', value: 2, description: 'Travel/load days per location', global_group: 'Production' },
        { name: 'HOLIDAY_DAYS', value: 0, description: 'Holiday days during production', global_group: 'Production' },
      ],
      // Rates Group
      rates: [
        { name: 'OVERTIME_MULT_1_5', value: 1.5, description: 'Overtime multiplier (1.5x)', global_group: 'Rates' },
        { name: 'OVERTIME_MULT_2', value: 2.0, description: 'Double time multiplier', global_group: 'Rates' },
        { name: 'GOLDEN_TIME_MULT', value: 2.5, description: 'Golden time multiplier', global_group: 'Rates' },
        { name: 'KIT_RENTAL_WEEKLY', value: 100, description: 'Standard kit rental per week', global_group: 'Rates' },
        { name: 'CAR_ALLOWANCE_DAILY', value: 35, description: 'Car allowance per day', global_group: 'Rates' },
        { name: 'CELL_ALLOWANCE_WEEKLY', value: 50, description: 'Cell phone allowance per week', global_group: 'Rates' },
      ],
      // Fringes Group
      fringes: [
        { name: 'PAYROLL_TAX_PCT', value: 15, description: 'Payroll taxes percentage', global_group: 'Fringes' },
        { name: 'HEALTH_WELFARE_PCT', value: 8.5, description: 'Health & Welfare percentage', global_group: 'Fringes' },
        { name: 'PENSION_PCT', value: 8.0, description: 'Pension contribution percentage', global_group: 'Fringes' },
        { name: 'WORKERS_COMP_PCT', value: 5.5, description: 'Workers comp percentage', global_group: 'Fringes' },
      ],
      // TV Series specific
      tv_series: [
        { name: 'NUM_EPISODES', value: 10, description: 'Number of episodes in order', global_group: 'Production' },
        { name: 'SHOOT_DAYS_PER_EP', value: 8, description: 'Shooting days per episode', global_group: 'Production' },
        { name: 'EP_PATTERN', value: 1, description: 'Episodes shot per block', global_group: 'Production' },
      ],
      // Feature Film specific
      feature: [
        { name: 'PRINCIPAL_DAYS', value: 35, description: 'Principal photography days', global_group: 'Production' },
        { name: 'SECOND_UNIT_DAYS', value: 10, description: 'Second unit days', global_group: 'Production' },
        { name: 'VFX_SHOTS', value: 200, description: 'Number of VFX shots', global_group: 'Production' },
      ],
    };

    // Select which globals to create based on production type
    let globalsToCreate = [...defaultGlobals.common, ...defaultGlobals.rates, ...defaultGlobals.fringes];

    if (production_type === 'tv_series' || production_type === 'episodic') {
      globalsToCreate = [...globalsToCreate, ...defaultGlobals.tv_series];
    } else if (production_type === 'feature' || production_type === 'theatrical') {
      globalsToCreate = [...globalsToCreate, ...defaultGlobals.feature];
    }

    let created = 0;
    let skipped = 0;

    for (const global of globalsToCreate) {
      // Check if global already exists
      const existing = await db.query(
        'SELECT id FROM globals WHERE production_id = $1 AND name = $2',
        [production_id, global.name]
      );

      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO globals (production_id, name, value, precision, description, global_group)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [production_id, global.name, global.value, 2, global.description, global.global_group]
        );
        created++;
      } else {
        skipped++;
      }
    }

    // Also initialize default budget groups
    const defaultGroups = [
      { name: 'Prep', description: 'Pre-production period', color: '#3B82F6', sort_order: 1 },
      { name: 'Shoot', description: 'Principal photography', color: '#10B981', sort_order: 2 },
      { name: 'Wrap', description: 'Wrap and strike period', color: '#F59E0B', sort_order: 3 },
      { name: 'Post-Production', description: 'Post-production period', color: '#8B5CF6', sort_order: 4 },
      { name: 'Idle', description: 'Idle/hiatus periods', color: '#6B7280', sort_order: 5, include_in_total: false },
    ];

    let groupsCreated = 0;
    for (const group of defaultGroups) {
      const existing = await db.query(
        'SELECT id FROM budget_groups WHERE production_id = $1 AND name = $2',
        [production_id, group.name]
      );

      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO budget_groups (production_id, name, description, color, sort_order, include_in_total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [production_id, group.name, group.description, group.color, group.sort_order, group.include_in_total !== false]
        );
        groupsCreated++;
      }
    }

    res.json({
      success: true,
      message: 'Default globals and groups initialized',
      globals: { created, skipped },
      groups: { created: groupsCreated },
    });
  } catch (error) {
    console.error('Error initializing globals:', error);
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
      // Agreement fields (new)
      iatse_agreement_id,
      sag_aftra_agreement_id,
      dga_agreement_id,
      wga_agreement_id,
      teamsters_agreement_id,
      applied_sideletters,
      is_union_signatory,
      agreement_notes,
    } = req.body;

    const result = await db.query(
      `INSERT INTO productions
       (name, production_type, distribution_platform, shooting_location, state,
        budget_target, episode_count, episode_length_minutes, season_number, principal_photography_start,
        iatse_agreement_id, sag_aftra_agreement_id, dga_agreement_id, wga_agreement_id, teamsters_agreement_id,
        applied_sideletters, is_union_signatory, agreement_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [name, production_type, distribution_platform, shooting_location, state,
       budget_target, episode_count, episode_length_minutes, season_number, principal_photography_start,
       iatse_agreement_id || null, sag_aftra_agreement_id || null, dga_agreement_id || null,
       wga_agreement_id || null, teamsters_agreement_id || null,
       JSON.stringify(applied_sideletters || []), is_union_signatory !== false, agreement_notes || null]
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
      'SELECT * FROM productions ORDER BY created_at DESC'
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

// Update production by ID
app.put('/api/productions/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      iatse_agreement_id,
      sag_aftra_agreement_id,
      dga_agreement_id,
      wga_agreement_id,
      teamsters_agreement_id,
      applied_sideletters,
      is_union_signatory,
      agreement_notes,
    } = req.body;

    // Check if production exists
    const checkResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found',
      });
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (production_type !== undefined) { updates.push(`production_type = $${paramCount++}`); values.push(production_type); }
    if (distribution_platform !== undefined) { updates.push(`distribution_platform = $${paramCount++}`); values.push(distribution_platform); }
    if (shooting_location !== undefined) { updates.push(`shooting_location = $${paramCount++}`); values.push(shooting_location); }
    if (state !== undefined) { updates.push(`state = $${paramCount++}`); values.push(state); }
    if (budget_target !== undefined) { updates.push(`budget_target = $${paramCount++}`); values.push(budget_target); }
    if (episode_count !== undefined) { updates.push(`episode_count = $${paramCount++}`); values.push(episode_count); }
    if (episode_length_minutes !== undefined) { updates.push(`episode_length_minutes = $${paramCount++}`); values.push(episode_length_minutes); }
    if (season_number !== undefined) { updates.push(`season_number = $${paramCount++}`); values.push(season_number); }
    if (principal_photography_start !== undefined) { updates.push(`principal_photography_start = $${paramCount++}`); values.push(principal_photography_start); }
    if (iatse_agreement_id !== undefined) { updates.push(`iatse_agreement_id = $${paramCount++}`); values.push(iatse_agreement_id); }
    if (sag_aftra_agreement_id !== undefined) { updates.push(`sag_aftra_agreement_id = $${paramCount++}`); values.push(sag_aftra_agreement_id); }
    if (dga_agreement_id !== undefined) { updates.push(`dga_agreement_id = $${paramCount++}`); values.push(dga_agreement_id); }
    if (wga_agreement_id !== undefined) { updates.push(`wga_agreement_id = $${paramCount++}`); values.push(wga_agreement_id); }
    if (teamsters_agreement_id !== undefined) { updates.push(`teamsters_agreement_id = $${paramCount++}`); values.push(teamsters_agreement_id); }
    if (applied_sideletters !== undefined) { updates.push(`applied_sideletters = $${paramCount++}`); values.push(JSON.stringify(applied_sideletters)); }
    if (is_union_signatory !== undefined) { updates.push(`is_union_signatory = $${paramCount++}`); values.push(is_union_signatory); }
    if (agreement_notes !== undefined) { updates.push(`agreement_notes = $${paramCount++}`); values.push(agreement_notes); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE productions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating production:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete production by ID
app.delete('/api/productions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if production exists
    const checkResult = await db.query(
      'SELECT id FROM productions WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found',
      });
    }

    // Delete related line items first (CASCADE should handle this, but being explicit)
    await db.query('DELETE FROM budget_line_items WHERE production_id = $1', [id]);

    // Delete the production
    await db.query('DELETE FROM productions WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Production deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting production:', error);
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
// API ROUTES - BUDGET LINE ITEMS
// ============================================================================

// Get all line items for a production with calculated totals
app.get('/api/productions/:production_id/line-items', async (req, res) => {
  try {
    const { production_id } = req.params;

    const result = await db.query(`
      SELECT
        bli.*,
        cp.position_title,
        cp.union_local,
        cp.department
      FROM budget_line_items bli
      LEFT JOIN crew_positions cp ON bli.position_id = cp.id
      WHERE bli.production_id = $1
      ORDER BY bli.account_code, bli.created_at
    `, [production_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching line items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new budget line item with automatic rate lookup and fringe calculation
app.post('/api/productions/:production_id/line-items', async (req, res) => {
  try {
    const { production_id } = req.params;
    const {
      account_code,
      description,
      position_id,
      quantity,
      rate_override,  // Optional: override automatic rate lookup
      union_local,
      job_classification,
      location,
      production_type,
      notes,
      // Multi-period support
      use_periods,
      periods,
      // Box rental support
      use_box_rental,
      box_rental
    } = req.body;

    // Get production details
    const prodResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [production_id]
    );

    if (prodResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found'
      });
    }

    const production = prodResult.rows[0];
    let finalRate = rate_override;
    let baseRate = null;
    let sideletterAdjustment = 0;
    let appliedSideletter = null;

    // If no rate override, look up rate from rate_cards
    if (!finalRate && union_local && job_classification) {
      const rateResult = await db.query(`
        SELECT base_rate, rate_type
        FROM current_rate_cards
        WHERE union_local = $1
          AND job_classification = $2
          AND (location = $3 OR location IS NULL)
          AND (production_type = $4 OR production_type IS NULL)
        ORDER BY
          CASE WHEN location = $3 THEN 1 ELSE 2 END,
          CASE WHEN production_type = $4 THEN 1 ELSE 2 END
        LIMIT 1
      `, [
        union_local,
        job_classification,
        location || production.shooting_location,
        production_type || production.production_type
      ]);

      if (rateResult.rows.length > 0) {
        baseRate = rateResult.rows[0].base_rate;
        finalRate = baseRate;
      }
    }

    // Apply sideletter wage adjustment if production has applied_sideletters
    // and this is a union position (not rate_override)
    if (finalRate && !rate_override && production.is_union_signatory && production.applied_sideletters) {
      let sideletters = production.applied_sideletters;
      if (typeof sideletters === 'string') {
        try {
          sideletters = JSON.parse(sideletters);
        } catch (e) {
          sideletters = [];
        }
      }

      // Find the most relevant sideletter for this position
      // Priority: exact production_type match > general sideletter
      for (const sl of sideletters) {
        if (sl.wage_adjustment_pct && sl.wage_adjustment_pct !== 0) {
          // Apply the wage adjustment (negative = discount, e.g., -3% = 97% of rate)
          const adjustmentPct = parseFloat(sl.wage_adjustment_pct);
          const adjustmentMultiplier = 1 + (adjustmentPct / 100);
          sideletterAdjustment = finalRate * (adjustmentPct / 100);
          finalRate = finalRate * adjustmentMultiplier;
          appliedSideletter = sl.sideletter_name || sl.sideletter_id;
          break; // Apply first matching sideletter
        }
      }
    }

    // Calculate subtotal (different logic for period-based vs simple)
    let subtotal = 0;

    if (use_periods && periods) {
      // Multi-period calculation: sum all periods
      // Formula per period: days × hours_per_day × rate
      for (const periodName of ['prep', 'shoot', 'hiatus', 'wrap', 'holiday']) {
        const period = periods[periodName] || {};
        const periodDays = period.days || 0;
        const periodHours = period.hours_per_day || 0;
        const periodRate = period.rate || finalRate || 0;

        subtotal += periodDays * periodHours * periodRate;
      }
    } else {
      // Simple calculation: rate × quantity
      subtotal = (finalRate || 0) * (quantity || 0);
    }

    // Calculate box rental if applicable
    let box_rental_amount = 0;
    if (use_box_rental && box_rental) {
      const weekly_rate = box_rental.weekly_rate || 0;
      const weeks = box_rental.weeks || 0;
      const cap_amount = box_rental.cap_amount || 1000;

      box_rental_amount = weekly_rate * weeks;
      if (box_rental_amount > cap_amount) {
        box_rental_amount = cap_amount;
      }
    }

    // Add box rental to subtotal
    subtotal += box_rental_amount;

    // Calculate fringes (get applicable fringe benefits)
    let totalFringes = 0;
    if (union_local) {
      const fringeResult = await db.query(`
        SELECT benefit_type, rate_type, rate_value
        FROM fringe_benefits
        WHERE union_local = $1
          AND (state = $2 OR state IS NULL)
        ORDER BY effective_date DESC
      `, [union_local, production.state]);

      for (const fringe of fringeResult.rows) {
        if (fringe.rate_type === 'percentage') {
          totalFringes += subtotal * (fringe.rate_value / 100);
        } else {
          totalFringes += fringe.rate_value;
        }
      }
    }

    // Calculate total
    const total = subtotal + totalFringes;

    // Insert line item
    const insertResult = await db.query(`
      INSERT INTO budget_line_items (
        production_id,
        account_code,
        description,
        position_id,
        quantity,
        rate,
        subtotal,
        fringes,
        total,
        notes,
        use_periods,
        periods,
        use_box_rental,
        box_rental
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      production_id,
      account_code,
      description,
      position_id,
      quantity,
      finalRate,
      subtotal,
      totalFringes,
      total,
      notes,
      use_periods || false,
      periods ? JSON.stringify(periods) : null,
      use_box_rental || false,
      box_rental ? JSON.stringify(box_rental) : null
    ]);

    res.json({
      success: true,
      data: insertResult.rows[0],
      calculations: {
        rate_used: finalRate,
        base_rate: baseRate,
        sideletter_adjustment: sideletterAdjustment,
        applied_sideletter: appliedSideletter,
        subtotal,
        fringes: totalFringes,
        total,
        box_rental_amount,
        period_breakdown: use_periods ? periods : null
      }
    });
  } catch (error) {
    console.error('Error creating line item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a budget line item
app.put('/api/line-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      account_code,
      description,
      quantity,
      rate,
      notes
    } = req.body;

    // Recalculate totals
    const subtotal = (rate || 0) * (quantity || 0);

    // Get existing line item to get production and union info
    const existingResult = await db.query(`
      SELECT bli.*, cp.union_local, p.state
      FROM budget_line_items bli
      LEFT JOIN crew_positions cp ON bli.position_id = cp.id
      LEFT JOIN productions p ON bli.production_id = p.id
      WHERE bli.id = $1
    `, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Line item not found'
      });
    }

    const existing = existingResult.rows[0];
    let totalFringes = 0;

    // Recalculate fringes
    if (existing.union_local) {
      const fringeResult = await db.query(`
        SELECT benefit_type, rate_type, rate_value
        FROM fringe_benefits
        WHERE union_local = $1
          AND (state = $2 OR state IS NULL)
        ORDER BY effective_date DESC
      `, [existing.union_local, existing.state]);

      for (const fringe of fringeResult.rows) {
        if (fringe.rate_type === 'percentage') {
          totalFringes += subtotal * (fringe.rate_value / 100);
        } else {
          totalFringes += fringe.rate_value;
        }
      }
    }

    const total = subtotal + totalFringes;

    // Update line item
    const updateResult = await db.query(`
      UPDATE budget_line_items
      SET
        account_code = COALESCE($1, account_code),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        rate = COALESCE($4, rate),
        subtotal = $5,
        fringes = $6,
        total = $7,
        notes = COALESCE($8, notes)
      WHERE id = $9
      RETURNING *
    `, [
      account_code,
      description,
      quantity,
      rate,
      subtotal,
      totalFringes,
      total,
      notes,
      id
    ]);

    res.json({
      success: true,
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating line item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a budget line item
app.delete('/api/line-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM budget_line_items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Line item not found'
      });
    }

    res.json({
      success: true,
      message: 'Line item deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting line item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get production budget summary with ATL/BTL grouping
app.get('/api/productions/:production_id/budget-summary', async (req, res) => {
  try {
    const { production_id } = req.params;

    // Get production details
    const prodResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [production_id]
    );

    if (prodResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found'
      });
    }

    // Get line items grouped by department/account code
    const lineItemsResult = await db.query(`
      SELECT
        bli.*,
        cp.position_title,
        cp.union_local,
        cp.department,
        cp.atl_or_btl,
        cp.account_code as position_account_code
      FROM budget_line_items bli
      LEFT JOIN crew_positions cp ON bli.position_id = cp.id
      WHERE bli.production_id = $1
      ORDER BY bli.account_code, bli.created_at
    `, [production_id]);

    // Group by ATL/BTL
    const groups = {
      atl: [],
      btl: [],
      other: []
    };

    let totalATL = 0;
    let totalBTL = 0;
    let totalOther = 0;

    for (const item of lineItemsResult.rows) {
      if (item.atl_or_btl === 'ATL') {
        groups.atl.push(item);
        totalATL += parseFloat(item.total || 0);
      } else if (item.atl_or_btl === 'BTL') {
        groups.btl.push(item);
        totalBTL += parseFloat(item.total || 0);
      } else {
        groups.other.push(item);
        totalOther += parseFloat(item.total || 0);
      }
    }

    const grandTotal = totalATL + totalBTL + totalOther;

    res.json({
      success: true,
      production: prodResult.rows[0],
      groups,
      totals: {
        atl: totalATL,
        btl: totalBTL,
        other: totalOther,
        grand_total: grandTotal
      },
      line_item_count: lineItemsResult.rows.length
    });
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// API ROUTES - LOCATION COMPARISON
// ============================================================================

// Get location comparison data from analyzed budgets
app.get('/api/location-comparison', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(__dirname, 'data/budget_summaries.csv');

    // Read CSV file
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    // Parse CSV data
    const budgets = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        filename: values[0],
        location: values[1],
        grand_total: parseFloat(values[2]) || 0,
        atl_total: parseFloat(values[3]) || 0,
        btl_total: parseFloat(values[4]) || 0,
        other_total: parseFloat(values[5]) || 0,
        production_total: parseFloat(values[6]) || 0,
        post_total: parseFloat(values[7]) || 0
      };
    }).filter(b => b.grand_total > 0 && b.location && b.location !== 'Unknown');

    // Group by location and calculate averages
    const locationStats = {};
    budgets.forEach(budget => {
      if (!locationStats[budget.location]) {
        locationStats[budget.location] = {
          location: budget.location,
          budgets: [],
          avg_total: 0,
          avg_atl: 0,
          avg_btl: 0,
          atl_percentage: 0,
          btl_percentage: 0,
          count: 0
        };
      }
      locationStats[budget.location].budgets.push(budget);
    });

    // Calculate statistics
    Object.values(locationStats).forEach(loc => {
      loc.count = loc.budgets.length;
      loc.avg_total = loc.budgets.reduce((sum, b) => sum + b.grand_total, 0) / loc.count;
      loc.avg_atl = loc.budgets.reduce((sum, b) => sum + b.atl_total, 0) / loc.count;
      loc.avg_btl = loc.budgets.reduce((sum, b) => sum + b.btl_total, 0) / loc.count;
      loc.atl_percentage = (loc.avg_atl / loc.avg_total) * 100;
      loc.btl_percentage = (loc.avg_btl / loc.avg_total) * 100;
    });

    // Sort by cost (cheapest first)
    const sorted = Object.values(locationStats).sort((a, b) => a.avg_total - b.avg_total);

    res.json({
      success: true,
      locations: sorted,
      total_budgets_analyzed: budgets.length,
      location_count: sorted.length
    });
  } catch (error) {
    console.error('Error loading location comparison:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Compare specific locations with recommendations
app.post('/api/location-comparison/compare', async (req, res) => {
  try {
    const { locations, budget_size } = req.body;

    if (!locations || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one location is required'
      });
    }

    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(__dirname, 'data/budget_summaries.csv');

    // Read and parse CSV
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());

    const budgets = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        location: values[1],
        grand_total: parseFloat(values[2]) || 0,
        atl_total: parseFloat(values[3]) || 0,
        btl_total: parseFloat(values[4]) || 0,
        other_total: parseFloat(values[5]) || 0
      };
    }).filter(b =>
      b.grand_total > 0 &&
      b.location &&
      locations.includes(b.location)
    );

    // Calculate averages per location
    const comparison = {};
    budgets.forEach(budget => {
      if (!comparison[budget.location]) {
        comparison[budget.location] = {
          location: budget.location,
          totals: [],
          avg_total: 0,
          avg_atl: 0,
          avg_btl: 0,
          atl_percentage: 0
        };
      }
      comparison[budget.location].totals.push(budget.grand_total);
      comparison[budget.location].avg_total += budget.grand_total;
      comparison[budget.location].avg_atl += budget.atl_total;
      comparison[budget.location].avg_btl += budget.btl_total;
    });

    Object.values(comparison).forEach(loc => {
      const count = loc.totals.length;
      loc.avg_total /= count;
      loc.avg_atl /= count;
      loc.avg_btl /= count;
      loc.atl_percentage = (loc.avg_atl / loc.avg_total) * 100;
      loc.budget_count = count;
    });

    // Sort by cost
    const sorted = Object.values(comparison).sort((a, b) => a.avg_total - b.avg_total);

    // Calculate savings
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    const savings = mostExpensive.avg_total - cheapest.avg_total;
    const savingsPercent = (savings / mostExpensive.avg_total) * 100;

    // Generate recommendation
    let recommendation = '';
    if (budget_size) {
      const closestMatch = sorted.reduce((prev, curr) => {
        return Math.abs(curr.avg_total - budget_size) < Math.abs(prev.avg_total - budget_size) ? curr : prev;
      });
      recommendation = `For a $${(budget_size / 1000000).toFixed(1)}M budget, ${closestMatch.location} (avg: $${(closestMatch.avg_total / 1000000).toFixed(2)}M) is the closest match. ${cheapest.location} offers the best value at $${(cheapest.avg_total / 1000000).toFixed(2)}M average.`;
    } else {
      recommendation = `${cheapest.location} offers the lowest production costs at $${(cheapest.avg_total / 1000000).toFixed(2)}M average, saving $${(savings / 1000000).toFixed(2)}M (${savingsPercent.toFixed(1)}%) vs ${mostExpensive.location}.`;
    }

    res.json({
      success: true,
      comparison: sorted,
      cheapest: cheapest.location,
      most_expensive: mostExpensive.location,
      savings: {
        amount: savings,
        percent: savingsPercent
      },
      recommendation,
      budget_count: budgets.length
    });
  } catch (error) {
    console.error('Error comparing locations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// API ROUTES - BUDGET TEMPLATES
// ============================================================================

// Get all templates (with optional filtering)
app.get('/api/templates', async (req, res) => {
  const startTime = Date.now();
  const { location, production_type, budget_min, budget_max } = req.query;

  templateLogger.info('Fetching templates', {
    location,
    production_type,
    budget_min,
    budget_max
  });

  try {
    let query = `
      SELECT
        id,
        name,
        location,
        production_type,
        total_budget,
        department_count,
        line_item_count,
        completeness_score,
        shoot_days
      FROM budget_templates
      WHERE is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (location) {
      query += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (production_type) {
      query += ` AND production_type = $${paramIndex}`;
      params.push(production_type);
      paramIndex++;
    }

    if (budget_min) {
      query += ` AND total_budget >= $${paramIndex}`;
      params.push(parseFloat(budget_min));
      paramIndex++;
    }

    if (budget_max) {
      query += ` AND total_budget <= $${paramIndex}`;
      params.push(parseFloat(budget_max));
      paramIndex++;
    }

    query += ` ORDER BY completeness_score DESC, line_item_count DESC`;

    dbLogger.debug('Template query', {
      query: query.substring(0, 200),
      params
    });

    const result = await db.query(query, params);
    const executionTime = Date.now() - startTime;

    templateLogger.info('Templates fetched successfully', {
      count: result.rows.length,
      execution_time_ms: executionTime,
      filters_applied: { location, production_type, budget_min, budget_max }
    });

    res.json({
      success: true,
      templates: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    templateLogger.error('Failed to fetch templates', error, {
      location,
      production_type,
      budget_min,
      budget_max,
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get template by ID with full details
app.get('/api/templates/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  templateLogger.info('Fetching template by ID', { template_id: id });

  try {
    // Get template metadata
    const templateResult = await db.query(`
      SELECT * FROM budget_templates WHERE id = $1 AND is_active = true
    `, [id]);

    if (templateResult.rows.length === 0) {
      templateLogger.warn('Template not found', { template_id: id });
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const template = templateResult.rows[0];

    templateLogger.debug('Template metadata retrieved', {
      template_id: id,
      name: template.name,
      location: template.location,
      department_count: template.department_count
    });

    // Get departments with line items
    const deptResult = await db.query(`
      SELECT
        d.id,
        d.name,
        d.account,
        d.total,
        d.sort_order
      FROM template_departments d
      WHERE d.template_id = $1
      ORDER BY d.sort_order
    `, [id]);

    // Get line items for each department
    for (const dept of deptResult.rows) {
      const itemsResult = await db.query(`
        SELECT
          account,
          description,
          position,
          quantity,
          unit,
          rate,
          subtotal,
          total,
          detail_lines,
          periods
        FROM template_line_items
        WHERE department_id = $1
        ORDER BY sort_order
      `, [dept.id]);

      dept.line_items = itemsResult.rows;
    }

    template.departments = deptResult.rows;
    const executionTime = Date.now() - startTime;

    templateLogger.info('Template fetched successfully', {
      template_id: id,
      name: template.name,
      department_count: deptResult.rows.length,
      total_line_items: deptResult.rows.reduce((sum, d) => sum + (d.line_items?.length || 0), 0),
      execution_time_ms: executionTime
    });

    res.json({
      success: true,
      template: template
    });
  } catch (error) {
    templateLogger.error('Failed to fetch template', error, {
      template_id: id,
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply template to production (creates budget groups and line items)
app.post('/api/productions/:production_id/apply-template', async (req, res) => {
  const startTime = Date.now();
  const { production_id } = req.params;
  const { template_id, scale_to_budget } = req.body;

  templateLogger.info('Applying template to production', {
    production_id,
    template_id,
    scale_to_budget
  });

  let groupsCreated = 0;
  let itemsCreated = 0;

  try {
    // Validate input
    if (!template_id) {
      templateLogger.warn('Template application attempted without template_id', {
        production_id
      });
      return res.status(400).json({
        success: false,
        error: 'template_id is required'
      });
    }

    // Get template with full details
    templateLogger.debug('Fetching template data', { template_id });

    const templateResult = await db.query(`
      SELECT template_data FROM budget_templates WHERE id = $1 AND is_active = true
    `, [template_id]);

    if (templateResult.rows.length === 0) {
      templateLogger.warn('Template not found for application', {
        template_id,
        production_id
      });
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const templateData = templateResult.rows[0].template_data;
    const departments = templateData.departments || [];

    templateLogger.info('Template data loaded', {
      template_id,
      department_count: departments.length
    });

    // Calculate scaling factor if requested
    let scaleFactor = 1.0;
    if (scale_to_budget && templateData.metadata && templateData.metadata.total_budget) {
      const originalBudget = templateData.metadata.total_budget;
      scaleFactor = scale_to_budget / originalBudget;

      templateLogger.info('Applying budget scaling', {
        original_budget: originalBudget,
        target_budget: scale_to_budget,
        scale_factor: scaleFactor.toFixed(4)
      });
    }

    // Create groups and line items from template
    for (const [index, dept] of departments.entries()) {
      templateLogger.debug('Creating department', {
        production_id,
        department_name: dept.name,
        index: index + 1,
        total: departments.length
      });

      try {
        // Create budget group
        const groupResult = await db.query(`
          INSERT INTO budget_groups (production_id, name, account_number, sort_order)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [production_id, dept.name, dept.account, groupsCreated]);

        const groupId = groupResult.rows[0].id;
        groupsCreated++;

        // Create line items
        for (const item of dept.line_items || []) {
          const scaledRate = item.rate ? item.rate * scaleFactor : 0;
          const scaledSubtotal = item.subtotal ? item.subtotal * scaleFactor : 0;

          try {
            await db.query(`
              INSERT INTO budget_line_items (
                production_id,
                group_id,
                account_number,
                description,
                quantity,
                unit,
                rate,
                rate_override,
                subtotal,
                fringe_total,
                total
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              production_id,
              groupId,
              item.account,
              item.description || item.position,
              item.quantity || 0,
              item.unit,
              0, // base rate (will use override)
              scaledRate, // rate_override
              scaledSubtotal,
              0, // fringe_total (will be calculated)
              scaledSubtotal // total
            ]);

            itemsCreated++;
          } catch (itemError) {
            templateLogger.error('Failed to create line item', itemError, {
              production_id,
              group_id: groupId,
              item_description: item.description,
              department: dept.name
            });
            // Continue with other items
          }
        }

        templateLogger.debug('Department created', {
          production_id,
          department_name: dept.name,
          group_id: groupId,
          items_created: dept.line_items?.length || 0
        });
      } catch (deptError) {
        templateLogger.error('Failed to create department', deptError, {
          production_id,
          department_name: dept.name,
          index: index + 1
        });
        // Continue with other departments
      }
    }

    const executionTime = Date.now() - startTime;

    templateLogger.info('Template applied successfully', {
      production_id,
      template_id,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      execution_time_ms: executionTime,
      scale_factor: scaleFactor.toFixed(4)
    });

    res.json({
      success: true,
      message: `Applied template successfully`,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      scale_factor: scaleFactor.toFixed(4)
    });
  } catch (error) {
    templateLogger.error('Template application failed', error, {
      production_id,
      template_id,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get position rate suggestions by location
app.get('/api/templates/rates/:position', async (req, res) => {
  const startTime = Date.now();
  const { position } = req.params;
  const { location } = req.query;

  templateLogger.info('Fetching position rate suggestions', {
    position,
    location
  });

  try {
    let query = `
      SELECT
        position,
        location,
        unit,
        avg_rate,
        min_rate,
        max_rate,
        sample_count
      FROM position_rates_by_location
      WHERE position ILIKE $1
    `;

    const params = [`%${position}%`];

    if (location) {
      query += ` AND location ILIKE $2`;
      params.push(`%${location}%`);
    }

    query += ` ORDER BY sample_count DESC, avg_rate DESC LIMIT 10`;

    const result = await db.query(query, params);
    const executionTime = Date.now() - startTime;

    templateLogger.info('Rate suggestions fetched successfully', {
      position,
      location,
      count: result.rows.length,
      execution_time_ms: executionTime
    });

    res.json({
      success: true,
      rates: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    templateLogger.error('Failed to fetch rate suggestions', error, {
      position,
      location,
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get template statistics
app.get('/api/templates/stats', async (req, res) => {
  const startTime = Date.now();

  templateLogger.info('Fetching template statistics');

  try {
    const statsResult = await db.query(`
      SELECT
        location,
        COUNT(*) as template_count,
        AVG(total_budget)::DECIMAL(12,2) as avg_budget,
        MIN(total_budget)::DECIMAL(12,2) as min_budget,
        MAX(total_budget)::DECIMAL(12,2) as max_budget,
        SUM(line_item_count) as total_items
      FROM budget_templates
      WHERE is_active = true AND total_budget > 0
      GROUP BY location
      ORDER BY avg_budget
    `);

    const overallResult = await db.query(`
      SELECT
        COUNT(*) as total_templates,
        SUM(department_count) as total_departments,
        SUM(line_item_count) as total_items,
        AVG(completeness_score)::DECIMAL(5,2) as avg_completeness
      FROM budget_templates
      WHERE is_active = true
    `);

    const executionTime = Date.now() - startTime;

    templateLogger.info('Template statistics fetched successfully', {
      location_count: statsResult.rows.length,
      total_templates: overallResult.rows[0]?.total_templates || 0,
      execution_time_ms: executionTime
    });

    res.json({
      success: true,
      by_location: statsResult.rows,
      overall: overallResult.rows[0]
    });
  } catch (error) {
    templateLogger.error('Failed to fetch template statistics', error, {
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// API ROUTES - AI BUDGET GENERATOR
// ============================================================================

// Generate budget from natural language
app.post('/api/ai/generate-budget', async (req, res) => {
  const startTime = Date.now();
  const { production_id, prompt } = req.body;

  aiLogger.info('AI budget generation requested', {
    production_id,
    prompt
  });

  try {
    // Validate input
    if (!production_id) {
      aiLogger.warn('Missing production_id');
      return res.status(400).json({
        success: false,
        error: 'production_id is required'
      });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      aiLogger.warn('Invalid or missing prompt');
      return res.status(400).json({
        success: false,
        error: 'prompt is required and must be a non-empty string'
      });
    }

    // Generate budget using AI
    const result = await generateBudget(db, production_id, prompt);

    const executionTime = Date.now() - startTime;

    aiLogger.info('AI budget generated successfully', {
      production_id,
      template_id: result.template_used.id,
      groups_created: result.groups_created,
      items_created: result.items_created,
      execution_time_ms: executionTime
    });

    res.json(result);
  } catch (error) {
    const executionTime = Date.now() - startTime;

    aiLogger.error('AI budget generation failed', error, {
      production_id,
      prompt,
      execution_time_ms: executionTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Parse natural language (for testing/preview)
app.post('/api/ai/parse', async (req, res) => {
  const { prompt } = req.body;

  aiLogger.info('Natural language parse requested', { prompt });

  try {
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    const parsed = parseNaturalLanguage(prompt);

    aiLogger.info('Natural language parsed', parsed);

    res.json({
      success: true,
      ...parsed
    });
  } catch (error) {
    aiLogger.error('Natural language parsing failed', error, {
      prompt
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SMART CREW BUILDER API
// ============================================================================

// Get available production types and their configurations
app.get('/api/ai/crew/production-types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: PRODUCTION_CONFIGS
    });
  } catch (error) {
    aiLogger.error('Failed to get production types', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recommend crew based on production parameters
app.post('/api/ai/crew/recommend', async (req, res) => {
  try {
    const { prompt, productionType, budget, shootDays, location, episodeCount } = req.body;

    aiLogger.info('Crew recommendation request', { productionType, budget, shootDays, location });

    // Parse natural language prompt if provided
    let params = {};
    if (prompt) {
      params = parseCrewRequest(prompt);
    }

    // Override with explicit parameters
    if (productionType) params.productionType = productionType;
    if (budget) params.budget = budget;
    if (shootDays) params.shootDays = shootDays;
    if (location) params.location = location;
    if (episodeCount) params.episodeCount = episodeCount;

    const result = await recommendCrew(db, params);

    res.json(result);
  } catch (error) {
    aiLogger.error('Crew recommendation failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Parse crew request (preview mode)
app.post('/api/ai/crew/parse', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const parsed = parseCrewRequest(prompt);

    res.json({
      success: true,
      parsed
    });
  } catch (error) {
    aiLogger.error('Crew parse failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Optimize existing crew for budget constraints
app.post('/api/ai/crew/optimize', async (req, res) => {
  try {
    const { currentCrew, targetBudget, priorities } = req.body;

    if (!currentCrew || !targetBudget) {
      return res.status(400).json({
        success: false,
        error: 'currentCrew and targetBudget are required'
      });
    }

    aiLogger.info('Crew optimization request', {
      positionCount: currentCrew.length,
      targetBudget
    });

    const result = await optimizeCrew(db, currentCrew, targetBudget, priorities || []);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    aiLogger.error('Crew optimization failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply crew recommendations to production budget
app.post('/api/ai/crew/apply/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { departments, applyFringes = true } = req.body;

    if (!departments || !Array.isArray(departments)) {
      return res.status(400).json({
        success: false,
        error: 'departments array is required'
      });
    }

    aiLogger.info('Applying crew to production', {
      productionId,
      departmentCount: departments.length
    });

    let itemsCreated = 0;

    for (const dept of departments) {
      for (const position of dept.positions || []) {
        // Insert line item for each position
        await db.query(
          `INSERT INTO budget_line_items (
            production_id, account_code, description, quantity, rate,
            subtotal, fringes, total, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            productionId,
            position.accountCode || '0000',
            position.position,
            position.weeks * position.quantity,
            position.weeklyRate,
            position.baseCost,
            applyFringes ? position.fringes : 0,
            applyFringes ? position.total : position.baseCost,
            `${position.union} - ${position.quantity} × ${position.weeks} weeks`
          ]
        );
        itemsCreated++;
      }
    }

    res.json({
      success: true,
      message: `Applied ${itemsCreated} crew positions to budget`,
      itemsCreated
    });
  } catch (error) {
    aiLogger.error('Failed to apply crew to production', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auto-generate budget for a production using AI crew builder + agreement rules
app.post('/api/productions/:productionId/auto-generate-budget', async (req, res) => {
  const { productionId } = req.params;
  const { includeAll = true } = req.body; // Whether to include all positions or just essentials

  try {
    aiLogger.info('Auto-generating budget for production', { productionId });

    // 1. Fetch production details
    const prodResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (prodResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    const production = prodResult.rows[0];
    const startDate = production.principal_photography_start;
    const productionType = production.production_type || 'single_camera';
    const budget = parseFloat(production.budget_target) || 10000000;
    const location = production.shooting_location || 'Los Angeles';
    const episodeCount = production.episode_count || 1;
    const shootDays = episodeCount * 8; // Estimate 8 days per episode

    aiLogger.debug('Production details', { productionType, budget, location, shootDays, startDate });

    // 2. Get crew recommendations using existing smart crew builder
    const crewRecommendations = await recommendCrew(db, {
      productionType,
      budget,
      shootDays,
      location,
      episodeCount
    });

    // 3. Get period rules for overtime calculations
    const periodRulesResult = await db.query(
      `SELECT * FROM period_rules
       WHERE union_local = 'IATSE'
       AND effective_date <= $1
       ORDER BY effective_date DESC`,
      [startDate || new Date()]
    );
    const periodRules = periodRulesResult.rows;

    // 4. Get meal penalty rates
    const mealPenaltyResult = await db.query(
      `SELECT * FROM meal_penalties
       WHERE union_local = 'IATSE'
       AND effective_date <= $1
       ORDER BY effective_date DESC
       LIMIT 1`,
      [startDate || new Date()]
    );
    const mealPenalty = mealPenaltyResult.rows[0];

    // 5. Get typical crew from production_type_crews if available
    const crewTemplateResult = await db.query(
      `SELECT ptc.*, rc.base_rate, rc.rate_type
       FROM production_type_crews ptc
       LEFT JOIN rate_cards rc ON
         rc.job_classification ILIKE '%' || ptc.position_title || '%'
         AND rc.union_local ILIKE '%' || ptc.union_local || '%'
         AND rc.effective_date <= $2
       WHERE ptc.production_type = $1
       ORDER BY ptc.sort_order, rc.effective_date DESC`,
      [productionType, startDate || new Date()]
    );

    // 6. Delete existing budget line items (to regenerate)
    await db.query(
      'DELETE FROM budget_line_items WHERE production_id = $1',
      [productionId]
    );

    let itemsCreated = 0;
    let totalBudget = 0;

    // 7. Create line items from either crew template or AI recommendations
    if (crewTemplateResult.rows.length > 0) {
      // Use our new production_type_crews table
      const seenPositions = new Set();
      const accountCodeCounter = {}; // Track used account codes per category

      for (const crew of crewTemplateResult.rows) {
        // Skip duplicates (from multiple rate matches)
        const posKey = `${crew.department}-${crew.position_title}`;
        if (seenPositions.has(posKey)) continue;
        seenPositions.add(posKey);

        // Get the best rate for this position
        const rateResult = await db.query(
          `SELECT base_rate, rate_type FROM rate_cards
           WHERE job_classification ILIKE $1
           AND (location ILIKE $2 OR location = 'National' OR location IS NULL)
           AND effective_date <= $3
           ORDER BY
             CASE WHEN location ILIKE $2 THEN 0 ELSE 1 END,
             effective_date DESC
           LIMIT 1`,
          [`%${crew.position_title}%`, `%${location}%`, startDate || new Date()]
        );

        const rate = rateResult.rows[0]?.base_rate || 2000;
        const rateType = rateResult.rows[0]?.rate_type || 'weekly';

        // Calculate days from template
        const prepDays = crew.typical_prep_days || 0;
        const shootDaysForPos = crew.typical_shoot_days || shootDays;
        const wrapDays = crew.typical_wrap_days || 0;
        const totalDays = prepDays + shootDaysForPos + wrapDays;

        // Convert to weeks for weekly rates
        const quantity = rateType === 'weekly' ? Math.ceil(totalDays / 5) : totalDays;
        const subtotal = rate * quantity;
        const fringes = subtotal * 0.32; // 32% fringe estimate
        const total = subtotal + fringes;

        // Generate unique account code for crew positions
        // Extract category from department (e.g., "Production" -> "20", "Camera" -> "33")
        const deptLower = crew.department?.toLowerCase() || '';
        let categoryCode = '20'; // Default to production

        if (deptLower.includes('camera')) categoryCode = '33';
        else if (deptLower.includes('sound')) categoryCode = '37';
        else if (deptLower.includes('grip')) categoryCode = '25';
        else if (deptLower.includes('electric') || deptLower.includes('lighting')) categoryCode = '32';
        else if (deptLower.includes('art')) categoryCode = '22';
        else if (deptLower.includes('location')) categoryCode = '36';
        else if (deptLower.includes('transport')) categoryCode = '35';
        else if (deptLower.includes('wardrobe') || deptLower.includes('costume')) categoryCode = '29';
        else if (deptLower.includes('property') || deptLower.includes('prop')) categoryCode = '28';
        else if (deptLower.includes('makeup') || deptLower.includes('hair')) categoryCode = '31';
        else if (deptLower.includes('post')) categoryCode = '43';

        // Generate sequential account code within category
        if (!accountCodeCounter[categoryCode]) {
          accountCodeCounter[categoryCode] = 1;
        }
        const accountCode = `${categoryCode}${String(accountCodeCounter[categoryCode]).padStart(2, '0')}`;
        accountCodeCounter[categoryCode]++;

        await db.query(
          `INSERT INTO budget_line_items (
            production_id, account_code, description, quantity, rate,
            subtotal, fringes, total, notes, atl_or_btl
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            productionId,
            accountCode,
            `${crew.position_title} (${crew.department})`,
            quantity,
            rate,
            subtotal,
            fringes,
            total,
            `${crew.union_local} - Prep: ${prepDays}d, Shoot: ${shootDaysForPos}d, Wrap: ${wrapDays}d`,
            'BTL'
          ]
        );

        itemsCreated++;
        totalBudget += total;
      }
    } else if (crewRecommendations.departments) {
      // Fall back to AI crew recommendations
      const accountCodeCounter = {}; // Track used account codes

      for (const dept of crewRecommendations.departments) {
        for (const position of dept.positions || []) {
          // Generate unique account code if not provided
          let accountCode = position.accountCode;
          if (!accountCode || accountCode === '0000') {
            const categoryCode = dept.categoryCode || '20';
            if (!accountCodeCounter[categoryCode]) {
              accountCodeCounter[categoryCode] = 1;
            }
            accountCode = `${categoryCode}${String(accountCodeCounter[categoryCode]).padStart(2, '0')}`;
            accountCodeCounter[categoryCode]++;
          }

          await db.query(
            `INSERT INTO budget_line_items (
              production_id, account_code, description, quantity, rate,
              subtotal, fringes, total, notes, atl_or_btl
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              productionId,
              accountCode,
              position.position,
              position.weeks * (position.quantity || 1),
              position.weeklyRate || 0,
              position.baseCost || 0,
              position.fringes || 0,
              position.total || 0,
              `${position.union || 'Union'} - ${position.quantity || 1} × ${position.weeks || 1} weeks`,
              'BTL'
            ]
          );
          itemsCreated++;
          totalBudget += position.total || 0;
        }
      }
    }

    // 8. Add meal penalty allowance line item
    if (mealPenalty) {
      const mealPenaltyAllowance = shootDays * 2 * parseFloat(mealPenalty.first_penalty_rate); // Estimate 2 per day
      await db.query(
        `INSERT INTO budget_line_items (
          production_id, account_code, description, quantity, rate,
          subtotal, fringes, total, notes, atl_or_btl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productionId,
          '3685', // Misc Expenses under Location department
          'Meal Penalty Allowance',
          shootDays,
          mealPenalty.first_penalty_rate * 2,
          mealPenaltyAllowance,
          0,
          mealPenaltyAllowance,
          `Estimated 2 penalties/day × $${mealPenalty.first_penalty_rate}/violation`,
          'BTL'
        ]
      );
      itemsCreated++;
      totalBudget += mealPenaltyAllowance;
    }

    // 9. Add Above the Line (ATL) costs - typically 35-45% of budget
    const atlBudget = budget * 0.40; // 40% for ATL

    // Query chart_of_accounts for unique ATL account codes
    const atlAccountsResult = await db.query(`
      SELECT account_code, account_name FROM chart_of_accounts
      WHERE account_type = 'ATL'
      AND account_code IN ('1101', '1201', '1301', '1400', '1504', '1600')
      ORDER BY account_code
    `);

    const atlCategories = [
      { code: atlAccountsResult.rows.find(a => a.account_code === '1101')?.account_code || '1101',
        desc: 'Story & Rights', pct: 0.05, fringePct: 0 }, // Non-labor
      { code: atlAccountsResult.rows.find(a => a.account_code === '1201')?.account_code || '1201',
        desc: 'Producers', pct: 0.08, fringePct: 0.25 }, // 25% fringes
      { code: atlAccountsResult.rows.find(a => a.account_code === '1301')?.account_code || '1301',
        desc: 'Directors', pct: 0.10, fringePct: 0.31 }, // DGA 31% fringes
      { code: atlAccountsResult.rows.find(a => a.account_code === '1400')?.account_code || '1400',
        desc: 'Cast', pct: 0.70, fringePct: 0.25 }, // SAG-AFTRA 25% fringes (increased from 0.65 to account for fringes)
      { code: atlAccountsResult.rows.find(a => a.account_code === '1504')?.account_code || '1504',
        desc: 'Travel & Living - ATL', pct: 0.07, fringePct: 0 } // Non-labor
    ];

    for (const cat of atlCategories) {
      const subtotal = atlBudget * cat.pct;
      const fringes = subtotal * cat.fringePct;
      const total = subtotal + fringes;

      await db.query(
        `INSERT INTO budget_line_items (
          production_id, account_code, description, quantity, rate,
          subtotal, fringes, total, notes, atl_or_btl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productionId,
          cat.code,
          cat.desc,
          1,
          subtotal,
          subtotal,
          fringes,
          total,
          cat.fringePct > 0
            ? `Estimated ${(cat.pct * 100).toFixed(0)}% of ATL budget ($${atlBudget.toLocaleString()}) + ${(cat.fringePct * 100).toFixed(0)}% fringes`
            : `Estimated ${(cat.pct * 100).toFixed(0)}% of ATL budget ($${atlBudget.toLocaleString()})`,
          'ATL'
        ]
      );
      itemsCreated++;
      totalBudget += total;
    }

    // 10. Add Production Costs (equipment, locations, sets, etc.)
    const prodCostsBudget = budget * 0.25; // 25% for production costs

    // Query chart_of_accounts for unique BTL account codes
    const btlAccountsResult = await db.query(`
      SELECT account_code, account_name FROM chart_of_accounts
      WHERE account_type = 'BTL'
      AND account_code IN ('2101', '2216', '2316', '2716', '2816', '2908', '3116', '3318', '2518', '3216', '3518')
      ORDER BY account_code
    `);

    const prodCosts = [
      { code: btlAccountsResult.rows.find(a => a.account_code === '2101')?.account_code || '2101',
        desc: 'Extra Talent - Stand-Ins', amount: prodCostsBudget * 0.08 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2216')?.account_code || '2216',
        desc: 'Set Design - Purchases', amount: prodCostsBudget * 0.20 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2316')?.account_code || '2316',
        desc: 'Set Construction - Purchases', amount: prodCostsBudget * 0.25 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2716')?.account_code || '2716',
        desc: 'Set Dressing - Purchases', amount: prodCostsBudget * 0.10 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2816')?.account_code || '2816',
        desc: 'Prop Purchases', amount: prodCostsBudget * 0.08 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2908')?.account_code || '2908',
        desc: 'Wardrobe - Alterations & Repairs', amount: prodCostsBudget * 0.09 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '3116')?.account_code || '3116',
        desc: 'Makeup & Hair Supplies', amount: prodCostsBudget * 0.05 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '3318')?.account_code || '3318',
        desc: 'Camera Equipment Rentals', amount: prodCostsBudget * 0.05 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '2518')?.account_code || '2518',
        desc: 'Grip Equipment Rentals', amount: prodCostsBudget * 0.03 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '3216')?.account_code || '3216',
        desc: 'Lighting Purchases', amount: prodCostsBudget * 0.04 },
      { code: btlAccountsResult.rows.find(a => a.account_code === '3518')?.account_code || '3518',
        desc: 'Transportation - Vehicle Rentals', amount: prodCostsBudget * 0.03 }
    ];

    for (const cost of prodCosts) {
      await db.query(
        `INSERT INTO budget_line_items (
          production_id, account_code, description, quantity, rate,
          subtotal, fringes, total, notes, atl_or_btl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productionId,
          cost.code,
          cost.desc,
          1,
          cost.amount,
          cost.amount,
          0,
          cost.amount,
          'Estimated production cost allocation',
          'BTL'
        ]
      );
      itemsCreated++;
      totalBudget += cost.amount;
    }

    // 11. Add Post-Production costs - typically 20% of budget
    const postBudget = budget * 0.20;

    // Query chart_of_accounts for unique POST account codes
    const postAccountsResult = await db.query(`
      SELECT account_code, account_name FROM chart_of_accounts
      WHERE account_type = 'POST'
      AND account_code IN ('4100', '4432', '4602', '4605', '4646', '4206')
      ORDER BY account_code
    `);

    const postCosts = [
      { code: postAccountsResult.rows.find(a => a.account_code === '4100')?.account_code || '4100',
        desc: 'Editing & Post Tests', amount: postBudget * 0.15 },
      { code: postAccountsResult.rows.find(a => a.account_code === '4432')?.account_code || '4432',
        desc: 'Visual Effects', amount: postBudget * 0.35 },
      { code: postAccountsResult.rows.find(a => a.account_code === '4602')?.account_code || '4602',
        desc: 'Composer', amount: postBudget * 0.15 },
      { code: postAccountsResult.rows.find(a => a.account_code === '4605')?.account_code || '4605',
        desc: 'Licensed Music & Supervision', amount: postBudget * 0.15 },
      { code: postAccountsResult.rows.find(a => a.account_code === '4646')?.account_code || '4646',
        desc: 'Music License Buyout', amount: postBudget * 0.10 },
      { code: postAccountsResult.rows.find(a => a.account_code === '4206')?.account_code || '4206',
        desc: 'Stage Rental & Facilities', amount: postBudget * 0.10 }
    ];

    for (const cost of postCosts) {
      await db.query(
        `INSERT INTO budget_line_items (
          production_id, account_code, description, quantity, rate,
          subtotal, fringes, total, notes, atl_or_btl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productionId,
          cost.code,
          cost.desc,
          1,
          cost.amount,
          cost.amount,
          0,
          cost.amount,
          'Estimated post-production cost',
          'Other'
        ]
      );
      itemsCreated++;
      totalBudget += cost.amount;
    }

    // 12. Add Other Costs (insurance, contingency)
    const otherBudget = budget * 0.12; // 12% for insurance & contingency

    // Query chart_of_accounts for unique OTHER account codes
    const otherAccountsResult = await db.query(`
      SELECT account_code, account_name FROM chart_of_accounts
      WHERE account_type = 'OTHER'
      AND account_code IN ('6701', '6864', '6885')
      ORDER BY account_code
    `);

    const otherCosts = [
      { code: otherAccountsResult.rows.find(a => a.account_code === '6701')?.account_code || '6701',
        desc: 'Production Insurance', amount: otherBudget * 0.25 },
      { code: otherAccountsResult.rows.find(a => a.account_code === '6864')?.account_code || '6864',
        desc: 'Accounting & Administrative', amount: otherBudget * 0.25 },
      { code: otherAccountsResult.rows.find(a => a.account_code === '6885')?.account_code || '6885',
        desc: 'Contingency & Misc Expenses', amount: otherBudget * 0.50 }
    ];

    for (const cost of otherCosts) {
      await db.query(
        `INSERT INTO budget_line_items (
          production_id, account_code, description, quantity, rate,
          subtotal, fringes, total, notes, atl_or_btl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productionId,
          cost.code,
          cost.desc,
          1,
          cost.amount,
          cost.amount,
          0,
          cost.amount,
          'Estimated other cost',
          'Other'
        ]
      );
      itemsCreated++;
      totalBudget += cost.amount;
    }

    res.json({
      success: true,
      message: `Auto-generated budget with ${itemsCreated} line items`,
      itemsCreated,
      estimatedTotal: totalBudget,
      periodRules: periodRules.map(r => ({
        period: r.period_type,
        standardHours: r.standard_hours_per_day,
        overtimeAfter: r.overtime_start_hour,
        doubleTimeAfter: r.double_time_start_hour
      })),
      mealPenalty: mealPenalty ? {
        deadline: `${mealPenalty.first_meal_deadline_hours} hours`,
        rate: mealPenalty.first_penalty_rate
      } : null,
      productionDetails: {
        type: productionType,
        location,
        budget,
        shootDays,
        startDate
      }
    });

  } catch (error) {
    aiLogger.error('Auto-generate budget failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get IATSE Videotape 2024-27 wage rates
app.get('/api/ai/crew/union-rates/iatse-videotape', async (req, res) => {
  try {
    // IATSE Videotape Agreement 2024-27 wage rates (extracted from official PDF)
    const iatseVideotapeRates = {
      union: 'IATSE',
      agreement: 'Videotape Electronics Supplemental Basic Agreement',
      effectivePeriod: '2024-2027',
      currentPeriod: '2024-25',
      minimumCall: { daily: '8 hours', weekly: '8 hours, 5 consecutive days' },
      dramatic: {
        description: 'Dramatic Programs - Article 15(a) - 3rd+ seasons',
        daily: {
          technical_supervisor: 631, technical_director: 631, editor: 618,
          audio_mixer: 618, director_of_photography: 618, video_cameraperson: 552,
          digital_imaging_technician: 692, video_controller_shader: 552,
          camera_utility: 523, digital_utility: 364, videotape_operator: 418,
          stagecraft_chief: 479, stagecraft_other: 398, script_supervisor: 407,
          makeup_artist: 492, hair_stylist: 430, costumer: 399,
          set_decorator: 524, scenic_artist: 479
        },
        weekly: {
          technical_supervisor: 2863, technical_director: 2863, editor: 2817,
          audio_mixer: 2817, director_of_photography: 2817, video_cameraperson: 2558,
          digital_imaging_technician: 3170, video_controller_shader: 2558,
          camera_utility: 2353, videotape_operator: 1950, stagecraft_chief: 2214,
          stagecraft_other: 1810, script_supervisor: 1880, makeup_artist: 2217,
          hair_stylist: 1947, costumer: 1831, art_director: 3972,
          set_decorator: 2414, scenic_artist: 2081
        }
      },
      nonDramatic: {
        description: 'Non-Dramatic Programs - Article 15(b)(1) - Awards, parades, reality',
        daily: {
          technical_supervisor: 570, technical_director: 570, editor: 560,
          audio_mixer: 560, director_of_photography: 560, video_cameraperson: 498,
          digital_imaging_technician: 625, video_controller_shader: 498,
          camera_utility: 475, digital_utility: 327, videotape_operator: 376,
          stagecraft_chief: 434, stagecraft_other: 358, script_supervisor: 366,
          makeup_artist: 441, hair_stylist: 387, costumer: 358,
          set_decorator: 477, scenic_artist: 434
        },
        weekly: {
          technical_supervisor: 2582, technical_director: 2582, editor: 2542,
          audio_mixer: 2542, director_of_photography: 2542, video_cameraperson: 2305,
          digital_imaging_technician: 2856, video_controller_shader: 2305,
          camera_utility: 2123, videotape_operator: 1763, stagecraft_chief: 1994,
          stagecraft_other: 1631, script_supervisor: 1700, makeup_artist: 1998,
          hair_stylist: 1763, costumer: 1655, art_director: 3579,
          set_decorator: 2181, scenic_artist: 1879
        }
      },
      reality: {
        description: 'Non-Dramatic Programs - Article 15(b)(2) - Reality shows',
        daily: {
          technical_supervisor: 587, technical_director: 587, editor: 577,
          audio_mixer: 577, director_of_photography: 577, video_cameraperson: 513,
          digital_imaging_technician: 644, video_controller_shader: 513,
          camera_utility: 489, digital_utility: 337, videotape_operator: 387,
          stagecraft_chief: 447, stagecraft_other: 369, script_supervisor: 377,
          makeup_artist: 454, hair_stylist: 399, costumer: 369,
          set_decorator: 491, scenic_artist: 447
        },
        weekly: {
          technical_supervisor: 2659, technical_director: 2659, editor: 2618,
          audio_mixer: 2618, director_of_photography: 2618, video_cameraperson: 2374,
          digital_imaging_technician: 2941, video_controller_shader: 2374,
          camera_utility: 2187, videotape_operator: 1816, stagecraft_chief: 2054,
          stagecraft_other: 1680, script_supervisor: 1752, makeup_artist: 2058,
          hair_stylist: 1816, costumer: 1705, art_director: 3686,
          set_decorator: 2246, scenic_artist: 1936
        }
      },
      notes: [
        'Entry level videotape operators eligible for higher rate after 1 year',
        'Stagecraft crane/dolly/dimmer board operators receive additional $0.65/hour',
        'Aerial lift work (35+ feet) receives additional $0.65/hour',
        'Licensed powderman receives $20.00 bonus per shift'
      ]
    };

    res.json({
      success: true,
      data: iatseVideotapeRates
    });
  } catch (error) {
    aiLogger.error('Failed to get IATSE Videotape rates', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed IATSE Videotape 2024-27 rates into the database
app.post('/api/ai/crew/union-rates/iatse-videotape/seed', async (req, res) => {
  try {
    aiLogger.info('Seeding IATSE Videotape 2024-27 rates into database');

    // Define the rates to insert
    const rates = [];
    const effectiveDate = '2024-09-29';
    const contractYear = 1;
    const wageIncreasePct = 4.0;

    // Production types mapping
    const productionTypes = [
      { type: 'dramatic', prodType: 'dramatic_videotape', location: 'Los Angeles - Studio' },
      { type: 'nonDramatic', prodType: 'non_dramatic_videotape', location: 'Los Angeles - Studio' },
      { type: 'reality', prodType: 'reality_videotape', location: 'Los Angeles - Studio' }
    ];

    // IATSE Videotape rates (2024-25)
    const rateData = {
      dramatic: {
        daily: {
          technical_supervisor: 631, technical_director: 631, editor: 618,
          audio_mixer: 618, director_of_photography: 618, video_cameraperson: 552,
          digital_imaging_technician: 692, video_controller_shader: 552,
          camera_utility: 523, digital_utility: 364, videotape_operator: 418,
          stagecraft_chief: 479, stagecraft_other: 398, script_supervisor: 407,
          makeup_artist: 492, hair_stylist: 430, costumer: 399,
          set_decorator: 524, scenic_artist: 479
        },
        weekly: {
          technical_supervisor: 2863, technical_director: 2863, editor: 2817,
          audio_mixer: 2817, director_of_photography: 2817, video_cameraperson: 2558,
          digital_imaging_technician: 3170, video_controller_shader: 2558,
          camera_utility: 2353, videotape_operator: 1950, stagecraft_chief: 2214,
          stagecraft_other: 1810, script_supervisor: 1880, makeup_artist: 2217,
          hair_stylist: 1947, costumer: 1831, art_director: 3972,
          set_decorator: 2414, scenic_artist: 2081
        }
      },
      nonDramatic: {
        daily: {
          technical_supervisor: 570, technical_director: 570, editor: 560,
          audio_mixer: 560, director_of_photography: 560, video_cameraperson: 498,
          digital_imaging_technician: 625, video_controller_shader: 498,
          camera_utility: 475, digital_utility: 327, videotape_operator: 376,
          stagecraft_chief: 434, stagecraft_other: 358, script_supervisor: 366,
          makeup_artist: 441, hair_stylist: 387, costumer: 358,
          set_decorator: 477, scenic_artist: 434
        },
        weekly: {
          technical_supervisor: 2582, technical_director: 2582, editor: 2542,
          audio_mixer: 2542, director_of_photography: 2542, video_cameraperson: 2305,
          digital_imaging_technician: 2856, video_controller_shader: 2305,
          camera_utility: 2123, videotape_operator: 1763, stagecraft_chief: 1994,
          stagecraft_other: 1631, script_supervisor: 1700, makeup_artist: 1998,
          hair_stylist: 1763, costumer: 1655, art_director: 3579,
          set_decorator: 2181, scenic_artist: 1879
        }
      },
      reality: {
        daily: {
          technical_supervisor: 587, technical_director: 587, editor: 577,
          audio_mixer: 577, director_of_photography: 577, video_cameraperson: 513,
          digital_imaging_technician: 644, video_controller_shader: 513,
          camera_utility: 489, digital_utility: 337, videotape_operator: 387,
          stagecraft_chief: 447, stagecraft_other: 369, script_supervisor: 377,
          makeup_artist: 454, hair_stylist: 399, costumer: 369,
          set_decorator: 491, scenic_artist: 447
        },
        weekly: {
          technical_supervisor: 2659, technical_director: 2659, editor: 2618,
          audio_mixer: 2618, director_of_photography: 2618, video_cameraperson: 2374,
          digital_imaging_technician: 2941, video_controller_shader: 2374,
          camera_utility: 2187, videotape_operator: 1816, stagecraft_chief: 2054,
          stagecraft_other: 1680, script_supervisor: 1752, makeup_artist: 2058,
          hair_stylist: 1816, costumer: 1705, art_director: 3686,
          set_decorator: 2246, scenic_artist: 1936
        }
      }
    };

    // Job classification name mapping (snake_case to Title Case)
    const classificationNames = {
      technical_supervisor: 'Technical Supervisor',
      technical_director: 'Technical Director',
      editor: 'Editor',
      audio_mixer: 'Audio Mixer',
      director_of_photography: 'Director of Photography',
      video_cameraperson: 'Video Cameraperson',
      digital_imaging_technician: 'Digital Imaging Technician',
      video_controller_shader: 'Video Controller/Shader',
      camera_utility: 'Camera Utility',
      digital_utility: 'Digital Utility',
      videotape_operator: 'Videotape Operator',
      stagecraft_chief: 'Stagecraft Chief',
      stagecraft_other: 'Stagecraft Other',
      script_supervisor: 'Script Supervisor',
      makeup_artist: 'Makeup Artist',
      hair_stylist: 'Hair Stylist',
      costumer: 'Costumer',
      set_decorator: 'Set Decorator',
      scenic_artist: 'Scenic Artist',
      art_director: 'Art Director'
    };

    // Build INSERT statements
    for (const pt of productionTypes) {
      const typeData = rateData[pt.type];

      // Daily rates
      for (const [job, rate] of Object.entries(typeData.daily)) {
        rates.push({
          union_local: 'IATSE Videotape',
          job_classification: classificationNames[job] || job,
          rate_type: 'daily',
          base_rate: rate,
          location: pt.location,
          production_type: pt.prodType,
          effective_date: effectiveDate,
          contract_year: contractYear,
          wage_increase_pct: wageIncreasePct
        });
      }

      // Weekly rates
      for (const [job, rate] of Object.entries(typeData.weekly)) {
        rates.push({
          union_local: 'IATSE Videotape',
          job_classification: classificationNames[job] || job,
          rate_type: 'weekly',
          base_rate: rate,
          location: pt.location,
          production_type: pt.prodType,
          effective_date: effectiveDate,
          contract_year: contractYear,
          wage_increase_pct: wageIncreasePct
        });
      }
    }

    // Check if IATSE Videotape rates already exist
    const existing = await db.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'IATSE Videotape'
    `);

    if (parseInt(existing.rows[0].count) > 0) {
      // Delete existing rates first to avoid duplicates
      await db.query(`DELETE FROM rate_cards WHERE union_local = 'IATSE Videotape'`);
      aiLogger.info('Deleted existing IATSE Videotape rates');
    }

    // Insert all rates
    let inserted = 0;

    for (const rate of rates) {
      await db.query(`
        INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year, wage_increase_pct)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [rate.union_local, rate.job_classification, rate.rate_type, rate.base_rate, rate.location, rate.production_type, rate.effective_date, rate.contract_year, rate.wage_increase_pct]);
      inserted++;
    }

    aiLogger.info('IATSE Videotape rates seeded', { inserted, total: rates.length });

    res.json({
      success: true,
      message: `Seeded ${rates.length} IATSE Videotape rate cards`,
      details: { inserted, total: rates.length }
    });
  } catch (error) {
    aiLogger.error('Failed to seed IATSE Videotape rates', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed Chart of Accounts from budget templates
app.post('/api/chart-of-accounts/seed', async (req, res) => {
  try {
    aiLogger.info('Seeding Chart of Accounts from budget templates');

    // Check if table exists, create if it doesn't
    await db.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_code VARCHAR(10) NOT NULL UNIQUE,
        category_code VARCHAR(4),
        category_name VARCHAR(255),
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50),
        department VARCHAR(100),
        is_labor BOOLEAN DEFAULT false,
        is_fringe_account BOOLEAN DEFAULT false,
        standard_system VARCHAR(50) DEFAULT 'STANDARD',
        sort_order INT
      )
    `);

    // Define all account codes from budget templates
    const accounts = [
      { code: '1100', category: '11', categoryName: 'WRITER', name: 'WRITER', type: 'ATL', dept: 'WRITER', isLabor: false },
      { code: '1101', category: '11', categoryName: 'WRITER', name: 'WRITER', type: 'ATL', dept: 'WRITER', isLabor: true },
      { code: '1102', category: '11', categoryName: 'WRITER', name: 'SCRIPT CLEARANCE RESEARCH', type: 'ATL', dept: 'WRITER', isLabor: false },
      { code: '1200', category: '12', categoryName: 'PRODUCERS UNIT', name: 'PRODUCERS UNIT', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: false },
      { code: '1201', category: '12', categoryName: 'PRODUCERS UNIT', name: 'EXECUTIVE PRODUCER', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: true },
      { code: '1202', category: '12', categoryName: 'PRODUCERS UNIT', name: 'PRODUCER', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: true },
      { code: '1207', category: '12', categoryName: 'PRODUCERS UNIT', name: 'PRODUCER\'S ASSISTANT', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: true },
      { code: '1285', category: '12', categoryName: 'PRODUCERS UNIT', name: 'MISC EXPENSES', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: false },
      { code: '1288', category: '12', categoryName: 'PRODUCERS UNIT', name: 'PRODUCER BONUS', type: 'ATL', dept: 'PRODUCERS UNIT', isLabor: true },
      { code: '1300', category: '13', categoryName: 'DIRECTOR', name: 'DIRECTOR', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1301', category: '13', categoryName: 'DIRECTOR', name: 'DIRECTOR', type: 'ATL', dept: 'DIRECTOR', isLabor: true },
      { code: '1309', category: '13', categoryName: 'DIRECTOR', name: 'PILOT ROYALTY', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1351', category: '13', categoryName: 'DIRECTOR', name: 'AIRFARES', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1352', category: '13', categoryName: 'DIRECTOR', name: 'HOTELS', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1353', category: '13', categoryName: 'DIRECTOR', name: 'MEALS/PER DIEM', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1355', category: '13', categoryName: 'DIRECTOR', name: 'AUTOS/TAXIS/LIMOS', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1385', category: '13', categoryName: 'DIRECTOR', name: 'MISCELLANEOUS', type: 'ATL', dept: 'DIRECTOR', isLabor: false },
      { code: '1400', category: '14', categoryName: 'PRINCIPAL CAST', name: 'PRINCIPAL CAST', type: 'ATL', dept: 'PRINCIPAL CAST', isLabor: false },
      { code: '1406', category: '14', categoryName: 'PRINCIPAL CAST', name: 'STUNT COORDINATOR', type: 'ATL', dept: 'PRINCIPAL CAST', isLabor: true },
      { code: '1407', category: '14', categoryName: 'PRINCIPAL CAST', name: 'STUNTS & ADJUSTMENTS', type: 'ATL', dept: 'PRINCIPAL CAST', isLabor: false },
      { code: '1417', category: '14', categoryName: 'PRINCIPAL CAST', name: 'RENTALS', type: 'ATL', dept: 'PRINCIPAL CAST', isLabor: false },
      { code: '1500', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'ATL TRAVEL & LIVING', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1501', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'AIRFARES', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1502', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'HOTELS', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1503', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'MEALS', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1504', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'PER DIEM/LIVING', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1505', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'GROUND TRANSPORTATION', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '1506', category: '15', categoryName: 'ATL TRAVEL & LIVING', name: 'RENTAL CARS', type: 'ATL', dept: 'ATL TRAVEL & LIVING', isLabor: false },
      { code: '2000', category: '20', categoryName: 'PRODUCTION STAFF', name: 'PRODUCTION STAFF', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: false },
      { code: '2002', category: '20', categoryName: 'PRODUCTION STAFF', name: '1ST ASSISTANT DIRECTOR', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2003', category: '20', categoryName: 'PRODUCTION STAFF', name: '2ND ASSISTANT DIRECTOR', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2005', category: '20', categoryName: 'PRODUCTION STAFF', name: 'SCRIPT SUPERVISOR', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2007', category: '20', categoryName: 'PRODUCTION STAFF', name: 'LOCATION MANAGER', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2008', category: '20', categoryName: 'PRODUCTION STAFF', name: 'ASSISTANT LOCATION MANAGER', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2009', category: '20', categoryName: 'PRODUCTION STAFF', name: 'PRODUCTION COORDINATOR', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2010', category: '20', categoryName: 'PRODUCTION STAFF', name: 'ASST PROD. OFFICE COORDINATOR', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2012', category: '20', categoryName: 'PRODUCTION STAFF', name: 'SET STAFF ASSISTANTS', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2013', category: '20', categoryName: 'PRODUCTION STAFF', name: 'PRODUCTION ACCOUNTANT', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2014', category: '20', categoryName: 'PRODUCTION STAFF', name: 'ASST ACCOUNTANTS', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: true },
      { code: '2015', category: '20', categoryName: 'PRODUCTION STAFF', name: 'BOARD PREP', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: false },
      { code: '2017', category: '20', categoryName: 'PRODUCTION STAFF', name: 'BOX/COMPUTER RENTALS', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: false },
      { code: '2085', category: '20', categoryName: 'PRODUCTION STAFF', name: 'MISCELLANEOUS', type: 'BTL', dept: 'PRODUCTION STAFF', isLabor: false },
      { code: '2100', category: '21', categoryName: 'EXTRA TALENT', name: 'EXTRA TALENT', type: 'BTL', dept: 'EXTRA TALENT', isLabor: false },
      { code: '2101', category: '21', categoryName: 'EXTRA TALENT', name: 'STAND-INS', type: 'BTL', dept: 'EXTRA TALENT', isLabor: true },
      { code: '2102', category: '21', categoryName: 'EXTRA TALENT', name: 'UNION EXTRAS', type: 'BTL', dept: 'EXTRA TALENT', isLabor: true },
      { code: '2103', category: '21', categoryName: 'EXTRA TALENT', name: 'NON-UNION EXTRAS', type: 'BTL', dept: 'EXTRA TALENT', isLabor: true },
      { code: '2107', category: '21', categoryName: 'EXTRA TALENT', name: 'WARDROBE FITTINGS', type: 'BTL', dept: 'EXTRA TALENT', isLabor: false },
      { code: '2110', category: '21', categoryName: 'EXTRA TALENT', name: 'EXTRAS CASTING COORDINATOR', type: 'BTL', dept: 'EXTRA TALENT', isLabor: true },
      { code: '2155', category: '21', categoryName: 'EXTRA TALENT', name: 'ATMOSPHERE CARS/MILEAGE', type: 'BTL', dept: 'EXTRA TALENT', isLabor: false },
      { code: '2185', category: '21', categoryName: 'EXTRA TALENT', name: 'MISCELLANEOUS', type: 'BTL', dept: 'EXTRA TALENT', isLabor: false },
      { code: '2200', category: '22', categoryName: 'SET DESIGN', name: 'SET DESIGN', type: 'BTL', dept: 'SET DESIGN', isLabor: false },
      { code: '2202', category: '22', categoryName: 'SET DESIGN', name: 'ART DIRECTOR', type: 'BTL', dept: 'SET DESIGN', isLabor: true },
      { code: '2213', category: '22', categoryName: 'SET DESIGN', name: 'ART DEPT COORDINATOR', type: 'BTL', dept: 'SET DESIGN', isLabor: true },
      { code: '2216', category: '22', categoryName: 'SET DESIGN', name: 'PURCHASES', type: 'BTL', dept: 'SET DESIGN', isLabor: false },
      { code: '2280', category: '22', categoryName: 'SET DESIGN', name: 'PRINTING/XEROX/PHOTO DEV', type: 'BTL', dept: 'SET DESIGN', isLabor: false },
      { code: '2300', category: '23', categoryName: 'SET CONSTRUCTION', name: 'SET CONSTRUCTION', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: false },
      { code: '2301', category: '23', categoryName: 'SET CONSTRUCTION', name: 'CONSTRUCTION LABOR', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: true },
      { code: '2304', category: '23', categoryName: 'SET CONSTRUCTION', name: 'PAINT FOREMAN', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: true },
      { code: '2305', category: '23', categoryName: 'SET CONSTRUCTION', name: 'GREENS', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: false },
      { code: '2307', category: '23', categoryName: 'SET CONSTRUCTION', name: 'BACKINGS', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: false },
      { code: '2308', category: '23', categoryName: 'SET CONSTRUCTION', name: 'GREENS LABOR', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: true },
      { code: '2316', category: '23', categoryName: 'SET CONSTRUCTION', name: 'PURCHASES', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: false },
      { code: '2385', category: '23', categoryName: 'SET CONSTRUCTION', name: 'OTHER COSTS', type: 'BTL', dept: 'SET CONSTRUCTION', isLabor: false },
      { code: '2400', category: '24', categoryName: 'SET STRIKE', name: 'SET STRIKE', type: 'BTL', dept: 'SET STRIKE', isLabor: false },
      { code: '2497', category: '24', categoryName: 'SET STRIKE', name: 'TRASH & HAZARDOUS WASTE REMOVAL', type: 'BTL', dept: 'SET STRIKE', isLabor: false },
      { code: '2500', category: '25', categoryName: 'SET OPERATIONS', name: 'SET OPERATIONS', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2504', category: '25', categoryName: 'SET OPERATIONS', name: 'CRANE GRIP', type: 'BTL', dept: 'SET OPERATIONS', isLabor: true },
      { code: '2505', category: '25', categoryName: 'SET OPERATIONS', name: 'COMPANY GRIPS', type: 'BTL', dept: 'SET OPERATIONS', isLabor: true },
      { code: '2509', category: '25', categoryName: 'SET OPERATIONS', name: 'RIGGING CREW', type: 'BTL', dept: 'SET OPERATIONS', isLabor: true },
      { code: '2512', category: '25', categoryName: 'SET OPERATIONS', name: 'CRAFTS SERVICE PURCHASES', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2516', category: '25', categoryName: 'SET OPERATIONS', name: 'PURCHASES', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2518', category: '25', categoryName: 'SET OPERATIONS', name: 'EQUIPMENT RENTALS', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2519', category: '25', categoryName: 'SET OPERATIONS', name: 'CRANES', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2520', category: '25', categoryName: 'SET OPERATIONS', name: 'GRIP PACKAGE', type: 'BTL', dept: 'SET OPERATIONS', isLabor: false },
      { code: '2600', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'SPECIAL EFFECTS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2602', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'F/X FOREMAN', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: true },
      { code: '2603', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'COMPANY F/X TECHNICIANS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: true },
      { code: '2612', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'MANUFACTURING - MATERIALS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2616', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'MFG PURCHASES & RENTALS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2617', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'BOX RENTALS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2618', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'EQUIPMENT RENTALS', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2655', category: '26', categoryName: 'SPECIAL EFFECTS', name: 'CAR ALLOWANCE', type: 'BTL', dept: 'SPECIAL EFFECTS', isLabor: false },
      { code: '2700', category: '27', categoryName: 'SET DRESSING', name: 'SET DRESSING', type: 'BTL', dept: 'SET DRESSING', isLabor: false },
      { code: '2703', category: '27', categoryName: 'SET DRESSING', name: 'SWING GANG', type: 'BTL', dept: 'SET DRESSING', isLabor: true },
      { code: '2716', category: '27', categoryName: 'SET DRESSING', name: 'PURCHASES', type: 'BTL', dept: 'SET DRESSING', isLabor: false },
      { code: '2717', category: '27', categoryName: 'SET DRESSING', name: 'BOX/COMPUTER RENTALS', type: 'BTL', dept: 'SET DRESSING', isLabor: false },
      { code: '2718', category: '27', categoryName: 'SET DRESSING', name: 'RENTALS', type: 'BTL', dept: 'SET DRESSING', isLabor: false },
      { code: '2800', category: '28', categoryName: 'PROPERTY', name: 'PROPERTY', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2801', category: '28', categoryName: 'PROPERTY', name: 'PROPERTY MASTER', type: 'BTL', dept: 'PROPERTY', isLabor: true },
      { code: '2803', category: '28', categoryName: 'PROPERTY', name: 'ADDITIONAL PROP LABOR', type: 'BTL', dept: 'PROPERTY', isLabor: true },
      { code: '2816', category: '28', categoryName: 'PROPERTY', name: 'PROP PURCHASES', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2817', category: '28', categoryName: 'PROPERTY', name: 'BOX RENTALS', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2818', category: '28', categoryName: 'PROPERTY', name: 'PROP RENTALS', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2855', category: '28', categoryName: 'PROPERTY', name: 'CAR ALLOWANCES', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2898', category: '28', categoryName: 'PROPERTY', name: 'LOSS & DAMAGE', type: 'BTL', dept: 'PROPERTY', isLabor: false },
      { code: '2900', category: '29', categoryName: 'WARDROBE', name: 'WARDROBE', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2908', category: '29', categoryName: 'WARDROBE', name: 'ALTERATIONS & REPAIRS', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2909', category: '29', categoryName: 'WARDROBE', name: 'CLEANING & DYEING', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2916', category: '29', categoryName: 'WARDROBE', name: 'PURCHASES', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2917', category: '29', categoryName: 'WARDROBE', name: 'BOX RENTALS', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2918', category: '29', categoryName: 'WARDROBE', name: 'RENTALS', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '2955', category: '29', categoryName: 'WARDROBE', name: 'CAR ALLOWANCES', type: 'BTL', dept: 'WARDROBE', isLabor: false },
      { code: '3000', category: '30', categoryName: 'PICTURE VEHICLES & ANIMALS', name: 'PICTURE VEHICLES & ANIMALS', type: 'BTL', dept: 'PICTURE VEHICLES & ANIMALS', isLabor: false },
      { code: '3007', category: '30', categoryName: 'PICTURE VEHICLES & ANIMALS', name: 'PICTURE VEHICLE RENTALS', type: 'BTL', dept: 'PICTURE VEHICLES & ANIMALS', isLabor: false },
      { code: '3011', category: '30', categoryName: 'PICTURE VEHICLES & ANIMALS', name: 'REPAIRS/MODIFICATIONS', type: 'BTL', dept: 'PICTURE VEHICLES & ANIMALS', isLabor: false },
      { code: '3043', category: '30', categoryName: 'PICTURE VEHICLES & ANIMALS', name: 'WRANGLERS', type: 'BTL', dept: 'PICTURE VEHICLES & ANIMALS', isLabor: true },
      { code: '3049', category: '30', categoryName: 'PICTURE VEHICLES & ANIMALS', name: 'ANIMAL TRANSPORT', type: 'BTL', dept: 'PICTURE VEHICLES & ANIMALS', isLabor: false },
      { code: '3100', category: '31', categoryName: 'MAKEUP & HAIR STYLISTS', name: 'MAKEUP & HAIR STYLISTS', type: 'BTL', dept: 'MAKEUP & HAIR STYLISTS', isLabor: false },
      { code: '3114', category: '31', categoryName: 'MAKEUP & HAIR STYLISTS', name: 'WIG & HAIR PURCHASE', type: 'BTL', dept: 'MAKEUP & HAIR STYLISTS', isLabor: false },
      { code: '3116', category: '31', categoryName: 'MAKEUP & HAIR STYLISTS', name: 'MAKEUP/HAIR SUPPLIES', type: 'BTL', dept: 'MAKEUP & HAIR STYLISTS', isLabor: false },
      { code: '3117', category: '31', categoryName: 'MAKEUP & HAIR STYLISTS', name: 'MAKE-UP/HAIR KIT RENTALS', type: 'BTL', dept: 'MAKEUP & HAIR STYLISTS', isLabor: false },
      { code: '3200', category: '32', categoryName: 'LIGHTING', name: 'LIGHTING', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3204', category: '32', categoryName: 'LIGHTING', name: 'COMPANY LABOR', type: 'BTL', dept: 'LIGHTING', isLabor: true },
      { code: '3212', category: '32', categoryName: 'LIGHTING', name: 'GENERATOR FUEL', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3216', category: '32', categoryName: 'LIGHTING', name: 'PURCHASES', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3217', category: '32', categoryName: 'LIGHTING', name: 'BOX RENTALS', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3220', category: '32', categoryName: 'LIGHTING', name: 'LIGHTING PACKAGE', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3221', category: '32', categoryName: 'LIGHTING', name: 'CONDORS AND LIFTS', type: 'BTL', dept: 'LIGHTING', isLabor: false },
      { code: '3300', category: '33', categoryName: 'CAMERA', name: 'CAMERA', type: 'BTL', dept: 'CAMERA', isLabor: false },
      { code: '3303', category: '33', categoryName: 'CAMERA', name: 'ADDITIONAL CAMERA OPERATOR', type: 'BTL', dept: 'CAMERA', isLabor: true },
      { code: '3305', category: '33', categoryName: 'CAMERA', name: '1ST ASSISTANT CAMERA', type: 'BTL', dept: 'CAMERA', isLabor: true },
      { code: '3306', category: '33', categoryName: 'CAMERA', name: '2ND ASSISTANT CAMERA', type: 'BTL', dept: 'CAMERA', isLabor: true },
      { code: '3316', category: '33', categoryName: 'CAMERA', name: 'PURCHASES', type: 'BTL', dept: 'CAMERA', isLabor: false },
      { code: '3317', category: '33', categoryName: 'CAMERA', name: 'BOX RENTALS', type: 'BTL', dept: 'CAMERA', isLabor: false },
      { code: '3318', category: '33', categoryName: 'CAMERA', name: 'EQUIPMENT RENTALS', type: 'BTL', dept: 'CAMERA', isLabor: false },
      { code: '3319', category: '33', categoryName: 'CAMERA', name: 'STEADICAM RENTAL', type: 'BTL', dept: 'CAMERA', isLabor: false },
      { code: '3400', category: '34', categoryName: 'PRODUCTION SOUND', name: 'PRODUCTION SOUND', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3404', category: '34', categoryName: 'PRODUCTION SOUND', name: 'VIDEO ASSIST OPERATOR', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: true },
      { code: '3405', category: '34', categoryName: 'PRODUCTION SOUND', name: '24-FRAME PLAYBACK', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3416', category: '34', categoryName: 'PRODUCTION SOUND', name: 'PURCHASES', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3418', category: '34', categoryName: 'PRODUCTION SOUND', name: 'EQUIPMENT RENTALS', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3420', category: '34', categoryName: 'PRODUCTION SOUND', name: 'SOUND PACKAGE RENTALS', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3422', category: '34', categoryName: 'PRODUCTION SOUND', name: 'WALKIE TALKIES', type: 'BTL', dept: 'PRODUCTION SOUND', isLabor: false },
      { code: '3500', category: '35', categoryName: 'TRANSPORTATION', name: 'TRANSPORTATION', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3501', category: '35', categoryName: 'TRANSPORTATION', name: 'TRANSPORTATION COORDINATOR', type: 'BTL', dept: 'TRANSPORTATION', isLabor: true },
      { code: '3502', category: '35', categoryName: 'TRANSPORTATION', name: 'CAPTAIN', type: 'BTL', dept: 'TRANSPORTATION', isLabor: true },
      { code: '3503', category: '35', categoryName: 'TRANSPORTATION', name: 'STUDIO DRIVERS', type: 'BTL', dept: 'TRANSPORTATION', isLabor: true },
      { code: '3516', category: '35', categoryName: 'TRANSPORTATION', name: 'PURCHASES', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3517', category: '35', categoryName: 'TRANSPORTATION', name: 'BOX/COMPUTER RENTALS', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3518', category: '35', categoryName: 'TRANSPORTATION', name: 'VEHICLE RENTALS', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3544', category: '35', categoryName: 'TRANSPORTATION', name: 'GASOLINE & OIL', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3545', category: '35', categoryName: 'TRANSPORTATION', name: 'MILEAGE', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3546', category: '35', categoryName: 'TRANSPORTATION', name: 'REPAIRS & MAINTENANCE', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3547', category: '35', categoryName: 'TRANSPORTATION', name: 'PARKING/PERMITS/TAXIS', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3585', category: '35', categoryName: 'TRANSPORTATION', name: 'MISCELLANEOUS', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3598', category: '35', categoryName: 'TRANSPORTATION', name: 'LOSS & DAMAGE', type: 'BTL', dept: 'TRANSPORTATION', isLabor: false },
      { code: '3600', category: '36', categoryName: 'LOCATION', name: 'LOCATION', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3602', category: '36', categoryName: 'LOCATION', name: 'HOTELS', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3604', category: '36', categoryName: 'LOCATION', name: 'LIVING EXPENSES/PER DIEM', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3605', category: '36', categoryName: 'LOCATION', name: 'GROUND TRANSPORTATION', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3606', category: '36', categoryName: 'LOCATION', name: 'SCOUTING/SURVEY COSTS', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3607', category: '36', categoryName: 'LOCATION', name: 'SITE RENTALS/PERMITS', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3609', category: '36', categoryName: 'LOCATION', name: 'COURTESY PAYMENTS', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3613', category: '36', categoryName: 'LOCATION', name: 'SHIPPING/POSTAGE', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3620', category: '36', categoryName: 'LOCATION', name: 'CATERED MEALS', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3621', category: '36', categoryName: 'LOCATION', name: 'CATERER HELPERS', type: 'BTL', dept: 'LOCATION', isLabor: true },
      { code: '3625', category: '36', categoryName: 'LOCATION', name: 'FIRST AID TECHNICIANS', type: 'BTL', dept: 'LOCATION', isLabor: true },
      { code: '3627', category: '36', categoryName: 'LOCATION', name: 'FIRST AID KIT RENTAL', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3630', category: '36', categoryName: 'LOCATION', name: 'SECURITY SERVICES', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3631', category: '36', categoryName: 'LOCATION', name: 'POLICE & FIREMEN', type: 'BTL', dept: 'LOCATION', isLabor: true },
      { code: '3632', category: '36', categoryName: 'LOCATION', name: 'MISC LOCAL EMPLOYEES', type: 'BTL', dept: 'LOCATION', isLabor: true },
      { code: '3685', category: '36', categoryName: 'LOCATION', name: 'MISC EXPENSES', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3698', category: '36', categoryName: 'LOCATION', name: 'LOSS & DAMAGE', type: 'BTL', dept: 'LOCATION', isLabor: false },
      { code: '3700', category: '37', categoryName: 'PRODUCTION FILM & LAB', name: 'PRODUCTION FILM & LAB', type: 'BTL', dept: 'PRODUCTION FILM & LAB', isLabor: false },
      { code: '3764', category: '37', categoryName: 'PRODUCTION FILM & LAB', name: 'STREAMING TRANSMISSION', type: 'BTL', dept: 'PRODUCTION FILM & LAB', isLabor: false },
      { code: '3772', category: '37', categoryName: 'PRODUCTION FILM & LAB', name: 'ARCHIVAL/CASSETTES', type: 'BTL', dept: 'PRODUCTION FILM & LAB', isLabor: false },
      { code: '3785', category: '37', categoryName: 'PRODUCTION FILM & LAB', name: 'MISC EXPENSES', type: 'BTL', dept: 'PRODUCTION FILM & LAB', isLabor: false },
      { code: '4100', category: '41', categoryName: 'TESTS', name: 'TESTS', type: 'POST', dept: 'TESTS', isLabor: false },
      { code: '4200', category: '42', categoryName: 'STAGE RENTAL', name: 'STAGE RENTAL', type: 'POST', dept: 'STAGE RENTAL', isLabor: false },
      { code: '4206', category: '42', categoryName: 'STAGE RENTAL', name: 'OTHER STAGES & FACILITIES', type: 'POST', dept: 'STAGE RENTAL', isLabor: false },
      { code: '4210', category: '42', categoryName: 'STAGE RENTAL', name: 'STORAGE CHARGES', type: 'POST', dept: 'STAGE RENTAL', isLabor: false },
      { code: '4250', category: '42', categoryName: 'STAGE RENTAL', name: 'TRASH REMOVAL/DRESSING ROOMS', type: 'POST', dept: 'STAGE RENTAL', isLabor: false },
      { code: '4400', category: '44', categoryName: 'VISUAL EFFECTS', name: 'VISUAL EFFECTS', type: 'POST', dept: 'VISUAL EFFECTS', isLabor: false },
      { code: '4432', category: '44', categoryName: 'VISUAL EFFECTS', name: 'VFX', type: 'POST', dept: 'VISUAL EFFECTS', isLabor: false },
      { code: '4600', category: '46', categoryName: 'MUSIC', name: 'MUSIC', type: 'POST', dept: 'MUSIC', isLabor: false },
      { code: '4602', category: '46', categoryName: 'MUSIC', name: 'COMPOSER', type: 'POST', dept: 'MUSIC', isLabor: true },
      { code: '4605', category: '46', categoryName: 'MUSIC', name: 'LICENSED MUSIC & SUPERVISION', type: 'POST', dept: 'MUSIC', isLabor: false },
      { code: '4646', category: '46', categoryName: 'MUSIC', name: 'MUSIC LICENSE BUYOUT', type: 'POST', dept: 'MUSIC', isLabor: false },
      { code: '6700', category: '67', categoryName: 'INSURANCE', name: 'INSURANCE', type: 'OTHER', dept: 'INSURANCE', isLabor: false },
      { code: '6701', category: '67', categoryName: 'INSURANCE', name: 'PRODUCTION INSURANCE', type: 'OTHER', dept: 'INSURANCE', isLabor: false },
      { code: '6702', category: '67', categoryName: 'INSURANCE', name: 'NEG INSURANCE', type: 'OTHER', dept: 'INSURANCE', isLabor: false },
      { code: '6703', category: '67', categoryName: 'INSURANCE', name: 'ERRORS & OMISSIONS', type: 'OTHER', dept: 'INSURANCE', isLabor: false },
      { code: '6705', category: '67', categoryName: 'INSURANCE', name: 'OTHER INSURANCE', type: 'OTHER', dept: 'INSURANCE', isLabor: false },
      { code: '6803', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'XEROX', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false },
      { code: '6829', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'LEGAL FEES', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false },
      { code: '6835', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'ELECTRIC GOLF CARTS', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false },
      { code: '6861', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'COMPUTER RENTAL', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false },
      { code: '6864', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'ACCOUNTING', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false },
      { code: '6885', category: '68', categoryName: 'GENERAL & ADMINISTRATIVE', name: 'MISC EXPENSES', type: 'OTHER', dept: 'GENERAL & ADMINISTRATIVE', isLabor: false }
    ];

    // Insert all accounts
    let inserted = 0;
    for (const acct of accounts) {
      await db.query(`
        INSERT INTO chart_of_accounts
        (account_code, category_code, category_name, account_name, account_type, department, is_labor, is_fringe_account, standard_system, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, false, 'STANDARD', $8)
        ON CONFLICT (account_code) DO NOTHING
      `, [acct.code, acct.category, acct.categoryName, acct.name, acct.type, acct.dept, acct.isLabor, parseInt(acct.code)]);
      inserted++;
    }

    aiLogger.info('Chart of Accounts seeded', { inserted, total: accounts.length });

    res.json({
      success: true,
      message: `Seeded ${accounts.length} chart of accounts`,
      details: { inserted, total: accounts.length }
    });
  } catch (error) {
    aiLogger.error('Failed to seed chart of accounts', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WHAT-IF ANALYZER API - Predictive Variance and Scenario Modeling
// ============================================================================

// Analyze a single what-if scenario
app.post('/api/ai/whatif/analyze', async (req, res) => {
  try {
    const { baseline, scenario } = req.body;

    if (!baseline || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'baseline and scenario are required'
      });
    }

    aiLogger.info('Analyzing what-if scenario', {
      scenarioName: scenario.name,
      baselineBudget: baseline.totalBudget
    });

    const analysis = analyzeScenario(baseline, scenario, db);

    res.json({
      success: true,
      analysis,
      summary: summarizeScenario(analysis)
    });
  } catch (error) {
    aiLogger.error('What-if analysis failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Compare multiple scenarios
app.post('/api/ai/whatif/compare', async (req, res) => {
  try {
    const { baseline, scenarios } = req.body;

    if (!baseline || !scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        error: 'baseline and scenarios array are required'
      });
    }

    aiLogger.info('Comparing what-if scenarios', {
      count: scenarios.length,
      baselineBudget: baseline.totalBudget
    });

    const comparison = compareScenarios(baseline, scenarios, db);

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    aiLogger.error('Scenario comparison failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Predict variance for a production
app.post('/api/ai/whatif/predict-variance', async (req, res) => {
  try {
    const { baseline } = req.body;

    if (!baseline) {
      return res.status(400).json({
        success: false,
        error: 'baseline is required'
      });
    }

    aiLogger.info('Predicting variance', {
      productionType: baseline.productionType,
      totalBudget: baseline.totalBudget
    });

    const prediction = predictVariance(baseline, db);

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    aiLogger.error('Variance prediction failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Parse natural language scenario request
app.post('/api/ai/whatif/parse', async (req, res) => {
  try {
    const { request } = req.body;

    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'request text is required'
      });
    }

    aiLogger.info('Parsing scenario request', { request });

    const scenario = parseScenarioRequest(request);

    res.json({
      success: true,
      scenario
    });
  } catch (error) {
    aiLogger.error('Scenario parsing failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get historical variance data by production type
app.get('/api/ai/whatif/historical-variance', (req, res) => {
  try {
    res.json({
      success: true,
      data: HISTORICAL_VARIANCE
    });
  } catch (error) {
    aiLogger.error('Failed to get historical variance', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze what-if for a specific production
app.post('/api/ai/whatif/production/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { scenario } = req.body;

    // Get current production data as baseline
    const productionResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (productionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found'
      });
    }

    const production = productionResult.rows[0];

    // Get current budget totals
    const budgetResult = await db.query(
      `SELECT COALESCE(SUM(total), 0) as total_budget
       FROM budget_line_items WHERE production_id = $1`,
      [productionId]
    );

    // Build baseline from production data
    const baseline = {
      totalBudget: parseFloat(budgetResult.rows[0].total_budget) || production.budget || 10000000,
      productionType: production.production_type || 'theatrical',
      shootDays: production.shoot_days || 30,
      locations: production.location_count || 5,
      crewSize: production.crew_size || 50,
      principalCast: production.principal_cast || 5,
      contingency: production.contingency || 0.10
    };

    aiLogger.info('Analyzing what-if for production', {
      productionId,
      baseline
    });

    const analysis = analyzeScenario(baseline, scenario, db);

    res.json({
      success: true,
      production: {
        id: production.id,
        name: production.name,
        type: production.production_type
      },
      baseline,
      analysis,
      summary: summarizeScenario(analysis)
    });
  } catch (error) {
    aiLogger.error('Production what-if analysis failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// NESTED LINE ITEMS API - Modern replacement for hidden 4th Level
// ============================================================================

// Get line items with their children (tree structure)
app.get('/api/productions/:productionId/line-items/tree', async (req, res) => {
  try {
    const { productionId } = req.params;

    // Get all line items for this production
    const result = await db.query(`
      SELECT * FROM budget_line_items
      WHERE production_id = $1
      ORDER BY account_code, sort_order, created_at
    `, [productionId]);

    // Build tree structure
    const items = result.rows;
    const itemMap = new Map();
    const rootItems = [];

    // First pass: create map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree
    items.forEach(item => {
      const node = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(node);
      } else {
        rootItems.push(node);
      }
    });

    res.json({
      success: true,
      items: rootItems,
      totalCount: items.length
    });
  } catch (error) {
    apiLogger.error('Failed to get line items tree', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a child line item to a parent
app.post('/api/line-items/:parentId/children', async (req, res) => {
  try {
    const { parentId } = req.params;
    const { description, quantity, rate, notes } = req.body;

    // Get parent item
    const parentResult = await db.query(
      'SELECT * FROM budget_line_items WHERE id = $1',
      [parentId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Parent item not found' });
    }

    const parent = parentResult.rows[0];
    const subtotal = (quantity || 0) * (rate || 0);

    // Create child item
    const result = await db.query(`
      INSERT INTO budget_line_items (
        production_id, parent_id, account_code, description,
        quantity, rate, subtotal, total, notes, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8,
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM budget_line_items WHERE parent_id = $2)
      )
      RETURNING *
    `, [
      parent.production_id,
      parentId,
      parent.account_code,
      description,
      quantity || 0,
      rate || 0,
      subtotal,
      notes || ''
    ]);

    // Mark parent as having children
    await db.query(
      'UPDATE budget_line_items SET is_parent = true WHERE id = $1',
      [parentId]
    );

    // Recalculate parent total from children
    await recalculateParentTotal(parentId);

    res.json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    apiLogger.error('Failed to add child line item', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get children of a line item
app.get('/api/line-items/:parentId/children', async (req, res) => {
  try {
    const { parentId } = req.params;

    const result = await db.query(`
      SELECT * FROM budget_line_items
      WHERE parent_id = $1
      ORDER BY sort_order, created_at
    `, [parentId]);

    res.json({
      success: true,
      children: result.rows
    });
  } catch (error) {
    apiLogger.error('Failed to get children', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update calculation breakdown for a line item
app.put('/api/line-items/:id/calculation', async (req, res) => {
  try {
    const { id } = req.params;
    const { calculation_breakdown } = req.body;

    const result = await db.query(`
      UPDATE budget_line_items
      SET calculation_breakdown = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(calculation_breakdown), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Line item not found' });
    }

    res.json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    apiLogger.error('Failed to update calculation', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get calculation breakdown for a line item
app.get('/api/line-items/:id/calculation', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT id, description, quantity, rate, subtotal, fringes, total,
             calculation_breakdown, is_parent
      FROM budget_line_items WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Line item not found' });
    }

    const item = result.rows[0];

    // If has children, also get children summary
    let childrenSummary = null;
    if (item.is_parent) {
      const childResult = await db.query(`
        SELECT description, quantity, rate, subtotal, total
        FROM budget_line_items WHERE parent_id = $1
        ORDER BY sort_order
      `, [id]);
      childrenSummary = childResult.rows;
    }

    res.json({
      success: true,
      item,
      childrenSummary,
      breakdown: item.calculation_breakdown || generateDefaultBreakdown(item)
    });
  } catch (error) {
    apiLogger.error('Failed to get calculation', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recalculate parent total from children
app.post('/api/line-items/:parentId/recalculate', async (req, res) => {
  try {
    const { parentId } = req.params;
    const newTotal = await recalculateParentTotal(parentId);

    res.json({
      success: true,
      newTotal
    });
  } catch (error) {
    apiLogger.error('Failed to recalculate', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to recalculate parent total
async function recalculateParentTotal(parentId) {
  const childrenResult = await db.query(
    'SELECT SUM(total) as total FROM budget_line_items WHERE parent_id = $1',
    [parentId]
  );

  const childrenTotal = parseFloat(childrenResult.rows[0].total) || 0;

  await db.query(
    'UPDATE budget_line_items SET subtotal = $1, total = $1 WHERE id = $2',
    [childrenTotal, parentId]
  );

  return childrenTotal;
}

// Helper function to generate default breakdown
function generateDefaultBreakdown(item) {
  return {
    type: 'simple',
    steps: [
      { label: 'Quantity', value: item.quantity, operation: 'base' },
      { label: 'Rate', value: item.rate, operation: 'multiply' },
      { label: 'Subtotal', value: item.subtotal, operation: 'result' }
    ],
    fringes: item.fringes ? {
      rate: item.fringes / item.subtotal,
      amount: item.fringes
    } : null,
    total: item.total
  };
}

// ============================================================================
// BUDGET GUARDIAN API - Compliance Auditing and Tax Incentives
// ============================================================================

// Audit a production budget for compliance
app.post('/api/ai/guardian/audit/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;

    // Get production
    const productionResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (productionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found'
      });
    }

    const production = productionResult.rows[0];

    // Get all line items
    const lineItemsResult = await db.query(
      'SELECT * FROM budget_line_items WHERE production_id = $1',
      [productionId]
    );

    aiLogger.info('Running budget audit', {
      productionId,
      lineItems: lineItemsResult.rows.length
    });

    const audit = await auditBudget(production, lineItemsResult.rows, db);

    res.json({
      success: true,
      audit,
      summary: summarizeAudit(audit)
    });
  } catch (error) {
    aiLogger.error('Budget audit failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check a single rate for compliance
app.post('/api/ai/guardian/check-rate', async (req, res) => {
  try {
    const { position, rate, productionType, location } = req.body;

    if (!position || rate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'position and rate are required'
      });
    }

    aiLogger.info('Checking rate compliance', { position, rate, productionType, location });

    const result = await checkRate(
      position,
      rate,
      productionType || 'theatrical',
      location || 'Los Angeles',
      db
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    aiLogger.error('Rate check failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate tax incentives for a budget
app.post('/api/ai/guardian/tax-incentives', async (req, res) => {
  try {
    const { budget, lineItems } = req.body;

    if (!budget || !lineItems) {
      return res.status(400).json({
        success: false,
        error: 'budget and lineItems are required'
      });
    }

    aiLogger.info('Calculating tax incentives', {
      location: budget.primary_location,
      itemCount: lineItems.length
    });

    const incentives = calculateTaxIncentives(budget, lineItems);

    res.json({
      success: true,
      incentives
    });
  } catch (error) {
    aiLogger.error('Tax incentive calculation failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available tax incentive programs
app.get('/api/ai/guardian/tax-programs', (req, res) => {
  try {
    const programs = getTaxIncentivePrograms();
    res.json({
      success: true,
      programs
    });
  } catch (error) {
    aiLogger.error('Failed to get tax programs', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get compliance rules by production type
app.get('/api/ai/guardian/compliance-rules', (req, res) => {
  try {
    const { productionType } = req.query;

    if (productionType && COMPLIANCE_RULES[productionType]) {
      res.json({
        success: true,
        productionType,
        rules: COMPLIANCE_RULES[productionType]
      });
    } else {
      res.json({
        success: true,
        allRules: COMPLIANCE_RULES
      });
    }
  } catch (error) {
    aiLogger.error('Failed to get compliance rules', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick audit for a production (lightweight version)
app.get('/api/ai/guardian/quick-audit/:productionId', async (req, res) => {
  try {
    const { productionId } = req.params;

    // Get production
    const productionResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (productionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production not found'
      });
    }

    const production = productionResult.rows[0];

    // Get line item summary
    const summaryResult = await db.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(total) as total_budget,
        SUM(fringes) as total_fringes,
        COUNT(CASE WHEN fringes = 0 OR fringes IS NULL THEN 1 END) as items_without_fringes
      FROM budget_line_items WHERE production_id = $1
    `, [productionId]);

    const summary = summaryResult.rows[0];
    const rules = COMPLIANCE_RULES[production.production_type] || COMPLIANCE_RULES.theatrical;

    // Quick compliance checks
    const issues = [];

    // Check fringe coverage
    const fringeRatio = summary.items_without_fringes / summary.total_items;
    if (fringeRatio > 0.3) {
      issues.push({
        type: 'warning',
        category: 'fringes',
        message: `${Math.round(fringeRatio * 100)}% of items missing fringe calculations`
      });
    }

    // Check if tax incentive eligible
    const incentives = calculateTaxIncentives(production, []);
    const eligible = incentives.some(i => i.eligible);

    res.json({
      success: true,
      production: {
        id: production.id,
        name: production.name,
        type: production.production_type,
        location: production.primary_location
      },
      summary: {
        totalItems: parseInt(summary.total_items),
        totalBudget: parseFloat(summary.total_budget) || 0,
        totalFringes: parseFloat(summary.total_fringes) || 0,
        itemsWithoutFringes: parseInt(summary.items_without_fringes)
      },
      issues,
      taxIncentiveEligible: eligible,
      complianceRules: rules
    });
  } catch (error) {
    aiLogger.error('Quick audit failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// REFERENCE DOCS API (Movie Magic Manual, etc.)
// ============================================================================

// Get all reference docs (summary view)
app.get('/api/reference-docs', async (req, res) => {
  try {
    const { topic, doc_type, search } = req.query;

    let query = `
      SELECT id, doc_name, doc_type, source, section, page_start, page_end,
             summary, topics, created_at
      FROM reference_docs
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (topic) {
      query += ` AND $${paramIndex} = ANY(topics)`;
      params.push(topic);
      paramIndex++;
    }

    if (doc_type) {
      query += ` AND doc_type = $${paramIndex}`;
      params.push(doc_type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (content ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY page_start NULLS LAST`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    appLogger.error('Error fetching reference docs', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get full content of a specific reference doc
app.get('/api/reference-docs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT * FROM reference_docs WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    appLogger.error('Error fetching reference doc', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search reference docs by topic
app.get('/api/reference-docs/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;

    const result = await db.query(`
      SELECT id, doc_name, doc_type, section, page_start, page_end,
             summary, topics
      FROM reference_docs
      WHERE $1 = ANY(topics)
      ORDER BY page_start NULLS LAST
    `, [topic]);

    res.json({
      success: true,
      topic,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    appLogger.error('Error searching reference docs by topic', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of available topics
app.get('/api/reference-docs/topics/list', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT unnest(topics) as topic,
             COUNT(*) as doc_count
      FROM reference_docs
      GROUP BY topic
      ORDER BY doc_count DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    appLogger.error('Error fetching topics list', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// API ROUTES - UNION AGREEMENTS
// ============================================================================

// Get all available union agreements
app.get('/api/agreements', async (req, res) => {
  try {
    const { union_name, active_only } = req.query;

    let query = `
      SELECT id, union_name, agreement_type,
             effective_date_start, effective_date_end,
             document_url, rules, created_at
      FROM union_agreements
      WHERE 1=1
    `;
    const params = [];

    if (union_name) {
      params.push(union_name);
      query += ` AND union_name = $${params.length}`;
    }

    if (active_only === 'true') {
      query += ` AND (effective_date_end IS NULL OR effective_date_end >= CURRENT_DATE)`;
    }

    query += ' ORDER BY union_name, effective_date_start DESC';

    const result = await db.query(query, params);

    // Group by union for easier frontend consumption
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.union_name]) {
        grouped[row.union_name] = [];
      }
      grouped[row.union_name].push(row);
    });

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      grouped: grouped
    });
  } catch (error) {
    appLogger.error('Error fetching agreements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recommended agreements based on production parameters
app.post('/api/agreements/recommend', async (req, res) => {
  try {
    const { production_type, distribution_platform, start_date, shooting_location } = req.body;
    const effectiveDate = start_date || new Date().toISOString().split('T')[0];

    // Get active agreements for each major guild
    const result = await db.query(`
      SELECT DISTINCT ON (union_name)
        id, union_name, agreement_type,
        effective_date_start, effective_date_end, rules
      FROM union_agreements
      WHERE union_name IN ('IATSE', 'SAG-AFTRA', 'DGA', 'WGA', 'Teamsters Local 399')
        AND (effective_date_start IS NULL OR effective_date_start <= $1)
        AND (effective_date_end IS NULL OR effective_date_end >= $1)
        AND (
          agreement_type ILIKE '%Basic Agreement%'
          OR agreement_type ILIKE '%2024%'
          OR agreement_type ILIKE '%2023%'
        )
      ORDER BY union_name, effective_date_start DESC
    `, [effectiveDate]);

    // Get applicable sideletters
    const sideletterResult = await db.query(`
      SELECT id, sideletter_name, production_type, distribution_platform,
             wage_adjustment_pct, holiday_pay_pct, vacation_pay_pct,
             overtime_rules, season_number, location_restriction
      FROM sideletter_rules
      WHERE (production_type = $1 OR production_type IS NULL)
        AND (distribution_platform = $2 OR distribution_platform IS NULL)
      ORDER BY
        CASE WHEN production_type = $1 THEN 1 ELSE 2 END,
        CASE WHEN distribution_platform = $2 THEN 1 ELSE 2 END
    `, [production_type, distribution_platform]);

    const recommendations = {
      iatse: result.rows.find(r => r.union_name === 'IATSE'),
      sag_aftra: result.rows.find(r => r.union_name === 'SAG-AFTRA'),
      dga: result.rows.find(r => r.union_name === 'DGA'),
      wga: result.rows.find(r => r.union_name === 'WGA'),
      teamsters: result.rows.find(r => r.union_name === 'Teamsters Local 399'),
      applicable_sideletters: sideletterResult.rows.slice(0, 5) // Top 5 most relevant
    };

    res.json({
      success: true,
      data: recommendations,
      message: 'Recommended agreements based on production parameters'
    });
  } catch (error) {
    appLogger.error('Error recommending agreements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single agreement by ID
app.get('/api/agreements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT id, union_name, agreement_type,
             effective_date_start, effective_date_end,
             document_url, rules, created_at
      FROM union_agreements
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agreement not found' });
    }

    // Also get related sideletters
    const sideletters = await db.query(`
      SELECT * FROM sideletter_rules
      WHERE union_name = $1
    `, [result.rows[0].union_name]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        sideletters: sideletters.rows
      }
    });
  } catch (error) {
    appLogger.error('Error fetching agreement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get production's agreements (what agreements are assigned to a production)
app.get('/api/productions/:production_id/agreements', async (req, res) => {
  try {
    const { production_id } = req.params;

    const result = await db.query(`
      SELECT p.id, p.name, p.production_type, p.distribution_platform,
             p.is_union_signatory, p.applied_sideletters, p.agreement_notes,
             ia.id as iatse_agreement_id, ia.agreement_type as iatse_agreement_type,
             sa.id as sag_aftra_agreement_id, sa.agreement_type as sag_aftra_agreement_type,
             da.id as dga_agreement_id, da.agreement_type as dga_agreement_type,
             wa.id as wga_agreement_id, wa.agreement_type as wga_agreement_type,
             ta.id as teamsters_agreement_id, ta.agreement_type as teamsters_agreement_type
      FROM productions p
      LEFT JOIN union_agreements ia ON p.iatse_agreement_id = ia.id
      LEFT JOIN union_agreements sa ON p.sag_aftra_agreement_id = sa.id
      LEFT JOIN union_agreements da ON p.dga_agreement_id = da.id
      LEFT JOIN union_agreements wa ON p.wga_agreement_id = wa.id
      LEFT JOIN union_agreements ta ON p.teamsters_agreement_id = ta.id
      WHERE p.id = $1
    `, [production_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    appLogger.error('Error fetching production agreements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update production's agreements
app.put('/api/productions/:production_id/agreements', async (req, res) => {
  try {
    const { production_id } = req.params;
    const {
      iatse_agreement_id,
      sag_aftra_agreement_id,
      dga_agreement_id,
      wga_agreement_id,
      teamsters_agreement_id,
      applied_sideletters,
      is_union_signatory,
      agreement_notes
    } = req.body;

    const result = await db.query(`
      UPDATE productions
      SET
        iatse_agreement_id = COALESCE($2, iatse_agreement_id),
        sag_aftra_agreement_id = COALESCE($3, sag_aftra_agreement_id),
        dga_agreement_id = COALESCE($4, dga_agreement_id),
        wga_agreement_id = COALESCE($5, wga_agreement_id),
        teamsters_agreement_id = COALESCE($6, teamsters_agreement_id),
        applied_sideletters = COALESCE($7, applied_sideletters),
        is_union_signatory = COALESCE($8, is_union_signatory),
        agreement_notes = COALESCE($9, agreement_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      production_id,
      iatse_agreement_id,
      sag_aftra_agreement_id,
      dga_agreement_id,
      wga_agreement_id,
      teamsters_agreement_id,
      JSON.stringify(applied_sideletters || []),
      is_union_signatory,
      agreement_notes
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Production agreements updated successfully'
    });
  } catch (error) {
    appLogger.error('Error updating production agreements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// API ROUTES - PDF EXPORT
// ============================================================================

// Export budget to PDF
app.get('/api/productions/:production_id/export/pdf', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { format = 'topsheet' } = req.query; // topsheet, detail, or full

    // Get production details
    const prodResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [production_id]
    );

    if (prodResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    const production = prodResult.rows[0];

    // Get line items grouped by category
    const lineItemsResult = await db.query(`
      SELECT *
      FROM budget_line_items
      WHERE production_id = $1
      ORDER BY account_code, position_title
    `, [production_id]);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${production.name.replace(/[^a-z0-9]/gi, '_')}_Budget.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      const num = parseFloat(amount || 0);
      return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('PRODUCTION BUDGET', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(production.name, { align: 'center' });
    doc.moveDown(0.5);

    // Production Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Production Type: ${production.production_type || 'N/A'}`, 50);
    doc.text(`Location: ${production.shooting_location || 'N/A'}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`);
    doc.moveDown();

    // Calculate totals by category
    const categories = {};
    let grandTotal = 0;

    lineItemsResult.rows.forEach(item => {
      const catCode = item.account_code?.substring(0, 2) || '00';
      if (!categories[catCode]) {
        categories[catCode] = { items: [], total: 0 };
      }
      categories[catCode].items.push(item);
      categories[catCode].total += parseFloat(item.total || 0);
      grandTotal += parseFloat(item.total || 0);
    });

    // Category names mapping
    const categoryNames = {
      '01': 'STORY & RIGHTS',
      '02': 'TALENT',
      '03': 'DIRECTION',
      '04': 'CAST',
      '05': 'TRAVEL & LIVING',
      '06': 'PRODUCTION STAFF',
      '07': 'ART DEPARTMENT',
      '08': 'SET CONSTRUCTION',
      '09': 'SET OPERATIONS',
      '10': 'SPECIAL EFFECTS',
      '11': 'SET DRESSING',
      '12': 'PROPS',
      '13': 'WARDROBE',
      '14': 'MAKEUP & HAIR',
      '15': 'ELECTRICAL',
      '16': 'CAMERA',
      '17': 'PRODUCTION SOUND',
      '18': 'TRANSPORTATION',
      '19': 'LOCATION',
      '20': 'PICTURE VEHICLES/ANIMALS',
      '21': 'FILM & LAB',
      '22': 'SECOND UNIT',
      '23': 'TESTS',
      '24': 'POST PRODUCTION SUPERVISION',
      '25': 'EDITING',
      '26': 'MUSIC',
      '27': 'POST PRODUCTION SOUND',
      '28': 'POST PRODUCTION FILM & LAB',
      '29': 'MAIN & END TITLES',
      '30': 'FRINGE BENEFITS',
      '31': 'PUBLICITY',
      '32': 'INSURANCE',
      '33': 'GENERAL EXPENSES',
    };

    // Topsheet - Category Summary
    doc.fontSize(14).font('Helvetica-Bold').text('BUDGET TOPSHEET', { underline: true });
    doc.moveDown(0.5);

    // Draw table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('ACCT', 50, tableTop, { width: 40 });
    doc.text('CATEGORY', 95, tableTop, { width: 250 });
    doc.text('TOTAL', 400, tableTop, { width: 100, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Category rows
    let yPos = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    Object.keys(categories).sort().forEach(catCode => {
      const cat = categories[catCode];
      const catName = categoryNames[catCode] || `Category ${catCode}`;

      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc.text(catCode, 50, yPos, { width: 40 });
      doc.text(catName, 95, yPos, { width: 250 });
      doc.text(formatCurrency(cat.total), 400, yPos, { width: 100, align: 'right' });
      yPos += 15;
    });

    // Total line
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL', 95, yPos);
    doc.text(formatCurrency(grandTotal), 400, yPos, { width: 100, align: 'right' });

    // Add detail pages if requested
    if (format === 'detail' || format === 'full') {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('BUDGET DETAIL', { underline: true });
      doc.moveDown(0.5);

      Object.keys(categories).sort().forEach(catCode => {
        const cat = categories[catCode];
        const catName = categoryNames[catCode] || `Category ${catCode}`;

        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(11).font('Helvetica-Bold').text(`${catCode} - ${catName}`);
        doc.moveDown(0.3);

        // Column headers
        const headerY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Acct', 50, headerY, { width: 50 });
        doc.text('Description', 105, headerY, { width: 180 });
        doc.text('Rate', 290, headerY, { width: 60, align: 'right' });
        doc.text('Qty', 355, headerY, { width: 40, align: 'right' });
        doc.text('Total', 440, headerY, { width: 70, align: 'right' });

        let detailY = headerY + 12;
        doc.font('Helvetica').fontSize(8);

        cat.items.forEach(item => {
          if (detailY > 720) {
            doc.addPage();
            detailY = 50;
          }

          doc.text(item.account_code || '', 50, detailY, { width: 50 });
          doc.text((item.position_title || item.description || '').substring(0, 35), 105, detailY, { width: 180 });
          doc.text(formatCurrency(item.rate), 290, detailY, { width: 60, align: 'right' });
          doc.text(item.quantity?.toString() || '', 355, detailY, { width: 40, align: 'right' });
          doc.text(formatCurrency(item.total), 440, detailY, { width: 70, align: 'right' });
          detailY += 11;
        });

        // Category total
        doc.font('Helvetica-Bold');
        doc.text(`${catCode} Total:`, 290, detailY + 5, { width: 100 });
        doc.text(formatCurrency(cat.total), 440, detailY + 5, { width: 70, align: 'right' });
        doc.moveDown(1.5);
      });
    }

    // Footer on each page
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Page ${i + 1} of ${pages.count} | Generated by AI Budget System | ${new Date().toLocaleString()}`,
        50,
        750,
        { width: 500, align: 'center' }
      );
    }

    doc.end();

  } catch (error) {
    appLogger.error('Error generating PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// API ROUTES - BUDGET COMPARISON (Original vs Current)
// ============================================================================

// Lock original totals (set current as baseline)
app.post('/api/productions/:production_id/lock-original', async (req, res) => {
  try {
    const { production_id } = req.params;

    // Check if already locked
    const prodCheck = await db.query(
      'SELECT lock_original_totals FROM productions WHERE id = $1',
      [production_id]
    );

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    if (prodCheck.rows[0].lock_original_totals) {
      return res.status(400).json({
        success: false,
        error: 'Original totals are already locked. Unlock first to re-lock.',
      });
    }

    // Copy current totals to original columns
    const updateResult = await db.query(`
      UPDATE budget_line_items
      SET
        original_subtotal = subtotal,
        original_total = total
      WHERE production_id = $1
      RETURNING id
    `, [production_id]);

    // Lock the production
    await db.query(`
      UPDATE productions
      SET lock_original_totals = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [production_id]);

    res.json({
      success: true,
      message: 'Original totals locked successfully',
      line_items_updated: updateResult.rows.length
    });
  } catch (error) {
    appLogger.error('Error locking original totals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unlock original totals
app.post('/api/productions/:production_id/unlock-original', async (req, res) => {
  try {
    const { production_id } = req.params;

    await db.query(`
      UPDATE productions
      SET lock_original_totals = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [production_id]);

    res.json({
      success: true,
      message: 'Original totals unlocked'
    });
  } catch (error) {
    appLogger.error('Error unlocking original totals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get budget comparison report
app.get('/api/productions/:production_id/comparison', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { by_category, by_account } = req.query;

    // Get production info
    const prodResult = await db.query(
      'SELECT name, lock_original_totals, budget_target FROM productions WHERE id = $1',
      [production_id]
    );

    if (prodResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    const production = prodResult.rows[0];

    // Get line items with variance
    const lineItemsResult = await db.query(`
      SELECT
        id,
        account_code,
        position_title,
        description,
        rate,
        quantity,
        units,
        subtotal,
        total,
        original_subtotal,
        original_total,
        (COALESCE(total, 0) - COALESCE(original_total, 0)) as variance,
        CASE
          WHEN COALESCE(original_total, 0) > 0
          THEN ((COALESCE(total, 0) - COALESCE(original_total, 0)) / original_total * 100)
          ELSE 0
        END as variance_pct
      FROM budget_line_items
      WHERE production_id = $1
      ORDER BY account_code, position_title
    `, [production_id]);

    // Calculate summary totals
    let originalTotal = 0;
    let currentTotal = 0;
    const categoryTotals = {};

    lineItemsResult.rows.forEach(item => {
      originalTotal += parseFloat(item.original_total || 0);
      currentTotal += parseFloat(item.total || 0);

      // Group by category (first 2-3 chars of account code)
      const category = item.account_code?.substring(0, 3) || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { original: 0, current: 0, variance: 0 };
      }
      categoryTotals[category].original += parseFloat(item.original_total || 0);
      categoryTotals[category].current += parseFloat(item.total || 0);
      categoryTotals[category].variance += parseFloat(item.variance || 0);
    });

    const totalVariance = currentTotal - originalTotal;
    const variancePct = originalTotal > 0 ? (totalVariance / originalTotal * 100) : 0;

    // Find items with significant variance
    const significantVariances = lineItemsResult.rows
      .filter(item => Math.abs(parseFloat(item.variance || 0)) > 100)
      .sort((a, b) => Math.abs(parseFloat(b.variance)) - Math.abs(parseFloat(a.variance)))
      .slice(0, 20);

    res.json({
      success: true,
      production: {
        id: production_id,
        name: production.name,
        budget_target: production.budget_target,
        is_locked: production.lock_original_totals
      },
      summary: {
        original_total: originalTotal.toFixed(2),
        current_total: currentTotal.toFixed(2),
        variance: totalVariance.toFixed(2),
        variance_pct: variancePct.toFixed(1),
        status: totalVariance > 0 ? 'OVER_BUDGET' :
                totalVariance < 0 ? 'UNDER_BUDGET' : 'ON_BUDGET'
      },
      by_category: Object.entries(categoryTotals).map(([code, totals]) => ({
        category_code: code,
        original: totals.original.toFixed(2),
        current: totals.current.toFixed(2),
        variance: totals.variance.toFixed(2),
        variance_pct: totals.original > 0 ? ((totals.variance / totals.original) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => a.category_code.localeCompare(b.category_code)),
      significant_variances: significantVariances.map(item => ({
        id: item.id,
        account_code: item.account_code,
        position_title: item.position_title,
        original: parseFloat(item.original_total || 0).toFixed(2),
        current: parseFloat(item.total || 0).toFixed(2),
        variance: parseFloat(item.variance || 0).toFixed(2),
        variance_pct: parseFloat(item.variance_pct || 0).toFixed(1)
      })),
      line_item_count: lineItemsResult.rows.length
    });
  } catch (error) {
    appLogger.error('Error getting budget comparison:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// API ROUTES - CBA COMPLIANCE CHECKER
// ============================================================================

// Check CBA compliance for a production's budget line items
// Compares rates against union minimum rates from rate_cards
app.get('/api/productions/:production_id/compliance-check', async (req, res) => {
  try {
    const { production_id } = req.params;
    const { include_warnings } = req.query;

    // Get production details including agreements
    const prodResult = await db.query(`
      SELECT p.*,
             ia.agreement_type as iatse_agreement,
             sa.agreement_type as sag_aftra_agreement,
             da.agreement_type as dga_agreement
      FROM productions p
      LEFT JOIN union_agreements ia ON p.iatse_agreement_id = ia.id
      LEFT JOIN union_agreements sa ON p.sag_aftra_agreement_id = sa.id
      LEFT JOIN union_agreements da ON p.dga_agreement_id = da.id
      WHERE p.id = $1
    `, [production_id]);

    if (prodResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production not found' });
    }

    const production = prodResult.rows[0];

    // Get all line items for this production with position information
    const lineItemsResult = await db.query(`
      SELECT bli.*
      FROM budget_line_items bli
      WHERE bli.production_id = $1
        AND bli.rate IS NOT NULL
        AND bli.rate > 0
      ORDER BY bli.account_code, bli.position_title
    `, [production_id]);

    const violations = [];
    const warnings = [];
    let compliantCount = 0;

    // For each line item, check against rate_cards
    for (const item of lineItemsResult.rows) {
      // Find matching rate card based on position title
      // Try exact match first, then fuzzy match
      const rateCardResult = await db.query(`
        SELECT rc.*, rc.base_rate as minimum_rate
        FROM rate_cards rc
        WHERE (
          rc.job_classification ILIKE $1
          OR rc.job_classification ILIKE $2
          OR $1 ILIKE '%' || rc.job_classification || '%'
        )
        AND rc.effective_date <= COALESCE($3, CURRENT_DATE)
        ORDER BY
          CASE WHEN rc.job_classification ILIKE $1 THEN 1
               WHEN rc.job_classification ILIKE $2 THEN 2
               ELSE 3 END,
          rc.effective_date DESC
        LIMIT 1
      `, [item.position_title, '%' + item.position_title + '%', production.principal_photography_start]);

      if (rateCardResult.rows.length > 0) {
        const rateCard = rateCardResult.rows[0];
        const minimumRate = parseFloat(rateCard.minimum_rate);
        const itemRate = parseFloat(item.rate);

        // Calculate rate type adjustment (hourly vs daily vs weekly)
        let adjustedMinimum = minimumRate;
        const rateType = rateCard.rate_type?.toLowerCase() || 'hourly';

        // Normalize to hourly for comparison if needed
        if (rateType === 'daily' && item.unit?.toLowerCase() === 'day') {
          // Both are daily, compare directly
        } else if (rateType === 'weekly' && item.unit?.toLowerCase() === 'week') {
          // Both are weekly, compare directly
        } else if (rateType === 'hourly' && item.unit?.toLowerCase() === 'hour') {
          // Both are hourly, compare directly
        }
        // For mixed comparisons, keep it simple for now

        if (itemRate < adjustedMinimum) {
          violations.push({
            line_item_id: item.id,
            account_code: item.account_code,
            position_title: item.position_title,
            current_rate: itemRate,
            minimum_rate: adjustedMinimum,
            rate_card_classification: rateCard.job_classification,
            union_local: rateCard.union_local,
            unit: item.unit || 'unspecified',
            shortfall: (adjustedMinimum - itemRate).toFixed(2),
            shortfall_pct: (((adjustedMinimum - itemRate) / adjustedMinimum) * 100).toFixed(1),
            severity: itemRate < (adjustedMinimum * 0.9) ? 'critical' : 'warning'
          });
        } else {
          compliantCount++;

          // Add near-minimum warnings if requested
          if (include_warnings === 'true' && itemRate < (adjustedMinimum * 1.05)) {
            warnings.push({
              line_item_id: item.id,
              account_code: item.account_code,
              position_title: item.position_title,
              current_rate: itemRate,
              minimum_rate: adjustedMinimum,
              message: 'Rate is within 5% of minimum'
            });
          }
        }
      }
    }

    // Calculate compliance score
    const totalChecked = violations.length + compliantCount;
    const complianceScore = totalChecked > 0
      ? ((compliantCount / totalChecked) * 100).toFixed(1)
      : 100;

    // Calculate total shortfall
    const totalShortfall = violations.reduce((sum, v) => sum + parseFloat(v.shortfall), 0);

    res.json({
      success: true,
      production_id,
      production_name: production.name,
      is_union_signatory: production.is_union_signatory,
      agreements: {
        iatse: production.iatse_agreement,
        sag_aftra: production.sag_aftra_agreement,
        dga: production.dga_agreement
      },
      summary: {
        total_line_items_checked: totalChecked,
        compliant_count: compliantCount,
        violation_count: violations.length,
        warning_count: warnings.length,
        compliance_score: parseFloat(complianceScore),
        total_shortfall: totalShortfall.toFixed(2),
        status: violations.length === 0 ? 'COMPLIANT' :
                violations.some(v => v.severity === 'critical') ? 'CRITICAL' : 'VIOLATIONS'
      },
      violations,
      warnings: include_warnings === 'true' ? warnings : undefined
    });
  } catch (error) {
    appLogger.error('Error checking CBA compliance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available rate cards for a specific position
app.get('/api/rate-cards/search', async (req, res) => {
  try {
    const { position, union_local, production_type, effective_date } = req.query;

    if (!position) {
      return res.status(400).json({
        success: false,
        error: 'Position search term is required'
      });
    }

    const result = await db.query(`
      SELECT *
      FROM rate_cards
      WHERE job_classification ILIKE $1
        AND ($2::varchar IS NULL OR union_local = $2)
        AND ($3::varchar IS NULL OR production_type = $3 OR production_type IS NULL)
        AND ($4::date IS NULL OR effective_date <= $4)
      ORDER BY
        union_local,
        CASE WHEN job_classification ILIKE $5 THEN 1 ELSE 2 END,
        effective_date DESC
      LIMIT 50
    `, ['%' + position + '%', union_local || null, production_type || null, effective_date || null, position]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    appLogger.error('Error searching rate cards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suggest compliant rate for a position
app.get('/api/rate-cards/suggest', async (req, res) => {
  try {
    const { position, union_local, production_type, effective_date } = req.query;

    if (!position) {
      return res.status(400).json({
        success: false,
        error: 'Position is required'
      });
    }

    // Find best matching rate card
    const result = await db.query(`
      SELECT rc.*,
             rc.base_rate as suggested_rate,
             'Based on ' || rc.job_classification || ' (' || rc.union_local || ')' as suggestion_reason
      FROM rate_cards rc
      WHERE (
        rc.job_classification ILIKE $1
        OR rc.job_classification ILIKE $2
      )
      AND ($3::varchar IS NULL OR rc.union_local ILIKE '%' || $3 || '%')
      AND ($4::date IS NULL OR rc.effective_date <= $4)
      ORDER BY
        CASE
          WHEN rc.job_classification ILIKE $1 THEN 1
          WHEN rc.job_classification ILIKE $2 THEN 2
          ELSE 3
        END,
        rc.effective_date DESC
      LIMIT 5
    `, [position, '%' + position + '%', union_local || null, effective_date || null]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: 'No matching rate card found for this position',
        suggestions: []
      });
    }

    res.json({
      success: true,
      found: true,
      best_match: result.rows[0],
      alternatives: result.rows.slice(1)
    });
  } catch (error) {
    appLogger.error('Error suggesting rate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get compliance summary for all productions
app.get('/api/compliance/summary', async (req, res) => {
  try {
    // Get basic stats
    const statsResult = await db.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_productions,
        COUNT(DISTINCT CASE WHEN p.is_union_signatory THEN p.id END) as union_productions,
        (SELECT COUNT(*) FROM rate_cards) as total_rate_cards,
        (SELECT COUNT(DISTINCT union_local) FROM rate_cards) as unions_covered
      FROM productions p
    `);

    // Get rate card breakdown by union
    const unionBreakdown = await db.query(`
      SELECT union_local, COUNT(*) as rate_count
      FROM rate_cards
      GROUP BY union_local
      ORDER BY rate_count DESC
    `);

    res.json({
      success: true,
      stats: statsResult.rows[0],
      rate_cards_by_union: unionBreakdown.rows
    });
  } catch (error) {
    appLogger.error('Error getting compliance summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Error logging middleware (logs all errors before handling)
app.use(errorLogger(appLogger));

// 404 handler
app.use((req, res) => {
  appLogger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  appLogger.error('Unhandled server error', err, {
    method: req.method,
    url: req.originalUrl || req.url,
    body: req.body,
    params: req.params,
    query: req.query
  });

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// API ROUTES - DYNAMIC BUDGET VIEWS
// ============================================================================

// Initialize views table on startup
ensureViewsTable(db.pool).catch(err => console.error('Failed to create views table:', err));

// Get filter options for a production (departments, unions, account codes, etc.)
app.get('/api/productions/:productionId/views/filter-options', async (req, res) => {
  try {
    const { productionId } = req.params;
    const options = await getFilterOptions(db.pool, productionId);
    res.json({ success: true, data: options });
  } catch (err) {
    console.error('Error getting filter options:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get view templates (presets)
app.get('/api/views/templates', (req, res) => {
  res.json({ success: true, data: VIEW_TEMPLATES });
});

// Apply filters and get filtered view data
app.post('/api/productions/:productionId/views/filter', async (req, res) => {
  try {
    const { productionId } = req.params;
    const filters = req.body.filters || {};
    const result = await getFilteredView(db.pool, productionId, filters);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error applying filters:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all saved views for a production
app.get('/api/productions/:productionId/views', async (req, res) => {
  try {
    const { productionId } = req.params;
    const views = await getSavedViews(db.pool, productionId);
    res.json({ success: true, data: views });
  } catch (err) {
    console.error('Error getting saved views:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save a new view
app.post('/api/productions/:productionId/views', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { name, description, filters, is_default } = req.body;
    const view = await saveView(db.pool, productionId, { name, description, filters, is_default });
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Error saving view:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a view
app.put('/api/views/:viewId', async (req, res) => {
  try {
    const { viewId } = req.params;
    const { name, description, filters, is_default } = req.body;
    const view = await updateView(db.pool, viewId, { name, description, filters, is_default });
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Error updating view:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a view
app.delete('/api/views/:viewId', async (req, res) => {
  try {
    const { viewId } = req.params;
    const deleted = await deleteView(db.pool, viewId);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error('Error deleting view:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// API ROUTES - ACCESS CONTROL & SHARE LINKS
// ============================================================================

// Initialize access tables on startup
ensureAccessTables(db.pool).catch(err => console.error('Failed to create access tables:', err));

// Get available roles
app.get('/api/roles', (req, res) => {
  res.json({ success: true, data: ROLES });
});

// Get all users with access to a production
app.get('/api/productions/:productionId/access', async (req, res) => {
  try {
    const { productionId } = req.params;
    const access = await getProductionAccess(db.pool, productionId);
    res.json({ success: true, data: access });
  } catch (err) {
    console.error('Error getting production access:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Grant access to a user
app.post('/api/productions/:productionId/access', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { email, role, grantedBy } = req.body;
    const access = await grantAccess(db.pool, productionId, email, role, grantedBy);
    await logAccess(db.pool, productionId, 'access_granted', {
      userEmail: grantedBy,
      metadata: { targetEmail: email, role }
    });
    res.json({ success: true, data: access });
  } catch (err) {
    console.error('Error granting access:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revoke access from a user
app.delete('/api/productions/:productionId/access/:email', async (req, res) => {
  try {
    const { productionId, email } = req.params;
    const { revokedBy } = req.query;
    const revoked = await revokeAccess(db.pool, productionId, email);
    if (revoked) {
      await logAccess(db.pool, productionId, 'access_revoked', {
        userEmail: revokedBy,
        metadata: { targetEmail: email }
      });
    }
    res.json({ success: true, revoked });
  } catch (err) {
    console.error('Error revoking access:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check user's permission for a production
app.get('/api/productions/:productionId/access/check', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { email, permission } = req.query;
    const hasPermission = await checkPermission(db.pool, productionId, email, permission);
    const role = await getUserRole(db.pool, productionId, email);
    res.json({ success: true, data: { hasPermission, role } });
  } catch (err) {
    console.error('Error checking permission:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all share links for a production
app.get('/api/productions/:productionId/share-links', async (req, res) => {
  try {
    const { productionId } = req.params;
    const links = await getShareLinks(db.pool, productionId);
    res.json({ success: true, data: links });
  } catch (err) {
    console.error('Error getting share links:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a share link
app.post('/api/productions/:productionId/share-links', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { role, name, createdBy, expiresIn, maxUses } = req.body;
    const link = await createShareLink(db.pool, productionId, { role, name, createdBy, expiresIn, maxUses });
    await logAccess(db.pool, productionId, 'share_link_created', {
      userEmail: createdBy,
      metadata: { linkId: link.id, role, name }
    });
    res.json({ success: true, data: link });
  } catch (err) {
    console.error('Error creating share link:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Validate a share link (public endpoint)
app.get('/api/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await validateShareLink(db.pool, token);
    if (result.valid) {
      await logAccess(db.pool, result.productionId, 'share_link_used', {
        shareToken: token,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error validating share link:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Deactivate a share link
app.delete('/api/share-links/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const deactivated = await deactivateShareLink(db.pool, linkId);
    res.json({ success: true, deactivated });
  } catch (err) {
    console.error('Error deactivating share link:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get access log for a production
app.get('/api/productions/:productionId/access-log', async (req, res) => {
  try {
    const { productionId } = req.params;
    const { limit } = req.query;
    const log = await getAccessLog(db.pool, productionId, limit ? parseInt(limit) : 50);
    res.json({ success: true, data: log });
  } catch (err) {
    console.error('Error getting access log:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all productions a user has access to
app.get('/api/users/:email/productions', async (req, res) => {
  try {
    const { email } = req.params;
    const productions = await getUserProductions(db.pool, email);
    res.json({ success: true, data: productions });
  } catch (err) {
    console.error('Error getting user productions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  appLogger.info('AI Budget System API started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    health_check: `http://localhost:${PORT}/health`,
    api_base_url: `http://localhost:${PORT}/api`
  });

  console.log(`\n🚀 AI Budget System API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api\n`);
});
