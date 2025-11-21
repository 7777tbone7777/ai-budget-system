/**
 * Comprehensive System Test
 * Tests all components of the AI Budget System
 */

const { Pool } = require('pg');
const { parseNaturalLanguage, findBestTemplate, generateBudget } = require('./ai-budget-generator');
const { validateBudget } = require('./budget-validator');

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function section(title) {
  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + title + colors.reset);
  console.log(colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

function warn(message) {
  log(colors.yellow, '⚠', message);
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '', details = null) {
  if (passed) {
    results.passed++;
    success(`${name}: ${message}`);
  } else {
    results.failed++;
    error(`${name}: ${message}`);
  }

  results.tests.push({ name, passed, message, details });
}

async function test1_DatabaseConnection() {
  section('TEST 1: Database Connection');

  try {
    const result = await db.query('SELECT NOW()');
    recordTest('DB Connection', true, `Connected successfully at ${result.rows[0].now}`);

    // Check database version
    const versionResult = await db.query('SELECT version()');
    info(`PostgreSQL version: ${versionResult.rows[0].version.split(',')[0]}`);

    return true;
  } catch (err) {
    recordTest('DB Connection', false, err.message);
    return false;
  }
}

async function test2_TemplateDatabase() {
  section('TEST 2: Template Database');

  try {
    // Check if budget_templates table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'budget_templates'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      recordTest('Template Table', false, 'budget_templates table does not exist');
      return false;
    }
    recordTest('Template Table', true, 'Table exists');

    // Count templates
    const countResult = await db.query('SELECT COUNT(*) as count FROM budget_templates WHERE is_active = true');
    const templateCount = parseInt(countResult.rows[0].count);

    if (templateCount === 0) {
      recordTest('Template Count', false, 'No templates found');
      return false;
    }
    recordTest('Template Count', true, `Found ${templateCount} active templates`);

    // Check template quality
    const qualityResult = await db.query(`
      SELECT
        AVG(completeness_score) as avg_score,
        MIN(completeness_score) as min_score,
        MAX(completeness_score) as max_score
      FROM budget_templates
      WHERE is_active = true
    `);

    const avgScore = parseFloat(qualityResult.rows[0].avg_score);
    info(`Average completeness score: ${avgScore.toFixed(2)}%`);
    info(`Score range: ${qualityResult.rows[0].min_score}% - ${qualityResult.rows[0].max_score}%`);

    if (avgScore < 50) {
      warn('Average completeness score is below 50%');
      results.warnings++;
    }

    // Check template diversity
    const diversityResult = await db.query(`
      SELECT
        COUNT(DISTINCT location) as locations,
        COUNT(DISTINCT production_type) as types
      FROM budget_templates
      WHERE is_active = true
    `);

    info(`Template diversity: ${diversityResult.rows[0].locations} locations, ${diversityResult.rows[0].types} production types`);

    return true;
  } catch (err) {
    recordTest('Template Database', false, err.message);
    return false;
  }
}

