// Migrate VARCHAR(100) columns to VARCHAR(255) to accommodate longer values
const { Client } = require('pg');

async function migrateColumnSizes() {
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

    console.log('📏 Dropping views...\n');
    await client.query('DROP VIEW IF EXISTS current_rate_cards CASCADE');
    await client.query('DROP VIEW IF EXISTS production_budget_summary CASCADE');
    console.log('✓ Views dropped\n');

    console.log('📏 Increasing column sizes...\n');

    // Union agreements
    await client.query('ALTER TABLE union_agreements ALTER COLUMN union_name TYPE VARCHAR(255)');
    console.log('✓ union_agreements.union_name → VARCHAR(255)');

    await client.query('ALTER TABLE union_agreements ALTER COLUMN agreement_type TYPE VARCHAR(255)');
    console.log('✓ union_agreements.agreement_type → VARCHAR(255)');

    // Rate cards
    await client.query('ALTER TABLE rate_cards ALTER COLUMN union_local TYPE VARCHAR(255)');
    console.log('✓ rate_cards.union_local → VARCHAR(255)');

    await client.query('ALTER TABLE rate_cards ALTER COLUMN job_classification TYPE VARCHAR(255)');
    console.log('✓ rate_cards.job_classification → VARCHAR(255)');

    await client.query('ALTER TABLE rate_cards ALTER COLUMN location TYPE VARCHAR(255)');
    console.log('✓ rate_cards.location → VARCHAR(255)');

    // Sideletter rules
    await client.query('ALTER TABLE sideletter_rules ALTER COLUMN sideletter_name TYPE VARCHAR(255)');
    console.log('✓ sideletter_rules.sideletter_name → VARCHAR(255)');

    await client.query('ALTER TABLE sideletter_rules ALTER COLUMN location_restriction TYPE VARCHAR(255)');
    console.log('✓ sideletter_rules.location_restriction → VARCHAR(255)');

    // Fringe benefits
    await client.query('ALTER TABLE fringe_benefits ALTER COLUMN union_local TYPE VARCHAR(255)');
    console.log('✓ fringe_benefits.union_local → VARCHAR(255)');

    // Make date columns nullable
    console.log('\n📏 Making date columns nullable...\n');
    await client.query('ALTER TABLE union_agreements ALTER COLUMN effective_date_start DROP NOT NULL');
    console.log('✓ union_agreements.effective_date_start → nullable');

    await client.query('ALTER TABLE union_agreements ALTER COLUMN effective_date_end DROP NOT NULL');
    console.log('✓ union_agreements.effective_date_end → nullable');

    console.log('\n✅ All columns migrated successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

migrateColumnSizes();
