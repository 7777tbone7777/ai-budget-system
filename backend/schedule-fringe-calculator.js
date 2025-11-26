/**
 * Schedule-Aware Fringe Calculator
 * Calculates fringes across production phases with cap tracking
 *
 * Features:
 * - Phase-aware calculations (prep, shoot, wrap, post)
 * - Union-specific fringe rates
 * - P&H cap tracking
 * - Daily vs weekly hire handling
 * - Audit mode to compare calculated vs entered fringes
 */

const { createLogger } = require('./logger');
const fringeLogger = createLogger('FRINGE_CALC');

// Default fringe rates by union (percentage of wages)
// These are fallbacks when database doesn't have specific rates
const DEFAULT_FRINGE_RATES = {
  'IATSE': {
    pension: 0.085,      // 8.5%
    health: 0.085,       // 8.5%
    vacation: 0.06,      // 6%
    annuity: 0.04,       // 4%
    // Statutory
    fica_ss: 0.062,      // 6.2% up to wage base
    fica_medicare: 0.0145, // 1.45%
    futa: 0.006,         // 0.6% up to $7,000
    sui: 0.034,          // State dependent, CA default
    workers_comp: 0.03,  // 3% average
    // Caps
    ph_annual_cap: 420000, // P&H cap
    fica_ss_wage_base: 168600 // 2024 wage base
  },
  'DGA': {
    pension: 0.085,
    health: 0.11,
    vacation: 0.04,
    // Statutory same
    fica_ss: 0.062,
    fica_medicare: 0.0145,
    futa: 0.006,
    sui: 0.034,
    workers_comp: 0.025,
    ph_annual_cap: 500000
  },
  'SAG-AFTRA': {
    pension: 0.17,       // Combined P&H is higher for SAG
    health: 0.0,         // Included in pension
    vacation: 0.0,       // Not applicable
    fica_ss: 0.062,
    fica_medicare: 0.0145,
    futa: 0.006,
    sui: 0.034,
    workers_comp: 0.02,
    ph_annual_cap: 1000000
  },
  'WGA': {
    pension: 0.085,
    health: 0.085,
    vacation: 0.0,
    fica_ss: 0.062,
    fica_medicare: 0.0145,
    futa: 0.006,
    sui: 0.034,
    workers_comp: 0.015,
    ph_annual_cap: 500000
  },
  'Teamsters': {
    pension: 0.10,
    health: 0.08,
    vacation: 0.04,
    fica_ss: 0.062,
    fica_medicare: 0.0145,
    futa: 0.006,
    sui: 0.034,
    workers_comp: 0.04,
    ph_annual_cap: 400000
  },
  'Non-Union': {
    pension: 0.0,
    health: 0.0,
    vacation: 0.0,
    fica_ss: 0.062,
    fica_medicare: 0.0145,
    futa: 0.006,
    sui: 0.034,
    workers_comp: 0.03,
    ph_annual_cap: null
  }
};

// Phase multipliers for typical overtime
const PHASE_OT_MULTIPLIERS = {
  prep: 1.0,      // Prep usually no OT
  shoot: 1.12,    // Shoot typically 12% OT
  wrap: 1.05,     // Wrap some OT
  post: 1.0       // Post usually no OT
};

/**
 * Identify union from union_local string
 */
function identifyUnion(unionLocal) {
  if (!unionLocal) return 'Non-Union';

  const upper = unionLocal.toUpperCase();
  if (upper.includes('IATSE') || upper.includes('LOCAL')) return 'IATSE';
  if (upper.includes('DGA') || upper.includes('DIRECTOR')) return 'DGA';
  if (upper.includes('SAG') || upper.includes('AFTRA')) return 'SAG-AFTRA';
  if (upper.includes('WGA') || upper.includes('WRITER')) return 'WGA';
  if (upper.includes('TEAMSTER') || upper.includes('399')) return 'Teamsters';

  return 'IATSE'; // Default to IATSE for unknown union locals
}

/**
 * Get fringe rates for a union, merging DB data with defaults
 */
