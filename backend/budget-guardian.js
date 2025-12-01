/**
 * Budget Guardian - Real-Time Compliance Auditing
 * Rate validation, union compliance, and tax incentive optimization
 */

const { createLogger } = require('./logger');
const guardianLogger = createLogger('BUDGET_GUARDIAN');

// Tax incentive programs by state/location
const TAX_INCENTIVES = {
  'California': {
    name: 'California Film & TV Tax Credit Program',
    creditRate: 0.20, // 20% base
    qualifiedSpend: ['labor', 'post_production', 'equipment'],
    bonuses: {
      'Outside LA Zone': 0.05,
      'Music Scoring': 0.05,
      'VFX': 0.05
    },
    caps: {
      annual: 330000000,
      perProject: 12000000
    },
    requirements: {
      minBudget: 1000000,
      residencyDays: 75
    }
  },
  'Georgia': {
    name: 'Georgia Entertainment Industry Investment Act',
    creditRate: 0.20,
    qualifiedSpend: ['labor', 'post_production', 'equipment', 'locations', 'materials'],
    bonuses: {
      'Georgia Logo': 0.10
    },
    caps: {
      perProject: null // No cap
    },
    requirements: {
      minSpend: 500000,
      logoPlacement: true
    }
  },
  'New Mexico': {
    name: 'New Mexico Film Production Tax Credit',
    creditRate: 0.25,
    qualifiedSpend: ['labor', 'post_production', 'equipment', 'locations'],
    bonuses: {
      'Rural Areas': 0.05,
      'TV Pilot': 0.05
    },
    caps: {
      perProject: 50000000
    },
    requirements: {
      minSpend: 0
    }
  },
  'Louisiana': {
    name: 'Louisiana Motion Picture Production Program',
    creditRate: 0.25,
    qualifiedSpend: ['labor', 'post_production', 'equipment', 'locations'],
    bonuses: {
      'Louisiana Resident Labor': 0.10
    },
    caps: {
      perProject: 150000000
    },
    requirements: {
      minSpend: 300000
    }
  },
  'New York': {
    name: 'New York Film Production Credit',
    creditRate: 0.25,
    qualifiedSpend: ['labor', 'post_production'],
    bonuses: {
      'Upstate NY': 0.10
    },
    caps: {
      annual: 420000000
    },
    requirements: {
      minSpend: 0,
      postInNY: true
    }
  },
  'United Kingdom': {
    name: 'UK Film Tax Relief',
    creditRate: 0.25,
    qualifiedSpend: ['labor', 'post_production', 'equipment'],
    bonuses: {},
    caps: {},
    requirements: {
      culturalTest: true,
      minUKSpend: 0.10
    }
  },
  'Canada - British Columbia': {
    name: 'BC Production Services Tax Credit',
    creditRate: 0.28,
    qualifiedSpend: ['labor'],
    bonuses: {
      'Regional': 0.06,
      'Distant Location': 0.06
    },
    caps: {},
    requirements: {
      productionSpend: true
    }
  }
};

// Compliance rules by production type
const COMPLIANCE_RULES = {
  theatrical: {
    requiredUnions: ['IATSE', 'Teamsters Local 399', 'DGA', 'SAG-AFTRA', 'WGA'],
    minContingency: 0.10,
    requiredInsurance: ['production', 'E&O', 'workers_comp'],
    payrollFringes: 0.32
  },
  hbsvod: {
    requiredUnions: ['IATSE', 'Teamsters Local 399', 'DGA', 'SAG-AFTRA'],
    minContingency: 0.08,
    requiredInsurance: ['production', 'E&O', 'workers_comp'],
    payrollFringes: 0.32
  },
  television: {
    requiredUnions: ['IATSE', 'DGA', 'SAG-AFTRA', 'WGA'],
    minContingency: 0.05,
    requiredInsurance: ['production', 'E&O', 'workers_comp'],
    payrollFringes: 0.32
  },
  indie: {
    requiredUnions: [],
    minContingency: 0.05,
    requiredInsurance: ['production', 'workers_comp'],
    payrollFringes: 0.25
  }
};

