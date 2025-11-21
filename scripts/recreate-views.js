// Recreate database views that were dropped during migration
const { Client } = require('pg');

async function recreateViews() {
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

    console.log('📊 Recreating database views...\n');

    // Recreate current_rate_cards view
    await client.query(`
      CREATE OR REPLACE VIEW current_rate_cards AS
      SELECT DISTINCT ON (union_local, job_classification, location, production_type)
        id, union_local, job_classification, rate_type, base_rate,
        location, production_type, effective_date, contract_year
      FROM rate_cards
      ORDER BY union_local, job_classification, location, production_type, effective_date DESC
    `);
    console.log('✓ current_rate_cards view created');

    // Recreate production_budget_summary view
    await client.query(`
      CREATE OR REPLACE VIEW production_budget_summary AS
      SELECT
        p.id as production_id,
        p.name as production_name,
        p.production_type,
        p.distribution_platform,
        COUNT(bli.id) as line_item_count,
        COALESCE(SUM(bli.subtotal), 0) as total_labor,
        COALESCE(SUM(bli.fringes), 0) as total_fringes,
        COALESCE(SUM(bli.total), 0) as grand_total
      FROM productions p
      LEFT JOIN budget_line_items bli ON p.id = bli.production_id
      GROUP BY p.id, p.name, p.production_type, p.distribution_platform
    `);
    console.log('✓ production_budget_summary view created');

    console.log('\n✅ All views recreated successfully!\n');

  } catch (error) {
    console.error('❌ Failed to recreate views:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

recreateViews();
