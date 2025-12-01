/**
 * Check what productions exist and their line item counts
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        p.id,
        p.name,
        p.production_type,
        p.budget_target,
        COUNT(bli.id) as line_count
      FROM productions p
      LEFT JOIN budget_line_items bli ON bli.production_id = p.id
      GROUP BY p.id
      ORDER BY COUNT(bli.id) DESC
      LIMIT 10
    `);

    console.log('📊 Productions in database:\n');
    for (const row of result.rows) {
      console.log(`  ${row.name}`);
      console.log(`    ID: ${row.id}`);
      console.log(`    Type: ${row.production_type || 'N/A'}`);
      console.log(`    Budget: $${parseFloat(row.budget_target || 0).toLocaleString()}`);
      console.log(`    Line items: ${row.line_count}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
