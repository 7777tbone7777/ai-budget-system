/**
 * Extract crew positions from uploaded theatrical budget
 * and populate production_type_crews table
 *
 * Run with: node database/migrations/seed_production_crews_from_upload.js
 */

const { Pool } = require('pg');

// Railway DATABASE_URL - will be passed via environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔍 Finding uploaded theatrical budget...\n');

    // Find the production that has uploaded budget data (not auto-generated)
    // Look for a production with many line items that have detailed crew positions
    const productionsResult = await client.query(`
      SELECT p.id, p.name, p.production_type, p.budget_target, COUNT(bli.id) as line_count
      FROM productions p
      LEFT JOIN budget_line_items bli ON bli.production_id = p.id
      GROUP BY p.id
      HAVING COUNT(bli.id) > 50
      ORDER BY COUNT(bli.id) DESC
      LIMIT 1
    `);

    if (productionsResult.rows.length === 0) {
      console.log('❌ No uploaded budget found with detailed line items');
      return;
    }

    const production = productionsResult.rows[0];
    console.log(`✅ Found budget: ${production.name}`);
    console.log(`   Type: ${production.production_type}`);
    console.log(`   Budget: $${parseFloat(production.budget_target).toLocaleString()}`);
    console.log(`   Line items: ${production.line_count}\n`);

    // Get all crew position line items from this budget
    // We'll focus on BTL (Below the Line) crew positions
    const lineItemsResult = await client.query(`
      SELECT
        description,
        account_code,
        atl_or_btl,
        quantity,
        rate,
        unit_type,
        rate_type,
        notes
      FROM budget_line_items
      WHERE production_id = $1
        AND atl_or_btl = 'BTL'
        AND description IS NOT NULL
        AND description NOT LIKE '%Purchases%'
        AND description NOT LIKE '%Rentals%'
        AND description NOT LIKE '%Allowance%'
      ORDER BY account_code, description
    `, [production.id]);

    console.log(`📊 Found ${lineItemsResult.rows.length} crew positions to extract\n`);

    // Map account codes to departments
    const accountToDept = {
      '20': 'Production',
      '21': 'Extra Talent',
      '22': 'Art Department',
      '23': 'Set Construction',
      '24': 'Set Operations',
      '25': 'Grip',
      '26': 'Property',
      '27': 'Set Dressing',
      '28': 'Property',
      '29': 'Wardrobe',
      '30': 'Makeup & Hair',
      '31': 'Makeup & Hair',
      '32': 'Electric',
      '33': 'Camera',
      '34': 'Sound',
      '35': 'Transportation',
      '36': 'Location',
      '37': 'Sound',
      '38': 'Special Effects',
      '39': 'Animals',
      '40': 'Stunts',
      '41': 'Production',
      '42': 'Post Production',
      '43': 'Post Production',
      '44': 'Post Production',
      '45': 'Music',
      '46': 'Music'
    };

    // Extract 2-digit category from account code
    function getDepartment(accountCode) {
      if (!accountCode) return 'Production';
      const category = accountCode.substring(0, 2);
      return accountToDept[category] || 'Production';
    }

    // Parse position title and union from description
    function parseDescription(desc) {
      // Common patterns: "Position Title (Department)" or just "Position Title"
      const match = desc.match(/^(.+?)\s*(?:\((.+)\))?$/);
      if (match) {
        return {
          title: match[1].trim(),
          dept: match[2] || null
        };
      }
      return { title: desc, dept: null };
    }

    // Estimate work days based on budget and position type
    function estimateWorkDays(position, budget) {
      const budgetNum = parseFloat(budget) || 10000000;
      const shootDays = budgetNum < 5000000 ? 25 : budgetNum < 20000000 ? 40 : 60;

      // Key positions typically work more days
      const keyPositions = ['DP', 'Director', 'UPM', 'Line Producer', 'Producer',
                            '1st AD', '1st AC', 'Gaffer', 'Key Grip', 'Mixer'];
      const isKey = keyPositions.some(kp => position.toUpperCase().includes(kp.toUpperCase()));

      return {
        prep: isKey ? Math.floor(shootDays * 0.2) : Math.floor(shootDays * 0.1),
        shoot: shootDays,
        wrap: isKey ? Math.floor(shootDays * 0.15) : Math.floor(shootDays * 0.05)
      };
    }

    // Start transaction
    await client.query('BEGIN');

    // Clear existing theatrical templates
    await client.query(`
      DELETE FROM production_type_crews
      WHERE production_type = 'theatrical'
    `);
    console.log('🗑️  Cleared existing theatrical templates\n');

    // Insert crew positions
    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of lineItemsResult.rows) {
      const parsed = parseDescription(item.description);
      const dept = getDepartment(item.account_code);
      const workDays = estimateWorkDays(parsed.title, production.budget_target);

      // Skip generic/summary items
      if (parsed.title.match(/(total|subtotal|misc|other|expenses|costs)/i)) {
        skippedCount++;
        continue;
      }

      try {
        await client.query(`
          INSERT INTO production_type_crews (
            production_type,
            min_budget,
            max_budget,
            position_title,
            department,
            union_local,
            typical_prep_days,
            typical_shoot_days,
            typical_wrap_days,
            typical_quantity,
            typical_rate_type,
            typical_fringe_rate,
            sort_order,
            is_essential,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          'theatrical',                    // production_type
          5000000,                          // min_budget ($5M+ for full crew)
          null,                             // max_budget (no max)
          parsed.title,                     // position_title
          dept,                             // department
          null,                             // union_local (to be filled from rate_cards)
          workDays.prep,                    // typical_prep_days
          workDays.shoot,                   // typical_shoot_days
          workDays.wrap,                    // typical_wrap_days
          parseFloat(item.quantity) || 1,   // typical_quantity
          item.rate_type || 'weekly',       // typical_rate_type
          32.00,                            // typical_fringe_rate (32% default)
          insertedCount,                    // sort_order
          true,                             // is_essential
          item.notes || `Extracted from uploaded ${production.name} budget`
        ]);

        insertedCount++;
        if (insertedCount % 10 === 0) {
          process.stdout.write(`\r✍️  Inserted ${insertedCount} positions...`);
        }
      } catch (error) {
        console.error(`\n⚠️  Failed to insert ${parsed.title}:`, error.message);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`\n\n✅ Successfully inserted ${insertedCount} crew positions`);
    console.log(`⏭️  Skipped ${skippedCount} non-crew items`);

    // Show summary by department
    const summary = await client.query(`
      SELECT department, COUNT(*) as count
      FROM production_type_crews
      WHERE production_type = 'theatrical'
      GROUP BY department
      ORDER BY count DESC
    `);

    console.log('\n📋 Crew positions by department:');
    for (const row of summary.rows) {
      console.log(`   ${row.department.padEnd(20)} ${row.count} positions`);
    }

    console.log('\n🎉 Template creation complete!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
