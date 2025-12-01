/**
 * IATSE Local USA 829 (United Scenic Artists) Rate Extraction Script
 * Source: 2024-27 Minimum Wage Rates
 * Contract Period: 10/1/2023 - 9/30/2027
 * Using Year 2 rates: 9/28/2025 - 10/3/2026
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

// USA 829 rates - Year 2 (9/28/2025 - 10/3/2026)
const USA_829_RATES = [
  // ============================================
  // ARTICLE 4.A - THEATRICAL & TV (Excl. Long-Form, Pilots, New 1-Hour Series)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5798.31, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 817.97, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Costume Designer - Theatrical', rate_type: 'weekly', base_rate: 5798.31, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Costume Designer - 1/2 Hour TV', rate_type: 'weekly', base_rate: 5036.73, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 566.19, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 774.32, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 631.47, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 376.85, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },

  // Television Standard
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5798.31, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 817.97, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 566.19, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 774.32, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 631.47, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 376.85, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },

  // ============================================
  // ARTICLE 4.B - ONE-HOUR SERIES (Pre-Sept 2013)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5632.45, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 793.74, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 4894.71, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 539.77, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 751.77, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 613.08, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 366.32, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Pre-2013' },

  // ============================================
  // ARTICLE 4.C.(1) - ONE-HOUR SERIES (Post-Sept 2013, 1st Episode on/after Oct 2024)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5624.36, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 793.43, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 5624.36, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 549.20, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 751.09, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 612.53, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 365.54, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 New Season' },

  // ============================================
  // ARTICLE 4.C.(2) - ONE-HOUR SERIES (Post-Sept 2013, Lagged Rates)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5575.30, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 786.51, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 5575.30, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 544.41, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 744.54, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 607.18, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 362.36, location: 'All Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series Post-2013 Lagged' },

  // ============================================
  // ARTICLE 4.D - LONG-FORM TV & PILOTS (No Firm Commitment)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5342.69, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 751.47, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 4646.54, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 522.33, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 712.38, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 580.90, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 347.94, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },

  // ============================================
  // EXHIBIT 6 - NEW DIGITAL 1/2 HOUR SINGLE CAM DRAMATIC (1st Episode on/after Oct 2024)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5624.36, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 793.43, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 4885.63, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 549.20, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 751.09, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 612.53, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 365.54, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Post-Oct 2024' },

  // ============================================
  // EXHIBIT 6 - NEW DIGITAL 1/2 HOUR SINGLE CAM DRAMATIC (1st Episode before Oct 2024)
  // ============================================
  { job_classification: 'Art Director', rate_type: 'weekly', base_rate: 5575.30, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Asst. Art Director', rate_type: 'daily', base_rate: 786.51, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Costume Designer', rate_type: 'weekly', base_rate: 4843.01, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Asst. Costume Designer', rate_type: 'daily', base_rate: 544.41, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Charge Scenic Artist', rate_type: 'daily', base_rate: 744.54, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Journey Scenic Artist', rate_type: 'daily', base_rate: 607.18, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
  { job_classification: 'Shopperson/Industrial', rate_type: 'daily', base_rate: 362.36, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New Digital 1/2 Hour Pre-Oct 2024' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of USA_829_RATES) {
      const query = `
        INSERT INTO rate_cards (
          union_local,
          job_classification,
          rate_type,
          base_rate,
          effective_date,
          location,
          production_type,
          contract_year,
          tier,
          special_provisions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
        DO NOTHING
        RETURNING id
      `;

      const values = [
        'IATSE Local USA 829',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-09-28',
        rate.location,
        rate.production_type,
        2,
        rate.tier,
        JSON.stringify({
          currency: 'USD',
          source: 'AMPTP IATSE Local USA 829 Wage Scales 2024-27'
        })
      ];

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
        insertedCount++;
        console.log(`Inserted: ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type} - ${rate.tier}`);
      } else {
        skippedCount++;
        console.log(`Skipped (duplicate): ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type}`);
      }
    }

    console.log('\n=== IATSE Local USA 829 Rate Insertion Complete ===');
    console.log(`Total rates processed: ${USA_829_RATES.length}`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Skipped (duplicates): ${skippedCount}`);

  } catch (error) {
    console.error('Error inserting rates:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

insertRates();
