/**
 * DGA 2023-26 Basic Agreement Rate Extraction
 * Extracts rates from the AMPTP wage scale PDFs and inserts into database
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// DGA 2023-26 Basic Agreement Rates
// Source: AMPTP 2023-26 DGA Basic Agreement Wage Tables
const DGA_RATES = [
  // ===========================================
  // DIRECTORS - THEATRICAL (Freelance per week)
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025) - Current
  { job_classification: 'Director - Theatrical Low Budget', rate_type: 'weekly', base_rate: 14934, effective_date: '2024-07-01', contract_year: 2, tier: 'Low Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical Medium Budget', rate_type: 'weekly', base_rate: 16974, effective_date: '2024-07-01', contract_year: 2, tier: 'Medium Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical High Budget', rate_type: 'weekly', base_rate: 23767, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical Term', rate_type: 'weekly', base_rate: 14934, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Director - Trailers/Talent Tests/Promos', rate_type: 'weekly', base_rate: 16974, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Director - Shorts & Documentaries', rate_type: 'weekly', base_rate: 16974, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates (7/1/2025 - 6/30/2026)
  { job_classification: 'Director - Theatrical Low Budget', rate_type: 'weekly', base_rate: 15457, effective_date: '2025-07-01', contract_year: 3, tier: 'Low Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical Medium Budget', rate_type: 'weekly', base_rate: 17568, effective_date: '2025-07-01', contract_year: 3, tier: 'Medium Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical High Budget', rate_type: 'weekly', base_rate: 24599, effective_date: '2025-07-01', contract_year: 3, tier: 'High Budget', production_type: 'theatrical' },
  { job_classification: 'Director - Theatrical Term', rate_type: 'weekly', base_rate: 15457, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },

  // ===========================================
  // DIRECTORS - NETWORK PRIME TIME TV
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Director - Network Prime Time 1/2 Hour', rate_type: 'episode', base_rate: 32642, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 1 Hour', rate_type: 'episode', base_rate: 55434, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 1.5 Hours', rate_type: 'episode', base_rate: 92393, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 2 Hours', rate_type: 'episode', base_rate: 155213, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },

  // Year 3 rates (7/1/2025 - 6/30/2026)
  { job_classification: 'Director - Network Prime Time 1/2 Hour', rate_type: 'episode', base_rate: 33784, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 1 Hour', rate_type: 'episode', base_rate: 57374, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 1.5 Hours', rate_type: 'episode', base_rate: 95627, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },
  { job_classification: 'Director - Network Prime Time 2 Hours', rate_type: 'episode', base_rate: 160645, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },

  // ===========================================
  // DIRECTORS - NON-NETWORK/NON-PRIME TIME
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Director - Non-Network Term Contract', rate_type: 'weekly', base_rate: 12206, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network Trailers/Promos Weekly', rate_type: 'weekly', base_rate: 12206, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network Trailers/Promos Daily', rate_type: 'daily', base_rate: 3052, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network 8-15 Minutes', rate_type: 'episode', base_rate: 14666, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network 16-30 Minutes', rate_type: 'episode', base_rate: 14666, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network 1 Hour', rate_type: 'episode', base_rate: 29321, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network 90 Minutes', rate_type: 'episode', base_rate: 43994, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },
  { job_classification: 'Director - Non-Network 91-120 Minutes', rate_type: 'episode', base_rate: 61254, effective_date: '2024-07-01', contract_year: 2, production_type: 'television' },

  // Year 3 rates
  { job_classification: 'Director - Non-Network Term Contract', rate_type: 'weekly', base_rate: 12633, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },
  { job_classification: 'Director - Non-Network 1 Hour', rate_type: 'episode', base_rate: 30347, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },
  { job_classification: 'Director - Non-Network 90 Minutes', rate_type: 'episode', base_rate: 45534, effective_date: '2025-07-01', contract_year: 3, production_type: 'television' },

  // ===========================================
  // DIRECTORS - PILOT AND SPINOFF FILMS
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Director - Pilot Network Prime Time 1/2 Hour', rate_type: 'episode', base_rate: 92393, effective_date: '2024-07-01', contract_year: 2, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 1 Hour', rate_type: 'episode', base_rate: 123185, effective_date: '2024-07-01', contract_year: 2, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 1.5 Hours', rate_type: 'episode', base_rate: 153970, effective_date: '2024-07-01', contract_year: 2, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 2 Hours', rate_type: 'episode', base_rate: 215572, effective_date: '2024-07-01', contract_year: 2, production_type: 'pilot' },

  // Year 3 rates
  { job_classification: 'Director - Pilot Network Prime Time 1/2 Hour', rate_type: 'episode', base_rate: 95627, effective_date: '2025-07-01', contract_year: 3, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 1 Hour', rate_type: 'episode', base_rate: 127496, effective_date: '2025-07-01', contract_year: 3, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 1.5 Hours', rate_type: 'episode', base_rate: 159359, effective_date: '2025-07-01', contract_year: 3, production_type: 'pilot' },
  { job_classification: 'Director - Pilot Network Prime Time 2 Hours', rate_type: 'episode', base_rate: 223117, effective_date: '2025-07-01', contract_year: 3, production_type: 'pilot' },

  // ===========================================
  // UPMs, ADs, ASSOCIATE DIRECTORS - STUDIO
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Unit Production Manager (UPM) - Studio', rate_type: 'weekly', base_rate: 6784, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: '1st Assistant Director - Studio', rate_type: 'weekly', base_rate: 6450, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Key 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 4322, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: '2nd 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 4080, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Additional 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 2484, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates
  { job_classification: 'Unit Production Manager (UPM) - Studio', rate_type: 'weekly', base_rate: 7021, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: '1st Assistant Director - Studio', rate_type: 'weekly', base_rate: 6676, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'Key 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 4473, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: '2nd 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 4223, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'Additional 2nd Assistant Director - Studio', rate_type: 'weekly', base_rate: 2571, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },

  // ===========================================
  // UPMs, ADs - DISTANT LOCATION
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Unit Production Manager (UPM) - Distant Location', rate_type: 'weekly', base_rate: 9498, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: '1st Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 9022, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Key 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 6040, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: '2nd 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 5705, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Additional 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 3484, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates
  { job_classification: 'Unit Production Manager (UPM) - Distant Location', rate_type: 'weekly', base_rate: 9830, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: '1st Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 9338, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'Key 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 6251, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: '2nd 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 5905, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'Additional 2nd Assistant Director - Distant Location', rate_type: 'weekly', base_rate: 3606, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },

  // ===========================================
  // PRODUCTION FEES - STUDIO
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'UPM Production Fee - Studio', rate_type: 'weekly', base_rate: 1471, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: '1st AD Production Fee - Studio', rate_type: 'weekly', base_rate: 1197, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Key 2nd AD Production Fee - Studio', rate_type: 'weekly', base_rate: 911, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates
  { job_classification: 'UPM Production Fee - Studio', rate_type: 'weekly', base_rate: 1522, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: '1st AD Production Fee - Studio', rate_type: 'weekly', base_rate: 1239, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'Key 2nd AD Production Fee - Studio', rate_type: 'weekly', base_rate: 943, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },

  // ===========================================
  // DGA TRAINEE PROGRAM
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'DGA Trainee - 1st Period', rate_type: 'hourly', base_rate: 16.77, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 2nd Period', rate_type: 'hourly', base_rate: 18.02, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 3rd Period', rate_type: 'hourly', base_rate: 19.31, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 4th Period', rate_type: 'hourly', base_rate: 20.60, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates
  { job_classification: 'DGA Trainee - 1st Period', rate_type: 'hourly', base_rate: 17.36, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 2nd Period', rate_type: 'hourly', base_rate: 18.65, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 3rd Period', rate_type: 'hourly', base_rate: 19.99, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
  { job_classification: 'DGA Trainee - 4th Period', rate_type: 'hourly', base_rate: 21.32, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },

  // ===========================================
  // HIGH BUDGET SVOD (20M+ Subscribers)
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Director - SVOD 20-35 Min (Budget $2.1M+)', rate_type: 'episode', base_rate: 32661, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 20-35 Min (Budget $1.03-2.1M)', rate_type: 'episode', base_rate: 18509, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 36-65 Min (Budget $3.8M+)', rate_type: 'episode', base_rate: 59168, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 36-65 Min (Budget $1.75-3.8M)', rate_type: 'episode', base_rate: 37020, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 66-95 Min (Budget $4M+)', rate_type: 'episode', base_rate: 92446, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 96+ Min (Budget $4.5M+)', rate_type: 'episode', base_rate: 155301, effective_date: '2024-07-01', contract_year: 2, tier: 'High Budget SVOD', production_type: 'streaming' },

  // Year 3 rates
  { job_classification: 'Director - SVOD 20-35 Min (Budget $2.1M+)', rate_type: 'episode', base_rate: 33804, effective_date: '2025-07-01', contract_year: 3, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 36-65 Min (Budget $3.8M+)', rate_type: 'episode', base_rate: 61239, effective_date: '2025-07-01', contract_year: 3, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 66-95 Min (Budget $4M+)', rate_type: 'episode', base_rate: 95682, effective_date: '2025-07-01', contract_year: 3, tier: 'High Budget SVOD', production_type: 'streaming' },
  { job_classification: 'Director - SVOD 96+ Min (Budget $4.5M+)', rate_type: 'episode', base_rate: 160737, effective_date: '2025-07-01', contract_year: 3, tier: 'High Budget SVOD', production_type: 'streaming' },

  // ===========================================
  // BASIC CABLE PROGRAMS
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Director - Basic Cable 1/2 Hour (Budget $550K-1.6M)', rate_type: 'episode', base_rate: 14666, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1/2 Hour S2+ (Budget $1.6-2.1M)', rate_type: 'episode', base_rate: 18498, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1/2 Hour S2+ (Budget $2.1M+)', rate_type: 'episode', base_rate: 21596, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1 Hour (Budget $1.2-3M)', rate_type: 'episode', base_rate: 29321, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1 Hour S1 (Budget $3M+)', rate_type: 'episode', base_rate: 30179, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1 Hour S2+ (Budget $3M+)', rate_type: 'episode', base_rate: 41931, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 90 Minutes', rate_type: 'episode', base_rate: 43994, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 2 Hours', rate_type: 'episode', base_rate: 105135, effective_date: '2024-07-01', contract_year: 2, tier: 'Basic Cable', production_type: 'cable' },

  // Year 3 rates
  { job_classification: 'Director - Basic Cable 1/2 Hour (Budget $550K-1.6M)', rate_type: 'episode', base_rate: 15179, effective_date: '2025-07-01', contract_year: 3, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1 Hour (Budget $1.2-3M)', rate_type: 'episode', base_rate: 30347, effective_date: '2025-07-01', contract_year: 3, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 1 Hour S2+ (Budget $3M+)', rate_type: 'episode', base_rate: 43399, effective_date: '2025-07-01', contract_year: 3, tier: 'Basic Cable', production_type: 'cable' },
  { job_classification: 'Director - Basic Cable 2 Hours', rate_type: 'episode', base_rate: 108815, effective_date: '2025-07-01', contract_year: 3, tier: 'Basic Cable', production_type: 'cable' },

  // ===========================================
  // ALLOWANCES
  // ===========================================
  // Year 2 rates (7/1/2024 - 6/30/2025)
  { job_classification: 'Distant Location Allowance', rate_type: 'daily', base_rate: 24, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Wrap Supervision Allowance', rate_type: 'daily', base_rate: 62, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Aircraft Flight Allowance', rate_type: 'daily', base_rate: 194, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Underwater Work Allowance', rate_type: 'daily', base_rate: 194, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Dinner Allowance', rate_type: 'daily', base_rate: 33, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },
  { job_classification: 'Holiday/7th Day Worked Premium', rate_type: 'daily', base_rate: 4264, effective_date: '2024-07-01', contract_year: 2, production_type: 'theatrical' },

  // Year 3 rates
  { job_classification: 'Holiday/7th Day Worked Premium', rate_type: 'daily', base_rate: 4413, effective_date: '2025-07-01', contract_year: 3, production_type: 'theatrical' },
];

async function insertDGARates() {
  const client = await pool.connect();

  try {
    console.log('Starting DGA rate insertion...');

    // First, delete existing DGA rates to avoid duplicates
    await client.query(`
      DELETE FROM rate_cards
      WHERE union_local = 'DGA'
      AND effective_date >= '2024-07-01'
    `);
    console.log('Cleared existing DGA rates from 2024+');

    let insertedCount = 0;

    for (const rate of DGA_RATES) {
      const query = `
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          location, production_type, effective_date, contract_year,
          tier, special_provisions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
        DO UPDATE SET base_rate = EXCLUDED.base_rate, contract_year = EXCLUDED.contract_year
      `;

      await client.query(query, [
        'DGA',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        'Los Angeles', // Default location
        rate.production_type || 'theatrical',
        rate.effective_date,
        rate.contract_year,
        rate.tier || null,
        JSON.stringify({ source: 'AMPTP 2023-26 DGA Basic Agreement' })
      ]);

      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} DGA rate cards`);

    // Verify insertion
    const result = await client.query(`
      SELECT COUNT(*) as count,
             MIN(effective_date) as earliest,
             MAX(effective_date) as latest
      FROM rate_cards
      WHERE union_local = 'DGA'
    `);
    console.log('DGA rate cards summary:', result.rows[0]);

  } catch (error) {
    console.error('Error inserting DGA rates:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  insertDGARates()
    .then(() => {
      console.log('DGA rate insertion complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to insert DGA rates:', error);
      process.exit(1);
    });
}

module.exports = { insertDGARates, DGA_RATES };
