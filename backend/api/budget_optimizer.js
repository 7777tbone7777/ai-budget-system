/**
 * Budget Optimizer API
 * Helps users find areas to cut when over budget
 */

const express = require('express');
const router = express.Router();

/**
 * Analyze budget vs target and suggest optimizations
 * POST /api/budget-optimizer/analyze/:productionId
 */
router.post('/analyze/:productionId', async (req, res) => {
  const db = req.app.locals.db;
  const { productionId } = req.params;

  try {
    // Get production details
    const production = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (production.rows.length === 0) {
      return res.status(404).json({ error: 'Production not found' });
    }

    const prod = production.rows[0];
    const targetBudget = parseFloat(prod.budget_target || 0);

    // Get all line items grouped by category/department
    const lineItems = await db.query(`
      SELECT
        description,
        account_code,
        atl_or_btl,
        quantity,
        rate,
        unit_type,
        rate_type,
        current_total,
        notes
      FROM budget_line_items
      WHERE production_id = $1
      ORDER BY account_code, description
    `, [productionId]);

    // Calculate actual total
    let actualTotal = 0;
    const items = lineItems.rows.map(item => {
      const total = parseFloat(item.current_total || 0);
      actualTotal += total;
      return {
        ...item,
        current_total: total
      };
    });

    const overBudget = actualTotal - targetBudget;
    const overBudgetPercent = ((overBudget / targetBudget) * 100).toFixed(1);

    // Group by department (first 2 digits of account code)
    const departmentTotals = {};
    const departmentMap = {
      '10': 'Story & Rights',
      '11': 'ATL - Producers',
      '12': 'ATL - Director',
      '13': 'ATL - Cast',
      '14': 'ATL - Travel',
      '20': 'Production Staff',
      '21': 'Extra Talent',
      '22': 'Art Department',
      '23': 'Set Construction',
      '24': 'Set Operations',
      '25': 'Grip',
      '26': 'Property',
      '27': 'Set Dressing',
      '28': 'Property Master',
      '29': 'Wardrobe',
      '30': 'Makeup',
      '31': 'Hair',
      '32': 'Electric',
      '33': 'Camera',
      '34': 'Sound',
      '35': 'Transportation',
      '36': 'Location',
      '37': 'Production Sound',
      '38': 'Special Effects',
      '39': 'Animals',
      '40': 'Stunts',
      '41': 'Production Office',
      '42': 'Editorial',
      '43': 'Post Production',
      '44': 'Music',
      '45': 'Post Audio',
      '46': 'Stock & Transfers',
      '50': 'Fringes',
      '60': 'Insurance',
      '70': 'General Expenses'
    };

    items.forEach(item => {
      const category = item.account_code ? item.account_code.substring(0, 2) : '99';
      const deptName = departmentMap[category] || item.atl_or_btl || 'Other';

      if (!departmentTotals[deptName]) {
        departmentTotals[deptName] = {
          total: 0,
          items: [],
          category
        };
      }

      departmentTotals[deptName].total += item.current_total;
      departmentTotals[deptName].items.push(item);
    });

    // Sort departments by total (highest first)
    const departmentAnalysis = Object.entries(departmentTotals)
      .map(([name, data]) => ({
        department: name,
        total: data.total,
        percentOfBudget: ((data.total / actualTotal) * 100).toFixed(1),
        itemCount: data.items.length,
        items: data.items.sort((a, b) => b.current_total - a.current_total)
      }))
      .sort((a, b) => b.total - a.total);

    // Generate optimization suggestions
    const suggestions = [];

    // 1. Reduce shoot days
    const productionDept = departmentAnalysis.find(d => d.department === 'Production Staff');
    if (productionDept && overBudget > 0) {
      const avgDailyCost = actualTotal / (prod.shoot_days || 60);
      const daysToReduce = Math.ceil(overBudget / avgDailyCost);
      suggestions.push({
        strategy: 'Reduce shoot days',
        description: `Reduce from ${prod.shoot_days || 60} to ${(prod.shoot_days || 60) - daysToReduce} shoot days`,
        estimatedSavings: avgDailyCost * daysToReduce,
        impact: 'High - affects all daily crew and rentals',
        difficulty: 'High - requires script/schedule changes'
      });
    }

    // 2. Reduce crew size in largest departments
    const topDepts = departmentAnalysis.slice(0, 5);
    topDepts.forEach(dept => {
      if (dept.department !== 'ATL - Cast' && dept.department !== 'ATL - Director') {
        // Find positions with qty > 1
        const multiplePositions = dept.items.filter(item => parseFloat(item.quantity || 1) > 1);
        if (multiplePositions.length > 0) {
          const reduction = multiplePositions.reduce((sum, item) => {
            const reducedQty = Math.max(1, parseFloat(item.quantity) - 1);
            const savingsPerItem = item.current_total * ((parseFloat(item.quantity) - reducedQty) / parseFloat(item.quantity));
            return sum + savingsPerItem;
          }, 0);

          suggestions.push({
            strategy: `Reduce ${dept.department} crew size`,
            description: `Reduce crew quantities in ${dept.department} (${multiplePositions.length} positions can be reduced)`,
            estimatedSavings: reduction,
            impact: 'Medium - may increase shoot days',
            difficulty: 'Medium - adjust schedule to compensate'
          });
        }
      }
    });

    // 3. Switch to lower-budget sideletters
    if (prod.production_type === 'theatrical') {
      suggestions.push({
        strategy: 'Use low-budget theatrical sideletter',
        description: 'Switch to SAG Modified Low Budget ($700k-$2.5M) or Ultra Low Budget (<$250k) agreement',
        estimatedSavings: actualTotal * 0.15, // ~15% savings on labor
        impact: 'Medium - lower union rates across the board',
        difficulty: 'Low - if budget qualifies'
      });
    }

    // 4. Reduce prep/wrap days
    suggestions.push({
      strategy: 'Reduce prep and wrap days',
      description: 'Reduce prep days by 20% and wrap days by 30% for non-essential positions',
      estimatedSavings: actualTotal * 0.08, // ~8% of total
      impact: 'Low-Medium - affects department heads most',
      difficulty: 'Medium - requires efficient planning'
    });

    // 5. Equipment rental optimization
    const equipmentDepts = departmentAnalysis.filter(d =>
      d.department.includes('Camera') || d.department.includes('Electric') ||
      d.department.includes('Grip') || d.department.includes('Sound')
    );
    if (equipmentDepts.length > 0) {
      const equipmentTotal = equipmentDepts.reduce((sum, d) => sum + d.total, 0);
      suggestions.push({
        strategy: 'Optimize equipment rentals',
        description: 'Negotiate package deals, reduce redundant equipment, use house equipment',
        estimatedSavings: equipmentTotal * 0.15, // ~15% equipment savings
        impact: 'Low - minimal creative impact',
        difficulty: 'Low - negotiate with vendors'
      });
    }

    // Sort suggestions by estimated savings
    suggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    res.json({
      success: true,
      analysis: {
        targetBudget,
        actualBudget: actualTotal,
        difference: overBudget,
        differencePercent: parseFloat(overBudgetPercent),
        status: overBudget > 0 ? 'over' : overBudget < 0 ? 'under' : 'on-target'
      },
      departmentBreakdown: departmentAnalysis,
      suggestions: suggestions.map(s => ({
        ...s,
        estimatedSavings: Math.round(s.estimatedSavings),
        percentOfOverage: ((s.estimatedSavings / Math.abs(overBudget)) * 100).toFixed(1)
      })),
      quickWins: suggestions.slice(0, 3) // Top 3 easiest savings
    });

  } catch (error) {
    console.error('Budget optimizer error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