async function test3_NaturalLanguageParsing() {
  section('TEST 3: Natural Language Parsing');

  const testCases = [
    {
      input: 'Atlanta one-hour pilot, 15 shoot days, $8M',
      expected: { location: 'Atlanta', production_type: 'one_hour_pilot', shoot_days: 15, budget: 8000000 }
    },
    {
      input: 'Los Angeles multi-cam series, $5 million budget',
      expected: { location: 'Los Angeles', production_type: 'multi_cam', budget: 5000000 }
    },
    {
      input: 'NYC cable series, 20 shoot days',
      expected: { location: 'New York', production_type: 'cable_series', shoot_days: 20 }
    },
    {
      input: 'LA pilot',
      expected: { location: 'Los Angeles', production_type: 'one_hour_pilot' }
    }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    const parsed = parseNaturalLanguage(testCase.input);

    const checks = [];
    if (testCase.expected.location && parsed.location !== testCase.expected.location) {
      checks.push(`location mismatch: expected ${testCase.expected.location}, got ${parsed.location}`);
    }
    if (testCase.expected.production_type && parsed.production_type !== testCase.expected.production_type) {
      checks.push(`type mismatch: expected ${testCase.expected.production_type}, got ${parsed.production_type}`);
    }
    if (testCase.expected.shoot_days && parsed.shoot_days !== testCase.expected.shoot_days) {
      checks.push(`shoot days mismatch: expected ${testCase.expected.shoot_days}, got ${parsed.shoot_days}`);
    }
    if (testCase.expected.budget && parsed.budget !== testCase.expected.budget) {
      checks.push(`budget mismatch: expected ${testCase.expected.budget}, got ${parsed.budget}`);
    }

    if (checks.length > 0) {
      recordTest('NLP Parsing', false, `"${testCase.input}" - ${checks.join(', ')}`);
      allPassed = false;
    } else {
      recordTest('NLP Parsing', true, `"${testCase.input}"`);
    }
  }

  return allPassed;
}

async function test4_TemplateMatching() {
  section('TEST 4: Template Matching');

  try {
    const params = {
      location: 'Atlanta',
      production_type: 'one_hour_pilot',
      budget: 8000000
    };

    const template = await findBestTemplate(db, params);

    if (!template) {
      recordTest('Template Matching', false, 'No template found');
      return false;
    }

    recordTest('Template Matching', true, `Matched: "${template.name}"`);
    info(`  Location: ${template.location}`);
    info(`  Type: ${template.production_type}`);
    info(`  Budget: $${template.total_budget.toLocaleString()}`);
    info(`  Departments: ${template.department_count}`);
    info(`  Line Items: ${template.line_item_count}`);
    info(`  Completeness: ${template.completeness_score}%`);

    return true;
  } catch (err) {
    recordTest('Template Matching', false, err.message);
    return false;
  }
}

async function test5_BudgetGeneration() {
  section('TEST 5: Budget Generation');

  try {
    // First, create a test production
    const prodResult = await db.query(`
      INSERT INTO productions (name, production_type, created_at)
      VALUES ('TEST_PRODUCTION_AI', 'one_hour_pilot', NOW())
      RETURNING id
    `);

    const productionId = prodResult.rows[0].id;
    info(`Created test production with ID: ${productionId}`);

    // Generate budget using AI
    const prompt = 'Atlanta one-hour pilot, 15 shoot days, $8M';
    info(`Generating budget with prompt: "${prompt}"`);

    const result = await generateBudget(db, productionId, prompt);

    if (!result.success) {
      recordTest('Budget Generation', false, 'Generation failed');
      return false;
    }

    recordTest('Budget Generation', true, 'Budget generated successfully');

    info(`  Parsed params: ${JSON.stringify(result.parsed_params, null, 2)}`);
    info(`  Template used: ${result.template_used.name}`);
    info(`  Scale factor: ${result.scale_factor.toFixed(4)}`);
    info(`  Groups created: ${result.groups_created}`);
    info(`  Items created: ${result.items_created}`);
    info(`  Execution time: ${result.execution_time_ms}ms`);

    // Check validation results
    if (result.validation) {
      info(`  Validation score: ${result.validation.score.toFixed(1)}%`);
      info(`  Valid: ${result.validation.valid ? 'Yes' : 'No'}`);
      info(`  Warnings: ${result.validation.warnings.length}`);
      info(`  Errors: ${result.validation.errors.length}`);

      if (result.validation.warnings.length > 0) {
        warn('Validation warnings:');
        result.validation.warnings.forEach(w => warn(`  - ${w.message}`));
      }

      if (result.validation.errors.length > 0) {
        error('Validation errors:');
        result.validation.errors.forEach(e => error(`  - ${e.message}`));
      }

      recordTest('Budget Validation', result.validation.valid, `Score: ${result.validation.score.toFixed(1)}%`);
    }

    // Verify data was created
    const groupsCheck = await db.query('SELECT COUNT(*) as count FROM budget_groups WHERE production_id = $1', [productionId]);
    const itemsCheck = await db.query('SELECT COUNT(*) as count FROM budget_line_items WHERE production_id = $1', [productionId]);

    const groupsCreated = parseInt(groupsCheck.rows[0].count);
    const itemsCreated = parseInt(itemsCheck.rows[0].count);

    if (groupsCreated === result.groups_created && itemsCreated === result.items_created) {
      recordTest('Data Verification', true, `${groupsCreated} groups and ${itemsCreated} items verified in database`);
    } else {
      recordTest('Data Verification', false, `Mismatch: reported ${result.groups_created}/${result.items_created}, found ${groupsCreated}/${itemsCreated}`);
    }

    // Clean up test data
    await db.query('DELETE FROM budget_line_items WHERE production_id = $1', [productionId]);
    await db.query('DELETE FROM budget_groups WHERE production_id = $1', [productionId]);
    await db.query('DELETE FROM productions WHERE id = $1', [productionId]);
    info('Test data cleaned up');

    return true;
  } catch (err) {
    recordTest('Budget Generation', false, err.message);
    console.error('Full error:', err);
    return false;
  }
}