// Common rate card violations
const RATE_VIOLATION_FIXES = {
  below_minimum: (item, rateCard) => ({
    action: 'increase_rate',
    newRate: rateCard.base_rate,
    reason: `Union minimum is $${rateCard.base_rate}/${rateCard.rate_type}`,
    savings: 0,
    cost: (rateCard.base_rate - item.rate) * (item.quantity || 1)
  }),
  missing_fringes: (item, fringeRate) => ({
    action: 'add_fringes',
    newFringes: item.subtotal * fringeRate,
    reason: `Missing ${(fringeRate * 100).toFixed(0)}% fringe benefit contribution`,
    cost: item.subtotal * fringeRate
  }),
  wrong_rate_type: (item, rateCard) => ({
    action: 'convert_rate_type',
    suggestedRate: rateCard.base_rate,
    suggestedType: rateCard.rate_type,
    reason: `Position typically uses ${rateCard.rate_type} rates`
  })
};

/**
 * Audit a budget against union rate cards
 */
async function auditBudget(budget, lineItems, pool) {
  guardianLogger.info('Starting budget audit', {
    budgetId: budget.id,
    lineItemCount: lineItems.length
  });

  const audit = {
    budgetId: budget.id,
    productionType: budget.production_type || 'theatrical',
    timestamp: new Date().toISOString(),
    summary: {
      totalItems: lineItems.length,
      compliant: 0,
      warnings: 0,
      violations: 0,
      totalBudgetImpact: 0
    },
    violations: [],
    warnings: [],
    recommendations: [],
    taxIncentives: [],
    complianceScore: 100
  };

  // Get compliance rules for this production type
  const rules = COMPLIANCE_RULES[audit.productionType] || COMPLIANCE_RULES.theatrical;

  // Check each line item
  for (const item of lineItems) {
    const itemAudit = await auditLineItem(item, budget, rules, pool);

    if (itemAudit.violation) {
      audit.violations.push(itemAudit);
      audit.summary.violations++;
      audit.summary.totalBudgetImpact += itemAudit.budgetImpact || 0;
      audit.complianceScore -= 5;
    } else if (itemAudit.warning) {
      audit.warnings.push(itemAudit);
      audit.summary.warnings++;
      audit.complianceScore -= 2;
    } else {
      audit.summary.compliant++;
    }
  }

  // Check overall budget compliance
  const budgetCompliance = checkBudgetCompliance(budget, lineItems, rules);
  audit.warnings.push(...budgetCompliance.warnings);
  audit.violations.push(...budgetCompliance.violations);
  audit.complianceScore -= budgetCompliance.violations.length * 5;
  audit.complianceScore -= budgetCompliance.warnings.length * 2;

  // Calculate tax incentive opportunities
  audit.taxIncentives = calculateTaxIncentives(budget, lineItems);

  // Generate recommendations
  audit.recommendations = generateComplianceRecommendations(audit);

  // Ensure score doesn't go below 0
  audit.complianceScore = Math.max(0, audit.complianceScore);

  guardianLogger.info('Budget audit complete', {
    budgetId: budget.id,
    complianceScore: audit.complianceScore,
    violations: audit.summary.violations
  });

  return audit;
}

/**
 * Audit a single line item
 */
async function auditLineItem(item, budget, rules, pool) {
  const result = {
    lineItemId: item.id,
    description: item.description,
    accountCode: item.account_code,
    currentRate: item.rate,
    currentTotal: item.total,
    violation: null,
    warning: null,
    fix: null,
    budgetImpact: 0
  };

  // Try to match to a rate card
  if (pool) {
    try {
      const rateQuery = await pool.query(
        `SELECT * FROM rate_cards
         WHERE job_classification ILIKE $1
         AND (production_type = $2 OR production_type IS NULL)
         ORDER BY effective_date DESC LIMIT 1`,
        [`%${item.description}%`, budget.production_type || 'theatrical']
      );

      if (rateQuery.rows.length > 0) {
        const rateCard = rateQuery.rows[0];

        // Check if below minimum
        if (item.rate < rateCard.base_rate) {
          result.violation = {
            type: 'below_minimum',
            message: `Rate of $${item.rate} is below union minimum of $${rateCard.base_rate}/${rateCard.rate_type}`,
            union: rateCard.union_local,
            minimumRate: rateCard.base_rate,
            rateType: rateCard.rate_type
          };
          result.fix = RATE_VIOLATION_FIXES.below_minimum(item, rateCard);
          result.budgetImpact = result.fix.cost;
        }
      }
    } catch (err) {
      guardianLogger.error('Rate card lookup failed', err);
    }
  }

  // Check for missing fringes on labor items
  const isLaborItem = item.account_code?.startsWith('1') || // Above the line
                      item.account_code?.startsWith('2') || // Production staff
                      item.account_code?.startsWith('5') || // Production crew
                      item.account_code?.startsWith('6') || // Extra talent
                      item.account_code?.startsWith('7');   // Set operations

  if (isLaborItem && (!item.fringes || item.fringes === 0)) {
    const expectedFringes = (item.subtotal || item.total) * rules.payrollFringes;
    if (expectedFringes > 100) { // Only flag if significant
      result.warning = {
        type: 'missing_fringes',
        message: `Labor item appears to be missing fringe benefits (expected ~$${expectedFringes.toFixed(0)})`,
        expectedFringes
      };
      result.fix = RATE_VIOLATION_FIXES.missing_fringes(item, rules.payrollFringes);
    }
  }

  return result;
}

