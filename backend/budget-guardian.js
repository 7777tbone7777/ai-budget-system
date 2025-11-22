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

module.exports = {
  auditBudget,
  auditLineItem,
  checkRate,
  calculateTaxIncentives,
  getTaxIncentivePrograms,
  summarizeAudit,
  TAX_INCENTIVES,
  COMPLIANCE_RULES
};
