/**
 * Budget Hierarchy API Endpoints
 *
 * Handles the 4-level budget hierarchy:
 * - Metadata (budget versioning)
 * - Topsheet (high-level categories)
 * - Accounts (mid-level groupings)
 * - Line Items (detailed entries with auto-calculated fringes)
 */

const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget for a production
 * @access  Public
 */
router.post('/', async (req, res) => {
  const { production_id, version_number = 1, budget_type = 'original', notes } = req.body;

  if (!production_id) {
    return res.status(400).json({ error: 'production_id is required' });
  }

  try {
    const client = req.app.locals.pool;

    // Generate unique budget UUID
    const budgetUUID = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create budget metadata
    const result = await client.query(
      `INSERT INTO budget_metadata (
        production_id,
        budget_uuid,
        version_number,
        budget_type,
        notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [production_id, budgetUUID, version_number, budget_type, notes]
    );

    res.status(201).json({
      success: true,
      budget: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Failed to create budget', details: err.message });
  }
});

/**
 * @route   GET /api/budgets/:budget_id
 * @desc    Get budget metadata
 * @access  Public
 */
router.get('/:budget_id', async (req, res) => {
  const { budget_id } = req.params;

  try {
    const client = req.app.locals.pool;

    const result = await client.query(
      `SELECT
        bm.*,
        p.name as production_name,
        p.production_type,
        p.episode_count
      FROM budget_metadata bm
      JOIN productions p ON bm.production_id = p.id
      WHERE bm.id = $1`,
      [budget_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      success: true,
      budget: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching budget:', err);
    res.status(500).json({ error: 'Failed to fetch budget', details: err.message });
  }
});

/**
 * @route   GET /api/budgets/:budget_id/topsheet
 * @desc    Get topsheet summary (high-level categories)
 * @access  Public
 */
router.get('/:budget_id/topsheet', async (req, res) => {
  const { budget_id } = req.params;

  try {
    const client = req.app.locals.pool;

    const result = await client.query(
      `SELECT
        id,
        category_number,
        category_name,
        current_subtotal,
        current_fringe,
        current_total,
        variance_subtotal,
        variance_fringe,
        variance_total,
        is_amortized,
        amortization_episodes,
        sort_order
      FROM budget_topsheet
      WHERE budget_id = $1
      ORDER BY sort_order`,
      [budget_id]
    );

    // Get total counts
    const metaResult = await client.query(
      `SELECT
        total_topsheet_categories,
        total_accounts,
        total_detail_lines
      FROM budget_metadata
      WHERE id = $1`,
      [budget_id]
    );

    res.json({
      success: true,
      topsheet: result.rows,
      metadata: metaResult.rows[0],
      grand_total: result.rows.reduce((sum, cat) => sum + parseFloat(cat.current_total || 0), 0)
    });
  } catch (err) {
    console.error('Error fetching topsheet:', err);
    res.status(500).json({ error: 'Failed to fetch topsheet', details: err.message });
  }
});

/**
 * @route   POST /api/budgets/:budget_id/topsheet
 * @desc    Create a new topsheet category
 * @access  Public
 */
router.post('/:budget_id/topsheet', async (req, res) => {
  const { budget_id } = req.params;
  const { category_number, category_name, sort_order, is_amortized = false, amortization_episodes } = req.body;

  if (!category_number || !category_name || sort_order === undefined) {
    return res.status(400).json({ error: 'category_number, category_name, and sort_order are required' });
  }

  try {
    const client = req.app.locals.pool;

    const result = await client.query(
      `INSERT INTO budget_topsheet (
        budget_id,
        category_number,
        category_name,
        sort_order,
        is_amortized,
        amortization_episodes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [budget_id, category_number, category_name, sort_order, is_amortized, amortization_episodes]
    );

    res.status(201).json({
      success: true,
      category: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating topsheet category:', err);
    res.status(500).json({ error: 'Failed to create category', details: err.message });
  }
});

/**
 * @route   GET /api/budgets/:budget_id/accounts
 * @desc    Get all accounts (mid-level groupings)
 * @access  Public
 */
router.get('/:budget_id/accounts', async (req, res) => {
  const { budget_id } = req.params;
  const { category_id } = req.query;

  try {
    const client = req.app.locals.pool;

    let query = `
      SELECT
        ba.*,
        bt.category_name,
        (SELECT COUNT(*) FROM budget_line_items WHERE account_id = ba.id) as line_item_count
      FROM budget_accounts ba
      JOIN budget_topsheet bt ON ba.topsheet_category_id = bt.id
      WHERE ba.budget_id = $1
    `;
    const params = [budget_id];

    if (category_id) {
      query += ` AND ba.topsheet_category_id = $2`;
      params.push(category_id);
    }

    query += ` ORDER BY ba.sort_order`;

    const result = await client.query(query, params);

    res.json({
      success: true,
      accounts: result.rows
    });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts', details: err.message });
  }
});

/**
 * @route   POST /api/budgets/:budget_id/accounts
 * @desc    Create a new account
 * @access  Public
 */
router.post('/:budget_id/accounts', async (req, res) => {
  const { budget_id } = req.params;
  const {
    topsheet_category_id,
    account_code,
    account_name,
    sort_order,
    is_amortized = false,
    amortization_episodes
  } = req.body;

  if (!topsheet_category_id || !account_code || !account_name || sort_order === undefined) {
    return res.status(400).json({
      error: 'topsheet_category_id, account_code, account_name, and sort_order are required'
    });
  }

  try {
    const client = req.app.locals.pool;

    const result = await client.query(
      `INSERT INTO budget_accounts (
        topsheet_category_id,
        budget_id,
        account_code,
        account_name,
        sort_order,
        is_amortized,
        amortization_episodes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [topsheet_category_id, budget_id, account_code, account_name, sort_order, is_amortized, amortization_episodes]
    );

    res.status(201).json({
      success: true,
      account: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

/**
 * @route   GET /api/budgets/:budget_id/line-items
 * @desc    Get all line items (detailed entries)
 * @access  Public
 */
router.get('/:budget_id/line-items', async (req, res) => {
  const { budget_id } = req.params;
  const { account_id, limit = 100, offset = 0 } = req.query;

  try {
    const client = req.app.locals.pool;

    let query = `
      SELECT
        bli.*,
        ba.account_code,
        ba.account_name,
        bt.category_name
      FROM budget_line_items bli
      JOIN budget_accounts ba ON bli.account_id = ba.id
      JOIN budget_topsheet bt ON ba.topsheet_category_id = bt.id
      WHERE bli.budget_id = $1
    `;
    const params = [budget_id];

    if (account_id) {
      query += ` AND bli.account_id = $${params.length + 1}`;
      params.push(account_id);
    }

    query += ` ORDER BY bli.sort_order LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM budget_line_items WHERE budget_id = $1`,
      [budget_id]
    );

    res.json({
      success: true,
      line_items: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (err) {
    console.error('Error fetching line items:', err);
    res.status(500).json({ error: 'Failed to fetch line items', details: err.message });
  }
});

/**
 * @route   POST /api/budgets/:budget_id/line-items
 * @desc    Create a new line item (with auto-calculated fringes!)
 * @access  Public
 */
router.post('/:budget_id/line-items', async (req, res) => {
  const { budget_id } = req.params;
  const {
    account_id,
    production_id,
    line_number,
    description,
    quantity,
    unit_type,
    rate,
    rate_type,
    multiplier = 1.0,
    formula,
    union_local,
    position_id,
    total_fringe_rate,
    fringe_breakdown,
    is_amortized = false,
    amortization_episodes,
    is_corporate_deal = false,
    sort_order
  } = req.body;

  if (!account_id || !production_id || !description || sort_order === undefined) {
    return res.status(400).json({
      error: 'account_id, production_id, description, and sort_order are required'
    });
  }

  try {
    const client = req.app.locals.pool;

    // The database trigger will auto-calculate:
    // - current_subtotal = quantity × rate × multiplier
    // - current_fringe = current_subtotal × total_fringe_rate
    // - current_total = current_subtotal + current_fringe
    // - per_episode_cost (if is_amortized = true)

    const result = await client.query(
      `INSERT INTO budget_line_items (
        account_id,
        budget_id,
        production_id,
        line_number,
        description,
        quantity,
        unit_type,
        rate,
        rate_type,
        multiplier,
        formula,
        union_local,
        position_id,
        total_fringe_rate,
        fringe_breakdown,
        is_amortized,
        amortization_episodes,
        is_corporate_deal,
        sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        account_id, budget_id, production_id, line_number, description,
        quantity, unit_type, rate, rate_type, multiplier, formula,
        union_local, position_id, total_fringe_rate,
        fringe_breakdown ? JSON.stringify(fringe_breakdown) : null,
        is_amortized, amortization_episodes, is_corporate_deal, sort_order
      ]
    );

    res.status(201).json({
      success: true,
      line_item: result.rows[0],
      message: 'Line item created with auto-calculated subtotal, fringe, and total'
    });
  } catch (err) {
    console.error('Error creating line item:', err);
    res.status(500).json({ error: 'Failed to create line item', details: err.message });
  }
});

/**
 * @route   GET /api/budgets/:budget_id/hierarchy
 * @desc    Get complete budget hierarchy (topsheet → accounts → line items)
 * @access  Public
 */
router.get('/:budget_id/hierarchy', async (req, res) => {
  const { budget_id } = req.params;

  try {
    const client = req.app.locals.pool;

    // Use the view we created in migration
    const result = await client.query(
      `SELECT * FROM budget_hierarchy_view WHERE budget_id = $1`,
      [budget_id]
    );

    // Group by topsheet → accounts → line items
    const hierarchy = {};

    result.rows.forEach(row => {
      const catKey = `${row.category_number}-${row.category_name}`;

      if (!hierarchy[catKey]) {
        hierarchy[catKey] = {
          category_number: row.category_number,
          category_name: row.category_name,
          accounts: {}
        };
      }

      const accKey = `${row.account_code}-${row.account_name}`;

      if (!hierarchy[catKey].accounts[accKey]) {
        hierarchy[catKey].accounts[accKey] = {
          account_code: row.account_code,
          account_name: row.account_name,
          line_items: []
        };
      }

      hierarchy[catKey].accounts[accKey].line_items.push({
        line_number: row.line_number,
        description: row.description,
        quantity: row.quantity,
        unit_type: row.unit_type,
        rate: row.rate,
        rate_type: row.rate_type,
        current_subtotal: row.current_subtotal,
        current_fringe: row.current_fringe,
        current_total: row.current_total,
        union_local: row.union_local,
        is_amortized: row.is_amortized,
        per_episode_cost: row.per_episode_cost
      });
    });

    res.json({
      success: true,
      budget_id: budget_id,
      production_name: result.rows[0]?.production_name,
      production_type: result.rows[0]?.production_type,
      hierarchy: hierarchy
    });
  } catch (err) {
    console.error('Error fetching hierarchy:', err);
    res.status(500).json({ error: 'Failed to fetch hierarchy', details: err.message });
  }
});

/**
 * @route   GET /api/fringe-rules
 * @desc    Get all fringe calculation rules
 * @access  Public
 */
router.get('/fringe-rules', async (req, res) => {
  const { union_local, state, position_classification } = req.query;

  try {
    const client = req.app.locals.pool;

    let query = 'SELECT * FROM fringe_calculation_rules WHERE 1=1';
    const params = [];

    if (union_local) {
      params.push(union_local);
      query += ` AND union_local = $${params.length}`;
    }

    if (state) {
      params.push(state);
      query += ` AND state = $${params.length}`;
    }

    if (position_classification) {
      params.push(position_classification);
      query += ` AND position_classification = $${params.length}`;
    }

    query += ' ORDER BY effective_date_start DESC';

    const result = await client.query(query, params);

    res.json({
      success: true,
      fringe_rules: result.rows
    });
  } catch (err) {
    console.error('Error fetching fringe rules:', err);
    res.status(500).json({ error: 'Failed to fetch fringe rules', details: err.message });
  }
});

/**
 * @route   GET /api/fringe-rules/lookup
 * @desc    Smart lookup to find applicable fringe rule
 * @access  Public
 */
router.get('/fringe-rules/lookup', async (req, res) => {
  const { union_local, state, position_classification, effective_date } = req.query;

  if (!position_classification) {
    return res.status(400).json({ error: 'position_classification is required' });
  }

  try {
    const client = req.app.locals.pool;

    const result = await client.query(
      `SELECT * FROM get_fringe_rule($1, $2, $3, $4)`,
      [union_local || null, state || null, position_classification, effective_date || new Date()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No applicable fringe rule found' });
    }

    res.json({
      success: true,
      fringe_rule: result.rows[0]
    });
  } catch (err) {
    console.error('Error looking up fringe rule:', err);
    res.status(500).json({ error: 'Failed to lookup fringe rule', details: err.message });
  }
});

module.exports = router;
