/**
 * Check if production_type_crews table exists and its structure
 * Run with: railway run --service backend node database/migrations/check_table_structure.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking production_type_crews table...\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'production_type_crews'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table production_type_crews does NOT exist');
      return;
    }

    console.log('✅ Table production_type_crews exists\n');

    // Get table columns
    const columnsResult = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'production_type_crews'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    console.log('==========================================');
    for (const col of columnsResult.rows) {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    }

    // Get row count
    const countResult = await client.query('SELECT COUNT(*) as count FROM production_type_crews');
    console.log(`\n📊 Row count: ${countResult.rows[0].count}`);

    // Show sample data if any
    if (parseInt(countResult.rows[0].count) > 0) {
      const sampleResult = await client.query(`
        SELECT production_type, position_title, department
        FROM production_type_crews
        LIMIT 5
      `);

      console.log('\n📄 Sample data:');
      for (const row of sampleResult.rows) {
        console.log(`  ${row.production_type} | ${row.position_title} | ${row.department}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