/**
 * Check overall budget compliance
 */
function checkBudgetCompliance(budget, lineItems, rules) {
  const result = {
    warnings: [],
    violations: []
  };

  // Calculate total budget
  const totalBudget = lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // Check contingency
  const contingencyItems = lineItems.filter(item =>
    item.description?.toLowerCase().includes('contingency') ||
    item.account_code === '9900'
  );
  const contingencyAmount = contingencyItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const contingencyPercent = contingencyAmount / totalBudget;

  if (contingencyPercent < rules.minContingency) {
    result.warnings.push({
      lineItemId: null,
      type: 'low_contingency',
      message: `Contingency of ${(contingencyPercent * 100).toFixed(1)}% is below recommended ${(rules.minContingency * 100)}%`,
      recommendation: `Increase contingency by $${((rules.minContingency - contingencyPercent) * totalBudget).toFixed(0)}`
    });
  }

  // Check for required union coverage
  for (const union of rules.requiredUnions) {
    const hasUnionItems = lineItems.some(item =>
      item.notes?.includes(union) || item.description?.includes(union)
    );
    if (!hasUnionItems) {
      result.warnings.push({
        lineItemId: null,
        type: 'missing_union_coverage',
        message: `No line items found for ${union} - verify union signatory status`,
        union
      });
    }
  }

  // Check for insurance
  const insuranceItems = lineItems.filter(item =>
    item.description?.toLowerCase().includes('insurance') ||
    item.account_code?.startsWith('93')
  );
  if (insuranceItems.length === 0) {
    result.warnings.push({
      lineItemId: null,
      type: 'missing_insurance',
      message: 'No insurance line items found - production insurance is required'
    });
  }

  return result;
}

/**
 * Calculate tax incentive opportunities
 */
function calculateTaxIncentives(budget, lineItems) {
  const location = budget.primary_location || budget.location || 'California';
  const incentive = TAX_INCENTIVES[location];

  if (!incentive) {
    return [{
      location,
      eligible: false,
      message: `No tax incentive program data available for ${location}`
    }];
  }

  const totalBudget = lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // Check if meets minimum requirements
  if (incentive.requirements.minBudget && totalBudget < incentive.requirements.minBudget) {
    return [{
      location,
      programName: incentive.name,
      eligible: false,
      message: `Budget of $${totalBudget.toLocaleString()} does not meet minimum of $${incentive.requirements.minBudget.toLocaleString()}`
    }];
  }

  // Calculate qualified spend
  const qualifiedCategories = {
    labor: ['1', '2', '5', '6', '7'],
    post_production: ['8'],
    equipment: ['4'],
    locations: ['36', '37', '39'],
    materials: ['3']
  };

  let qualifiedSpend = 0;
  for (const category of incentive.qualifiedSpend) {
    const prefixes = qualifiedCategories[category] || [];
    for (const item of lineItems) {
      const code = item.account_code || '';
      if (prefixes.some(p => code.startsWith(p))) {
        qualifiedSpend += parseFloat(item.total) || 0;
      }
    }
  }

  // Calculate base credit
  let creditRate = incentive.creditRate;
  const bonusesApplied = [];

  // Apply bonuses (simplified - would need more data in real implementation)
  for (const [bonusName, bonusRate] of Object.entries(incentive.bonuses)) {
    // For now, just list potential bonuses
    bonusesApplied.push({
      name: bonusName,
      rate: bonusRate,
      applied: false,
      potentialValue: qualifiedSpend * bonusRate
    });
  }

  const baseCredit = qualifiedSpend * creditRate;
  const cappedCredit = incentive.caps?.perProject
    ? Math.min(baseCredit, incentive.caps.perProject)
    : baseCredit;

  return [{
    location,
    programName: incentive.name,
    eligible: true,
    qualifiedSpend,
    qualifiedPercent: (qualifiedSpend / totalBudget * 100).toFixed(1),
    baseRate: creditRate,
    baseCredit,
    cappedCredit,
    effectiveRate: (cappedCredit / totalBudget * 100).toFixed(2),
    potentialBonuses: bonusesApplied,
    requirements: incentive.requirements,
    recommendations: [
      `Maximize qualified spend in: ${incentive.qualifiedSpend.join(', ')}`,
      bonusesApplied.length > 0 ? `Potential bonus credits available for: ${Object.keys(incentive.bonuses).join(', ')}` : null
    ].filter(Boolean)
  }];
}

