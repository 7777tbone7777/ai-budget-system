// Apply migration 004: Special Provisions for Guild Agreements
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

    console.log('📊 Applying migration 004...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/004_add_special_provisions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Apply the migration
    await client.query(migrationSQL);

    console.log('✅ Migration 004 applied successfully!\n');

    // Verify columns were added
    console.log('🔍 Verifying new columns...\n');

    const columns = [
      { table: 'budget_line_items', column: 'special_provisions' },
      { table: 'budget_line_items', column: 'location' },
      { table: 'budget_line_items', column: 'effective_date' },
      { table: 'rate_cards', column: 'special_provisions' },
      { table: 'rate_cards', column: 'tier' },
      { table: 'fringe_benefits', column: 'benefit_category' },
      { table: 'sideletter_rules', column: 'min_budget_amount' },
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

    // Verify views were created
    console.log('\n🔍 Verifying views...\n');

    const views = ['budget_line_items_with_provisions', 'active_rate_cards_detailed'];

    for (const view of views) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_name = $1
        )
      `, [view]);

      if (result.rows[0].exists) {
        console.log(`✓ View '${view}' created`);
      } else {
        console.log(`✗ View '${view}' NOT found`);
      }
    }

    // Verify functions were created
    console.log('\n🔍 Verifying functions...\n');

    const functions = ['create_common_globals', 'calculate_overtime', 'get_special_provision'];

    for (const func of functions) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          WHERE proname = $1
        )
      `, [func]);

      if (result.rows[0].exists) {
        console.log(`✓ Function '${func}' created`);
      } else {
        console.log(`✗ Function '${func}' NOT found`);
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
