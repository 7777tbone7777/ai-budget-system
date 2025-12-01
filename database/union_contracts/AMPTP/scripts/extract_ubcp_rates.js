/**
 * UBCP (Union of BC Performers) Rate Extraction Script
 *
 * Source: Wage_Scales_2025-28_UBCP.pdf
 * Contract Period: March 30, 2025 - March 28, 2028
 * These rates are Year 2 (Effective March 30, 2025)
 *
 * Covers: Principal actors, stunt performers, background performers,
 *         singers, dancers, and related performer categories
 *
 * Currency: Canadian Dollars (CAD)
 * Location: British Columbia
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VFlzOYAahWhmRpVnuvIEraoKp628e1vp@caboose.proxy.rlwy.net:14463/railway';

// UBCP Year 2 Rates (Effective March 30, 2025)
const UBCP_RATES = [
  // =============================================
  // PRINCIPAL PERFORMERS - Television
  // =============================================

  // Principal Actor/Stunt Performer
  { job_classification: 'Principal Actor', rate_type: 'daily', base_rate: 917.69, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Principal Actor', rate_type: 'hourly', base_rate: 114.71, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'daily', base_rate: 917.69, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'hourly', base_rate: 114.71, production_type: 'television', location: 'British Columbia' },

  // Group Singer/Dancer (3+)
  { job_classification: 'Group Singer (3+)', rate_type: 'daily', base_rate: 687.42, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Group Singer (3+)', rate_type: 'hourly', base_rate: 85.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Group Dancer (3+)', rate_type: 'daily', base_rate: 687.42, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Group Dancer (3+)', rate_type: 'hourly', base_rate: 85.93, production_type: 'television', location: 'British Columbia' },

  // Actor
  { job_classification: 'Actor', rate_type: 'daily', base_rate: 617.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Actor', rate_type: 'hourly', base_rate: 77.20, production_type: 'television', location: 'British Columbia' },

  // Stunt Coordinator
  { job_classification: 'Stunt Coordinator', rate_type: 'daily', base_rate: 1193.33, production_type: 'television', location: 'British Columbia' },

  // =============================================
  // PRINCIPAL PERFORMERS - Feature Film (Theatrical)
  // =============================================

  // Principal Actor/Stunt Performer
  { job_classification: 'Principal Actor', rate_type: 'daily', base_rate: 917.69, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Principal Actor', rate_type: 'hourly', base_rate: 114.71, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'daily', base_rate: 917.69, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'hourly', base_rate: 114.71, production_type: 'theatrical', location: 'British Columbia' },

  // Group Singer/Dancer (3+)
  { job_classification: 'Group Singer (3+)', rate_type: 'daily', base_rate: 687.42, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Group Singer (3+)', rate_type: 'hourly', base_rate: 85.93, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Group Dancer (3+)', rate_type: 'daily', base_rate: 687.42, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Group Dancer (3+)', rate_type: 'hourly', base_rate: 85.93, production_type: 'theatrical', location: 'British Columbia' },

  // Actor
  { job_classification: 'Actor', rate_type: 'daily', base_rate: 617.63, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Actor', rate_type: 'hourly', base_rate: 77.20, production_type: 'theatrical', location: 'British Columbia' },

  // Stunt Coordinator
  { job_classification: 'Stunt Coordinator', rate_type: 'daily', base_rate: 1193.33, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // BACKGROUND PERFORMERS - Television
  // =============================================

  // Stand-In
  { job_classification: 'Stand-In', rate_type: 'daily', base_rate: 282.56, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stand-In', rate_type: 'hourly', base_rate: 35.32, production_type: 'television', location: 'British Columbia' },

  // General Background
  { job_classification: 'Background Performer - General', rate_type: 'daily', base_rate: 259.90, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Background Performer - General', rate_type: 'hourly', base_rate: 32.49, production_type: 'television', location: 'British Columbia' },

  // Special Ability Background
  { job_classification: 'Background Performer - Special Ability', rate_type: 'daily', base_rate: 348.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Background Performer - Special Ability', rate_type: 'hourly', base_rate: 43.60, production_type: 'television', location: 'British Columbia' },

  // =============================================
  // BACKGROUND PERFORMERS - Feature Film (Theatrical)
  // =============================================

  // Stand-In
  { job_classification: 'Stand-In', rate_type: 'daily', base_rate: 282.56, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Stand-In', rate_type: 'hourly', base_rate: 35.32, production_type: 'theatrical', location: 'British Columbia' },

  // General Background
  { job_classification: 'Background Performer - General', rate_type: 'daily', base_rate: 259.90, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Background Performer - General', rate_type: 'hourly', base_rate: 32.49, production_type: 'theatrical', location: 'British Columbia' },

  // Special Ability Background
  { job_classification: 'Background Performer - Special Ability', rate_type: 'daily', base_rate: 348.80, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Background Performer - Special Ability', rate_type: 'hourly', base_rate: 43.60, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // DUBBING RATES - Television & Theatrical
  // =============================================

  // Dubbing - Television
  { job_classification: 'Dubbing - Loop Group', rate_type: 'hourly', base_rate: 103.10, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dubbing - ADR', rate_type: 'hourly', base_rate: 103.10, production_type: 'television', location: 'British Columbia' },

  // Dubbing - Theatrical
  { job_classification: 'Dubbing - Loop Group', rate_type: 'hourly', base_rate: 103.10, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Dubbing - ADR', rate_type: 'hourly', base_rate: 103.10, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // WEEKLY RATES (Calculated as 5x daily)
  // =============================================

  // Principal Actor Weekly - Television
  { job_classification: 'Principal Actor', rate_type: 'weekly', base_rate: 4588.45, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'weekly', base_rate: 4588.45, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Actor', rate_type: 'weekly', base_rate: 3088.15, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stunt Coordinator', rate_type: 'weekly', base_rate: 5966.65, production_type: 'television', location: 'British Columbia' },

  // Principal Actor Weekly - Theatrical
  { job_classification: 'Principal Actor', rate_type: 'weekly', base_rate: 4588.45, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Stunt Performer', rate_type: 'weekly', base_rate: 4588.45, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Actor', rate_type: 'weekly', base_rate: 3088.15, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Stunt Coordinator', rate_type: 'weekly', base_rate: 5966.65, production_type: 'theatrical', location: 'British Columbia' },

  // Background Weekly - Television
  { job_classification: 'Stand-In', rate_type: 'weekly', base_rate: 1412.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Background Performer - General', rate_type: 'weekly', base_rate: 1299.50, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Background Performer - Special Ability', rate_type: 'weekly', base_rate: 1744.00, production_type: 'television', location: 'British Columbia' },

  // Background Weekly - Theatrical
  { job_classification: 'Stand-In', rate_type: 'weekly', base_rate: 1412.80, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Background Performer - General', rate_type: 'weekly', base_rate: 1299.50, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Background Performer - Special Ability', rate_type: 'weekly', base_rate: 1744.00, production_type: 'theatrical', location: 'British Columbia' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of UBCP_RATES) {
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
          special_provisions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
        DO NOTHING
        RETURNING id
      `;

      const values = [
        'UBCP',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-30', // Year 2 effective date
        rate.location,
        rate.production_type,
        2, // Contract Year 2
        JSON.stringify({ currency: 'CAD', source: 'AMPTP UBCP Wage Scales 2025-28' })
      ];

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
        insertedCount++;
        console.log(`Inserted: ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type}`);
      } else {
        skippedCount++;
        console.log(`Skipped (duplicate): ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type}`);
      }
    }

    console.log(`\n=== UBCP Rate Insertion Complete ===`);
    console.log(`Total rates processed: ${UBCP_RATES.length}`);
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