/**
 * Generate compliance recommendations
 */
function generateComplianceRecommendations(audit) {
  const recommendations = [];

  // Rate violation fixes
  const rateViolations = audit.violations.filter(v => v.violation?.type === 'below_minimum');
  if (rateViolations.length > 0) {
    const totalCost = rateViolations.reduce((sum, v) => sum + (v.budgetImpact || 0), 0);
    recommendations.push({
      priority: 'high',
      category: 'union_compliance',
      title: `Fix ${rateViolations.length} Rate Violations`,
      description: `${rateViolations.length} line items are below union minimums. Fixing will cost approximately $${totalCost.toLocaleString()}.`,
      estimatedCost: totalCost,
      items: rateViolations.map(v => ({
        description: v.description,
        currentRate: v.currentRate,
        requiredRate: v.violation.minimumRate,
        union: v.violation.union
      }))
    });
  }

  // Fringe warnings
  const fringeWarnings = audit.warnings.filter(w => w.warning?.type === 'missing_fringes' || w.type === 'missing_fringes');
  if (fringeWarnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'compliance',
      title: 'Review Fringe Benefit Calculations',
      description: `${fringeWarnings.length} labor items may be missing fringe benefit calculations. Standard fringes are 30-35% of gross wages.`,
      items: fringeWarnings.slice(0, 5).map(w => ({
        description: w.description,
        expectedFringes: w.warning?.expectedFringes || w.expectedFringes
      }))
    });
  }

  // Tax incentive recommendations
  const eligibleIncentives = audit.taxIncentives.filter(t => t.eligible);
  if (eligibleIncentives.length > 0) {
    for (const incentive of eligibleIncentives) {
      recommendations.push({
        priority: 'info',
        category: 'tax_incentive',
        title: `${incentive.programName} Eligible`,
        description: `Estimated credit of $${incentive.cappedCredit.toLocaleString()} (${incentive.effectiveRate}% of budget)`,
        potentialSavings: incentive.cappedCredit,
        recommendations: incentive.recommendations
      });
    }
  }

  // Contingency warning
  const contingencyWarnings = audit.warnings.filter(w => w.type === 'low_contingency');
  if (contingencyWarnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'risk_management',
      title: 'Increase Contingency Reserve',
      description: contingencyWarnings[0].message,
      recommendation: contingencyWarnings[0].recommendation
    });
  }

  return recommendations;
}

/**
 * Quick compliance check for a single rate
 */
