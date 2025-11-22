/**
 * Smart Crew Builder - AI-Powered Crew Recommendation Engine
 * Generates optimal crew configurations based on production parameters
 */

const { createLogger } = require('./logger');
const crewLogger = createLogger('SMART_CREW');

// Production type configurations with typical crew ratios
const PRODUCTION_CONFIGS = {
  theatrical: {
    name: 'Theatrical Feature',
    typicalShootDays: 45,
    typicalBudget: 25000000,
    crewMultiplier: 1.0,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup', 'Costume', 'Locations', 'Transportation', 'Production']
  },
  hbsvod: {
    name: 'High Budget SVOD',
    typicalShootDays: 40,
    typicalBudget: 15000000,
    crewMultiplier: 0.95,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup', 'Costume', 'Locations', 'Transportation', 'Production']
  },
  television: {
    name: 'TV Series',
    typicalShootDays: 8,
    typicalBudget: 4000000,
    crewMultiplier: 0.85,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup', 'Costume', 'Production']
  },
  multi_cam: {
    name: 'Multi-Camera Sitcom',
    typicalShootDays: 5,
    typicalBudget: 2500000,
    crewMultiplier: 0.7,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup', 'Costume', 'Production']
  },
  commercial: {
    name: 'Commercial',
    typicalShootDays: 2,
    typicalBudget: 500000,
    crewMultiplier: 0.5,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup']
  },
  indie: {
    name: 'Independent Film',
    typicalShootDays: 25,
    typicalBudget: 2000000,
    crewMultiplier: 0.6,
    departments: ['Camera', 'Grip & Electric', 'Sound', 'Art Department', 'Hair & Makeup', 'Costume']
  }
};

// Department priority for budget constraints (higher = cut last)
const DEPARTMENT_PRIORITY = {
  'Camera': 10,
  'Sound': 10,
  'Grip & Electric': 9,
  'Art Department': 8,
  'Hair & Makeup': 7,
  'Costume': 7,
  'Locations': 6,
  'Transportation': 5,
  'Production': 4
};

// Position essentiality (required vs. optional based on production size)
const POSITION_ESSENTIALITY = {
  'Director of Photography': { essential: true, minBudget: 0 },
  'Camera Operator': { essential: false, minBudget: 5000000 },
  '1st Assistant Camera': { essential: true, minBudget: 0 },
  '2nd Assistant Camera': { essential: false, minBudget: 2000000 },
  'Digital Imaging Technician': { essential: false, minBudget: 3000000 },
  'Still Photographer': { essential: false, minBudget: 10000000 },
  'Gaffer': { essential: true, minBudget: 0 },
  'Best Boy Electric': { essential: true, minBudget: 500000 },
  'Set Electrician': { essential: false, minBudget: 1000000 },
  'Generator Operator': { essential: false, minBudget: 5000000 },
  'Key Grip': { essential: true, minBudget: 0 },
  'Best Boy Grip': { essential: true, minBudget: 500000 },
  'Dolly Grip': { essential: false, minBudget: 2000000 },
  'Company Grip': { essential: false, minBudget: 1000000 },
  'Production Sound Mixer': { essential: true, minBudget: 0 },
  'Boom Operator': { essential: true, minBudget: 100000 },
  'Sound Utility': { essential: false, minBudget: 3000000 },
  'Video Assist Operator': { essential: false, minBudget: 5000000 },
  'Production Designer': { essential: false, minBudget: 2000000 },
  'Art Director': { essential: false, minBudget: 5000000 },
  'Set Designer': { essential: false, minBudget: 8000000 },
  'Set Decorator': { essential: false, minBudget: 3000000 },
  'Leadperson': { essential: false, minBudget: 5000000 },
  'On-Set Dresser': { essential: false, minBudget: 3000000 },
  'Property Master': { essential: false, minBudget: 1000000 },
  'Assistant Property Master': { essential: false, minBudget: 5000000 },
  'Department Head Makeup': { essential: false, minBudget: 1000000 },
  'Key Makeup Artist': { essential: false, minBudget: 500000 },
  'Makeup Artist': { essential: false, minBudget: 5000000 },
  'Department Head Hair': { essential: false, minBudget: 1000000 },
  'Key Hair Stylist': { essential: false, minBudget: 500000 },
  'Hair Stylist': { essential: false, minBudget: 5000000 },
  'Costume Designer': { essential: false, minBudget: 1000000 },
  'Assistant Costume Designer': { essential: false, minBudget: 5000000 },
  'Costume Supervisor': { essential: false, minBudget: 3000000 },
  'Key Costumer': { essential: false, minBudget: 2000000 },
  'Set Costumer': { essential: false, minBudget: 5000000 },
  'Location Manager': { essential: false, minBudget: 1000000 },
  'Assistant Location Manager': { essential: false, minBudget: 3000000 },
  'Transportation Coordinator': { essential: false, minBudget: 3000000 },
  'Transportation Captain': { essential: false, minBudget: 5000000 }
};

