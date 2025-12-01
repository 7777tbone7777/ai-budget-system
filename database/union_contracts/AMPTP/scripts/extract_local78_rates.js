/**
 * UA Local 78 (Plumbers & Pipe Fitters) 2024-27 Wage Scale Rate Extraction
 * Source: AMPTP 2024-27 Local #78 Wage Schedules
 * Contract Period: 8/1/2024 - 7/31/2027
 * Current Year (Y2): 8/4/2024 - 8/2/2025
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// UA Local 78 Year 2 rates (8/4/2024 - 8/2/2025)
const LOCAL78_RATES = [
  // ============================================
  // STUDIO (Other than Laboratories) - Year 2
  // ============================================
  { job_classification: 'Plumber Foreman', rate_type: 'weekly', base_rate: 3107.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman', rate_type: 'hourly', base_rate: 54.57, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Journeyman Plumber', rate_type: 'hourly', base_rate: 51.11, production_type: 'theatrical', location: 'Los Angeles' },
  // Construction rates (new plumbing system installation)
  { job_classification: 'Journeyman Plumber (Construction)', rate_type: 'hourly', base_rate: 54.94, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman (Construction)', rate_type: 'hourly', base_rate: 58.67, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // STUDIO (Laboratories Only) - Year 2
  // ============================================
  { job_classification: 'Plumber Foreman', rate_type: 'weekly', base_rate: 3043.06, production_type: 'laboratory', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman', rate_type: 'hourly', base_rate: 53.39, production_type: 'laboratory', location: 'Los Angeles' },
  { job_classification: 'Journeyman Plumber', rate_type: 'hourly', base_rate: 50.00, production_type: 'laboratory', location: 'Los Angeles' },
  // Construction rates (laboratories)
  { job_classification: 'Journeyman Plumber (Construction)', rate_type: 'hourly', base_rate: 53.75, production_type: 'laboratory', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman (Construction)', rate_type: 'hourly', base_rate: 57.39, production_type: 'laboratory', location: 'Los Angeles' },

  // ============================================
  // ONE-HOUR EPISODIC TV / PILOTS - Year 2
  // ============================================
  { job_classification: 'Plumber Foreman', rate_type: 'weekly', base_rate: 3014.31, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman', rate_type: 'hourly', base_rate: 52.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Journeyman Plumber', rate_type: 'hourly', base_rate: 49.58, production_type: 'television', location: 'Los Angeles' },
  // Construction rates (television)
  { job_classification: 'Journeyman Plumber (Construction)', rate_type: 'hourly', base_rate: 53.29, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman (Construction)', rate_type: 'hourly', base_rate: 56.91, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // LONG-FORM TV (MOWs - not basic cable) - Year 2
  // ============================================
  { job_classification: 'Plumber Foreman', rate_type: 'weekly', base_rate: 2796.79, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman', rate_type: 'hourly', base_rate: 49.11, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Journeyman Plumber', rate_type: 'hourly', base_rate: 46.00, production_type: 'long_form_tv', location: 'Los Angeles' },

  // ============================================
  // LONG-FORM TV (Basic Cable) - Year 2
  // ============================================
  { job_classification: 'Plumber Foreman', rate_type: 'weekly', base_rate: 2719.10, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Assistant Foreman', rate_type: 'hourly', base_rate: 47.75, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Journeyman Plumber', rate_type: 'hourly', base_rate: 44.72, production_type: 'basic_cable', location: 'Los Angeles' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing UA Local 78 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'UA Local 78'`);

    console.log(`Inserting ${LOCAL78_RATES.length} UA Local 78 rates...`);

    let inserted = 0;
    for (const rate of LOCAL78_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'UA Local 78',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2024-08-04',  // Year 2 start
        2,
        rate.production_type,
        rate.location
      ]);
      inserted++;
    }

    console.log(`Successfully inserted ${inserted} rates for UA Local 78`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'UA Local 78'
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