async function checkRate(position, rate, productionType, location, pool) {
  if (!pool) return { valid: true, message: 'No database connection for rate validation' };

  try {
    const result = await pool.query(
      `SELECT * FROM rate_cards
       WHERE job_classification ILIKE $1
       AND (production_type = $2 OR production_type IS NULL)
       AND (location = $3 OR location = 'National' OR location IS NULL)
       ORDER BY
         CASE WHEN location = $3 THEN 0 ELSE 1 END,
         effective_date DESC
       LIMIT 1`,
      [`%${position}%`, productionType, location]
    );

    if (result.rows.length === 0) {
      return {
        valid: true,
        message: 'No matching rate card found - manual verification recommended',
        warning: true
      };
    }

    const rateCard = result.rows[0];

    if (rate < rateCard.base_rate) {
      return {
        valid: false,
        message: `Rate of $${rate} is below ${rateCard.union_local} minimum of $${rateCard.base_rate}/${rateCard.rate_type}`,
        minimumRate: rateCard.base_rate,
        rateType: rateCard.rate_type,
        union: rateCard.union_local,
        difference: rateCard.base_rate - rate
      };
    }

    return {
      valid: true,
      message: `Rate of $${rate} meets ${rateCard.union_local} minimum`,
      minimumRate: rateCard.base_rate,
      union: rateCard.union_local,
      margin: rate - rateCard.base_rate
    };
  } catch (err) {
    guardianLogger.error('Rate check failed', err);
    return { valid: true, message: 'Rate check failed - manual verification recommended', error: true };
  }
}

/**
 * Get available tax incentive programs
 */
function getTaxIncentivePrograms() {
  return Object.entries(TAX_INCENTIVES).map(([location, program]) => ({
    location,
    ...program
  }));
}

/**
 * Summarize audit for display
 */
function summarizeAudit(audit) {
  const summary = [];

  summary.push(`## Budget Compliance Audit\n`);
  summary.push(`**Score:** ${audit.complianceScore}/100\n`);
  summary.push(`**Items Reviewed:** ${audit.summary.totalItems}`);
  summary.push(`**Compliant:** ${audit.summary.compliant}`);
  summary.push(`**Warnings:** ${audit.summary.warnings}`);
  summary.push(`**Violations:** ${audit.summary.violations}\n`);

  if (audit.violations.length > 0) {
    summary.push(`### Violations\n`);
    audit.violations.forEach(v => {
      if (v.violation) {
        summary.push(`- **${v.description}**: ${v.violation.message}`);
      }
    });
    summary.push('');
  }

  if (audit.taxIncentives.some(t => t.eligible)) {
    summary.push(`### Tax Incentive Opportunity\n`);
    audit.taxIncentives.filter(t => t.eligible).forEach(t => {
      summary.push(`- **${t.programName}**: Up to $${t.cappedCredit.toLocaleString()} (${t.effectiveRate}%)`);
    });
  }

  return summary.join('\n');
}

/**
 * ======================================
 * BUDGET OPTIMIZATION & SCENARIO ANALYSIS
 * ======================================
 */

/**
 * Comprehensive budget analysis - overage identification and optimization suggestions
 */
