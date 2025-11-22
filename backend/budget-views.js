/**
 * Dynamic Budget Views
 * Modern replacement for MMB's "Sub Budgets"
 *
 * Instead of creating separate budget copies, this provides:
 * - Saved filter configurations as "views"
 * - Live filtering with instant totals
 * - Quick toggle between different views
 * - Shareable view configurations
 */

// Preset view templates for common use cases
const VIEW_TEMPLATES = {
  'above-the-line': {
    name: 'Above the Line',
    description: 'All ATL costs - talent, producers, directors, writers',
    icon: 'star',
    filters: {
      atl_or_btl: ['ATL']
    }
  },
  'below-the-line': {
    name: 'Below the Line',
    description: 'All BTL costs - crew, equipment, post',
    icon: 'users',
    filters: {
      atl_or_btl: ['BTL']
    }
  },
  'labor-only': {
    name: 'Labor Costs',
    description: 'All labor and payroll items',
    icon: 'briefcase',
    filters: {
      account_code_range: ['1000', '4999'],
      has_union: true
    }
  },
  'production-period': {
    name: 'Production Period',
    description: 'Shoot days only costs',
    icon: 'video',
    filters: {
      departments: ['Camera', 'Grip', 'Electric', 'Sound', 'Art', 'Wardrobe', 'Hair/Makeup']
    }
  },
  'post-production': {
    name: 'Post Production',
    description: 'Editorial, VFX, sound mix, color',
    icon: 'film',
    filters: {
      account_code_range: ['5000', '5999']
    }
  },
  'locations': {
    name: 'Locations & Stages',
    description: 'All location and stage costs',
    icon: 'map-pin',
    filters: {
      departments: ['Locations', 'Stage Rental', 'Transportation']
    }
  },
  'equipment': {
    name: 'Equipment Rentals',
    description: 'Camera, grip, electric, sound equipment',
    icon: 'tool',
    filters: {
      account_code_range: ['4100', '4500']
    }
  },
  'union-costs': {
    name: 'Union Labor Only',
    description: 'All union-covered positions',
    icon: 'shield',
    filters: {
      has_union: true
    }
  }
};

