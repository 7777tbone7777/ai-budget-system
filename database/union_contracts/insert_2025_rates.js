#!/usr/bin/env node
/**
 * Insert 2025 rates from Paymaster into the database
 * Uses the rate_cards table with ON CONFLICT to avoid duplicates
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertRates() {
  const client = await pool.connect();

  try {
    // Read the extracted rates JSON
    const ratesFile = path.join(__dirname, 'extracted/paymaster_2025_rates.json');
    const data = JSON.parse(fs.readFileSync(ratesFile, 'utf8'));

    console.log(`\n${'='.repeat(70)}`);
    console.log('INSERTING 2025 RATES INTO DATABASE');
    console.log(`Source: ${data.source}`);
    console.log(`${'='.repeat(70)}\n`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const rate of data.rates) {
      try {
        // Use INSERT with ON CONFLICT to handle duplicates
        const result = await client.query(`
          INSERT INTO rate_cards (
            union_local, job_classification, rate_type, base_rate,
            location, production_type, effective_date, contract_year
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
          DO UPDATE SET
            base_rate = EXCLUDED.base_rate,
            rate_type = EXCLUDED.rate_type
          RETURNING id, (xmax = 0) AS inserted
        `, [
          rate.union_local,
          rate.job_classification,
          rate.rate_type,
          rate.base_rate,
          rate.location || 'Los Angeles - Studio',
          rate.production_type || 'theatrical',
          rate.effective_date,
          rate.contract_year || (rate.effective_date.includes('2025-07') ? 3 : 2) // DGA Y3, IATSE Y2
        ]);

        if (result.rows[0].inserted) {
          inserted++;
        } else {
          skipped++; // Updated existing
        }
      } catch (err) {
        console.error(`  ERROR inserting ${rate.job_classification}: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('RESULTS:');
    console.log(`  New records inserted: ${inserted}`);
    console.log(`  Existing records updated: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total processed: ${data.rates.length}`);
    console.log(`${'='.repeat(70)}\n`);

    // Verify the counts
    const countResult = await client.query(`
      SELECT
        union_local,
        COUNT(*) as count,
        MIN(effective_date) as earliest,
        MAX(effective_date) as latest
      FROM rate_cards
      WHERE effective_date >= '2025-01-01'
      GROUP BY union_local
      ORDER BY count DESC
    `);

    console.log('2025+ RATES BY UNION:');
    console.log('-'.repeat(60));
    for (const row of countResult.rows) {
      console.log(`  ${row.union_local.padEnd(30)} ${row.count.toString().padStart(5)} rates (${row.earliest} to ${row.latest})`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

insertRates().catch(console.error);
