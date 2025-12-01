/**
 * Teamsters Local 817 (New York) 2024-28 Wage Scale Rate Extraction
 * Source: AMPTP 2025-28 Local #817 Drivers + 2024-28 Location Personnel
 * Drivers: 11/03/2024 - 10/31/2028
 * Locations: 9/29/2024 - 9/30/2028
 * Using Year 1 rates (current)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Local 817 Year 1 rates
const LOCAL817_RATES = [
  // ============================================
  // DRIVERS - THEATRICAL (7-hour day daily rates)
  // ============================================
  { job_classification: 'Captain', rate_type: 'daily', base_rate: 452.09, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Co-Captain', rate_type: 'daily', base_rate: 420.66, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Specialized Equipment Driver', rate_type: 'daily', base_rate: 420.66, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'DOT Compliance', rate_type: 'daily', base_rate: 420.66, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Dispatcher/DOT Compliance', rate_type: 'daily', base_rate: 420.66, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Chauffeur', rate_type: 'daily', base_rate: 380.55, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Helper', rate_type: 'daily', base_rate: 364.58, production_type: 'theatrical', location: 'New York' },
  // Weekly flat rates - Theatrical
  { job_classification: 'Captain', rate_type: 'weekly', base_rate: 5975.63, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Co-Captain', rate_type: 'weekly', base_rate: 4837.33, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Specialized Equipment Driver', rate_type: 'weekly', base_rate: 4837.33, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'DOT Compliance', rate_type: 'weekly', base_rate: 4837.33, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Dispatcher/DOT Compliance', rate_type: 'weekly', base_rate: 4837.33, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Chauffeur', rate_type: 'weekly', base_rate: 4376.34, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Helper', rate_type: 'weekly', base_rate: 4192.71, production_type: 'theatrical', location: 'New York' },

  // ============================================
  // DRIVERS - TELEVISION (7-hour day daily rates)
  // ============================================
  { job_classification: 'Captain', rate_type: 'daily', base_rate: 426.33, production_type: 'television', location: 'New York' },
  { job_classification: 'Co-Captain', rate_type: 'daily', base_rate: 396.62, production_type: 'television', location: 'New York' },
  { job_classification: 'Specialized Equipment Driver', rate_type: 'daily', base_rate: 396.62, production_type: 'television', location: 'New York' },
  { job_classification: 'DOT Compliance', rate_type: 'daily', base_rate: 396.62, production_type: 'television', location: 'New York' },
  { job_classification: 'Dispatcher/DOT Compliance', rate_type: 'daily', base_rate: 396.62, production_type: 'television', location: 'New York' },
  { job_classification: 'Chauffeur', rate_type: 'daily', base_rate: 358.85, production_type: 'television', location: 'New York' },
  { job_classification: 'Helper', rate_type: 'daily', base_rate: 343.74, production_type: 'television', location: 'New York' },
  // Weekly flat rates - Television
  { job_classification: 'Captain', rate_type: 'weekly', base_rate: 5634.64, production_type: 'television', location: 'New York' },
  { job_classification: 'Co-Captain', rate_type: 'weekly', base_rate: 4561.28, production_type: 'television', location: 'New York' },
  { job_classification: 'Specialized Equipment Driver', rate_type: 'weekly', base_rate: 4561.28, production_type: 'television', location: 'New York' },
  { job_classification: 'DOT Compliance', rate_type: 'weekly', base_rate: 4561.28, production_type: 'television', location: 'New York' },
  { job_classification: 'Dispatcher/DOT Compliance', rate_type: 'weekly', base_rate: 4561.28, production_type: 'television', location: 'New York' },
  { job_classification: 'Chauffeur', rate_type: 'weekly', base_rate: 4126.61, production_type: 'television', location: 'New York' },
  { job_classification: 'Helper', rate_type: 'weekly', base_rate: 3953.49, production_type: 'television', location: 'New York' },

  // ============================================
  // LOCATION PERSONNEL - THEATRICAL (hourly)
  // ============================================
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 36.34, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Location Scout', rate_type: 'hourly', base_rate: 34.60, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Location Department Coordinator', rate_type: 'hourly', base_rate: 31.78, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 28.50, production_type: 'theatrical', location: 'New York' },

  // ============================================
  // LOCATION PERSONNEL - TELEVISION (hourly)
  // ============================================
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 34.60, production_type: 'television', location: 'New York' },
  { job_classification: 'Location Scout', rate_type: 'hourly', base_rate: 32.96, production_type: 'television', location: 'New York' },
  { job_classification: 'Location Department Coordinator', rate_type: 'hourly', base_rate: 30.36, production_type: 'television', location: 'New York' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 27.08, production_type: 'television', location: 'New York' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing Teamsters Local 817 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'Teamsters Local 817'`);

    console.log(`Inserting ${LOCAL817_RATES.length} Teamsters Local 817 rates...`);

    let inserted = 0;
    for (const rate of LOCAL817_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'Teamsters Local 817',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2024-11-03',  // Year 1 start for drivers (locations started 9/29/24)
        1,
        rate.production_type,
        rate.location
      ]);
      inserted++;
    }

    console.log(`Successfully inserted ${inserted} rates for Teamsters Local 817`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'Teamsters Local 817'
    `);
    console.log(`Verification: ${result.rows[0].count} rates in database`);

  } catch (error) {
    console.error('Error inserting rates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertRates();
