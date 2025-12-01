/**
 * IATSE Local 798 (Make-Up and Hair Stylists) Rate Extraction Script
 * Source: 2025-28 Local 798 Wage Rates
 * Contract Period: 3/3/2024 - 2/29/2028
 * Using Year 2 rates: 3/2/2025 - 2/28/2026
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

// Local 798 rates - Year 2 (3/2/2025 - 2/28/2026)
const LOCAL_798_RATES = [
  // ============================================
  // THEATRICAL & TELEVISION (Excl. Long-Form, Pilots, New 1-Hour Series)
  // Article 11.(a)(1)
  // ============================================
  { job_classification: 'Make-Up Artist Department Head', rate_type: 'daily', base_rate: 598.39, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Hair Stylist Department Head', rate_type: 'daily', base_rate: 598.39, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: '2nd & Additional Make-Up Artist', rate_type: 'daily', base_rate: 565.67, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: '2nd & Additional Hair Stylist', rate_type: 'daily', base_rate: 565.67, location: 'All Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },

  { job_classification: 'Make-Up Artist Department Head', rate_type: 'daily', base_rate: 598.39, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Hair Stylist Department Head', rate_type: 'daily', base_rate: 598.39, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: '2nd & Additional Make-Up Artist', rate_type: 'daily', base_rate: 565.67, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: '2nd & Additional Hair Stylist', rate_type: 'daily', base_rate: 565.67, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Standard' },

  // ============================================
  // NEW ONE-HOUR SERIES (Principal Photography on/after 3/2/2025)
  // Article 11.(a)(2)
  // ============================================
  { job_classification: 'Make-Up Artist Department Head', rate_type: 'daily', base_rate: 580.44, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New 1-Hour Series' },
  { job_classification: 'Hair Stylist Department Head', rate_type: 'daily', base_rate: 580.44, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New 1-Hour Series' },
  { job_classification: '2nd & Additional Make-Up Artist', rate_type: 'daily', base_rate: 548.70, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New 1-Hour Series' },
  { job_classification: '2nd & Additional Hair Stylist', rate_type: 'daily', base_rate: 548.70, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'New 1-Hour Series' },

  // ============================================
  // LONG-FORM TV & PILOTS
  // Article 11.(a)(3)
  // ============================================
  { job_classification: 'Make-Up Artist Department Head', rate_type: 'daily', base_rate: 550.46, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Hair Stylist Department Head', rate_type: 'daily', base_rate: 550.46, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: '2nd & Additional Make-Up Artist', rate_type: 'daily', base_rate: 520.39, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: '2nd & Additional Hair Stylist', rate_type: 'daily', base_rate: 520.39, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },

  // ============================================
  // SUPPLEMENTAL DIGITAL PRODUCTION - Non-Dramatic (excl. Reality)
  // Article 13.(a)(1) - Year 2: 9/28/2025 - 10/3/2026
  // ============================================
  { job_classification: 'Make-Up Artists', rate_type: 'daily', base_rate: 456.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Dramatic' },
  { job_classification: 'Make-Up Artists', rate_type: 'weekly', base_rate: 2056.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Dramatic' },
  { job_classification: 'Hair Stylists', rate_type: 'daily', base_rate: 398.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Dramatic' },
  { job_classification: 'Hair Stylists', rate_type: 'weekly', base_rate: 1817.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Dramatic' },

  // ============================================
  // SUPPLEMENTAL DIGITAL PRODUCTION - Reality Shows
  // Article 13.(a)(2) - Year 2: 9/28/2025 - 10/3/2026
  // ============================================
  { job_classification: 'Make-Up Artists', rate_type: 'daily', base_rate: 484.00, location: 'All Areas', production_type: 'television', tier: 'SDP Reality' },
  { job_classification: 'Make-Up Artists', rate_type: 'weekly', base_rate: 2181.00, location: 'All Areas', production_type: 'television', tier: 'SDP Reality' },
  { job_classification: 'Hair Stylists', rate_type: 'daily', base_rate: 422.00, location: 'All Areas', production_type: 'television', tier: 'SDP Reality' },
  { job_classification: 'Hair Stylists', rate_type: 'weekly', base_rate: 1927.00, location: 'All Areas', production_type: 'television', tier: 'SDP Reality' },

  // ============================================
  // SUPPLEMENTAL DIGITAL PRODUCTION - Non-Prime Dramatic
  // Article 13.(b) - Year 2: 9/28/2025 - 10/3/2026
  // ============================================
  { job_classification: 'Make-Up Artists', rate_type: 'daily', base_rate: 505.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
  { job_classification: 'Make-Up Artists', rate_type: 'weekly', base_rate: 2284.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
  { job_classification: 'Hair Stylists', rate_type: 'daily', base_rate: 443.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
  { job_classification: 'Hair Stylists', rate_type: 'weekly', base_rate: 2007.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of LOCAL_798_RATES) {
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
        'IATSE Local 798',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-02',
        rate.location,
        rate.production_type,
        2,
        rate.tier,
        JSON.stringify({
          currency: 'USD',
          source: 'AMPTP IATSE Local 798 Wage Scales 2025-28'
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

    console.log('\n=== IATSE Local 798 Rate Insertion Complete ===');
    console.log(`Total rates processed: ${LOCAL_798_RATES.length}`);
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
