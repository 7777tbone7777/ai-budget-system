/**
 * Check account codes in database directly
 */
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:@localhost/ai_budget';
const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  try {
    const result = await pool.query(`
      SELECT
        department,
        account_code,
        position_title
      FROM production_type_crews
      WHERE production_type = 'theatrical'
      AND account_code IS NOT NULL
      ORDER BY account_code
      LIMIT 50
    `);

    console.log('\n✅ ACCOUNT CODES IN DATABASE:\n');
    console.log(`Total positions with codes: ${result.rows.length}\n`);

    let currentDept = '';
    result.rows.forEach(row => {
      if (row.department !== currentDept) {
        currentDept = row.department;
        console.log(`\n${row.account_code.substring(0,2)}00 - ${row.department}:`);
      }
      console.log(`  ${row.account_code} - ${row.position_title}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
