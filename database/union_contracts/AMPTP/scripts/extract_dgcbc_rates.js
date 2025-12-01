/**
 * DGC-BC (Directors Guild of Canada - BC) Rate Extraction Script
 *
 * Source: Wage_Scales_2025-28_DGC-BC.pdf
 * Contract Period: March 30, 2025 - March 31, 2028
 * These rates are Year 1 (Effective March 30, 2025)
 *
 * Covers: Directors, ADs, UPMs, Location Managers, Production Assistants
 * Using B2 rates (Theatrical <=20M & TV) as the standard baseline
 *
 * Currency: Canadian Dollars (CAD)
 * Location: British Columbia
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VFlzOYAahWhmRpVnuvIEraoKp628e1vp@caboose.proxy.rlwy.net:14463/railway';

// DGC-BC Year 1 Rates (Effective March 30, 2025) - B2 Standard TV/Theatrical rates
const DGC_BC_RATES = [
  // =============================================
  // DIRECTORS - Appendix A (Theatrical)
  // =============================================

  // Theatrical Productions by Budget Tier
  { job_classification: 'Director - Theatrical ($2M-$3M budget)', rate_type: 'weekly', base_rate: 9689.00, production_type: 'theatrical', location: 'British Columbia', tier: '$2M-$3M' },
  { job_classification: 'Director - Theatrical ($3M-$5M budget)', rate_type: 'weekly', base_rate: 11182.00, production_type: 'theatrical', location: 'British Columbia', tier: '$3M-$5M' },
  { job_classification: 'Director - Theatrical (Over $5M budget)', rate_type: 'weekly', base_rate: 14908.00, production_type: 'theatrical', location: 'British Columbia', tier: 'Over $5M' },

  // TV MOW/Drama Specials/Mini-Series/Pilots
  { job_classification: 'Director - TV MOW (1/2 hour)', rate_type: 'flat', base_rate: 19481.00, production_type: 'television', location: 'British Columbia', tier: '1/2 hour' },
  { job_classification: 'Director - TV MOW (1 hour)', rate_type: 'flat', base_rate: 38960.00, production_type: 'television', location: 'British Columbia', tier: '1 hour' },
  { job_classification: 'Director - TV MOW (1.5 hours)', rate_type: 'flat', base_rate: 76637.00, production_type: 'television', location: 'British Columbia', tier: '1.5 hours' },
  { job_classification: 'Director - TV MOW (2 hours)', rate_type: 'flat', base_rate: 115036.00, production_type: 'television', location: 'British Columbia', tier: '2 hours' },

  // TV Series
  { job_classification: 'Director - TV Series (1/2 hour)', rate_type: 'flat', base_rate: 17385.00, production_type: 'television', location: 'British Columbia', tier: '1/2 hour series' },
  { job_classification: 'Director - TV Series (1 hour)', rate_type: 'flat', base_rate: 35081.00, production_type: 'television', location: 'British Columbia', tier: '1 hour series' },
  { job_classification: 'Director - TV Series (1.5 hours)', rate_type: 'flat', base_rate: 51586.00, production_type: 'television', location: 'British Columbia', tier: '1.5 hours series' },
  { job_classification: 'Director - TV Series (2 hours)', rate_type: 'flat', base_rate: 68786.00, production_type: 'television', location: 'British Columbia', tier: '2 hours series' },

  // =============================================
  // PRODUCTION MANAGERS - B2 (TV & Theatrical <=20M)
  // =============================================

  // Production Manager
  { job_classification: 'Production Manager', rate_type: 'daily', base_rate: 1230.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Production Manager', rate_type: 'hourly', base_rate: 60.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Production Manager', rate_type: 'weekly', base_rate: 4919.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Production Manager', rate_type: 'daily', base_rate: 1230.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Production Manager', rate_type: 'hourly', base_rate: 60.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Production Manager', rate_type: 'weekly', base_rate: 4919.00, production_type: 'theatrical', location: 'British Columbia' },

  // Unit Manager
  { job_classification: 'Unit Manager', rate_type: 'daily', base_rate: 788.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Unit Manager', rate_type: 'hourly', base_rate: 38.44, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Unit Manager', rate_type: 'weekly', base_rate: 3151.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Unit Manager', rate_type: 'daily', base_rate: 788.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Unit Manager', rate_type: 'hourly', base_rate: 38.44, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Unit Manager', rate_type: 'weekly', base_rate: 3151.00, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // ASSISTANT DIRECTORS - B2 (TV & Theatrical <=20M)
  // =============================================

  // First Assistant Director
  { job_classification: 'First Assistant Director', rate_type: 'daily', base_rate: 1168.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Director', rate_type: 'hourly', base_rate: 56.98, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Director', rate_type: 'weekly', base_rate: 4673.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'First Assistant Director', rate_type: 'daily', base_rate: 1168.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'First Assistant Director', rate_type: 'hourly', base_rate: 56.98, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'First Assistant Director', rate_type: 'weekly', base_rate: 4673.00, production_type: 'theatrical', location: 'British Columbia' },

  // Second Assistant Director
  { job_classification: 'Second Assistant Director', rate_type: 'daily', base_rate: 788.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Director', rate_type: 'hourly', base_rate: 38.44, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Director', rate_type: 'weekly', base_rate: 3151.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Second Assistant Director', rate_type: 'daily', base_rate: 788.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Second Assistant Director', rate_type: 'hourly', base_rate: 38.44, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Second Assistant Director', rate_type: 'weekly', base_rate: 3151.00, production_type: 'theatrical', location: 'British Columbia' },

  // Third Assistant Director
  { job_classification: 'Third Assistant Director', rate_type: 'daily', base_rate: 558.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Third Assistant Director', rate_type: 'hourly', base_rate: 27.22, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Third Assistant Director', rate_type: 'weekly', base_rate: 2233.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Third Assistant Director', rate_type: 'daily', base_rate: 558.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Third Assistant Director', rate_type: 'hourly', base_rate: 27.22, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Third Assistant Director', rate_type: 'weekly', base_rate: 2233.00, production_type: 'theatrical', location: 'British Columbia' },

  // Trainee Assistant Director
  { job_classification: 'Trainee Assistant Director', rate_type: 'daily', base_rate: 506.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Director', rate_type: 'hourly', base_rate: 24.68, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Director', rate_type: 'weekly', base_rate: 2024.38, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Trainee Assistant Director', rate_type: 'daily', base_rate: 506.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Director', rate_type: 'hourly', base_rate: 24.68, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Director', rate_type: 'weekly', base_rate: 2024.38, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // LOCATION MANAGERS - B2 (TV & Theatrical <=20M)
  // =============================================

  // Location Manager
  { job_classification: 'Location Manager', rate_type: 'daily', base_rate: 853.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Location Manager', rate_type: 'hourly', base_rate: 41.61, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 3412.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Location Manager', rate_type: 'daily', base_rate: 853.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Location Manager', rate_type: 'hourly', base_rate: 41.61, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Location Manager', rate_type: 'weekly', base_rate: 3412.00, production_type: 'theatrical', location: 'British Columbia' },

  // Assistant Location Manager
  { job_classification: 'Assistant Location Manager', rate_type: 'daily', base_rate: 646.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 31.51, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2583.00, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Assistant Location Manager', rate_type: 'daily', base_rate: 646.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Assistant Location Manager', rate_type: 'hourly', base_rate: 31.51, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Assistant Location Manager', rate_type: 'weekly', base_rate: 2583.00, production_type: 'theatrical', location: 'British Columbia' },

  // Trainee Assistant Location Manager
  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'daily', base_rate: 506.00, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'hourly', base_rate: 24.68, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'weekly', base_rate: 2024.38, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'daily', base_rate: 506.00, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'hourly', base_rate: 24.68, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Trainee Assistant Location Manager', rate_type: 'weekly', base_rate: 2024.38, production_type: 'theatrical', location: 'British Columbia' },

  // Location Scout
  { job_classification: 'Location Scout', rate_type: 'daily', base_rate: 422.30, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Location Scout', rate_type: 'hourly', base_rate: 20.60, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Location Scout', rate_type: 'daily', base_rate: 422.30, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Location Scout', rate_type: 'hourly', base_rate: 20.60, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // ADDITIONAL ADs / BACKGROUND COORDINATORS
  // =============================================

  // Key Background Coordinator
  { job_classification: 'Key Background Coordinator', rate_type: 'daily', base_rate: 256.32, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Key Background Coordinator', rate_type: 'hourly', base_rate: 32.04, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Key Background Coordinator', rate_type: 'daily', base_rate: 256.32, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Key Background Coordinator', rate_type: 'hourly', base_rate: 32.04, production_type: 'theatrical', location: 'British Columbia' },

  // Background Coordinator
  { job_classification: 'Background Coordinator', rate_type: 'daily', base_rate: 246.73, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Background Coordinator', rate_type: 'hourly', base_rate: 30.84, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Background Coordinator', rate_type: 'daily', base_rate: 246.73, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Background Coordinator', rate_type: 'hourly', base_rate: 30.84, production_type: 'theatrical', location: 'British Columbia' },

  // =============================================
  // PRODUCTION ASSISTANTS - B3 (All productions)
  // =============================================

  // Key Production Assistant (1st Office PA / 1st 3 On-Set PAs)
  { job_classification: 'Key Production Assistant', rate_type: 'daily', base_rate: 394.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Key Production Assistant', rate_type: 'hourly', base_rate: 19.25, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Key Production Assistant', rate_type: 'daily', base_rate: 394.63, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Key Production Assistant', rate_type: 'hourly', base_rate: 19.25, production_type: 'theatrical', location: 'British Columbia' },

  // Non-Key Production Assistant
  { job_classification: 'Production Assistant', rate_type: 'daily', base_rate: 384.38, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Production Assistant', rate_type: 'hourly', base_rate: 18.75, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Production Assistant', rate_type: 'daily', base_rate: 384.38, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Production Assistant', rate_type: 'hourly', base_rate: 18.75, production_type: 'theatrical', location: 'British Columbia' },

  // Additional PA / Helper
  { job_classification: 'Production Assistant Helper', rate_type: 'daily', base_rate: 379.25, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Production Assistant Helper', rate_type: 'hourly', base_rate: 18.50, production_type: 'television', location: 'British Columbia' },

  { job_classification: 'Production Assistant Helper', rate_type: 'daily', base_rate: 379.25, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Production Assistant Helper', rate_type: 'hourly', base_rate: 18.50, production_type: 'theatrical', location: 'British Columbia' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of DGC_BC_RATES) {
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
        'DGC-BC',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-30', // Year 1 effective date
        rate.location,
        rate.production_type,
        1, // Contract Year 1
        rate.tier || null,
        JSON.stringify({ currency: 'CAD', source: 'DGC-BC Collective Agreement 2025-28 Appendix B2' })
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

    console.log(`\n=== DGC-BC Rate Insertion Complete ===`);
    console.log(`Total rates processed: ${DGC_BC_RATES.length}`);
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
