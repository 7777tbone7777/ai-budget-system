/**
 * AI Budget Generator
 * Parses natural language input and generates budgets automatically
 */

const { createLogger } = require('./logger');
const { validateBudget } = require('./budget-validator');
const aiLogger = createLogger('AI_GENERATOR');

// Location keywords and mappings
const LOCATION_KEYWORDS = {
  'atlanta': 'Atlanta',
  'atl': 'Atlanta',
  'los angeles': 'Los Angeles',
  'la': 'Los Angeles',
  'chicago': 'Chicago',
  'vancouver': 'Vancouver',
  'toronto': 'Toronto',
  'montreal': 'Montreal',
  'new orleans': 'New Orleans',
  'nola': 'New Orleans',
  'boston': 'Boston',
  'new york': 'New York',
  'nyc': 'New York',
  'ny': 'New York',
  'pittsburgh': 'Pittsburgh',
  'portland': 'Portland',
  'santa fe': 'Santa Fe',
  'charleston': 'Charleston',
  'wilmington': 'Wilmington'
};

// Production type keywords and mappings
const TYPE_KEYWORDS = {
  'one hour pilot': 'one_hour_pilot',
  'one-hour pilot': 'one_hour_pilot',
  '1 hour pilot': 'one_hour_pilot',
  'pilot': 'one_hour_pilot',
  'multi cam': 'multi_cam',
  'multi-cam': 'multi_cam',
  'multicam': 'multi_cam',
  'cable series': 'cable_series',
  'cable': 'cable_series',
  'pattern': 'pattern_budget',
  'pattern budget': 'pattern_budget',
  'amortization': 'amortization',
  'amort': 'amortization'
};

/**
 * Parse natural language input to extract budget parameters
 * @param {string} prompt - Natural language input
 * @returns {Object} Parsed parameters
 */
function parseNaturalLanguage(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const parsed = {
    location: null,
    production_type: null,
    budget: null,
    shoot_days: null,
    raw_prompt: prompt
  };

  aiLogger.debug('Parsing natural language', { prompt });

  // Extract location
  for (const [keyword, location] of Object.entries(LOCATION_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      parsed.location = location;
      aiLogger.debug('Found location', { keyword, location });
      break;
    }
  }

  // Extract production type
  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      parsed.production_type = type;
      aiLogger.debug('Found production type', { keyword, type });
      break;
    }
  }

  // Extract budget (look for $ amounts or "million")
  const budgetPatterns = [
    /\$\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/i,  // $8M, $8.5 million
    /\$\s*(\d+,?\d*,?\d*)/,                    // $8000000, $8,000,000
    /(\d+(?:\.\d+)?)\s*m(?:illion)?\s*(?:budget|dollars?)?/i  // 8M budget, 8 million
  ];

  for (const pattern of budgetPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));

      // If matched with 'M' or 'million', multiply by 1,000,000
      if (pattern.toString().includes('m(?:illion)?')) {
        amount = amount * 1000000;
      }

      parsed.budget = amount;
      aiLogger.debug('Found budget', { amount, pattern: pattern.toString() });
      break;
    }
  }

  // Extract shoot days
  const shootDaysPatterns = [
    /(\d+)\s*shoot\s*days?/i,
    /(\d+)\s*days?\s*shoot/i,
    /shoot\s*(\d+)\s*days?/i
  ];

  for (const pattern of shootDaysPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      parsed.shoot_days = parseInt(match[1], 10);
      aiLogger.debug('Found shoot days', { days: parsed.shoot_days });
      break;
    }
  }

  aiLogger.info('Natural language parsed', parsed);
  return parsed;
}

/**
 * Find best matching template based on parsed parameters
 * @param {Object} db - Database connection
 * @param {Object} params - Parsed parameters
 * @returns {Promise<Object>} Best matching template
 */
