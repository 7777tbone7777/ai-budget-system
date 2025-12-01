/**
 * Local 724 (Studio Utility Employees) 2024-27 Wage Scale Rate Extraction
 * Source: AMPTP 2024-27 Local #724 Wage Schedules
 * Contract Period: 8/1/2024 - 7/31/2027
 * Current Year (Y2): 8/4/2024 - 8/2/2025
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Local 724 Year 2 rates (8/4/2024 - 8/2/2025)
const LOCAL724_RATES = [
  // ============================================
  // STUDIO MINIMUM RATES - Year 2
  // ============================================
  { job_classification: 'Laborer Foreperson', rate_type: 'hourly', base_rate: 47.19, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson (Lead)', rate_type: 'hourly', base_rate: 48.60, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson', rate_type: 'weekly', base_rate: 2551.07, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Laborer Gang Boss', rate_type: 'hourly', base_rate: 43.99, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Gardener Gang Boss', rate_type: 'hourly', base_rate: 47.85, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Laborer', rate_type: 'hourly', base_rate: 41.98, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Entry Level Employee', rate_type: 'hourly', base_rate: 25.19, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Pot Washer (Paint)', rate_type: 'hourly', base_rate: 43.27, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Concrete Tender', rate_type: 'hourly', base_rate: 44.72, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Plaster Tender (Hod Carrier)', rate_type: 'hourly', base_rate: 44.72, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sand Blaster', rate_type: 'hourly', base_rate: 43.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Roofer', rate_type: 'hourly', base_rate: 43.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Tar Pot Man', rate_type: 'hourly', base_rate: 43.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Pneumatic Tool Operator', rate_type: 'hourly', base_rate: 43.99, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Horticulturist', rate_type: 'hourly', base_rate: 45.20, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Gardener', rate_type: 'hourly', base_rate: 42.77, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Toolroom Keeper', rate_type: 'hourly', base_rate: 43.27, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // ONE-HOUR EPISODIC TV / PILOTS - Year 2
  // ============================================
  { job_classification: 'Laborer Foreperson', rate_type: 'hourly', base_rate: 45.77, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson (Lead)', rate_type: 'hourly', base_rate: 47.14, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson', rate_type: 'weekly', base_rate: 2474.54, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Laborer Gang Boss', rate_type: 'hourly', base_rate: 42.67, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Gardener Gang Boss', rate_type: 'hourly', base_rate: 46.41, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Laborer', rate_type: 'hourly', base_rate: 40.72, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Entry Level Employee', rate_type: 'hourly', base_rate: 24.43, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Pot Washer (Paint)', rate_type: 'hourly', base_rate: 41.97, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Concrete Tender', rate_type: 'hourly', base_rate: 43.38, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Plaster Tender (Hod Carrier)', rate_type: 'hourly', base_rate: 43.38, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sand Blaster', rate_type: 'hourly', base_rate: 42.25, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Roofer', rate_type: 'hourly', base_rate: 42.25, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Tar Pot Man', rate_type: 'hourly', base_rate: 42.25, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Pneumatic Tool Operator', rate_type: 'hourly', base_rate: 42.67, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Horticulturist', rate_type: 'hourly', base_rate: 43.84, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Gardener', rate_type: 'hourly', base_rate: 41.49, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Toolroom Keeper', rate_type: 'hourly', base_rate: 41.97, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // LONG-FORM TV (MOWs - not basic cable) - Year 2
  // ============================================
  { job_classification: 'Laborer Foreperson', rate_type: 'hourly', base_rate: 42.47, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson (Lead)', rate_type: 'hourly', base_rate: 43.74, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Laborer Foreperson', rate_type: 'weekly', base_rate: 2295.96, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Laborer Gang Boss', rate_type: 'hourly', base_rate: 39.59, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Gardener Gang Boss', rate_type: 'hourly', base_rate: 43.07, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Laborer', rate_type: 'hourly', base_rate: 37.78, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Entry Level Employee', rate_type: 'hourly', base_rate: 22.67, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Pot Washer (Paint)', rate_type: 'hourly', base_rate: 38.94, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Concrete Tender', rate_type: 'hourly', base_rate: 40.25, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Plaster Tender (Hod Carrier)', rate_type: 'hourly', base_rate: 40.25, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Sand Blaster', rate_type: 'hourly', base_rate: 39.20, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Roofer', rate_type: 'hourly', base_rate: 39.20, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Tar Pot Man', rate_type: 'hourly', base_rate: 39.20, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Pneumatic Tool Operator', rate_type: 'hourly', base_rate: 39.59, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Horticulturist', rate_type: 'hourly', base_rate: 40.68, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Gardener', rate_type: 'hourly', base_rate: 38.49, production_type: 'long_form_tv', location: 'Los Angeles' },
  { job_classification: 'Toolroom Keeper', rate_type: 'hourly', base_rate: 38.94, production_type: 'long_form_tv', location: 'Los Angeles' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing Local 724 rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'Local 724'`);

    console.log(`Inserting ${LOCAL724_RATES.length} Local 724 rates...`);

    let inserted = 0;
    for (const rate of LOCAL724_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'Local 724',
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

    console.log(`Successfully inserted ${inserted} rates for Local 724`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'Local 724'
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
