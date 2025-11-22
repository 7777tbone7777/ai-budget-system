/**
 * What-If Analyzer - Predictive Variance and Scenario Modeling
 * Enables budget impact analysis and scenario comparison
 */

const { createLogger } = require('./logger');
const whatIfLogger = createLogger('WHAT_IF');

// Budget category relationships - how changes cascade
const CASCADE_RULES = {
  shootDays: {
    affects: ['labor', 'equipment', 'locations', 'catering', 'transportation'],
    multiplier: 1.0, // 1 additional day = 1x daily rate increase
    description: 'Shoot days directly affect all daily-rated costs'
  },
  crewSize: {
    affects: ['labor', 'catering', 'transportation', 'wardrobe'],
    multiplier: 0.8, // Additional crew has diminishing returns on some costs
    description: 'Crew size affects labor and support costs'
  },
  locations: {
    affects: ['transportation', 'catering', 'equipment', 'permits'],
    multiplier: 1.2, // Multiple locations add complexity overhead
    description: 'Additional locations increase logistics costs'
  },
  cast: {
    affects: ['labor', 'wardrobe', 'hair_makeup', 'transportation', 'catering'],
    multiplier: 1.0,
    description: 'Cast changes affect talent and support costs'
  },
  stunts: {
    affects: ['labor', 'equipment', 'insurance', 'medical'],
    multiplier: 1.5, // Stunts have high overhead
    description: 'Stunt work adds specialized equipment and safety costs'
  },
  vfx: {
    affects: ['post_production', 'equipment'],
    multiplier: 1.0,
    description: 'VFX changes affect post-production budget'
  }
};

// Budget category typical percentages (for theatrical feature)
const BUDGET_PERCENTAGES = {
  theatrical: {
    above_the_line: 0.30,
    production: 0.45,
    post_production: 0.15,
    other: 0.10
  },
  hbsvod: {
    above_the_line: 0.28,
    production: 0.47,
    post_production: 0.15,
    other: 0.10
  },
  television: {
    above_the_line: 0.35,
    production: 0.40,
    post_production: 0.15,
    other: 0.10
  },
  indie: {
    above_the_line: 0.20,
    production: 0.55,
    post_production: 0.15,
    other: 0.10
  }
};

// Production cost factors by category
const COST_FACTORS = {
  labor: {
    dailyRate: true,
    percentOfBudget: 0.35,
    varianceRange: { min: 0.85, max: 1.25 }
  },
  equipment: {
    dailyRate: true,
    percentOfBudget: 0.08,
    varianceRange: { min: 0.90, max: 1.15 }
  },
  locations: {
    perLocation: true,
    percentOfBudget: 0.05,
    varianceRange: { min: 0.80, max: 1.40 }
  },
  transportation: {
    dailyRate: true,
    percentOfBudget: 0.04,
    varianceRange: { min: 0.90, max: 1.20 }
  },
  catering: {
    perPerson: true,
    dailyRate: true,
    percentOfBudget: 0.02,
    varianceRange: { min: 0.95, max: 1.10 }
  },
  wardrobe: {
    perPerson: true,
    percentOfBudget: 0.03,
    varianceRange: { min: 0.85, max: 1.30 }
  },
  post_production: {
    fixed: true,
    percentOfBudget: 0.15,
    varianceRange: { min: 0.90, max: 1.50 }
  },
  insurance: {
    percentOfTotal: 0.02,
    varianceRange: { min: 0.95, max: 1.20 }
  }
};

// Historical variance data by production type
const HISTORICAL_VARIANCE = {
  theatrical: {
    averageOverrun: 0.12, // 12% average overrun
    stdDeviation: 0.08,
    commonOverruns: ['weather delays', 'reshoots', 'VFX scope creep', 'talent schedule changes']
  },
  hbsvod: {
    averageOverrun: 0.08,
    stdDeviation: 0.06,
    commonOverruns: ['schedule compression', 'last-minute rewrites', 'platform notes']
  },
  television: {
    averageOverrun: 0.05,
    stdDeviation: 0.04,
    commonOverruns: ['episode overages', 'recurring cast availability']
  },
  indie: {
    averageOverrun: 0.15,
    stdDeviation: 0.12,
    commonOverruns: ['underfunded contingency', 'equipment failures', 'weather']
  }
};