/**
 * Parse production parameters from natural language
 */
function parseCrewRequest(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const params = {
    productionType: null,
    location: null,
    budget: null,
    shootDays: null,
    episodeCount: null,
    genre: null,
    priorities: []
  };

  // Extract production type
  const typePatterns = {
    'feature': 'theatrical',
    'theatrical': 'theatrical',
    'movie': 'theatrical',
    'film': 'theatrical',
    'hbsvod': 'hbsvod',
    'streaming': 'hbsvod',
    'netflix': 'hbsvod',
    'hbo': 'hbsvod',
    'tv series': 'television',
    'television': 'television',
    'episodic': 'television',
    'multi-cam': 'multi_cam',
    'sitcom': 'multi_cam',
    'commercial': 'commercial',
    'indie': 'indie',
    'independent': 'indie',
    'low budget': 'indie'
  };

  for (const [keyword, type] of Object.entries(typePatterns)) {
    if (lowerPrompt.includes(keyword)) {
      params.productionType = type;
      break;
    }
  }

  // Extract budget
  const budgetPatterns = [
    /\$\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/i,
    /\$\s*(\d+,?\d*,?\d*)/,
    /(\d+(?:\.\d+)?)\s*m(?:illion)?\s*(?:budget)?/i
  ];

  for (const pattern of budgetPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (pattern.toString().includes('m(?:illion)?') || amount < 1000) {
        amount = amount * 1000000;
      }
      params.budget = amount;
      break;
    }
  }

  // Extract shoot days
  const shootDaysMatch = lowerPrompt.match(/(\d+)\s*(?:shoot\s*)?days?/i);
  if (shootDaysMatch) {
    params.shootDays = parseInt(shootDaysMatch[1], 10);
  }

  // Extract episode count
  const episodeMatch = lowerPrompt.match(/(\d+)\s*episode/i);
  if (episodeMatch) {
    params.episodeCount = parseInt(episodeMatch[1], 10);
  }

  // Extract location
  const locationPatterns = ['los angeles', 'la', 'atlanta', 'new york', 'ny', 'vancouver', 'toronto', 'new orleans', 'georgia'];
  for (const loc of locationPatterns) {
    if (lowerPrompt.includes(loc)) {
      params.location = loc === 'la' ? 'Los Angeles' :
                        loc === 'ny' ? 'New York' :
                        loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  return params;
}

/**
 * Get crew templates from database matching production type
 */
async function getMatchingTemplates(db, productionType) {
  const result = await db.query(
    `SELECT id, name, description, category, production_type, crew_data
     FROM crew_templates
     WHERE production_type = $1 OR production_type = 'all'
     ORDER BY category`,
    [productionType]
  );
  return result.rows;
}

/**
 * Get rate card for a position
 */
async function getPositionRate(db, position, union, location, productionType) {
  // Try exact match first
  let result = await db.query(
    `SELECT base_rate, rate_type
     FROM rate_cards
     WHERE job_classification ILIKE $1
       AND union_local ILIKE $2
       AND (location = $3 OR location = 'National' OR location IS NULL)
       AND (production_type = $4 OR production_type IS NULL)
     ORDER BY
       CASE WHEN location = $3 THEN 0 ELSE 1 END,
       CASE WHEN production_type = $4 THEN 0 ELSE 1 END,
       effective_date DESC
     LIMIT 1`,
    [`%${position}%`, `%${union}%`, location || 'National', productionType]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Fallback: try without location/production type specificity
  result = await db.query(
    `SELECT base_rate, rate_type
     FROM rate_cards
     WHERE job_classification ILIKE $1
       AND union_local ILIKE $2
     ORDER BY effective_date DESC
     LIMIT 1`,
    [`%${position}%`, `%${union}%`]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Return default rate if not found
  return { base_rate: 2000, rate_type: 'weekly' };
}

/**
 * Calculate position cost with fringes
 */
function calculatePositionCost(rate, weeks, quantity, fringeRate = 0.32) {
  const baseCost = rate * weeks * quantity;
  const fringes = baseCost * fringeRate;
  return {
    baseCost,
    fringes,
    total: baseCost + fringes
  };
}

/**
 * Generate optimal crew recommendations
 */
async function recommendCrew(db, params) {
  const startTime = Date.now();

  crewLogger.info('Starting crew recommendation', params);

  try {
    const productionType = params.productionType || 'theatrical';
    const budget = params.budget || PRODUCTION_CONFIGS[productionType]?.typicalBudget || 10000000;
    const shootDays = params.shootDays || PRODUCTION_CONFIGS[productionType]?.typicalShootDays || 30;
    const location = params.location || 'Los Angeles';

    // Get crew templates
    const templates = await getMatchingTemplates(db, productionType);
    crewLogger.debug('Found templates', { count: templates.length });

    // Build crew recommendations
    const recommendations = {
      productionType,
      productionTypeName: PRODUCTION_CONFIGS[productionType]?.name || productionType,
      budget,
      shootDays,
      location,
      departments: [],
      summary: {
        totalPositions: 0,
        totalCrew: 0,
        estimatedLaborCost: 0,
        estimatedFringes: 0,
        estimatedTotal: 0,
        budgetPercentage: 0
      },
      optimizations: [],
      warnings: []
    };

    // Calculate shoot weeks (round up)
    const shootWeeks = Math.ceil(shootDays / 5);

    // Process each template
    for (const template of templates) {
      const crewData = template.crew_data || [];
      const departmentCrew = [];
      let departmentTotal = 0;

      for (const position of crewData) {
        // Check if position is appropriate for budget level
        const essentiality = POSITION_ESSENTIALITY[position.position] || { essential: false, minBudget: 0 };
        const includePosition = essentiality.essential || budget >= essentiality.minBudget;

        if (!includePosition) {
          continue;
        }

        // Get rate from database
        const rateInfo = await getPositionRate(db, position.position, position.union, location, productionType);
        const weeklyRate = rateInfo.rate_type === 'daily' ? rateInfo.base_rate * 5 : rateInfo.base_rate;

        // Calculate weeks based on template and production config
        const configMultiplier = PRODUCTION_CONFIGS[productionType]?.crewMultiplier || 1.0;
        const adjustedWeeks = Math.ceil(position.weeks * (shootWeeks / 10) * configMultiplier);

        // Adjust quantity based on budget
        let adjustedQuantity = position.quantity;
        if (budget < 5000000 && position.quantity > 1 && !essentiality.essential) {
          adjustedQuantity = Math.max(1, Math.floor(position.quantity * 0.5));
        }

        const costs = calculatePositionCost(weeklyRate, adjustedWeeks, adjustedQuantity);

        departmentCrew.push({
          position: position.position,
          union: position.union,
          quantity: adjustedQuantity,
          originalQuantity: position.quantity,
          weeks: adjustedWeeks,
          originalWeeks: position.weeks,
          weeklyRate,
          rateType: rateInfo.rate_type,
          baseCost: costs.baseCost,
          fringes: costs.fringes,
          total: costs.total,
          essential: essentiality.essential,
          source: 'template'
        });

        departmentTotal += costs.total;
        recommendations.summary.totalPositions++;
        recommendations.summary.totalCrew += adjustedQuantity;
      }

      if (departmentCrew.length > 0) {
        recommendations.departments.push({
          name: template.category,
          templateName: template.name,
          positions: departmentCrew,
          subtotal: departmentTotal,
          priority: DEPARTMENT_PRIORITY[template.category] || 5
        });

        recommendations.summary.estimatedLaborCost += departmentCrew.reduce((sum, p) => sum + p.baseCost, 0);
        recommendations.summary.estimatedFringes += departmentCrew.reduce((sum, p) => sum + p.fringes, 0);
        recommendations.summary.estimatedTotal += departmentTotal;
      }
    }

    // Sort departments by priority
    recommendations.departments.sort((a, b) => b.priority - a.priority);

    // Calculate budget percentage
    recommendations.summary.budgetPercentage = (recommendations.summary.estimatedTotal / budget * 100).toFixed(1);

    // Generate optimization suggestions
    if (recommendations.summary.estimatedTotal > budget * 0.5) {
      recommendations.optimizations.push({
        type: 'high_labor_cost',
        message: `Labor costs (${recommendations.summary.budgetPercentage}% of budget) are higher than typical. Consider reducing crew in non-essential positions.`,
        potentialSavings: null
      });
    }

    // Add department-specific suggestions
    for (const dept of recommendations.departments) {
      const nonEssential = dept.positions.filter(p => !p.essential);
      if (nonEssential.length > 3) {
        const savingsIfReduced = nonEssential
          .slice(Math.floor(nonEssential.length / 2))
          .reduce((sum, p) => sum + p.total, 0);

        recommendations.optimizations.push({
          type: 'reduce_department',
          department: dept.name,
          message: `${dept.name} has ${nonEssential.length} non-essential positions. Consider reducing by ${Math.floor(nonEssential.length / 2)} positions.`,
          potentialSavings: savingsIfReduced
        });
      }
    }

    // Add warnings
    if (recommendations.summary.totalCrew < 15 && budget > 5000000) {
      recommendations.warnings.push({
        type: 'understaffed',
        message: 'Crew size may be too small for this budget level. Consider adding positions in Camera and G&E.'
      });
    }

    if (!recommendations.departments.find(d => d.name === 'Sound')) {
      recommendations.warnings.push({
        type: 'missing_department',
        message: 'No Sound department found. Production Sound Mixer is essential for any production.'
      });
    }

    const executionTime = Date.now() - startTime;

    crewLogger.info('Crew recommendation complete', {
      totalPositions: recommendations.summary.totalPositions,
      totalCrew: recommendations.summary.totalCrew,
      estimatedTotal: recommendations.summary.estimatedTotal,
      executionTime
    });

    return {
      success: true,
      recommendations,
      executionTime
    };

  } catch (error) {
    crewLogger.error('Crew recommendation failed', error);
    throw error;
  }
}

/**
 * Optimize existing crew for budget constraints
 */
async function optimizeCrew(db, currentCrew, targetBudget, priorities = []) {
  crewLogger.info('Starting crew optimization', {
    currentPositions: currentCrew.length,
    targetBudget
  });

  const optimizedCrew = [];
  let totalSavings = 0;
  const changes = [];

  // Calculate current total
  const currentTotal = currentCrew.reduce((sum, p) => sum + (p.total || 0), 0);
  const requiredSavings = currentTotal - targetBudget;

  if (requiredSavings <= 0) {
    return {
      success: true,
      message: 'Current crew is within budget',
      optimizedCrew: currentCrew,
      changes: [],
      savings: 0
    };
  }

  // Sort crew by essentiality and priority
  const sortedCrew = [...currentCrew].sort((a, b) => {
    const aEssential = POSITION_ESSENTIALITY[a.position]?.essential ? 1 : 0;
    const bEssential = POSITION_ESSENTIALITY[b.position]?.essential ? 1 : 0;
    if (aEssential !== bEssential) return bEssential - aEssential;

    const aPriority = DEPARTMENT_PRIORITY[a.department] || 5;
    const bPriority = DEPARTMENT_PRIORITY[b.department] || 5;
    return bPriority - aPriority;
  });

  // Process from lowest priority to highest
  for (let i = sortedCrew.length - 1; i >= 0 && totalSavings < requiredSavings; i--) {
    const position = sortedCrew[i];
    const essentiality = POSITION_ESSENTIALITY[position.position] || { essential: false };

    if (essentiality.essential) {
      // Keep essential positions but maybe reduce weeks
      if (position.weeks > 4) {
        const reducedWeeks = Math.ceil(position.weeks * 0.8);
        const savings = (position.weeks - reducedWeeks) * position.weeklyRate * position.quantity * 1.32;

        if (totalSavings + savings <= requiredSavings * 1.1) {
          changes.push({
            type: 'reduce_weeks',
            position: position.position,
            from: position.weeks,
            to: reducedWeeks,
            savings
          });
          totalSavings += savings;
          optimizedCrew.push({ ...position, weeks: reducedWeeks });
        } else {
          optimizedCrew.push(position);
        }
      } else {
        optimizedCrew.push(position);
      }
    } else if (position.quantity > 1) {
      // Reduce quantity for non-essential positions
      const reducedQuantity = Math.max(1, position.quantity - 1);
      const savings = (position.quantity - reducedQuantity) * position.weeks * position.weeklyRate * 1.32;

      changes.push({
        type: 'reduce_quantity',
        position: position.position,
        from: position.quantity,
        to: reducedQuantity,
        savings
      });
      totalSavings += savings;
      optimizedCrew.push({ ...position, quantity: reducedQuantity });
    } else if (totalSavings < requiredSavings) {
      // Remove non-essential single positions
      changes.push({
        type: 'remove',
        position: position.position,
        savings: position.total
      });
      totalSavings += position.total;
      // Don't add to optimizedCrew (removed)
    } else {
      optimizedCrew.push(position);
    }
  }

  return {
    success: true,
    optimizedCrew,
    changes,
    savings: totalSavings,
    newTotal: currentTotal - totalSavings,
    withinBudget: (currentTotal - totalSavings) <= targetBudget
  };
}

module.exports = {
  parseCrewRequest,
  recommendCrew,
  optimizeCrew,
  PRODUCTION_CONFIGS,
  DEPARTMENT_PRIORITY,
  POSITION_ESSENTIALITY
};