async function findBestTemplate(db, params) {
  aiLogger.info('Finding best template', params);

  let query = `
    SELECT
      id,
      name,
      location,
      production_type,
      total_budget,
      department_count,
      line_item_count,
      completeness_score,
      shoot_days
    FROM budget_templates
    WHERE is_active = true
  `;

  const queryParams = [];
  let paramIndex = 1;

  // Filter by location if provided
  if (params.location) {
    query += ` AND location ILIKE $${paramIndex}`;
    queryParams.push(`%${params.location}%`);
    paramIndex++;
  }

  // Filter by production type if provided
  if (params.production_type) {
    query += ` AND production_type = $${paramIndex}`;
    queryParams.push(params.production_type);
    paramIndex++;
  }

  // Order by multiple criteria
  query += `
    ORDER BY
      completeness_score DESC,
      CASE
        WHEN $${paramIndex}::NUMERIC IS NOT NULL THEN ABS(total_budget - $${paramIndex}::NUMERIC)
        ELSE 0
      END ASC,
      line_item_count DESC
    LIMIT 1
  `;
  queryParams.push(params.budget);

  aiLogger.debug('Template query', { query: query.substring(0, 200), params: queryParams });

  const result = await db.query(query, queryParams);

  if (result.rows.length === 0) {
    throw new Error('No matching templates found');
  }

  const template = result.rows[0];
  aiLogger.info('Best template found', {
    template_id: template.id,
    name: template.name,
    location: template.location,
    type: template.production_type,
    budget: template.total_budget
  });

  return template;
}

/**
 * Generate budget from natural language prompt
 * @param {Object} db - Database connection
 * @param {number} productionId - Production ID
 * @param {string} prompt - Natural language input
 * @returns {Promise<Object>} Generated budget details
 */
async function generateBudget(db, productionId, prompt) {
  const startTime = Date.now();

  aiLogger.info('Starting AI budget generation', {
    production_id: productionId,
    prompt
  });

  try {
    // Step 1: Parse natural language
    const params = parseNaturalLanguage(prompt);

    // Step 2: Find best matching template
    const template = await findBestTemplate(db, params);

    // Step 3: Get template data
    const templateDataResult = await db.query(
      'SELECT template_data FROM budget_templates WHERE id = $1',
      [template.id]
    );

    if (templateDataResult.rows.length === 0) {
      throw new Error('Template data not found');
    }

    const templateData = templateDataResult.rows[0].template_data;
    const departments = templateData.departments || [];

    // Step 4: Calculate scaling factor if budget was specified
    let scaleFactor = 1.0;
    if (params.budget && template.total_budget) {
      scaleFactor = params.budget / template.total_budget;
      aiLogger.info('Applying budget scaling', {
        target_budget: params.budget,
        template_budget: template.total_budget,
        scale_factor: scaleFactor
      });
    }

    // Step 5: Create budget groups and line items
    let groupsCreated = 0;
    let itemsCreated = 0;
    const generatedBudget = {
      production_id: productionId,
      groups: []
    };

    for (const dept of departments) {
      // Create budget group with unique name
      const uniqueGroupName = `${dept.name} (${groupsCreated + 1})`;
      const groupResult = await db.query(
        `INSERT INTO budget_groups (production_id, name, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [productionId, uniqueGroupName, groupsCreated]
      );

      const groupId = groupResult.rows[0].id;
      groupsCreated++;

      const groupData = {
        id: groupId,
        name: dept.name,
        line_items: []
      };

      // Create line items
      for (const item of dept.line_items || []) {
        const scaledRate = item.rate ? item.rate * scaleFactor : 0;
        const scaledSubtotal = item.subtotal ? item.subtotal * scaleFactor : 0;

        await db.query(
          `INSERT INTO budget_line_items (
            production_id,
            account_code,
            description,
            quantity,
            rate,
            subtotal,
            fringes,
            total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            productionId,
            item.account || '0000',
            item.description || item.position || 'Line Item',
            item.quantity || 0,
            scaledRate,
            scaledSubtotal,
            0,
            scaledSubtotal
          ]
        );

        groupData.line_items.push({
          description: item.description || item.position,
          quantity: item.quantity || 0,
          unit: item.unit,
          rate: scaledRate,
          subtotal: scaledSubtotal,
          total: scaledSubtotal
        });

        itemsCreated++;
      }

      generatedBudget.groups.push(groupData);
    }

    // Step 6: Validate the generated budget
    aiLogger.info('Validating generated budget');
    const validation = await validateBudget(db, generatedBudget, params);

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      parsed_params: params,
      template_used: {
        id: template.id,
        name: template.name,
        location: template.location,
        production_type: template.production_type,
        original_budget: template.total_budget
      },
      scale_factor: scaleFactor,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      execution_time_ms: executionTime,
      validation: {
        valid: validation.valid,
        score: validation.score,
        warnings: validation.warnings,
        errors: validation.errors
      }
    };

    aiLogger.info('AI budget generated successfully', result);

    return result;
  } catch (error) {
    aiLogger.error('AI budget generation failed', error, {
      production_id: productionId,
      prompt,
      execution_time_ms: Date.now() - startTime
    });
    throw error;
  }
}

module.exports = {
  parseNaturalLanguage,
  findBestTemplate,
  generateBudget
};
