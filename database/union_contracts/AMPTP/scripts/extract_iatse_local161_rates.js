/**
 * IATSE Local 161 (Script Supervisors & Production Office Coordinators) Rate Extraction Script
 * Source: 2025-28 Wage Rates for Local 161
 * Contract Period: 3/3/2024 - 3/4/2028
 * Using Year 2 rates: 3/9/2025 - 3/7/2026
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

// Local 161 rates - Year 2 (3/9/2025 - 3/7/2026)
const LOCAL_161_RATES = [
  // ============================================
  // THEATRICAL MOTION PICTURES - NY/NJ/CT/Philadelphia 30-mile radius
  // Article 10.(a)(1)(A)(i)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 630.37, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2840.82, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 404.07, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1833.45, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 233.58, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1149.40, location: 'New York/New Jersey/Connecticut', production_type: 'theatrical', tier: 'Standard' },

  // ============================================
  // THEATRICAL MOTION PICTURES - Outside NY/NJ/CT/Philadelphia
  // Article 10.(a)(1)(A)(ii)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 630.37, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2840.82, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 404.07, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1833.45, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Other Jurisdiction Areas', production_type: 'theatrical', tier: 'Standard' },

  // ============================================
  // TELEVISION - NY/NJ/CT (Excl. Long-Form, Pilots, 1-Hour Series)
  // Article 10.(a)(1)(B)(i)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 630.37, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2840.82, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 404.07, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1833.45, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Standard' },

  // ============================================
  // TELEVISION - Outside NY/NJ/CT (Excl. Long-Form, Pilots, 1-Hour Series)
  // Article 10.(a)(1)(B)(ii)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 630.37, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2840.82, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 404.07, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1833.45, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Other Jurisdiction Areas', production_type: 'television', tier: 'Standard' },

  // ============================================
  // EXISTING ONE-HOUR SERIES (Pre-March 2007) - NY/NJ/CT
  // Article 10.(a)(2)(A)(i)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 612.34, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2759.58, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 392.63, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1781.52, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'Existing 1-Hour Series Pre-2007' },

  // ============================================
  // NEW ONE-HOUR SERIES (Post-March 2007) 1st/2nd Season - NY/NJ/CT
  // Article 10.(a)(2)(A)(ii)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 611.46, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2755.60, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 391.95, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1778.45, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 1st/2nd Season' },

  // ============================================
  // NEW ONE-HOUR SERIES 3rd+ Season - NY/NJ/CT
  // Article 10.(a)(2)(A)(ii)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 630.37, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2840.82, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 404.07, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1833.45, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'New York/New Jersey/Connecticut', production_type: 'television', tier: 'New 1-Hour Series 3rd+ Season' },

  // ============================================
  // ONE-HOUR SERIES - Outside NY/NJ/CT
  // Article 10.(a)(2)(B)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 612.34, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2759.58, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 392.63, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1781.52, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Other Jurisdiction Areas', production_type: 'television', tier: '1-Hour Series' },

  // ============================================
  // LONG-FORM TV & PILOTS
  // Article 10.(a)(3)
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 580.77, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 2617.64, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Production Office Coordinator', rate_type: 'daily', base_rate: 372.56, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1690.90, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'daily', base_rate: 228.00, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'All Jurisdiction Areas', production_type: 'television', tier: 'Long-Form/Pilots' },

  // ============================================
  // DISTANT HIRE (50+ miles from NYC) - Theatrical/TV Standard
  // Article 10.(b)(1) - Weekly only, 10+ weeks
  // ============================================
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1635.46, location: 'Distant Hire 50+ Miles NYC', production_type: 'theatrical', tier: 'Distant Hire' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Distant Hire 50+ Miles NYC', production_type: 'theatrical', tier: 'Distant Hire' },

  // ============================================
  // DISTANT HIRE - New One-Hour Series
  // Article 10.(b)(2)
  // ============================================
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1589.30, location: 'Distant Hire 50+ Miles NYC', production_type: 'television', tier: 'Distant Hire New 1-Hour Series' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Distant Hire 50+ Miles NYC', production_type: 'television', tier: 'Distant Hire New 1-Hour Series' },

  // ============================================
  // DISTANT HIRE - Long-Form/Pilots
  // Article 10.(b)(3)
  // ============================================
  { job_classification: 'Production Office Coordinator', rate_type: 'weekly', base_rate: 1508.72, location: 'Distant Hire 50+ Miles NYC', production_type: 'television', tier: 'Distant Hire Long-Form/Pilots' },
  { job_classification: 'Assistant Production Office Coordinator', rate_type: 'weekly', base_rate: 1140.00, location: 'Distant Hire 50+ Miles NYC', production_type: 'television', tier: 'Distant Hire Long-Form/Pilots' },

  // ============================================
  // SUPPLEMENTAL DIGITAL PRODUCTION - Non-Prime Dramatic
  // Year 2: 9/28/2025 - 10/3/2026
  // ============================================
  { job_classification: 'Script Supervisor', rate_type: 'daily', base_rate: 423.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
  { job_classification: 'Script Supervisor', rate_type: 'weekly', base_rate: 1955.00, location: 'All Areas', production_type: 'television', tier: 'SDP Non-Prime Dramatic' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of LOCAL_161_RATES) {
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
        'IATSE Local 161',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-09',
        rate.location,
        rate.production_type,
        2,
        rate.tier,
        JSON.stringify({
          currency: 'USD',
          source: 'AMPTP IATSE Local 161 Wage Scales 2025-28'
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

    console.log('\n=== IATSE Local 161 Rate Insertion Complete ===');
    console.log(`Total rates processed: ${LOCAL_161_RATES.length}`);
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
