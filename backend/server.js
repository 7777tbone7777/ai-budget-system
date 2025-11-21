// AI Budget System - Backend API
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./db');

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