async function analyzeBudgetOptimization(production, lineItems, pool) {
  guardianLogger.info('Starting budget optimization analysis', {
    productionId: production.id,
    targetBudget: production.budget_target
  });

  const targetBudget = parseFloat(production.budget_target || 0);

  // Calculate actual total
  let actualTotal = 0;
  const items = lineItems.map(item => {
    const total = parseFloat(item.current_total || 0);
    actualTotal += total;
    return {
      ...item,
      current_total: total
    };
  });

  const overBudget = actualTotal - targetBudget;
  const overBudgetPercent = targetBudget > 0 ? ((overBudget / targetBudget) * 100).toFixed(1) : 0;

  // Department mapping
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
    '29': 'Wardrobe',
    '30': 'Makeup',
    '31': 'Hair',
    '32': 'Electric',
    '33': 'Camera',
    '34': 'Sound',
    '35': 'Transportation',
    '36': 'Location',
    '38': 'Special Effects',
    '40': 'Stunts',
    '42': 'Editorial',
    '43': 'Post Production',
    '50': 'Fringes',
    '60': 'Insurance',
    '70': 'General Expenses'
  };

  // Group by department
  const departmentTotals = {};
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
    const shootDays = production.shoot_days || 60;
    const avgDailyCost = actualTotal / shootDays;
    const daysToReduce = Math.ceil(overBudget / avgDailyCost);
    suggestions.push({
      strategy: 'Reduce shoot days',
      description: `Reduce from ${shootDays} to ${shootDays - daysToReduce} shoot days`,
      estimatedSavings: avgDailyCost * daysToReduce,
      impact: 'High - affects all daily crew and rentals',
      difficulty: 'High - requires script/schedule changes',
      category: 'schedule'
    });
  }

  // 2. Reduce crew size in largest departments
  const topDepts = departmentAnalysis.slice(0, 5);
  topDepts.forEach(dept => {
    if (dept.department !== 'ATL - Cast' && dept.department !== 'ATL - Director') {
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
          difficulty: 'Medium - adjust schedule to compensate',
          category: 'crew'
        });
      }
    }
  });

  // 3. Switch to lower-budget sideletters
  if (production.production_type === 'theatrical') {
    suggestions.push({
      strategy: 'Use low-budget theatrical sideletter',
      description: 'Switch to SAG Modified Low Budget ($700k-$2.5M) or Ultra Low Budget (<$250k) agreement',
      estimatedSavings: actualTotal * 0.15,
      impact: 'Medium - lower union rates across the board',
      difficulty: 'Low - if budget qualifies',
      category: 'union'
    });
  }

  // 4. Reduce prep/wrap days
  suggestions.push({
    strategy: 'Reduce prep and wrap days',
    description: 'Reduce prep days by 20% and wrap days by 30% for non-essential positions',
    estimatedSavings: actualTotal * 0.08,
    impact: 'Low-Medium - affects department heads most',
    difficulty: 'Medium - requires efficient planning',
    category: 'schedule'
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
      estimatedSavings: equipmentTotal * 0.15,
      impact: 'Low - minimal creative impact',
      difficulty: 'Low - negotiate with vendors',
      category: 'equipment'
    });
  }

  // Sort suggestions by estimated savings
  suggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

  return {
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
      percentOfOverage: overBudget > 0 ? ((s.estimatedSavings / Math.abs(overBudget)) * 100).toFixed(1) : '0.0'
    })),
    quickWins: suggestions.slice(0, 3)
  };
}

/**
 * ======================================
 * WHAT-IF SCENARIO ANALYSIS (Integrated from what-if-analyzer.js)
 * ======================================
 */

// Import cascade rules and cost factors from what-if-analyzer
const CASCADE_RULES = {
  shootDays: {
    affects: ['labor', 'equipment', 'locations', 'catering', 'transportation'],
    multiplier: 1.0,
    description: 'Shoot days directly affect all daily-rated costs'
  },
  crewSize: {
    affects: ['labor', 'catering', 'transportation', 'wardrobe'],
    multiplier: 0.8,
    description: 'Crew size affects labor and support costs'
  },
  locations: {
    affects: ['transportation', 'catering', 'equipment', 'permits'],
    multiplier: 1.2,
    description: 'Additional locations increase logistics costs'
  },
  vfxShots: {
    affects: ['post_production', 'equipment'],
    multiplier: 1.0,
    description: 'VFX changes affect post-production budget'
  }
};

const COST_FACTORS = {
  labor: { dailyRate: true, percentOfBudget: 0.35, varianceRange: { min: 0.85, max: 1.25 } },
  equipment: { dailyRate: true, percentOfBudget: 0.08, varianceRange: { min: 0.90, max: 1.15 } },
  locations: { perLocation: true, percentOfBudget: 0.05, varianceRange: { min: 0.80, max: 1.40 } },
  transportation: { dailyRate: true, percentOfBudget: 0.04, varianceRange: { min: 0.90, max: 1.20 } },
  catering: { perPerson: true, dailyRate: true, percentOfBudget: 0.02, varianceRange: { min: 0.95, max: 1.10 } },
  post_production: { fixed: true, percentOfBudget: 0.15, varianceRange: { min: 0.90, max: 1.50 } }
};

/**
 * Analyze a what-if scenario WITH compliance validation
 */
