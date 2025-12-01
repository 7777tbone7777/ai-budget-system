/**
 * Teamsters Local 769 (Miami) 2025-28 Wage Scale Rate Extraction
 * Source: AMPTP 2025-28 Local #769 Wage Schedules (Drivers + Location Managers)
 * Contract Period: 3/31/2024 - 3/31/2028
 * Current Year (Y2): 3/30/2025 - 3/28/2026
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Local 769 Year 2 rates (3/30/2025 - 3/28/2026)
const LOCAL769_RATES = [
  // ============================================
  // DRIVERS - FEATURES (>$7M) & 3rd+ Seasons
  // ============================================
  { job_classification: 'Captain', rate_type: 'hourly', base_rate: 51.93, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Co-Captain', rate_type: 'hourly', base_rate: 50.64, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Special Equipment Driver', rate_type: 'hourly', base_rate: 48.75, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Production Van/Generator Driver', rate_type: 'hourly', base_rate: 50.89, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Driver Class A', rate_type: 'hourly', base_rate: 46.28, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Driver Class B', rate_type: 'hourly', base_rate: 43.91, production_type: 'theatrical', location: 'Miami' },
  { job_classification: '15-Passenger Van Driver', rate_type: 'hourly', base_rate: 43.91, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Van Driver (Under 15 Passenger)', rate_type: 'hourly', base_rate: 41.11, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Driver Class C', rate_type: 'hourly', base_rate: 39.94, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Chauffeur', rate_type: 'hourly', base_rate: 39.01, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Dispatcher', rate_type: 'hourly', base_rate: 48.75, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Mechanic', rate_type: 'hourly', base_rate: 48.75, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Driver/Caterer', rate_type: 'hourly', base_rate: 48.75, production_type: 'theatrical', location: 'Miami' },

  // ============================================
  // DRIVERS - LOW BUDGET FEATURES (<=$7M)
  // ============================================
  { job_classification: 'Captain', rate_type: 'hourly', base_rate: 46.72, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Co-Captain', rate_type: 'hourly', base_rate: 45.57, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Special Equipment Driver', rate_type: 'hourly', base_rate: 43.91, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Production Van/Generator Driver', rate_type: 'hourly', base_rate: 45.76, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Driver Class A', rate_type: 'hourly', base_rate: 41.66, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Driver Class B', rate_type: 'hourly', base_rate: 39.47, production_type: 'low_budget', location: 'Miami' },
  { job_classification: '15-Passenger Van Driver', rate_type: 'hourly', base_rate: 39.47, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Van Driver (Under 15 Passenger)', rate_type: 'hourly', base_rate: 37.00, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Driver Class C', rate_type: 'hourly', base_rate: 35.93, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Chauffeur', rate_type: 'hourly', base_rate: 35.10, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Dispatcher', rate_type: 'hourly', base_rate: 43.91, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Mechanic', rate_type: 'hourly', base_rate: 43.91, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Driver/Caterer', rate_type: 'hourly', base_rate: 43.91, production_type: 'low_budget', location: 'Miami' },

  // ============================================
  // DRIVERS - NETWORK TV (Pilots & 1st/2nd Seasons)
  // ============================================
  { job_classification: 'Captain', rate_type: 'hourly', base_rate: 50.37, production_type: 'television', location: 'Miami' },
  { job_classification: 'Co-Captain', rate_type: 'hourly', base_rate: 49.12, production_type: 'television', location: 'Miami' },
  { job_classification: 'Special Equipment Driver', rate_type: 'hourly', base_rate: 47.29, production_type: 'television', location: 'Miami' },
  { job_classification: 'Production Van/Generator Driver', rate_type: 'hourly', base_rate: 49.36, production_type: 'television', location: 'Miami' },
  { job_classification: 'Driver Class A', rate_type: 'hourly', base_rate: 44.89, production_type: 'television', location: 'Miami' },
  { job_classification: 'Driver Class B', rate_type: 'hourly', base_rate: 42.59, production_type: 'television', location: 'Miami' },
  { job_classification: '15-Passenger Van Driver', rate_type: 'hourly', base_rate: 42.59, production_type: 'television', location: 'Miami' },
  { job_classification: 'Van Driver (Under 15 Passenger)', rate_type: 'hourly', base_rate: 39.88, production_type: 'television', location: 'Miami' },
  { job_classification: 'Driver Class C', rate_type: 'hourly', base_rate: 38.74, production_type: 'television', location: 'Miami' },
  { job_classification: 'Chauffeur', rate_type: 'hourly', base_rate: 37.84, production_type: 'television', location: 'Miami' },
  { job_classification: 'Dispatcher', rate_type: 'hourly', base_rate: 47.29, production_type: 'television', location: 'Miami' },
  { job_classification: 'Mechanic', rate_type: 'hourly', base_rate: 47.29, production_type: 'television', location: 'Miami' },
  { job_classification: 'Driver/Caterer', rate_type: 'hourly', base_rate: 47.29, production_type: 'television', location: 'Miami' },

  // ============================================
  // DRIVERS - LONG-FORM TV & BASIC CABLE
  // ============================================
  { job_classification: 'Captain', rate_type: 'hourly', base_rate: 46.72, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Co-Captain', rate_type: 'hourly', base_rate: 45.57, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Special Equipment Driver', rate_type: 'hourly', base_rate: 43.91, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Production Van/Generator Driver', rate_type: 'hourly', base_rate: 45.76, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Driver Class A', rate_type: 'hourly', base_rate: 41.66, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Driver Class B', rate_type: 'hourly', base_rate: 39.47, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: '15-Passenger Van Driver', rate_type: 'hourly', base_rate: 39.47, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Van Driver (Under 15 Passenger)', rate_type: 'hourly', base_rate: 37.00, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Driver Class C', rate_type: 'hourly', base_rate: 35.93, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Chauffeur', rate_type: 'hourly', base_rate: 35.10, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Dispatcher', rate_type: 'hourly', base_rate: 43.91, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Mechanic', rate_type: 'hourly', base_rate: 43.91, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Driver/Caterer', rate_type: 'hourly', base_rate: 43.91, production_type: 'long_form_tv', location: 'Miami' },

  // ============================================
  // LOCATION MANAGERS - FEATURES (>$7M) & 3rd+ Seasons
  // ============================================
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 4079.00, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 42.46, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2972.00, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 21.87, production_type: 'theatrical', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'weekly', base_rate: 1531.00, production_type: 'theatrical', location: 'Miami' },

  // ============================================
  // LOCATION MANAGERS - LOW BUDGET (<=$7M)
  // ============================================
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 3672.00, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 38.24, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2677.00, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 19.71, production_type: 'low_budget', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'weekly', base_rate: 1380.00, production_type: 'low_budget', location: 'Miami' },

  // ============================================
  // LOCATION MANAGERS - NETWORK TV
  // ============================================
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 3957.00, production_type: 'television', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 41.19, production_type: 'television', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2883.00, production_type: 'television', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 21.21, production_type: 'television', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'weekly', base_rate: 1485.00, production_type: 'television', location: 'Miami' },

  // ============================================
  // LOCATION MANAGERS - LONG-FORM TV & BASIC CABLE
  // ============================================
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 3305.00, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 34.41, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2409.00, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'hourly', base_rate: 17.74, production_type: 'long_form_tv', location: 'Miami' },
  { job_classification: 'Location Assistant', rate_type: 'weekly', base_rate: 1242.00, production_type: 'long_form_tv', location: 'Miami' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing Teamsters Local 769 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'Teamsters Local 769'`);

    console.log(`Inserting ${LOCAL769_RATES.length} Teamsters Local 769 rates...`);

    let inserted = 0;
    for (const rate of LOCAL769_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'Teamsters Local 769',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-30',  // Year 2 start
        2,
        rate.production_type,
        rate.location
      ]);
      inserted++;
    }

    console.log(`Successfully inserted ${inserted} rates for Teamsters Local 769`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'Teamsters Local 769'
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
