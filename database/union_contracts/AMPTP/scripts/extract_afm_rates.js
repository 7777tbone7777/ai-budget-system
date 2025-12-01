/**
 * AFM (American Federation of Musicians) 2024-27 Wage Scale Rate Extraction
 * Source: AMPTP 2024-27 AFM Theatrical & Television Wage Schedules
 * Contract Period: 4/30/2023 - 4/30/2027
 * Current Year (Y2): 4/28/2024 - 5/3/2025
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// AFM Year 2 rates (4/28/2024 - 5/3/2025)
const AFM_RATES = [
  // ============================================
  // TELEVISION - Recording Musicians
  // ============================================
  { job_classification: 'Recording Musician (5+ musicians) - Single Session', rate_type: 'session', base_rate: 298.12, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Recording Musician (5+ musicians) - Double Session', rate_type: 'session', base_rate: 596.24, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Recording Musician (4 or fewer) - Single Session', rate_type: 'session', base_rate: 375.41, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Recording Musician (4 or fewer) - Double Session', rate_type: 'session', base_rate: 750.82, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track (1 musician)', rate_type: 'session', base_rate: 450.84, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track (2+ musicians)', rate_type: 'session', base_rate: 394.54, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Music Sound Consultant', rate_type: 'session', base_rate: 87.86, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Production Musicians (Non-Recording)
  // ============================================
  { job_classification: 'Production Musician - Single Session (3 hrs)', rate_type: 'session', base_rate: 227.73, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Production Musician - Two Sessions (10 hrs)', rate_type: 'daily', base_rate: 409.97, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Production Musician - 30 Hour Week', rate_type: 'weekly', base_rate: 1821.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Production Musician - 40 Hour Week', rate_type: 'weekly', base_rate: 2186.34, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Sideline Musicians
  // ============================================
  { job_classification: 'Sideline Musician (8 hours)', rate_type: 'daily', base_rate: 266.93, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Sideline Musician (photographed playing)', rate_type: 'daily', base_rate: 314.56, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Silent Bit Musician', rate_type: 'daily', base_rate: 428.23, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Orchestrators
  // ============================================
  { job_classification: 'Orchestrator', rate_type: 'weekly', base_rate: 2324.10, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Orchestrator', rate_type: 'hourly', base_rate: 62.39, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Copyists
  // ============================================
  { job_classification: 'Copyist', rate_type: 'page', base_rate: 136.43, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Librarians
  // ============================================
  { job_classification: 'Music Librarian', rate_type: 'weekly', base_rate: 1314.76, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Assistant Librarian', rate_type: 'weekly', base_rate: 811.23, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // TELEVISION - Proofreaders
  // ============================================
  { job_classification: 'Proofreader', rate_type: 'weekly', base_rate: 1115.37, production_type: 'television', location: 'Los Angeles' },
  { job_classification: 'Proofreader (Day Call - 8 hrs)', rate_type: 'hourly', base_rate: 29.33, production_type: 'television', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Recording Musicians
  // ============================================
  { job_classification: 'Recording Musician - Single Session A', rate_type: 'session', base_rate: 350.44, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Single Session B', rate_type: 'session', base_rate: 367.96, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Single Session C', rate_type: 'session', base_rate: 385.47, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Single Session D', rate_type: 'session', base_rate: 403.05, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Double Session A', rate_type: 'session', base_rate: 700.88, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Double Session B', rate_type: 'session', base_rate: 735.92, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Double Session C', rate_type: 'session', base_rate: 770.94, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Recording Musician - Double Session D', rate_type: 'session', base_rate: 806.10, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track (1 musician)', rate_type: 'session', base_rate: 420.85, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track (2+ musicians)', rate_type: 'session', base_rate: 368.30, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Music Sound Consultant', rate_type: 'session', base_rate: 81.99, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Production Musicians (Non-Recording)
  // ============================================
  { job_classification: 'Production Musician - Single Session (3 hrs)', rate_type: 'session', base_rate: 212.60, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Production Musician - Two Sessions (10 hrs)', rate_type: 'daily', base_rate: 382.75, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Production Musician - 30 Hour Week', rate_type: 'weekly', base_rate: 1700.80, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Production Musician - 40 Hour Week', rate_type: 'weekly', base_rate: 2040.92, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Sideline Musicians
  // ============================================
  { job_classification: 'Sideline Musician (8 hours)', rate_type: 'daily', base_rate: 266.93, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Sideline Musician (photographed playing)', rate_type: 'daily', base_rate: 314.56, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Silent Bit Musician', rate_type: 'daily', base_rate: 428.23, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Orchestrators
  // ============================================
  { job_classification: 'Orchestrator', rate_type: 'weekly', base_rate: 2169.54, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Orchestrator', rate_type: 'hourly', base_rate: 58.24, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Copyists
  // ============================================
  { job_classification: 'Copyist', rate_type: 'page', base_rate: 127.37, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Librarians
  // ============================================
  { job_classification: 'Music Librarian', rate_type: 'weekly', base_rate: 1227.35, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Assistant Librarian', rate_type: 'weekly', base_rate: 757.31, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // THEATRICAL - Proofreaders
  // ============================================
  { job_classification: 'Proofreader', rate_type: 'weekly', base_rate: 1041.24, production_type: 'theatrical', location: 'Los Angeles' },
  { job_classification: 'Proofreader (Day Call - 8 hrs)', rate_type: 'hourly', base_rate: 27.37, production_type: 'theatrical', location: 'Los Angeles' },

  // ============================================
  // LOW BUDGET - Recording Musicians ($45M or less theatrical)
  // ============================================
  { job_classification: 'Recording Musician (Low Budget) - 3hr Session', rate_type: 'session', base_rate: 261.57, production_type: 'low_budget', location: 'Los Angeles' },
  { job_classification: 'Recording Musician (Low Budget) - Hourly', rate_type: 'hourly', base_rate: 87.19, production_type: 'low_budget', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track Low Budget (1 musician)', rate_type: 'hourly', base_rate: 329.34, production_type: 'low_budget', location: 'Los Angeles' },
  { job_classification: 'Electronic Multi-Track Low Budget (2+ musicians)', rate_type: 'hourly', base_rate: 290.61, production_type: 'low_budget', location: 'Los Angeles' },
  { job_classification: 'Librarian (Low Budget) - 8 hrs', rate_type: 'daily', base_rate: 279.91, production_type: 'low_budget', location: 'Los Angeles' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing AFM rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'AFM'`);

    console.log(`Inserting ${AFM_RATES.length} AFM rates...`);

    let inserted = 0;
    for (const rate of AFM_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'AFM',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2024-04-28',  // Year 2 start
        2,
        rate.production_type,
        rate.location
      ]);
      inserted++;
    }

    console.log(`Successfully inserted ${inserted} rates for AFM`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'AFM'
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
