/**
 * IATSE Local USA829 2025-28 Wage Scale Rate Extraction
 * Scenic Artists (Art Directors, Costume Designers, Scenic Artists)
 * Source: 2025-28 Local USA829 Wage Rates
 * Coverage: NY, NJ, CT, Philadelphia area
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// IATSE Local USA829 2025-28 Wage Scales
// Contract Period: 3/3/2024 - 3/4/2028 (4 years)
// Year 2: 3/9/2025 - 3/7/2026 (Current/Upcoming)
// Year 3: 3/8/2026 - 3/6/2027
// Note: USA829 uses 5-day weekly rates
const LOCALUSA829_RATES = [
  // ===========================================
  // THEATRICAL MOTION PICTURES - Article 10.(a)(1)(A)(i)
  // ===========================================

  // Art Director - Theatrical
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5798.31, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },

  // Costume Designer - Theatrical
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 5798.31, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },

  // Scenic Artist (Charge) - Theatrical
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 744.54, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 774.32, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'weekly', base_rate: 3355.48, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'weekly', base_rate: 3489.70, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },

  // Scenic Artist (Journey) - Theatrical
  { job_classification: 'Scenic Artist', rate_type: 'daily', base_rate: 663.57, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Scenic Artist', rate_type: 'daily', base_rate: 690.11, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Scenic Artist', rate_type: 'weekly', base_rate: 2990.47, effective_date: '2025-03-09', contract_year: 2, production_type: 'theatrical', location: 'New York' },
  { job_classification: 'Scenic Artist', rate_type: 'weekly', base_rate: 3110.09, effective_date: '2026-03-08', contract_year: 3, production_type: 'theatrical', location: 'New York' },

  // ===========================================
  // TELEVISION (Excluding Long-Form, Pilots, 1-Hr Series) - Article 10.(a)(1)(B)(i)
  // ===========================================

  // Art Director - Television
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5798.31, effective_date: '2026-03-08', contract_year: 3, production_type: 'television', location: 'New York' },

  // Costume Designer - Television
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },

  // Charge Scenic Artist - Television
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 744.54, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'weekly', base_rate: 3355.48, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },

  // Scenic Artist - Television
  { job_classification: 'Scenic Artist', rate_type: 'daily', base_rate: 663.57, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },
  { job_classification: 'Scenic Artist', rate_type: 'weekly', base_rate: 2990.47, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York' },

  // ===========================================
  // EXISTING ONE-HOUR SERIES (Pre-2007) - Article 10.(a)(2)(A)(i)
  // ===========================================

  { job_classification: 'Art Director - Existing 1Hr Series', rate_type: 'weekly', base_rate: 5418.75, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },
  { job_classification: 'Costume Designer - Existing 1Hr Series', rate_type: 'weekly', base_rate: 5418.75, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },
  { job_classification: 'Charge Scenic Artist - Existing 1Hr Series', rate_type: 'daily', base_rate: 723.49, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },
  { job_classification: 'Charge Scenic Artist - Existing 1Hr Series', rate_type: 'weekly', base_rate: 3260.59, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },
  { job_classification: 'Scenic Artist - Existing 1Hr Series', rate_type: 'daily', base_rate: 644.83, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },
  { job_classification: 'Scenic Artist - Existing 1Hr Series', rate_type: 'weekly', base_rate: 2906.00, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'Existing 1-Hour Series' },

  // ===========================================
  // NEW ONE-HOUR SERIES 1st/2nd Season - Article 10.(a)(2)(A)(ii)
  // ===========================================

  { job_classification: 'Art Director - New 1Hr Series 1st/2nd Season', rate_type: 'weekly', base_rate: 5412.38, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Costume Designer - New 1Hr Series 1st/2nd Season', rate_type: 'weekly', base_rate: 5412.38, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Charge Scenic Artist - New 1Hr Series 1st/2nd Season', rate_type: 'daily', base_rate: 722.64, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Charge Scenic Artist - New 1Hr Series 1st/2nd Season', rate_type: 'weekly', base_rate: 3256.77, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Scenic Artist - New 1Hr Series 1st/2nd Season', rate_type: 'daily', base_rate: 644.07, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Scenic Artist - New 1Hr Series 1st/2nd Season', rate_type: 'weekly', base_rate: 2902.61, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 1st/2nd Season' },

  // ===========================================
  // NEW ONE-HOUR SERIES 3rd+ Season
  // ===========================================

  { job_classification: 'Art Director - New 1Hr Series 3rd+ Season', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Costume Designer - New 1Hr Series 3rd+ Season', rate_type: 'weekly', base_rate: 5575.30, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Charge Scenic Artist - New 1Hr Series 3rd+ Season', rate_type: 'daily', base_rate: 744.54, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Charge Scenic Artist - New 1Hr Series 3rd+ Season', rate_type: 'weekly', base_rate: 3355.48, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Scenic Artist - New 1Hr Series 3rd+ Season', rate_type: 'daily', base_rate: 663.57, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Scenic Artist - New 1Hr Series 3rd+ Season', rate_type: 'weekly', base_rate: 2990.47, effective_date: '2025-03-09', contract_year: 2, production_type: 'television', location: 'New York', tier: 'New 1-Hour Series 3rd+ Season' },

  // ===========================================
  // LONG-FORM TV / PILOTS - Article 10.(a)(3)
  // ===========================================

  { job_classification: 'Art Director - Pilot/Long-Form', rate_type: 'weekly', base_rate: 5138.27, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Art Director - Pilot/Long-Form', rate_type: 'weekly', base_rate: 5343.80, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Costume Designer - Pilot/Long-Form', rate_type: 'weekly', base_rate: 5138.27, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Costume Designer - Pilot/Long-Form', rate_type: 'weekly', base_rate: 5343.80, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },

  { job_classification: 'Charge Scenic Artist - Pilot/Long-Form', rate_type: 'daily', base_rate: 686.11, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Pilot/Long-Form', rate_type: 'daily', base_rate: 713.55, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Pilot/Long-Form', rate_type: 'weekly', base_rate: 3092.04, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Pilot/Long-Form', rate_type: 'weekly', base_rate: 3215.72, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },

  { job_classification: 'Scenic Artist - Pilot/Long-Form', rate_type: 'daily', base_rate: 611.59, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Scenic Artist - Pilot/Long-Form', rate_type: 'daily', base_rate: 636.05, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Scenic Artist - Pilot/Long-Form', rate_type: 'weekly', base_rate: 2756.17, effective_date: '2025-03-09', contract_year: 2, production_type: 'pilot', location: 'New York' },
  { job_classification: 'Scenic Artist - Pilot/Long-Form', rate_type: 'weekly', base_rate: 2866.41, effective_date: '2026-03-08', contract_year: 3, production_type: 'pilot', location: 'New York' },

  // ===========================================
  // SUPPLEMENTAL DIGITAL - Non-Prime Time Dramatic
  // ===========================================

  // Note: Art Directors and Costume Designers often negotiate flat rates
  // These are base minimum rates for scenic artists on digital productions
  { job_classification: 'Charge Scenic Artist - Digital', rate_type: 'daily', base_rate: 481, effective_date: '2024-09-29', contract_year: 2, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Digital', rate_type: 'daily', base_rate: 500, effective_date: '2025-09-28', contract_year: 3, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Digital', rate_type: 'weekly', base_rate: 2220, effective_date: '2024-09-29', contract_year: 2, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Charge Scenic Artist - Digital', rate_type: 'weekly', base_rate: 2309, effective_date: '2025-09-28', contract_year: 3, production_type: 'digital_dramatic', location: 'New York' },

  { job_classification: 'Scenic Artist - Digital', rate_type: 'daily', base_rate: 428, effective_date: '2024-09-29', contract_year: 2, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Scenic Artist - Digital', rate_type: 'daily', base_rate: 445, effective_date: '2025-09-28', contract_year: 3, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Scenic Artist - Digital', rate_type: 'weekly', base_rate: 1979, effective_date: '2024-09-29', contract_year: 2, production_type: 'digital_dramatic', location: 'New York' },
  { job_classification: 'Scenic Artist - Digital', rate_type: 'weekly', base_rate: 2058, effective_date: '2025-09-28', contract_year: 3, production_type: 'digital_dramatic', location: 'New York' },
];

async function insertLocalUSA829Rates() {
  const client = await pool.connect();

  try {
    console.log('Starting IATSE Local USA829 rate insertion...');

    // Delete existing USA829 rates from 2024+ to avoid duplicates
    const deleteResult = await client.query(`
      DELETE FROM rate_cards
      WHERE union_local = 'IATSE Local USA829'
      AND effective_date >= '2024-09-29'
    `);
    console.log(`Cleared ${deleteResult.rowCount} existing Local USA829 rates from 2024+`);

    let insertedCount = 0;

    for (const rate of LOCALUSA829_RATES) {
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
        'IATSE Local USA829',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        rate.location || 'New York',
        rate.production_type || 'theatrical',
        rate.effective_date,
        rate.contract_year,
        rate.tier || null,
        JSON.stringify({ source: 'AMPTP 2025-28 Local USA829 Agreement' })
      ]);

      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} IATSE Local USA829 rate cards`);

    // Verify insertion
    const result = await client.query(`
      SELECT COUNT(*) as count,
             MIN(effective_date) as earliest,
             MAX(effective_date) as latest
      FROM rate_cards
      WHERE union_local = 'IATSE Local USA829'
    `);
    console.log('IATSE Local USA829 rate cards summary:', result.rows[0]);

  } catch (error) {
    console.error('Error inserting USA829 rates:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  insertLocalUSA829Rates()
    .then(() => {
      console.log('IATSE Local USA829 rate insertion complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to insert USA829 rates:', error);
      process.exit(1);
    });
}

module.exports = { insertLocalUSA829Rates, LOCALUSA829_RATES };
