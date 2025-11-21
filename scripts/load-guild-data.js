// Load all guild agreement SQL data into Railway database
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadGuildData() {
  // Get DATABASE_URL from environment (set by Railway)
  // Try PUBLIC_URL first since we're connecting from outside Railway network
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read the master SQL file
    const sqlFile = path.join(__dirname, '../database/all_guild_agreements.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📊 Loading guild agreement data...');
    console.log(`   SQL file: ${path.basename(sqlFile)}`);
    console.log(`   Size: ${(sql.length / 1024).toFixed(1)} KB`);
    console.log(`   Lines: ${sql.split('\n').length}\n`);

    // Clear existing guild data
    console.log('🗑️  Clearing existing guild data...');
    await client.query('DELETE FROM fringe_benefits');
    await client.query('DELETE FROM sideletter_rules');
    await client.query('DELETE FROM rate_cards');
    await client.query('DELETE FROM union_agreements');
    console.log('✓ Existing data cleared\n');

    // Execute the SQL
    const startTime = Date.now();
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Data loaded successfully in ${duration}s!\n`);

    // Get counts
    console.log('📈 Database Summary:');

    const rateCardsResult = await client.query('SELECT COUNT(*) FROM rate_cards');
    console.log(`   Rate Cards: ${rateCardsResult.rows[0].count}`);

    const sidelettersResult = await client.query('SELECT COUNT(*) FROM sideletter_rules');
    console.log(`   Sideletter Rules: ${sidelettersResult.rows[0].count}`);

    const fringesResult = await client.query('SELECT COUNT(*) FROM fringe_benefits');
    console.log(`   Fringe Benefits: ${fringesResult.rows[0].count}`);

    const unionsResult = await client.query('SELECT COUNT(DISTINCT union_local) FROM rate_cards');
    console.log(`   Unions: ${unionsResult.rows[0].count}\n`);

  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

loadGuildData();
