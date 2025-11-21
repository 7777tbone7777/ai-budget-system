// Apply migration 003: Globals, Groups, and Contractual Charges
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Applying migration 003...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/003_add_globals_groups_contractual.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Apply the migration
    await client.query(migrationSQL);

    console.log('✅ Migration 003 applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying new tables...\n');

    const tables = ['globals', 'budget_groups', 'budget_line_item_groups', 'contractual_charges'];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`✓ Table '${table}' created`);
      } else {
        console.log(`✗ Table '${table}' NOT found`);
      }
    }

    // Verify new columns were added
    console.log('\n🔍 Verifying new columns...\n');

    const columns = [
      { table: 'budget_line_items', column: 'global_reference' },
      { table: 'budget_line_items', column: 'original_subtotal' },
      { table: 'budget_line_items', column: 'applied_groups' },
      { table: 'productions', column: 'lock_original_totals' },
      { table: 'productions', column: 'total_contractual_charges' },
    ];

    for (const { table, column } of columns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1 AND column_name = $2
        )
      `, [table, column]);

      if (result.rows[0].exists) {
        console.log(`✓ Column '${table}.${column}' added`);
      } else {
        console.log(`✗ Column '${table}.${column}' NOT found`);
      }
    }

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

applyMigration();
