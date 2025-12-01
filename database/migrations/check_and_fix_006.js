/**
 * Check and fix COA tables before running migration 006
 * Execute with: railway run --service backend node database/migrations/check_and_fix_006.js
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
    console.log('🔍 Checking existing COA tables...\n');

    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('chart_of_accounts', 'account_code_structure')
    `);

    console.log('Found tables:', tablesCheck.rows.map(r => r.table_name).join(', '));

    if (tablesCheck.rows.length > 0) {
      console.log('\n⚠️  COA tables already exist. Dropping them...');

      // Drop existing tables
      await client.query('DROP TABLE IF EXISTS account_code_structure CASCADE');
      await client.query('DROP TABLE IF EXISTS chart_of_accounts CASCADE');

      console.log('✅ Existing tables dropped');
    }

    // Check if columns were added to productions/production_type_crews
    const productionsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'productions' AND column_name = 'coa_id'
    `);

    const crewCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'production_type_crews' AND column_name = 'account_code'
    `);

    if (productionsCheck.rows.length > 0) {
      console.log('⚠️  productions.coa_id already exists, removing...');
      await client.query('ALTER TABLE productions DROP COLUMN IF EXISTS coa_id CASCADE');
    }

    if (crewCheck.rows.length > 0) {
      console.log('⚠️  production_type_crews.account_code already exists, removing...');
      await client.query('ALTER TABLE production_type_crews DROP COLUMN IF EXISTS account_code CASCADE');
    }

    console.log('\n✅ Database is clean, ready for migration 006');
    console.log('\nNow run: railway run --service backend node database/migrations/run_006_migration.js\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