async function getFringeRates(db, unionLocal, state = 'CA') {
  const unionType = identifyUnion(unionLocal);
  const defaults = DEFAULT_FRINGE_RATES[unionType] || DEFAULT_FRINGE_RATES['IATSE'];

  // Try to get rates from database
  try {
    const result = await db.query(`
      SELECT benefit_type, rate_type, rate_value
      FROM fringe_benefits
      WHERE (union_local = $1 OR union_local IS NULL)
        AND (state = $2 OR state IS NULL)
      ORDER BY union_local NULLS LAST, effective_date DESC
    `, [unionLocal, state]);

    const dbRates = {};
    for (const row of result.rows) {
      if (row.rate_type === 'percentage') {
        dbRates[row.benefit_type] = parseFloat(row.rate_value) / 100;
      } else {
        dbRates[row.benefit_type + '_flat'] = parseFloat(row.rate_value);
      }
    }

    // Merge DB rates with defaults
    return { ...defaults, ...dbRates, unionType };
  } catch (err) {
    fringeLogger.warn('Could not fetch fringe rates from DB, using defaults', { unionLocal, error: err.message });
    return { ...defaults, unionType };
  }
}

/**
 * Calculate fringes for a single position across all phases
 */
function calculatePositionFringes(position, schedule, fringeRates) {
  const result = {
    position: position.description || position.job_classification,
    union: position.union_local,
    unionType: fringeRates.unionType,
    phases: {},
    totals: {
      wages: 0,
      pension: 0,
      health: 0,
      vacation: 0,
      statutory: 0,
      totalFringes: 0,
      effectiveRate: 0
    },
    capInfo: {
      phCapReached: false,
      phCapWeek: null,
      ficaCapReached: false
    }
  };

  // Determine if daily or weekly
  const isDaily = position.rate_type === 'daily' || position.rate_type === 'day';
  const baseRate = parseFloat(position.rate || position.base_rate || 0);

  // Track cumulative wages for cap calculations
  let cumulativeWages = 0;
  let cumulativePH = 0;
  const phCap = fringeRates.ph_annual_cap;

  // Calculate for each phase
  const phases = ['prep', 'shoot', 'wrap', 'post'];

  for (const phase of phases) {
    const phaseSchedule = schedule[phase];
    if (!phaseSchedule || phaseSchedule.duration <= 0) continue;

    // Calculate wages for this phase
    let phaseWeeks, phaseDays;
    if (phase === 'shoot') {
      phaseDays = phaseSchedule.duration;
      phaseWeeks = phaseDays / 5; // Convert shoot days to weeks
    } else {
      phaseWeeks = phaseSchedule.duration;
      phaseDays = phaseWeeks * 5;
    }

    // Skip if position doesn't work this phase
    if (position.phases && !position.phases.includes(phase)) continue;

    // Calculate raw wages
    let phaseWages;
    if (isDaily && phase === 'shoot') {
      phaseWages = baseRate * phaseDays;
    } else {
      // Weekly rate
      const weeklyRate = isDaily ? baseRate * 5 : baseRate;
      phaseWages = weeklyRate * phaseWeeks;
    }

    // Apply OT multiplier for shoot
    phaseWages *= PHASE_OT_MULTIPLIERS[phase];

    // Calculate P&H fringes (subject to cap)
    let pensionFringe = 0;
    let healthFringe = 0;
    let vacationFringe = 0;

    // Check if we've hit the P&H cap
    if (phCap && cumulativePH >= phCap) {
      // Already at cap, no more P&H
      result.capInfo.phCapReached = true;
    } else {
      // Calculate P&H up to cap
      const phRate = (fringeRates.pension || 0) + (fringeRates.health || 0);
      const potentialPH = phaseWages * phRate;

      if (phCap && (cumulativePH + potentialPH) > phCap) {
        // Cap will be reached this phase
        const remainingCap = phCap - cumulativePH;
        const wagesUntilCap = remainingCap / phRate;

        pensionFringe = wagesUntilCap * (fringeRates.pension || 0);
        healthFringe = wagesUntilCap * (fringeRates.health || 0);

        result.capInfo.phCapReached = true;
        result.capInfo.phCapWeek = Math.ceil(cumulativeWages / (baseRate * (isDaily ? 5 : 1)));
      } else {
        pensionFringe = phaseWages * (fringeRates.pension || 0);
        healthFringe = phaseWages * (fringeRates.health || 0);
      }

      cumulativePH += pensionFringe + healthFringe;
    }

    // Vacation (not subject to P&H cap)
    vacationFringe = phaseWages * (fringeRates.vacation || 0);

    // Statutory taxes (always apply, with their own caps)
    const ficaSS = Math.min(phaseWages, Math.max(0, fringeRates.fica_ss_wage_base - cumulativeWages)) * fringeRates.fica_ss;
    const ficaMedicare = phaseWages * fringeRates.fica_medicare;
    const futa = Math.min(phaseWages, Math.max(0, 7000 - cumulativeWages)) * fringeRates.futa;
    const sui = phaseWages * (fringeRates.sui || 0.034);
    const workersComp = phaseWages * (fringeRates.workers_comp || 0.03);

    const statutory = ficaSS + ficaMedicare + futa + sui + workersComp;

    // Total fringes for this phase
    const phaseFringes = pensionFringe + healthFringe + vacationFringe + statutory;

    result.phases[phase] = {
      weeks: phaseWeeks,
      days: phaseDays,
      rate: baseRate,
      wages: Math.round(phaseWages * 100) / 100,
      pension: Math.round(pensionFringe * 100) / 100,
      health: Math.round(healthFringe * 100) / 100,
      vacation: Math.round(vacationFringe * 100) / 100,
      statutory: Math.round(statutory * 100) / 100,
      totalFringes: Math.round(phaseFringes * 100) / 100,
      effectiveRate: phaseWages > 0 ? Math.round((phaseFringes / phaseWages) * 1000) / 10 : 0
    };

    // Update totals
    result.totals.wages += phaseWages;
    result.totals.pension += pensionFringe;
    result.totals.health += healthFringe;
    result.totals.vacation += vacationFringe;
    result.totals.statutory += statutory;
    result.totals.totalFringes += phaseFringes;

    cumulativeWages += phaseWages;
  }

  // Round totals
  result.totals.wages = Math.round(result.totals.wages * 100) / 100;
  result.totals.pension = Math.round(result.totals.pension * 100) / 100;
  result.totals.health = Math.round(result.totals.health * 100) / 100;
  result.totals.vacation = Math.round(result.totals.vacation * 100) / 100;
  result.totals.statutory = Math.round(result.totals.statutory * 100) / 100;
  result.totals.totalFringes = Math.round(result.totals.totalFringes * 100) / 100;
  result.totals.effectiveRate = result.totals.wages > 0
    ? Math.round((result.totals.totalFringes / result.totals.wages) * 1000) / 10
    : 0;

  return result;
}