/**
 * Analyze a what-if scenario against baseline budget
 */
function analyzeScenario(baseline, scenario, pool) {
  whatIfLogger.info('Analyzing scenario', {
    baselineBudget: baseline.totalBudget,
    scenarioChanges: Object.keys(scenario.changes)
  });

  const changes = scenario.changes || {};
  const results = {
    scenarioName: scenario.name || 'Unnamed Scenario',
    baseline: { ...baseline },
    impacts: [],
    cascadeEffects: [],
    totalImpact: 0,
    newTotal: baseline.totalBudget,
    percentChange: 0,
    riskFactors: [],
    recommendations: []
  };

  // Process each change
  for (const [changeType, changeValue] of Object.entries(changes)) {
    const impact = calculateChangeImpact(baseline, changeType, changeValue, pool);
    results.impacts.push(impact);
    results.totalImpact += impact.dollarImpact;

    // Calculate cascade effects
    if (CASCADE_RULES[changeType]) {
      const cascades = calculateCascadeEffects(baseline, changeType, changeValue);
      results.cascadeEffects.push(...cascades);
      cascades.forEach(c => results.totalImpact += c.dollarImpact);
    }
  }

  // Calculate new totals
  results.newTotal = baseline.totalBudget + results.totalImpact;
  results.percentChange = (results.totalImpact / baseline.totalBudget) * 100;

  // Add risk assessment
  results.riskFactors = assessRisks(baseline, scenario, results);

  // Generate recommendations
  results.recommendations = generateRecommendations(baseline, scenario, results);

  return results;
}

/**
 * Calculate impact of a single change
 */
function calculateChangeImpact(baseline, changeType, changeValue, pool) {
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
      const daysDiff = changeValue - (baseline.shootDays || 30);
      const dailyCost = baseline.totalBudget * 0.02; // ~2% of budget per shoot day
      impact.dollarImpact = daysDiff * dailyCost;
      impact.description = `${daysDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(daysDiff)} shoot day(s)`;
      impact.affectedCategories = ['labor', 'equipment', 'locations', 'catering'];
      break;
    }

    case 'crewSize': {
      const crewDiff = changeValue - (baseline.crewSize || 50);
      const costPerCrew = baseline.totalBudget * 0.004; // ~0.4% per crew member
      impact.dollarImpact = crewDiff * costPerCrew * (baseline.shootDays || 30);
      impact.description = `${crewDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(crewDiff)} crew member(s)`;
      impact.affectedCategories = ['labor', 'catering', 'transportation'];
      break;
    }

    case 'locations': {
      const locationsDiff = changeValue - (baseline.locations || 5);
      const costPerLocation = baseline.totalBudget * 0.01; // ~1% per major location
      impact.dollarImpact = locationsDiff * costPerLocation;
      impact.description = `${locationsDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(locationsDiff)} location(s)`;
      impact.affectedCategories = ['locations', 'transportation', 'permits'];
      break;
    }

    case 'cast': {
      const castDiff = changeValue - (baseline.principalCast || 5);
      const costPerCast = baseline.totalBudget * 0.02; // ~2% per principal
      impact.dollarImpact = castDiff * costPerCast;
      impact.description = `${castDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(castDiff)} principal cast member(s)`;
      impact.affectedCategories = ['talent', 'wardrobe', 'hair_makeup', 'transportation'];
      break;
    }

    case 'stunts': {
      const stuntsDiff = changeValue - (baseline.stuntDays || 0);
      const costPerStuntDay = baseline.totalBudget * 0.015; // ~1.5% per stunt day
      impact.dollarImpact = stuntsDiff * costPerStuntDay;
      impact.description = `${stuntsDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(stuntsDiff)} stunt day(s)`;
      impact.affectedCategories = ['stunts', 'equipment', 'insurance', 'medical'];
      break;
    }

    case 'vfxShots': {
      const vfxDiff = changeValue - (baseline.vfxShots || 0);
      const costPerShot = 15000; // Average VFX shot cost
      impact.dollarImpact = vfxDiff * costPerShot;
      impact.description = `${vfxDiff > 0 ? 'Adding' : 'Removing'} ${Math.abs(vfxDiff)} VFX shot(s)`;
      impact.affectedCategories = ['post_production', 'vfx'];
      break;
    }

    case 'overtime': {
      const overtimeHours = changeValue;
      const avgHourlyRate = 75; // Average crew hourly rate
      const overtimeCrew = baseline.crewSize || 50;
      impact.dollarImpact = overtimeHours * avgHourlyRate * 1.5 * overtimeCrew * (baseline.shootDays || 30);
      impact.description = `Adding ${overtimeHours} hour(s) overtime per day`;
      impact.affectedCategories = ['labor'];
      break;
    }

    case 'contingency': {
      const contingencyDiff = changeValue - (baseline.contingency || 0.10);
      impact.dollarImpact = contingencyDiff * baseline.totalBudget;
      impact.description = `Adjusting contingency to ${(changeValue * 100).toFixed(1)}%`;
      impact.affectedCategories = ['contingency'];
      break;
    }

    default:
      impact.description = `Unknown change type: ${changeType}`;
  }

  impact.percentImpact = (impact.dollarImpact / baseline.totalBudget) * 100;
  return impact;
}