async function test6_ProductionFlow() {
  section('TEST 6: Production Table');

  try {
    // Check if productions table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'productions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      recordTest('Productions Table', false, 'productions table does not exist');
      return false;
    }
    recordTest('Productions Table', true, 'Table exists');

    // Get production count
    const countResult = await db.query('SELECT COUNT(*) as count FROM productions');
    info(`Total productions in database: ${countResult.rows[0].count}`);

    return true;
  } catch (err) {
    recordTest('Productions Table', false, err.message);
    return false;
  }
}

async function printSummary() {
  section('TEST SUMMARY');

  const total = results.passed + results.failed;
  const passRate = total > 0 ? (results.passed / total * 100).toFixed(1) : 0;

  console.log(colors.bright + `Total Tests: ${total}` + colors.reset);
  console.log(colors.green + `Passed: ${results.passed}` + colors.reset);
  console.log(colors.red + `Failed: ${results.failed}` + colors.reset);
  console.log(colors.yellow + `Warnings: ${results.warnings}` + colors.reset);
  console.log(colors.bright + `Pass Rate: ${passRate}%` + colors.reset);
  console.log();

  if (results.failed === 0) {
    success('ALL TESTS PASSED!');
    console.log();
    success('🎉 System is ready for production use!');
  } else {
    error('SOME TESTS FAILED');
    console.log();
    error('⚠️  Please review and fix issues before production use');
  }

  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

async function runAllTests() {
  console.log(colors.bright + colors.blue);
  console.log(`
██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗████████╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
██╔══██╗██║   ██║██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
██████╔╝██║   ██║██║  ██║██║  ███╗█████╗     ██║       ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
██╔══██╗██║   ██║██║  ██║██║   ██║██╔══╝     ██║       ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
██████╔╝╚██████╔╝██████╔╝╚██████╔╝███████╗   ██║       ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝       ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝

████████╗███████╗███████╗████████╗███████╗
╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔════╝
   ██║   █████╗  ███████╗   ██║   ███████╗
   ██║   ██╔══╝  ╚════██║   ██║   ╚════██║
   ██║   ███████╗███████║   ██║   ███████║
   ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚══════╝
  `);
  console.log(colors.reset);

  info('AI Budget System - Comprehensive Test Suite');
  info('Testing all components...\n');

  const startTime = Date.now();

  try {
    await test1_DatabaseConnection();
    await test2_TemplateDatabase();
    await test3_NaturalLanguageParsing();
    await test4_TemplateMatching();
    await test5_BudgetGeneration();
    await test6_ProductionFlow();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    await printSummary();

    info(`Total execution time: ${duration.toFixed(2)}s`);

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (err) {
    error('Fatal error during testing:');
    console.error(err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run all tests
runAllTests();