/**
 * Main function: Calculate fringes for entire production
 */
async function calculateProductionFringes(db, productionId, schedule) {
  const startTime = Date.now();

  fringeLogger.info('Starting fringe calculation', { productionId, schedule });

  try {
    // Get production info
    const prodResult = await db.query(
      'SELECT * FROM productions WHERE id = $1',
      [productionId]
    );

    if (prodResult.rows.length === 0) {
      throw new Error('Production not found');
    }

    const production = prodResult.rows[0];
    const state = production.state || 'CA';

    // Get all line items with union info
    const itemsResult = await db.query(`
      SELECT
        bli.id,
        bli.description,
        bli.quantity,
        bli.rate,
        bli.rate_type,
        bli.subtotal,
        bli.fringes as entered_fringes,
        bli.total,
        cp.union_local,
        cp.job_classification
      FROM budget_line_items bli
      LEFT JOIN crew_positions cp ON bli.crew_position_id = cp.id
      WHERE bli.production_id = $1
      ORDER BY bli.account_code
    `, [productionId]);

    const lineItems = itemsResult.rows;
    fringeLogger.info('Found line items', { count: lineItems.length });

    // Calculate fringes for each position
    const positionResults = [];
    const fringeRatesCache = {};

    for (const item of lineItems) {
      // Get fringe rates (cached by union)
      const unionKey = item.union_local || 'Non-Union';
      if (!fringeRatesCache[unionKey]) {
        fringeRatesCache[unionKey] = await getFringeRates(db, item.union_local, state);
      }

      const fringeRates = fringeRatesCache[unionKey];
      const positionFringes = calculatePositionFringes(item, schedule, fringeRates);

      positionResults.push({
        lineItemId: item.id,
        ...positionFringes,
        enteredFringes: parseFloat(item.entered_fringes || 0),
        difference: Math.round((positionFringes.totals.totalFringes - parseFloat(item.entered_fringes || 0)) * 100) / 100
      });
    }

    // Calculate summary
    const summary = {
      totalPositions: positionResults.length,
      totalCalculatedWages: 0,
      totalCalculatedFringes: 0,
      totalEnteredFringes: 0,
      totalDifference: 0,
      positionsWithDiscrepancies: 0,
      averageEffectiveRate: 0,
      byUnion: {}
    };

    for (const pos of positionResults) {
      summary.totalCalculatedWages += pos.totals.wages;
      summary.totalCalculatedFringes += pos.totals.totalFringes;
      summary.totalEnteredFringes += pos.enteredFringes;

      if (Math.abs(pos.difference) > 1) { // $1 tolerance
        summary.positionsWithDiscrepancies++;
      }

      // Group by union
      const unionType = pos.unionType;
      if (!summary.byUnion[unionType]) {
        summary.byUnion[unionType] = {
          positions: 0,
          wages: 0,
          fringes: 0
        };
      }
      summary.byUnion[unionType].positions++;
      summary.byUnion[unionType].wages += pos.totals.wages;
      summary.byUnion[unionType].fringes += pos.totals.totalFringes;
    }

    summary.totalDifference = Math.round((summary.totalCalculatedFringes - summary.totalEnteredFringes) * 100) / 100;
    summary.averageEffectiveRate = summary.totalCalculatedWages > 0
      ? Math.round((summary.totalCalculatedFringes / summary.totalCalculatedWages) * 1000) / 10
      : 0;

    // Round summary values
    summary.totalCalculatedWages = Math.round(summary.totalCalculatedWages * 100) / 100;
    summary.totalCalculatedFringes = Math.round(summary.totalCalculatedFringes * 100) / 100;
    summary.totalEnteredFringes = Math.round(summary.totalEnteredFringes * 100) / 100;

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      productionId,
      productionName: production.name,
      schedule,
      summary,
      positions: positionResults,
      discrepancies: positionResults.filter(p => Math.abs(p.difference) > 1),
      executionTimeMs: executionTime
    };

    fringeLogger.info('Fringe calculation complete', {
      productionId,
      positions: summary.totalPositions,
      calculatedFringes: summary.totalCalculatedFringes,
      enteredFringes: summary.totalEnteredFringes,
      difference: summary.totalDifference,
      executionTimeMs: executionTime
    });

    return result;

  } catch (error) {
    fringeLogger.error('Fringe calculation failed', error, { productionId });
    throw error;
  }
}

/**
 * Apply calculated fringes to line items
 */
async function applyCalculatedFringes(db, productionId, positionResults) {
  fringeLogger.info('Applying calculated fringes', { productionId, count: positionResults.length });

  let updated = 0;

  for (const pos of positionResults) {
    if (!pos.lineItemId) continue;

    await db.query(`
      UPDATE budget_line_items
      SET fringes = $1,
          total = subtotal + $1,
          updated_at = NOW()
      WHERE id = $2
    `, [pos.totals.totalFringes, pos.lineItemId]);

    updated++;
  }

  fringeLogger.info('Applied fringes', { productionId, updated });

  return { updated };
}

/**
 * Quick estimate for a single position (used in real-time preview)
 */
async function estimatePositionFringes(db, unionLocal, rate, rateType, schedule) {
  const fringeRates = await getFringeRates(db, unionLocal, 'CA');

  const position = {
    union_local: unionLocal,
    rate,
    rate_type: rateType
  };

  return calculatePositionFringes(position, schedule, fringeRates);
}

module.exports = {
  calculateProductionFringes,
  applyCalculatedFringes,
  estimatePositionFringes,
  getFringeRates,
  DEFAULT_FRINGE_RATES
};