/**
 * Calculate cascade effects of a change
 */
function calculateCascadeEffects(baseline, changeType, changeValue) {
  const rule = CASCADE_RULES[changeType];
  if (!rule) return [];

  const cascades = [];
  const primaryImpact = calculateChangeImpact(baseline, changeType, changeValue);

  for (const affectedCategory of rule.affects) {
    const factor = COST_FACTORS[affectedCategory];
    if (!factor) continue;

    // Secondary effect is a fraction of primary
    const secondaryMultiplier = 0.15 * rule.multiplier;
    const dollarImpact = primaryImpact.dollarImpact * secondaryMultiplier * (factor.percentOfBudget || 0.05);

    if (Math.abs(dollarImpact) > 1000) { // Only show significant cascades
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
 * Assess risks based on scenario changes
 */
function assessRisks(baseline, scenario, results) {
  const risks = [];
  const productionType = baseline.productionType || 'theatrical';
  const variance = HISTORICAL_VARIANCE[productionType] || HISTORICAL_VARIANCE.theatrical;

  // Budget overrun risk
  if (results.percentChange > 10) {
    risks.push({
      level: 'high',
      category: 'budget',
      description: `${results.percentChange.toFixed(1)}% increase exceeds typical variance`,
      mitigation: 'Review scope and identify cost savings opportunities'
    });
  } else if (results.percentChange > 5) {
    risks.push({
      level: 'medium',
      category: 'budget',
      description: `${results.percentChange.toFixed(1)}% increase approaching budget threshold`,
      mitigation: 'Monitor closely and prepare contingency plans'
    });
  }

  // Schedule risk
  const dayChange = scenario.changes?.shootDays;
  if (dayChange && dayChange > (baseline.shootDays || 30) * 1.2) {
    risks.push({
      level: 'high',
      category: 'schedule',
      description: 'Significant schedule extension may affect availability',
      mitigation: 'Confirm crew and cast availability, check location holds'
    });
  }

  // Crew capacity risk
  const crewChange = scenario.changes?.crewSize;
  if (crewChange && crewChange > (baseline.crewSize || 50) * 1.3) {
    risks.push({
      level: 'medium',
      category: 'resources',
      description: 'Large crew increase may strain local availability',
      mitigation: 'Consider travel crew or phased hiring'
    });
  }

  // VFX scope risk
  const vfxChange = scenario.changes?.vfxShots;
  if (vfxChange && vfxChange > 100) {
    risks.push({
      level: 'high',
      category: 'post_production',
      description: 'High VFX shot count requires careful vendor management',
      mitigation: 'Lock VFX breakdown early, consider multiple vendors'
    });
  }

  // Historical variance warning
  risks.push({
    level: 'info',
    category: 'historical',
    description: `${productionType} productions typically see ${(variance.averageOverrun * 100).toFixed(0)}% overrun`,
    mitigation: `Common causes: ${variance.commonOverruns.slice(0, 2).join(', ')}`
  });

  return risks;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(baseline, scenario, results) {
  const recommendations = [];

  // Cost saving recommendations
  if (results.percentChange > 5) {
    recommendations.push({
      type: 'cost_saving',
      priority: 'high',
      title: 'Consider Overtime Management',
      description: 'Strict 10-hour day enforcement could save 8-12% on labor',
      potentialSavings: baseline.totalBudget * 0.03
    });

    recommendations.push({
      type: 'cost_saving',
      priority: 'medium',
      title: 'Consolidate Locations',
      description: 'Reducing company moves saves transportation and time',
      potentialSavings: baseline.totalBudget * 0.02
    });
  }

  // Schedule recommendations
  if (scenario.changes?.shootDays > baseline.shootDays) {
    recommendations.push({
      type: 'schedule',
      priority: 'medium',
      title: 'Review Scene Efficiency',
      description: 'Second unit or splinter unit could reduce main unit days',
      potentialSavings: baseline.totalBudget * 0.05
    });
  }

  // Crew recommendations
  if (scenario.changes?.crewSize > baseline.crewSize) {
    recommendations.push({
      type: 'crew',
      priority: 'low',
      title: 'Day-Play vs Weekly Hires',
      description: 'Analyze which positions need full run vs day-play',
      potentialSavings: baseline.totalBudget * 0.01
    });
  }

  // Union recommendations
  recommendations.push({
    type: 'compliance',
    priority: 'info',
    title: 'Verify Rate Cards',
    description: 'Ensure all new positions use current union minimums',
    potentialSavings: 0
  });

  return recommendations;
}

/**
 * Compare multiple scenarios side by side
 */
function compareScenarios(baseline, scenarios, pool) {
  whatIfLogger.info('Comparing scenarios', { count: scenarios.length });

  const comparison = {
    baseline,
    scenarios: [],
    summary: {
      lowestCost: null,
      highestCost: null,
      lowestRisk: null,
      recommended: null
    }
  };

  // Analyze each scenario
  for (const scenario of scenarios) {
    const analysis = analyzeScenario(baseline, scenario, pool);
    comparison.scenarios.push({
      name: scenario.name,
      analysis,
      changes: scenario.changes
    });
  }

  // Determine summary metrics
  const sortedByCost = [...comparison.scenarios].sort(
    (a, b) => a.analysis.newTotal - b.analysis.newTotal
  );
  comparison.summary.lowestCost = sortedByCost[0]?.name;
  comparison.summary.highestCost = sortedByCost[sortedByCost.length - 1]?.name;

  // Lowest risk = fewest high/medium risks
  const sortedByRisk = [...comparison.scenarios].sort((a, b) => {
    const aRisks = a.analysis.riskFactors.filter(r => r.level !== 'info').length;
    const bRisks = b.analysis.riskFactors.filter(r => r.level !== 'info').length;
    return aRisks - bRisks;
  });
  comparison.summary.lowestRisk = sortedByRisk[0]?.name;

  // Recommended = best balance of cost and risk
  const scored = comparison.scenarios.map(s => {
    const costScore = s.analysis.percentChange; // Lower is better
    const riskScore = s.analysis.riskFactors.filter(r => r.level === 'high').length * 10 +
                      s.analysis.riskFactors.filter(r => r.level === 'medium').length * 5;
    return { name: s.name, score: costScore + riskScore };
  });
  scored.sort((a, b) => a.score - b.score);
  comparison.summary.recommended = scored[0]?.name;

  return comparison;
}

/**
 * Predict budget variance based on production type and parameters
 */
function predictVariance(baseline, pool) {
  whatIfLogger.info('Predicting variance', { productionType: baseline.productionType });

  const productionType = baseline.productionType || 'theatrical';
  const variance = HISTORICAL_VARIANCE[productionType] || HISTORICAL_VARIANCE.theatrical;

  // Base prediction
  const prediction = {
    expectedVariance: variance.averageOverrun,
    varianceRange: {
      optimistic: baseline.totalBudget * (1 - variance.stdDeviation),
      expected: baseline.totalBudget * (1 + variance.averageOverrun),
      pessimistic: baseline.totalBudget * (1 + variance.averageOverrun + variance.stdDeviation * 2)
    },
    confidenceLevel: 0.70,
    factors: [],
    recommendations: []
  };

  // Adjust based on project parameters
  const shootDays = baseline.shootDays || 30;

  // Longer shoots have more variance
  if (shootDays > 50) {
    prediction.expectedVariance += 0.05;
    prediction.factors.push({
      factor: 'Extended Schedule',
      impact: '+5%',
      description: 'Shoots over 50 days have higher variance'
    });
  }

  // More locations = more variance
  const locations = baseline.locations || 5;
  if (locations > 15) {
    prediction.expectedVariance += 0.03;
    prediction.factors.push({
      factor: 'Many Locations',
      impact: '+3%',
      description: 'Productions with 15+ locations face logistics challenges'
    });
  }

  // VFX heavy = post variance
  const vfxShots = baseline.vfxShots || 0;
  if (vfxShots > 200) {
    prediction.expectedVariance += 0.08;
    prediction.factors.push({
      factor: 'VFX Heavy',
      impact: '+8%',
      description: 'High VFX count often leads to scope changes in post'
    });
  }

  // Contingency adequacy
  const contingency = baseline.contingency || 0.10;
  if (contingency < 0.10) {
    prediction.factors.push({
      factor: 'Low Contingency',
      impact: 'High Risk',
      description: `${(contingency * 100).toFixed(0)}% contingency is below recommended 10%`
    });
    prediction.confidenceLevel -= 0.10;
  }

  // Recalculate ranges with adjusted variance
  prediction.varianceRange = {
    optimistic: baseline.totalBudget * (1 - variance.stdDeviation * 0.5),
    expected: baseline.totalBudget * (1 + prediction.expectedVariance),
    pessimistic: baseline.totalBudget * (1 + prediction.expectedVariance + variance.stdDeviation * 2)
  };

  // Add recommendations
  prediction.recommendations.push({
    title: 'Recommended Contingency',
    value: `${((prediction.expectedVariance + 0.05) * 100).toFixed(0)}%`,
    description: `Based on historical data and project parameters`
  });

  prediction.recommendations.push({
    title: 'Key Monitoring Areas',
    value: variance.commonOverruns.slice(0, 3).join(', '),
    description: 'Most common sources of overruns for this production type'
  });

  return prediction;
}

/**
 * Generate natural language summary of scenario
 */
function summarizeScenario(analysis) {
  const { scenarioName, baseline, impacts, totalImpact, percentChange, riskFactors } = analysis;

  let summary = `**${scenarioName}**\n\n`;

  // Budget impact
  const direction = totalImpact >= 0 ? 'increase' : 'decrease';
  summary += `This scenario would ${direction} the budget by $${Math.abs(totalImpact).toLocaleString()} `;
  summary += `(${Math.abs(percentChange).toFixed(1)}%), `;
  summary += `bringing the total to $${analysis.newTotal.toLocaleString()}.\n\n`;

  // Key changes
  if (impacts.length > 0) {
    summary += '**Key Changes:**\n';
    impacts.forEach(impact => {
      const sign = impact.dollarImpact >= 0 ? '+' : '';
      summary += `- ${impact.description}: ${sign}$${impact.dollarImpact.toLocaleString()}\n`;
    });
    summary += '\n';
  }

  // Risks
  const highRisks = riskFactors.filter(r => r.level === 'high');
  if (highRisks.length > 0) {
    summary += '**Risks to Consider:**\n';
    highRisks.forEach(risk => {
      summary += `- ${risk.description}\n`;
    });
  }

  return summary;
}

/**
 * Parse natural language scenario request
 */
function parseScenarioRequest(request) {
  whatIfLogger.info('Parsing scenario request', { request });

  const scenario = {
    name: 'Custom Scenario',
    changes: {}
  };

  const lowerRequest = request.toLowerCase();

  // Parse shoot days
  const daysMatch = lowerRequest.match(/(\d+)\s*(more|extra|additional|fewer|less)\s*(shoot\s*)?days?/);
  const daysMatch2 = lowerRequest.match(/(add|remove|cut)\s*(\d+)\s*days?/);
  const daysMatch3 = lowerRequest.match(/(\d+)\s*day\s*(shoot|schedule)/);

  if (daysMatch) {
    const num = parseInt(daysMatch[1]);
    const modifier = daysMatch[2];
    scenario.changes.shootDays = modifier.includes('more') || modifier.includes('extra') || modifier.includes('additional')
      ? num : -num;
    scenario.name = `${Math.abs(num)} ${scenario.changes.shootDays > 0 ? 'more' : 'fewer'} shoot days`;
  } else if (daysMatch2) {
    const action = daysMatch2[1];
    const num = parseInt(daysMatch2[2]);
    scenario.changes.shootDays = action === 'add' ? num : -num;
    scenario.name = `${action} ${num} days`;
  } else if (daysMatch3) {
    scenario.changes.shootDays = parseInt(daysMatch3[1]);
    scenario.name = `${scenario.changes.shootDays} day shoot`;
  }

  // Parse crew changes
  const crewMatch = lowerRequest.match(/(\d+)\s*(more|extra|additional|fewer|less)\s*crew/);
  if (crewMatch) {
    const num = parseInt(crewMatch[1]);
    const modifier = crewMatch[2];
    scenario.changes.crewSize = modifier.includes('more') || modifier.includes('extra') ? num : -num;
  }

  // Parse location changes
  const locationMatch = lowerRequest.match(/(\d+)\s*(more|extra|additional|fewer|less)\s*location/);
  if (locationMatch) {
    const num = parseInt(locationMatch[1]);
    const modifier = locationMatch[2];
    scenario.changes.locations = modifier.includes('more') || modifier.includes('extra') ? num : -num;
  }

  // Parse VFX
  const vfxMatch = lowerRequest.match(/(\d+)\s*(more|extra|additional|fewer|less)?\s*vfx\s*(shots?)?/);
  if (vfxMatch) {
    const num = parseInt(vfxMatch[1]);
    const modifier = vfxMatch[2] || 'more';
    scenario.changes.vfxShots = modifier.includes('more') || modifier.includes('extra') ? num : -num;
  }

  // Parse overtime
  const otMatch = lowerRequest.match(/(\d+)\s*(hours?\s*)?(of\s*)?overtime/);
  if (otMatch) {
    scenario.changes.overtime = parseInt(otMatch[1]);
  }

  // Parse percentage budget changes
  const percentMatch = lowerRequest.match(/(increase|decrease|reduce|cut)\s*(the\s*)?budget\s*(by\s*)?(\d+)\s*%/);
  if (percentMatch) {
    const action = percentMatch[1];
    const percent = parseInt(percentMatch[4]) / 100;
    scenario.changes.budgetMultiplier = action === 'increase' ? (1 + percent) : (1 - percent);
    scenario.name = `${action} budget by ${percentMatch[4]}%`;
  }

  // Parse stunt days
  const stuntMatch = lowerRequest.match(/(\d+)\s*(stunt\s*)days?/);
  if (stuntMatch) {
    scenario.changes.stunts = parseInt(stuntMatch[1]);
  }

  return scenario;
}

module.exports = {
  analyzeScenario,
  compareScenarios,
  predictVariance,
  summarizeScenario,
  parseScenarioRequest,
  CASCADE_RULES,
  HISTORICAL_VARIANCE,
  COST_FACTORS
};