async function analyzeScenarioWithCompliance(production, lineItems, scenario, pool) {
  guardianLogger.info('Analyzing scenario with compliance check', {
    productionId: production.id,
    scenarioName: scenario.name
  });

  const baseline = {
    totalBudget: lineItems.reduce((sum, item) => sum + parseFloat(item.current_total || 0), 0),
    shootDays: production.shoot_days || 30,
    crewSize: lineItems.filter(item => item.account_code?.startsWith('2') || item.account_code?.startsWith('3')).length,
    locations: production.locations || 5,
    productionType: production.production_type || 'theatrical'
  };

  const changes = scenario.changes || {};
  const results = {
    scenarioName: scenario.name || 'Unnamed Scenario',
    baseline: { ...baseline },
    impacts: [],
    cascadeEffects: [],
    totalImpact: 0,
    newTotal: baseline.totalBudget,
    percentChange: 0,
    complianceIssues: [],
    recommendations: []
  };

  // Calculate scenario impacts
  for (const [changeType, changeValue] of Object.entries(changes)) {
    const impact = calculateChangeImpact(baseline, changeType, changeValue);
    results.impacts.push(impact);
    results.totalImpact += impact.dollarImpact;

    // Calculate cascade effects
    if (CASCADE_RULES[changeType]) {
      const cascades = calculateCascadeEffects(baseline, changeType, changeValue);
      results.cascadeEffects.push(...cascades);
      cascades.forEach(c => results.totalImpact += c.dollarImpact);
    }
  }

  results.newTotal = baseline.totalBudget + results.totalImpact;
  results.percentChange = (results.totalImpact / baseline.totalBudget) * 100;

  // COMPLIANCE CHECK: Run audit on the scenario
  const scenarioLineItems = adjustLineItemsForScenario(lineItems, scenario);
  const scenarioProduction = { ...production };
  if (changes.shootDays) scenarioProduction.shoot_days = baseline.shootDays + changes.shootDays;

  const complianceAudit = await auditBudget(scenarioProduction, scenarioLineItems, pool);

  results.complianceScore = complianceAudit.complianceScore;
  results.complianceIssues = [
    ...complianceAudit.violations.map(v => ({ severity: 'high', ...v })),
    ...complianceAudit.warnings.map(w => ({ severity: 'medium', ...w }))
  ];

  // Tax incentive impact
  results.taxIncentiveImpact = calculateTaxIncentives(scenarioProduction, scenarioLineItems);

  // Generate recommendations that consider compliance
  results.recommendations = generateScenarioRecommendations(results);

  return results;
}

/**
 * Calculate impact of a single change
 */
function calculateChangeImpact(baseline, changeType, changeValue) {
  const impact = {
    changeType,
    changeValue,
    description: '',
    dollarImpact: 0,
    percentImpact: 0,
    affectedCategories: []
  };

  switch (changeType) {
    case 'shootDays': {
      const daysDiff = changeValue - baseline.shootDays;
      const dailyCost = baseline.totalBudget * 0.02;
      impact.dollarImpact = daysDiff * dailyCost;
      impact.description = `${daysDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(daysDiff)} shoot day(s)`;
      impact.affectedCategories = ['labor', 'equipment', 'locations', 'catering'];
      break;
    }
    case 'crewSize': {
      const crewDiff = changeValue - baseline.crewSize;
      const costPerCrew = baseline.totalBudget * 0.004;
      impact.dollarImpact = crewDiff * costPerCrew * baseline.shootDays;
      impact.description = `${crewDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(crewDiff)} crew member(s)`;
      impact.affectedCategories = ['labor', 'catering', 'transportation'];
      break;
    }
    case 'locations': {
      const locationsDiff = changeValue - baseline.locations;
      const costPerLocation = baseline.totalBudget * 0.01;
      impact.dollarImpact = locationsDiff * costPerLocation;
      impact.description = `${locationsDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(locationsDiff)} location(s)`;
      impact.affectedCategories = ['locations', 'transportation', 'permits'];
      break;
    }
    case 'vfxShots': {
      const vfxDiff = changeValue - (baseline.vfxShots || 0);
      const costPerShot = 15000;
      impact.dollarImpact = vfxDiff * costPerShot;
      impact.description = `${vfxDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(vfxDiff)} VFX shot(s)`;
      impact.affectedCategories = ['post_production', 'vfx'];
      break;
    }
  }

  impact.percentImpact = (impact.dollarImpact / baseline.totalBudget) * 100;
  return impact;
}

/**
 * Calculate cascade effects
 */