// Build SQL WHERE clause from filters
function buildFilterQuery(filters, params) {
  const conditions = [];
  let paramIndex = params.length + 1;

  // ATL/BTL filter
  if (filters.atl_or_btl && filters.atl_or_btl.length > 0) {
    const placeholders = filters.atl_or_btl.map((_, i) => `$${paramIndex + i}`);
    conditions.push(`atl_or_btl IN (${placeholders.join(', ')})`);
    params.push(...filters.atl_or_btl);
    paramIndex += filters.atl_or_btl.length;
  }

  // Department filter
  if (filters.departments && filters.departments.length > 0) {
    const placeholders = filters.departments.map((_, i) => `$${paramIndex + i}`);
    conditions.push(`department IN (${placeholders.join(', ')})`);
    params.push(...filters.departments);
    paramIndex += filters.departments.length;
  }

  // Union filter
  if (filters.unions && filters.unions.length > 0) {
    const placeholders = filters.unions.map((_, i) => `$${paramIndex + i}`);
    conditions.push(`union_local IN (${placeholders.join(', ')})`);
    params.push(...filters.unions);
    paramIndex += filters.unions.length;
  }

  // Has union filter
  if (filters.has_union === true) {
    conditions.push(`union_local IS NOT NULL AND union_local != ''`);
  } else if (filters.has_union === false) {
    conditions.push(`(union_local IS NULL OR union_local = '')`);
  }

  // Account code range
  if (filters.account_code_range && filters.account_code_range.length === 2) {
    conditions.push(`account_code >= $${paramIndex} AND account_code <= $${paramIndex + 1}`);
    params.push(filters.account_code_range[0], filters.account_code_range[1]);
    paramIndex += 2;
  }

  // Account code prefix (e.g., all 2xxx codes)
  if (filters.account_code_prefix) {
    conditions.push(`account_code LIKE $${paramIndex}`);
    params.push(`${filters.account_code_prefix}%`);
    paramIndex++;
  }

  // Description search
  if (filters.search) {
    conditions.push(`(description ILIKE $${paramIndex} OR account_code ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Total amount range
  if (filters.min_total !== undefined) {
    conditions.push(`total >= $${paramIndex}`);
    params.push(filters.min_total);
    paramIndex++;
  }
  if (filters.max_total !== undefined) {
    conditions.push(`total <= $${paramIndex}`);
    params.push(filters.max_total);
    paramIndex++;
  }

  return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
}

// Get filtered line items with totals
async function getFilteredView(pool, productionId, filters = {}) {
  const params = [productionId];
  const whereClause = buildFilterQuery(filters, params);

  // Get filtered items
  const itemsQuery = `
    SELECT
      id, account_code, description, position_title, union_local,
      department, atl_or_btl, quantity, rate, subtotal, fringes, total,
      notes, is_parent, parent_id
    FROM budget_line_items
    WHERE production_id = $1 AND parent_id IS NULL AND ${whereClause}
    ORDER BY account_code, description
  `;

  const items = await pool.query(itemsQuery, params);

  // Calculate totals
  const totalsParams = [productionId];
  const totalsWhereClause = buildFilterQuery(filters, totalsParams);

  const totalsQuery = `
    SELECT
      COUNT(*) as item_count,
      COALESCE(SUM(subtotal), 0) as subtotal,
      COALESCE(SUM(fringes), 0) as fringes,
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM(CASE WHEN atl_or_btl = 'ATL' THEN total ELSE 0 END), 0) as atl_total,
      COALESCE(SUM(CASE WHEN atl_or_btl = 'BTL' THEN total ELSE 0 END), 0) as btl_total,
      COUNT(DISTINCT department) as department_count,
      COUNT(DISTINCT union_local) FILTER (WHERE union_local IS NOT NULL) as union_count
    FROM budget_line_items
    WHERE production_id = $1 AND parent_id IS NULL AND ${totalsWhereClause}
  `;

  const totals = await pool.query(totalsQuery, totalsParams);

  // Get breakdown by department
  const deptBreakdownQuery = `
    SELECT
      department,
      COUNT(*) as item_count,
      COALESCE(SUM(total), 0) as total
    FROM budget_line_items
    WHERE production_id = $1 AND parent_id IS NULL AND ${totalsWhereClause}
    GROUP BY department
    ORDER BY SUM(total) DESC
    LIMIT 10
  `;

  const deptBreakdown = await pool.query(deptBreakdownQuery, totalsParams);

  return {
    items: items.rows,
    summary: {
      itemCount: parseInt(totals.rows[0].item_count),
      subtotal: parseFloat(totals.rows[0].subtotal),
      fringes: parseFloat(totals.rows[0].fringes),
      total: parseFloat(totals.rows[0].total),
      atlTotal: parseFloat(totals.rows[0].atl_total),
      btlTotal: parseFloat(totals.rows[0].btl_total),
      departmentCount: parseInt(totals.rows[0].department_count),
      unionCount: parseInt(totals.rows[0].union_count)
    },
    departmentBreakdown: deptBreakdown.rows.map(row => ({
      department: row.department || 'Unassigned',
      itemCount: parseInt(row.item_count),
      total: parseFloat(row.total)
    }))
  };
}

// Save a custom view
async function saveView(pool, productionId, viewData) {
  const { name, description, filters, is_default } = viewData;

  // If this is being set as default, unset other defaults first
  if (is_default) {
    await pool.query(
      `UPDATE budget_views SET is_default = false WHERE production_id = $1`,
      [productionId]
    );
  }

  const result = await pool.query(`
    INSERT INTO budget_views (production_id, name, description, filters, is_default)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, description, filters, is_default, created_at
  `, [productionId, name, description, JSON.stringify(filters), is_default || false]);

  return result.rows[0];
}

// Get all saved views for a production
async function getSavedViews(pool, productionId) {
  const result = await pool.query(`
    SELECT id, name, description, filters, is_default, created_at, updated_at
    FROM budget_views
    WHERE production_id = $1
    ORDER BY is_default DESC, name
  `, [productionId]);

  return result.rows;
}

// Update a view
async function updateView(pool, viewId, updates) {
  const { name, description, filters, is_default } = updates;

  // Get the production_id first
  const viewResult = await pool.query(
    `SELECT production_id FROM budget_views WHERE id = $1`,
    [viewId]
  );

  if (viewResult.rows.length === 0) {
    throw new Error('View not found');
  }

  // If setting as default, unset others
  if (is_default) {
    await pool.query(
      `UPDATE budget_views SET is_default = false WHERE production_id = $1`,
      [viewResult.rows[0].production_id]
    );
  }

  const result = await pool.query(`
    UPDATE budget_views
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        filters = COALESCE($4, filters),
        is_default = COALESCE($5, is_default),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, description, filters, is_default, created_at, updated_at
  `, [viewId, name, description, filters ? JSON.stringify(filters) : null, is_default]);

  return result.rows[0];
}

// Delete a view
async function deleteView(pool, viewId) {
  const result = await pool.query(
    `DELETE FROM budget_views WHERE id = $1 RETURNING id`,
    [viewId]
  );
  return result.rowCount > 0;
}

// Get available filter options for a production
async function getFilterOptions(pool, productionId) {
  // Get unique departments
  const depts = await pool.query(`
    SELECT DISTINCT department, COUNT(*) as count
    FROM budget_line_items
    WHERE production_id = $1 AND department IS NOT NULL AND department != ''
    GROUP BY department
    ORDER BY department
  `, [productionId]);

  // Get unique unions
  const unions = await pool.query(`
    SELECT DISTINCT union_local, COUNT(*) as count
    FROM budget_line_items
    WHERE production_id = $1 AND union_local IS NOT NULL AND union_local != ''
    GROUP BY union_local
    ORDER BY union_local
  `, [productionId]);

  // Get account code ranges
  const accountCodes = await pool.query(`
    SELECT
      MIN(account_code) as min_code,
      MAX(account_code) as max_code,
      COUNT(*) as total_items
    FROM budget_line_items
    WHERE production_id = $1
  `, [productionId]);

  // Get budget totals for context
  const totals = await pool.query(`
    SELECT
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM(CASE WHEN atl_or_btl = 'ATL' THEN total ELSE 0 END), 0) as atl_total,
      COALESCE(SUM(CASE WHEN atl_or_btl = 'BTL' THEN total ELSE 0 END), 0) as btl_total
    FROM budget_line_items
    WHERE production_id = $1 AND parent_id IS NULL
  `, [productionId]);

  return {
    departments: depts.rows.map(r => ({ name: r.department, count: parseInt(r.count) })),
    unions: unions.rows.map(r => ({ name: r.union_local, count: parseInt(r.count) })),
    accountCodeRange: {
      min: accountCodes.rows[0].min_code,
      max: accountCodes.rows[0].max_code,
      totalItems: parseInt(accountCodes.rows[0].total_items)
    },
    budgetTotals: {
      total: parseFloat(totals.rows[0].total),
      atlTotal: parseFloat(totals.rows[0].atl_total),
      btlTotal: parseFloat(totals.rows[0].btl_total)
    },
    atlBtlOptions: ['ATL', 'BTL'],
    presetViews: VIEW_TEMPLATES
  };
}

// Create budget_views table if not exists
async function ensureViewsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS budget_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      filters JSONB DEFAULT '{}',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_budget_views_production ON budget_views(production_id);
  `);
}

module.exports = {
  VIEW_TEMPLATES,
  buildFilterQuery,
  getFilteredView,
  saveView,
  getSavedViews,
  updateView,
  deleteView,
  getFilterOptions,
  ensureViewsTable
};
