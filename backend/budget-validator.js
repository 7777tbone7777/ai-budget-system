/**
 * Budget Validator
 * Validates generated budgets against real production patterns
 */

const { createLogger } = require('./logger');
const validatorLogger = createLogger('VALIDATOR');

// Validation thresholds and patterns based on real production budgets
const VALIDATION_RULES = {
  // Department count expectations
  min_departments: 5,
  max_departments: 50,

  // Line item count expectations
  min_line_items: 10,
  max_line_items: 5000,

  // Budget range expectations (in dollars)
  min_total_budget: 100000,        // $100k
  max_total_budget: 100000000,     // $100M

  // Department percentage ranges (what % of total budget is typical)
  department_percentages: {
    'story_rights': { min: 0, max: 10 },
    'producer': { min: 0, max: 15 },
    'director': { min: 0, max: 10 },
    'cast': { min: 5, max: 40 },
    'travel_living': { min: 0, max: 15 },
    'production_staff': { min: 2, max: 20 },
    'extras_casting': { min: 0, max: 10 },
    'set_design': { min: 0, max: 15 },
    'wardrobe': { min: 0, max: 10 },
    'makeup_hair': { min: 0, max: 8 },
    'camera': { min: 1, max: 15 },
    'electric': { min: 1, max: 12 },
    'grip': { min: 1, max: 10 },
    'sound': { min: 1, max: 8 },
    'transportation': { min: 1, max: 12 },
    'location': { min: 1, max: 15 },
    'film_lab': { min: 0, max: 10 },
    'post_production': { min: 5, max: 25 },
    'music': { min: 0, max: 10 },
    'post_production_sound': { min: 1, max: 10 },
    'titles_opticals': { min: 0, max: 5 },
    'insurance': { min: 1, max: 8 },
    'general_expense': { min: 1, max: 10 }
  },

  // Line item validation
  max_line_item_percentage: 30,  // No single line item should be >30% of budget

  // Shoot days validation
  min_shoot_days: 1,
  max_shoot_days: 365
};

/**
 * Validation result structure
 */
class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.score = 100;
  }

  addError(message, details = {}) {
    this.valid = false;
    this.errors.push({ message, ...details });
    this.score -= 20;
  }

  addWarning(message, details = {}) {
    this.warnings.push({ message, ...details });
    this.score -= 5;
  }

  addInfo(message, details = {}) {
    this.info.push({ message, ...details });
  }

  getScore() {
    return Math.max(0, Math.min(100, this.score));
  }
}

/**
 * Validate budget structure
 */
function validateBudgetStructure(budget) {
  const result = new ValidationResult();

  // Check required fields
  if (!budget.production_id) {
    result.addError('Missing production_id');
  }

  if (!budget.groups || !Array.isArray(budget.groups)) {
    result.addError('Missing or invalid budget groups');
    return result;
  }

  // Check department count
  const deptCount = budget.groups.length;
  if (deptCount < VALIDATION_RULES.min_departments) {
    result.addWarning(
      `Low department count: ${deptCount} (expected at least ${VALIDATION_RULES.min_departments})`,
      { department_count: deptCount }
    );
  }
  if (deptCount > VALIDATION_RULES.max_departments) {
    result.addWarning(
      `High department count: ${deptCount} (expected at most ${VALIDATION_RULES.max_departments})`,
      { department_count: deptCount }
    );
  }

  // Count line items
  let totalLineItems = 0;
  budget.groups.forEach(group => {
    if (group.line_items && Array.isArray(group.line_items)) {
      totalLineItems += group.line_items.length;
    }
  });

  if (totalLineItems < VALIDATION_RULES.min_line_items) {
    result.addWarning(
      `Low line item count: ${totalLineItems} (expected at least ${VALIDATION_RULES.min_line_items})`,
      { line_item_count: totalLineItems }
    );
  }
  if (totalLineItems > VALIDATION_RULES.max_line_items) {
    result.addWarning(
      `High line item count: ${totalLineItems} (expected at most ${VALIDATION_RULES.max_line_items})`,
      { line_item_count: totalLineItems }
    );
  }

  result.addInfo(`Budget has ${deptCount} departments and ${totalLineItems} line items`);

  return result;
}

/**
 * Validate budget amounts
 */
