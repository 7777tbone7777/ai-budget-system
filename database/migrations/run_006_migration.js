/**
 * Run migration 006 - Add Chart of Accounts system
 * Execute with: railway run --service backend node database/migrations/run_006_migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    console.log('📊 Running migration 006: Chart of Accounts system\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '006_add_chart_of_accounts.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the migration
    await client.query(sql);

    console.log('✅ Migration 006 completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - chart_of_accounts (4 COAs: Standard Film/TV, AICP, Netflix, Disney)');
    console.log('  - account_code_structure (46 categories total)');
    console.log('\nUpdated tables:');
    console.log('  - productions (added coa_id column)');
    console.log('  - production_type_crews (added account_code column)');
    console.log('\nIndexes created for performance optimization\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
