/**
 * Local 755 (Operative Plasterers and Cement Masons) 2024-27 Wage Scale Rate Extraction
 * Source: AMPTP 2024-27 Local #755 Wage Schedules
 * Contract Period: 8/1/2024 - 7/31/2027
 * Current Year (Y2): 8/4/2024 - 8/2/2025
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Local 755 Year 2 rates (8/4/2024 - 8/2/2025)
const LOCAL755_RATES = [
  // ============================================
  // STUDIO MINIMUM RATES - Year 2 (Page 2)
  // ============================================
  { job_classification: 'Plasterer Foreman', rate_type: 'hourly', base_rate: 58.03, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Plasterer Foreman', rate_type: 'weekly', base_rate: 3146.09, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Modeler Gang Boss', rate_type: 'hourly', base_rate: 66.74, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Artist', rate_type: 'hourly', base_rate: 64.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sculptor', rate_type: 'hourly', base_rate: 64.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Modeler', rate_type: 'hourly', base_rate: 64.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Plasterer Gang Boss', rate_type: 'hourly', base_rate: 55.14, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Model Maker Gang Boss', rate_type: 'hourly', base_rate: 55.14, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Plasterer', rate_type: 'hourly', base_rate: 52.50, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Model Maker', rate_type: 'hourly', base_rate: 52.50, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Mouldmaker', rate_type: 'hourly', base_rate: 52.50, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Caster', rate_type: 'hourly', base_rate: 51.11, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Cement Finisher', rate_type: 'hourly', base_rate: 51.11, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Improver', rate_type: 'hourly', base_rate: 46.84, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Helper', rate_type: 'hourly', base_rate: 44.74, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Standby or Keyman', rate_type: 'hourly', base_rate: 52.50, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // ONE-HOUR EPISODIC TV / PILOTS - Year 2 (Page 11)
  // ============================================
  { job_classification: 'Plasterer Foreman', rate_type: 'hourly', base_rate: 56.29, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Plasterer Foreman', rate_type: 'weekly', base_rate: 3051.71, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Modeler Gang Boss', rate_type: 'hourly', base_rate: 64.74, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Artist', rate_type: 'hourly', base_rate: 62.62, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sculptor', rate_type: 'hourly', base_rate: 62.62, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Modeler', rate_type: 'hourly', base_rate: 62.62, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Plasterer Gang Boss', rate_type: 'hourly', base_rate: 53.49, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Model Maker Gang Boss', rate_type: 'hourly', base_rate: 53.49, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Plasterer', rate_type: 'hourly', base_rate: 50.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Model Maker', rate_type: 'hourly', base_rate: 50.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Mouldmaker', rate_type: 'hourly', base_rate: 50.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Caster', rate_type: 'hourly', base_rate: 49.58, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Cement Finisher', rate_type: 'hourly', base_rate: 49.58, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Improver', rate_type: 'hourly', base_rate: 45.43, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Helper', rate_type: 'hourly', base_rate: 43.40, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Standby or Keyman', rate_type: 'hourly', base_rate: 50.93, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // LONG-FORM TV (MOWs - not basic cable) - Year 2 (Page 20)
  // ============================================
  { job_classification: 'Plasterer Foreman', rate_type: 'hourly', base_rate: 52.23, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Plasterer Foreman', rate_type: 'weekly', base_rate: 2831.48, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Modeler Gang Boss', rate_type: 'hourly', base_rate: 60.07, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Artist', rate_type: 'hourly', base_rate: 58.10, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Sculptor', rate_type: 'hourly', base_rate: 58.10, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Modeler', rate_type: 'hourly', base_rate: 58.10, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Plasterer Gang Boss', rate_type: 'hourly', base_rate: 49.63, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Model Maker Gang Boss', rate_type: 'hourly', base_rate: 49.63, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Plasterer', rate_type: 'hourly', base_rate: 47.25, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Model Maker', rate_type: 'hourly', base_rate: 47.25, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Mouldmaker', rate_type: 'hourly', base_rate: 47.25, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Caster', rate_type: 'hourly', base_rate: 46.00, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Cement Finisher', rate_type: 'hourly', base_rate: 46.00, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Improver', rate_type: 'hourly', base_rate: 42.16, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Helper', rate_type: 'hourly', base_rate: 40.27, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Standby or Keyman', rate_type: 'hourly', base_rate: 47.25, production_type: 'long_form_tv', location: 'Los Angeles' },

  // ============================================
  // BASIC CABLE - Year 2 (Page 21)
  // ============================================
  { job_classification: 'Plasterer Foreman', rate_type: 'hourly', base_rate: 50.78, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Plasterer Foreman', rate_type: 'weekly', base_rate: 2752.83, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Modeler Gang Boss', rate_type: 'hourly', base_rate: 58.40, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Artist', rate_type: 'hourly', base_rate: 56.49, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Sculptor', rate_type: 'hourly', base_rate: 56.49, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Modeler', rate_type: 'hourly', base_rate: 56.49, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Plasterer Gang Boss', rate_type: 'hourly', base_rate: 48.25, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Model Maker Gang Boss', rate_type: 'hourly', base_rate: 48.25, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Plasterer', rate_type: 'hourly', base_rate: 45.94, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Model Maker', rate_type: 'hourly', base_rate: 45.94, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Mouldmaker', rate_type: 'hourly', base_rate: 45.94, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Caster', rate_type: 'hourly', base_rate: 44.72, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Cement Finisher', rate_type: 'hourly', base_rate: 44.72, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Improver', rate_type: 'hourly', base_rate: 40.99, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Helper', rate_type: 'hourly', base_rate: 39.15, production_type: 'basic_cable', location: 'Los Angeles' },
  { job_classification: 'Standby or Keyman', rate_type: 'hourly', base_rate: 45.94, production_type: 'basic_cable', location: 'Los Angeles' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing Local 755 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'Local 755'`);

    console.log(`Inserting ${LOCAL755_RATES.length} Local 755 rates...`);

    let inserted = 0;
    for (const rate of LOCAL755_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'Local 755',
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

    console.log(`Successfully inserted ${inserted} rates for Local 755`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'Local 755'
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