function validateBudgetAmounts(budget) {
  const result = new ValidationResult();

  // Calculate total budget
  let totalBudget = 0;
  const departmentTotals = {};

  budget.groups.forEach(group => {
    let groupTotal = 0;

    if (group.line_items && Array.isArray(group.line_items)) {
      group.line_items.forEach(item => {
        const amount = item.total || item.subtotal || 0;
        groupTotal += amount;

        // Check for negative amounts
        if (amount < 0) {
          result.addError(
            `Negative amount in line item: ${item.description || 'Unknown'}`,
            { amount, item: item.description }
          );
        }

        // Check for suspiciously high single line items
        if (amount > 0 && totalBudget > 0) {
          const percentage = (amount / totalBudget) * 100;
          if (percentage > VALIDATION_RULES.max_line_item_percentage) {
            result.addWarning(
              `Line item represents ${percentage.toFixed(1)}% of budget: ${item.description}`,
              { amount, percentage, item: item.description }
            );
          }
        }
      });
    }

    departmentTotals[group.name] = groupTotal;
    totalBudget += groupTotal;
  });

  // Check total budget range
  if (totalBudget < VALIDATION_RULES.min_total_budget) {
    result.addWarning(
      `Total budget ${formatCurrency(totalBudget)} is below typical minimum ${formatCurrency(VALIDATION_RULES.min_total_budget)}`,
      { total_budget: totalBudget }
    );
  }
  if (totalBudget > VALIDATION_RULES.max_total_budget) {
    result.addWarning(
      `Total budget ${formatCurrency(totalBudget)} exceeds typical maximum ${formatCurrency(VALIDATION_RULES.max_total_budget)}`,
      { total_budget: totalBudget }
    );
  }

  // Validate department percentages
  if (totalBudget > 0) {
    Object.entries(departmentTotals).forEach(([deptName, deptTotal]) => {
      const percentage = (deptTotal / totalBudget) * 100;

      // Try to find matching rule (normalize department names)
      const normalizedName = deptName.toLowerCase().replace(/[^a-z]/g, '_');
      let matchedRule = null;

      for (const [ruleName, rule] of Object.entries(VALIDATION_RULES.department_percentages)) {
        if (normalizedName.includes(ruleName) || ruleName.includes(normalizedName.substring(0, 5))) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        if (percentage < matchedRule.min) {
          result.addInfo(
            `${deptName} is ${percentage.toFixed(1)}% of budget (typical min: ${matchedRule.min}%)`,
            { department: deptName, percentage, expected_min: matchedRule.min }
          );
        }
        if (percentage > matchedRule.max) {
          result.addWarning(
            `${deptName} is ${percentage.toFixed(1)}% of budget (typical max: ${matchedRule.max}%)`,
            { department: deptName, percentage, expected_max: matchedRule.max }
          );
        }
      }
    });
  }

  result.addInfo(`Total budget: ${formatCurrency(totalBudget)}`);

  return result;
}

/**
 * Validate against similar templates
 */
async function validateAgainstTemplates(db, budget, params) {
  const result = new ValidationResult();

  try {
    // Find similar templates
    let query = `
      SELECT
        name,
        location,
        production_type,
        total_budget,
        department_count,
        line_item_count
      FROM budget_templates
      WHERE is_active = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (params.location) {
      query += ` AND location ILIKE $${paramIndex}`;
      queryParams.push(`%${params.location}%`);
      paramIndex++;
    }

    if (params.production_type) {
      query += ` AND production_type = $${paramIndex}`;
      queryParams.push(params.production_type);
      paramIndex++;
    }

    query += ` ORDER BY completeness_score DESC LIMIT 5`;

    const templates = await db.query(query, queryParams);

    if (templates.rows.length > 0) {
      // Compare with similar templates
      const avgBudget = templates.rows.reduce((sum, t) => sum + parseFloat(t.total_budget), 0) / templates.rows.length;
      const avgDepts = templates.rows.reduce((sum, t) => sum + t.department_count, 0) / templates.rows.length;
      const avgItems = templates.rows.reduce((sum, t) => sum + t.line_item_count, 0) / templates.rows.length;

      result.addInfo(
        `Compared with ${templates.rows.length} similar productions`,
        {
          avg_budget: avgBudget,
          avg_departments: avgDepts,
          avg_line_items: avgItems
        }
      );

      // Calculate total budget for generated budget
      let generatedTotal = 0;
      budget.groups.forEach(group => {
        if (group.line_items) {
          group.line_items.forEach(item => {
            generatedTotal += item.total || item.subtotal || 0;
          });
        }
      });

      // Check if generated budget is within reasonable range of similar budgets
      const deviation = Math.abs(generatedTotal - avgBudget) / avgBudget;
      if (deviation > 0.5) {  // More than 50% deviation
        result.addWarning(
          `Generated budget differs significantly from similar productions (${(deviation * 100).toFixed(0)}% deviation)`,
          { generated_budget: generatedTotal, avg_budget: avgBudget, deviation }
        );
      }
    } else {
      result.addInfo('No similar templates found for comparison');
    }
  } catch (error) {
    validatorLogger.error('Template comparison failed', error);
    result.addWarning('Could not compare with existing templates', { error: error.message });
  }

  return result;
}

/**
 * Main validation function
 */
async function validateBudget(db, budget, params = {}) {
  validatorLogger.info('Starting budget validation', {
    production_id: budget.production_id,
    department_count: budget.groups?.length || 0
  });

  const results = {
    structure: validateBudgetStructure(budget),
    amounts: validateBudgetAmounts(budget),
    templates: await validateAgainstTemplates(db, budget, params)
  };

  // Combine results
  const finalResult = new ValidationResult();

  [results.structure, results.amounts, results.templates].forEach(r => {
    finalResult.errors.push(...r.errors);
    finalResult.warnings.push(...r.warnings);
    finalResult.info.push(...r.info);
    if (!r.valid) finalResult.valid = false;
  });

  // Calculate combined score
  const avgScore = (
    results.structure.getScore() +
    results.amounts.getScore() +
    results.templates.getScore()
  ) / 3;
  finalResult.score = avgScore;

  validatorLogger.info('Budget validation complete', {
    valid: finalResult.valid,
    score: finalResult.getScore(),
    errors: finalResult.errors.length,
    warnings: finalResult.warnings.length
  });

  return {
    valid: finalResult.valid,
    score: finalResult.getScore(),
    errors: finalResult.errors,
    warnings: finalResult.warnings,
    info: finalResult.info,
    details: results
  };
}

/**
 * Helper function to format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

module.exports = {
  validateBudget,
  VALIDATION_RULES
};
