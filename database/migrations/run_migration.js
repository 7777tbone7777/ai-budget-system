#!/usr/bin/env node
/**
 * Migration Runner for AI Budget System
 * Executes SQL migration files against the Railway PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not set');
  console.error('Run with: railway run --service backend node database/migrations/run_migration.js');
  process.exit(1);
}

// Get migration file from command line args
const migrationFile = process.argv[2] || '001_add_4_level_hierarchy.sql';
const migrationPath = path.join(__dirname, migrationFile);

console.log('🚀 AI Budget System - Database Migration');
console.log('==========================================');
console.log(`📁 Migration file: ${migrationFile}`);
console.log(`📍 Full path: ${migrationPath}`);

// Check if file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ ERROR: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read SQL file
const sql = fs.readFileSync(migrationPath, 'utf8');
console.log(`📄 SQL file size: ${(sql.length / 1024).toFixed(2)} KB`);
console.log('');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to PostgreSQL database');
    console.log('⏳ Executing migration...');
    console.log('');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Verifying new tables...');

    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'budget_metadata',
          'budget_topsheet',
          'budget_accounts',
          'budget_line_items',
          'budget_global_variables',
          'fringe_calculation_rules'
        )
      ORDER BY table_name;
    `);

    console.log('Created/Updated tables:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');
    console.log('🔍 Checking triggers...');

    const triggerCheck = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE 'trg_%'
      ORDER BY trigger_name;
    `);

    console.log(`Found ${triggerCheck.rows.length} triggers:`);
    triggerCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.trigger_name} (${row.event_manipulation} on ${row.event_object_table})`);
    });

    console.log('');
    console.log('🔍 Checking views...');

    const viewCheck = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name LIKE '%budget%'
      ORDER BY table_name;
    `);

    console.log(`Found ${viewCheck.rows.length} views:`);
    viewCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('==========================================');

  } catch (err) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('==========================================');
    console.error('Error:', err.message);
    console.error('');
    if (err.detail) {
      console.error('Detail:', err.detail);
    }
    if (err.hint) {
      console.error('Hint:', err.hint);
    }
    console.error('');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
