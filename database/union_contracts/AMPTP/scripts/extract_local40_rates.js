/**
 * IBEW Local 40 2024-27 Wage Scale Rate Extraction
 * Source: AMPTP 2024-27 Local #40 Wage Schedules
 * Contract Period: 8/1/2024 - 7/31/2027
 * Current Year (Y2): 8/4/2024 - 8/2/2025
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// IBEW Local 40 Year 2 rates (8/4/2024 - 8/2/2025)
const LOCAL40_RATES = [
  // ============================================
  // STUDIO (Other than Lab) - Year 2
  // ============================================

  // FOREMEN (Weekly)
  { job_classification: 'Electrical Foreman', rate_type: 'weekly', base_rate: 3107.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sound Installation Foreman', rate_type: 'weekly', base_rate: 3107.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Maintenance Foreman', rate_type: 'weekly', base_rate: 3107.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Foreman', rate_type: 'weekly', base_rate: 3107.54, production_type: 'theatrical', location: 'Los Angeles' },

  // GANG BOSSES (Hourly)
  { job_classification: 'Electrical Gang Boss', rate_type: 'hourly', base_rate: 54.75, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Gang Boss', rate_type: 'hourly', base_rate: 54.75, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Electronic Gang Boss', rate_type: 'hourly', base_rate: 56.01, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Construction Gang Boss', rate_type: 'hourly', base_rate: 59.89, production_type: 'theatrical', location: 'Los Angeles' },

  // OTHER CLASSIFICATIONS (Hourly)
  { job_classification: 'Cable Splicer', rate_type: 'hourly', base_rate: 53.95, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Electronic Technician', rate_type: 'hourly', base_rate: 53.13, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Journeyman Wireman', rate_type: 'hourly', base_rate: 51.11, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Engineer', rate_type: 'hourly', base_rate: 51.11, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Production Van Driver/Operator', rate_type: 'hourly', base_rate: 56.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sound Installation/Maintenance Man', rate_type: 'hourly', base_rate: 59.11, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sound Gang Boss', rate_type: 'hourly', base_rate: 63.65, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // ONE-HOUR EPISODIC TV / PILOTS - Year 2
  // (3% reduction from studio rates)
  // ============================================

  // FOREMEN (Weekly)
  { job_classification: 'Electrical Foreman', rate_type: 'weekly', base_rate: 3014.31, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sound Installation Foreman', rate_type: 'weekly', base_rate: 3014.31, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Maintenance Foreman', rate_type: 'weekly', base_rate: 3014.31, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Foreman', rate_type: 'weekly', base_rate: 3014.31, production_type: 'television', location: 'Los Angeles' },

  // GANG BOSSES (Hourly)
  { job_classification: 'Electrical Gang Boss', rate_type: 'hourly', base_rate: 53.11, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Gang Boss', rate_type: 'hourly', base_rate: 53.11, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Electronic Gang Boss', rate_type: 'hourly', base_rate: 54.33, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Construction Gang Boss', rate_type: 'hourly', base_rate: 58.09, production_type: 'television', location: 'Los Angeles' },

  // OTHER CLASSIFICATIONS (Hourly)
  { job_classification: 'Cable Splicer', rate_type: 'hourly', base_rate: 52.33, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Electronic Technician', rate_type: 'hourly', base_rate: 51.54, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Journeyman Wireman', rate_type: 'hourly', base_rate: 49.58, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Engineer', rate_type: 'hourly', base_rate: 49.58, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Production Van Driver/Operator', rate_type: 'hourly', base_rate: 54.84, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sound Installation/Maintenance Man', rate_type: 'hourly', base_rate: 57.34, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sound Gang Boss', rate_type: 'hourly', base_rate: 61.74, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // LONG-FORM TV (MOWs) - Year 2
  // (10% reduction from studio rates)
  // ============================================

  // FOREMEN (Weekly)
  { job_classification: 'Electrical Foreman', rate_type: 'weekly', base_rate: 2796.79, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Sound Installation Foreman', rate_type: 'weekly', base_rate: 2796.79, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Maintenance Foreman', rate_type: 'weekly', base_rate: 2796.79, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Foreman', rate_type: 'weekly', base_rate: 2796.79, production_type: 'long_form_tv', location: 'Los Angeles' },

  // GANG BOSSES (Hourly)
  { job_classification: 'Electrical Gang Boss', rate_type: 'hourly', base_rate: 49.28, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Gang Boss', rate_type: 'hourly', base_rate: 49.28, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Electronic Gang Boss', rate_type: 'hourly', base_rate: 50.41, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Construction Gang Boss', rate_type: 'hourly', base_rate: 53.90, production_type: 'long_form_tv', location: 'Los Angeles' },

  // OTHER CLASSIFICATIONS (Hourly)
  { job_classification: 'Cable Splicer', rate_type: 'hourly', base_rate: 48.56, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Electronic Technician', rate_type: 'hourly', base_rate: 47.82, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Journeyman Wireman', rate_type: 'hourly', base_rate: 46.00, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Air Conditioning Engineer', rate_type: 'hourly', base_rate: 46.00, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Production Van Driver/Operator', rate_type: 'hourly', base_rate: 50.89, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Sound Installation/Maintenance Man', rate_type: 'hourly', base_rate: 53.20, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Sound Gang Boss', rate_type: 'hourly', base_rate: 57.29, production_type: 'long_form_tv', location: 'Los Angeles' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing IBEW Local 40 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'IBEW Local 40'`);

    console.log(`Inserting ${LOCAL40_RATES.length} IBEW Local 40 rates...`);

    let inserted = 0;
    for (const rate of LOCAL40_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'IBEW Local 40',
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

    console.log(`Successfully inserted ${inserted} rates for IBEW Local 40`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'IBEW Local 40'
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