function calculateCascadeEffects(baseline, changeType, changeValue) {
  const rule = CASCADE_RULES[changeType];
  if (!rule) return [];

  const cascades = [];
  const primaryImpact = calculateChangeImpact(baseline, changeType, changeValue);

  for (const affectedCategory of rule.affects) {
    const factor = COST_FACTORS[affectedCategory];
    if (!factor) continue;

    const secondaryMultiplier = 0.15 * rule.multiplier;
    const dollarImpact = primaryImpact.dollarImpact * secondaryMultiplier * (factor.percentOfBudget || 0.05);

    if (Math.abs(dollarImpact) > 1000) {
      cascades.push({
        category: affectedCategory,
        dollarImpact,
        percentImpact: (dollarImpact / baseline.totalBudget) * 100,
        description: `${changeType} change affects ${affectedCategory}`,
        type: 'cascade'
      });
    }
  }

  return cascades;
}

/**
 * Adjust line items for scenario (simplified version)
 */
function adjustLineItemsForScenario(lineItems, scenario) {
  // For now, return original line items
  // In full implementation, would adjust quantities, days, etc.
  return lineItems;
}

/**
 * Generate recommendations for scenario
 */
function generateScenarioRecommendations(results) {
  const recommendations = [];

  // If scenario passes compliance, recommend it
  if (results.complianceScore >= 90 && results.totalImpact < 0) {
    recommendations.push({
      priority: 'high',
      category: 'approved_scenario',
      title: 'Scenario Approved - Compliant and Cost-Saving',
      description: `This scenario saves $${Math.abs(results.totalImpact).toLocaleString()} and maintains ${results.complianceScore}% compliance`,
      action: 'This scenario can be safely applied'
    });
  }

  // If compliance issues, warn
  if (results.complianceIssues.filter(i => i.severity === 'high').length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'compliance_warning',
      title: 'Compliance Issues Detected',
      description: `This scenario introduces ${results.complianceIssues.length} compliance issues that must be resolved`,
      action: 'Review violations before applying this scenario'
    });
  }

  return recommendations;
}

/**
 * ======================================
 * UNIFIED BUDGET GUARDIAN - Main Entry Point
 * ======================================
 */

/**
 * Comprehensive budget analysis combining optimization, compliance, and tax incentives
 */
async function comprehensiveAnalysis(production, lineItems, pool) {
  guardianLogger.info('Running comprehensive budget analysis', {
    productionId: production.id
  });

  // 1. Compliance audit
  const complianceAudit = await auditBudget(production, lineItems, pool);

  // 2. Budget optimization (if over budget)
  let optimization = null;
  if (production.budget_target) {
    optimization = await analyzeBudgetOptimization(production, lineItems, pool);
  }

  // 3. Tax incentive analysis (already part of compliance audit)
  const taxIncentives = complianceAudit.taxIncentives;

  // 4. Combine into unified report
  return {
    production: {
      id: production.id,
      title: production.title,
      type: production.production_type,
      location: production.primary_location,
      shootDays: production.shoot_days
    },
    summary: {
      targetBudget: production.budget_target,
      actualBudget: optimization?.analysis?.actualBudget || lineItems.reduce((s, i) => s + parseFloat(i.current_total || 0), 0),
      difference: optimization?.analysis?.difference || 0,
      status: optimization?.analysis?.status || 'unknown',
      complianceScore: complianceAudit.complianceScore
    },
    compliance: {
      score: complianceAudit.complianceScore,
      violations: complianceAudit.violations,
      warnings: complianceAudit.warnings,
      summary: complianceAudit.summary
    },
    optimization: optimization,
    taxIncentives: taxIncentives,
    recommendations: [
      ...complianceAudit.recommendations,
      ...(optimization?.quickWins || []).map(qw => ({
        priority: 'high',
        category: qw.category,
        title: qw.strategy,
        description: qw.description,
        estimatedSavings: qw.estimatedSavings
      }))
    ].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, info: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    })
  };
}

module.exports = {
  // Original exports
  auditBudget,
  auditLineItem,
  checkRate,
  calculateTaxIncentives,
  getTaxIncentivePrograms,
  summarizeAudit,
  TAX_INCENTIVES,
  COMPLIANCE_RULES,

  // New unified exports
  analyzeBudgetOptimization,
  analyzeScenarioWithCompliance,
  comprehensiveAnalysis,
  CASCADE_RULES,
  COST_FACTORS
};
