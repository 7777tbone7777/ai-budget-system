// Formula Parser for Budget Line Items with Global Variables
// Supports expressions like: NUM_EPISODES * 500, SHOOT_DAYS * DAILY_RATE, etc.

const db = require('./db');

/**
 * Parse and evaluate a formula string that may contain global variable references
 * @param {string} formula - The formula string (e.g., "NUM_EPISODES * 500")
 * @param {string} productionId - The production ID to fetch globals from
 * @returns {Promise<{value: number, resolved: string, globals: Array}>}
 */
async function parseFormula(formula, productionId) {
  // If formula is just a number, return it
  if (!isNaN(formula)) {
    return {
      value: parseFloat(formula),
      resolved: formula.toString(),
      globals: []
    };
  }

  // Convert formula to string and trim
  formula = String(formula).trim();

  // Extract all potential global variable names (uppercase words)
  const globalPattern = /\b([A-Z_][A-Z0-9_]*)\b/g;
  const potentialGlobals = formula.match(globalPattern) || [];

  // Get unique global names
  const uniqueGlobals = [...new Set(potentialGlobals)];

  // Fetch all globals for this production
  const globalsResult = await db.query(
    'SELECT name, value FROM globals WHERE production_id = $1 AND name = ANY($2)',
    [productionId, uniqueGlobals]
  );

  const globalsMap = {};
  globalsResult.rows.forEach(g => {
    globalsMap[g.name] = parseFloat(g.value);
  });

  // Replace global names with their values in the formula
  let resolvedFormula = formula;
  const usedGlobals = [];

  uniqueGlobals.forEach(globalName => {
    if (globalsMap[globalName] !== undefined) {
      const value = globalsMap[globalName];
      // Use word boundaries to ensure we only replace complete variable names
      const regex = new RegExp(`\\b${globalName}\\b`, 'g');
      resolvedFormula = resolvedFormula.replace(regex, value);
      usedGlobals.push({ name: globalName, value });
    }
  });

  // Evaluate the formula safely
  try {
    // Sanitize the formula to only allow numbers and basic operators
    const sanitized = resolvedFormula.replace(/[^0-9+\-*/().\s]/g, '');

    if (sanitized !== resolvedFormula) {
      throw new Error('Formula contains invalid characters');
    }

    // Evaluate using Function constructor (safer than eval)
    const result = new Function('return ' + sanitized)();

    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Formula evaluation resulted in invalid number');
    }

    return {
      value: result,
      resolved: resolvedFormula,
      globals: usedGlobals
    };
  } catch (error) {
    throw new Error(`Failed to evaluate formula "${formula}": ${error.message}`);
  }
}

/**
 * Detect if a string contains global variable references
 * @param {string} input - The input string
 * @returns {boolean}
 */
function containsGlobals(input) {
  if (!input || typeof input !== 'string') return false;
  const globalPattern = /\b([A-Z_][A-Z0-9_]*)\b/;
  return globalPattern.test(input);
}

/**
 * Extract global variable names from a formula
 * @param {string} formula - The formula string
 * @returns {Array<string>}
 */
function extractGlobalNames(formula) {
  if (!formula || typeof formula !== 'string') return [];
  const globalPattern = /\b([A-Z_][A-Z0-9_]*)\b/g;
  const matches = formula.match(globalPattern) || [];
  return [...new Set(matches)];
}

/**
 * Calculate line item totals with formula support
 * @param {Object} lineItem - Line item data
 * @param {string} productionId - Production ID
 * @returns {Promise<Object>}
 */
async function calculateLineItemTotal(lineItem, productionId) {
  const {
    amount,
    units,
    unit_type,
    rate,
    days_weeks,
    fringe_rate
  } = lineItem;

  let subtotal = 0;

  // Parse amount (may contain global references)
  if (amount) {
    const amountResult = await parseFormula(amount, productionId);
    subtotal = amountResult.value;
  } else if (units && rate && days_weeks) {
    // Calculate: units * rate * days_weeks
    const unitsResult = await parseFormula(units, productionId);
    const rateResult = await parseFormula(rate, productionId);
    const daysWeeksResult = await parseFormula(days_weeks, productionId);

    subtotal = unitsResult.value * rateResult.value * daysWeeksResult.value;
  } else if (units && rate) {
    // Calculate: units * rate
    const unitsResult = await parseFormula(units, productionId);
    const rateResult = await parseFormula(rate, productionId);

    subtotal = unitsResult.value * rateResult.value;
  }

  // Calculate fringes
  let fringes = 0;
  if (fringe_rate) {
    const fringeResult = await parseFormula(fringe_rate, productionId);
    fringes = (subtotal * fringeResult.value) / 100;
  }

  // Total
  const total = subtotal + fringes;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    fringes: parseFloat(fringes.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

module.exports = {
  parseFormula,
  containsGlobals,
  extractGlobalNames,
  calculateLineItemTotal
};
