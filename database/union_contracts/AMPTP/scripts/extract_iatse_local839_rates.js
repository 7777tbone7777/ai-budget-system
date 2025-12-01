/**
 * IATSE Local 839 (Animation Guild) 2024-27 Wage Scale Rate Extraction
 * Source: 2024-27 Local #839 Wage Rates (20 pages)
 * Coverage: Animation industry - Animators, Writers, Storyboard, etc.
 * Contract Period: 8/1/2024 - 7/31/2027 (3 years)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// IATSE Local 839 2024-27 Wage Scales - Core Animation Positions
// First Period: 8/4/24-8/2/25, Second Period: 8/3/25-8/1/26, Third Period: 8/2/26-7/31/27
const LOCAL839_RATES = [
  // ===========================================
  // ANIMATION - Core Positions (Weekly Rates)
  // ===========================================

  // Animator (Journey)
  { job_classification: 'Animator - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animator - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animator - Journey', rate_type: 'hourly', base_rate: 60.33, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animator - Journey', rate_type: 'hourly', base_rate: 62.74, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Background Artist (Journey)
  { job_classification: 'Background Artist - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Background Artist - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Layout Artist (Journey)
  { job_classification: 'Layout Artist - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Layout Artist - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Model Designer (Journey)
  { job_classification: 'Model Designer - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Model Designer - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Color Designer (Journey) - Effective 3/23/25+
  { job_classification: 'Color Designer - Journey', rate_type: 'weekly', base_rate: 2436.00, effective_date: '2025-03-23', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Color Designer - Journey', rate_type: 'weekly', base_rate: 2597.60, effective_date: '2026-03-28', contract_year: 3, production_type: 'animation', location: 'Los Angeles' },

  // Animation Story Person (Journey)
  { job_classification: 'Animation Story Person - Journey', rate_type: 'weekly', base_rate: 2435.60, effective_date: '2025-03-23', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Story Person - Journey', rate_type: 'weekly', base_rate: 2533.20, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Production Board (Journey) - Effective 12/29/24+
  { job_classification: 'Production Board - Journey', rate_type: 'weekly', base_rate: 2775.20, effective_date: '2024-12-29', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Production Board - Journey', rate_type: 'weekly', base_rate: 2886.40, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Animation Art Director (Journey) - New position effective 3/23/25
  { job_classification: 'Animation Art Director - Journey', rate_type: 'weekly', base_rate: 2801.20, effective_date: '2025-03-23', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Art Director - Journey', rate_type: 'weekly', base_rate: 2913.20, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Key Assistant Animator
  { job_classification: 'Key Assistant Animator', rate_type: 'weekly', base_rate: 2312.40, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Key Assistant Animator', rate_type: 'weekly', base_rate: 2404.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Assistant Animator (Journey)
  { job_classification: 'Assistant Animator - Journey', rate_type: 'weekly', base_rate: 2065.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Assistant Animator - Journey', rate_type: 'weekly', base_rate: 2148.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Assistant Director (Journey)
  { job_classification: 'Assistant Director - Animation - Journey', rate_type: 'weekly', base_rate: 2267.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Assistant Director - Animation - Journey', rate_type: 'weekly', base_rate: 2358.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Animation Timer (Journey)
  { job_classification: 'Animation Timer - Journey', rate_type: 'weekly', base_rate: 2267.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Timer - Journey', rate_type: 'weekly', base_rate: 2358.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Animation Checker (Journey)
  { job_classification: 'Animation Checker - Journey', rate_type: 'weekly', base_rate: 2065.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Checker - Journey', rate_type: 'weekly', base_rate: 2148.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Inbetweener (Journey)
  { job_classification: 'Inbetweener - Journey', rate_type: 'weekly', base_rate: 1746.80, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Inbetweener - Journey', rate_type: 'weekly', base_rate: 1816.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Breakdown (Journey)
  { job_classification: 'Breakdown Artist - Journey', rate_type: 'weekly', base_rate: 1813.60, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Breakdown Artist - Journey', rate_type: 'weekly', base_rate: 1886.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // ===========================================
  // ANIMATION WRITERS (Weekly Rates)
  // For programs licensed on/after 8/1/2022 but prior to 3/23/2025
  // ===========================================

  // Animation Writer Level 1 (Journey)
  { job_classification: 'Animation Writer Level 1 - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Writer Level 1 - Journey', rate_type: 'weekly', base_rate: 2610.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Animation Writer Level 2
  { job_classification: 'Animation Writer Level 2', rate_type: 'weekly', base_rate: 2777.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Writer Level 2', rate_type: 'weekly', base_rate: 2888.40, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Supervising Animation Writer
  { job_classification: 'Supervising Animation Writer', rate_type: 'weekly', base_rate: 3196.40, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Supervising Animation Writer', rate_type: 'weekly', base_rate: 3324.40, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Associate Animation Writer
  { job_classification: 'Associate Animation Writer - 2nd 6 months', rate_type: 'weekly', base_rate: 2022.40, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Associate Animation Writer - 2nd 6 months', rate_type: 'weekly', base_rate: 2103.20, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // ===========================================
  // CGI / DIGITAL POSITIONS (Weekly Rates)
  // ===========================================

  // CGI Animator/Modeler (Journey)
  { job_classification: 'CGI Animator/Modeler - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'CGI Animator/Modeler - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Production Technical Director 1 (Journey)
  { job_classification: 'Production Technical Director 1 - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Production Technical Director 1 - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Visual Development (Journey)
  { job_classification: 'Visual Development - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Visual Development - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Digital Animator I (Journey)
  { job_classification: 'Digital Animator I - Journey', rate_type: 'weekly', base_rate: 2413.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Digital Animator I - Journey', rate_type: 'weekly', base_rate: 2509.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Animation Director (Journey) - Sideletter F
  { job_classification: 'Animation Director - Journey', rate_type: 'weekly', base_rate: 2820.80, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Animation Director - Journey', rate_type: 'weekly', base_rate: 2933.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Timing Director (Journey) - Sideletter F
  { job_classification: 'Timing Director - Journey', rate_type: 'weekly', base_rate: 2704.00, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Timing Director - Journey', rate_type: 'weekly', base_rate: 2812.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // ===========================================
  // INK AND PAINT POSITIONS (Weekly Rates)
  // ===========================================

  // Painter (Journey)
  { job_classification: 'Painter - Journey', rate_type: 'weekly', base_rate: 1716.00, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Painter - Journey', rate_type: 'weekly', base_rate: 1784.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Inker (Journey)
  { job_classification: 'Inker - Journey', rate_type: 'weekly', base_rate: 1728.00, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Inker - Journey', rate_type: 'weekly', base_rate: 1797.20, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Color Modelist (Journey)
  { job_classification: 'Color Modelist - Journey', rate_type: 'weekly', base_rate: 1795.60, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Color Modelist - Journey', rate_type: 'weekly', base_rate: 1867.60, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Paint Technician (Journey)
  { job_classification: 'Paint Technician - Journey', rate_type: 'weekly', base_rate: 1850.80, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Paint Technician - Journey', rate_type: 'weekly', base_rate: 1924.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // ===========================================
  // CHECKERS (Weekly Rates)
  // ===========================================

  // Xerox Checker (Journey)
  { job_classification: 'Xerox Checker - Journey', rate_type: 'weekly', base_rate: 1787.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Xerox Checker - Journey', rate_type: 'weekly', base_rate: 1858.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Paint Checker (Journey)
  { job_classification: 'Paint Checker - Journey', rate_type: 'weekly', base_rate: 1746.80, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Paint Checker - Journey', rate_type: 'weekly', base_rate: 1816.80, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Head Final Checker
  { job_classification: 'Head Final Checker', rate_type: 'weekly', base_rate: 1836.80, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Head Final Checker', rate_type: 'weekly', base_rate: 1910.40, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },

  // Letter Artist (Journey)
  { job_classification: 'Letter Artist - Journey', rate_type: 'weekly', base_rate: 2065.20, effective_date: '2024-08-04', contract_year: 1, production_type: 'animation', location: 'Los Angeles' },
  { job_classification: 'Letter Artist - Journey', rate_type: 'weekly', base_rate: 2148.00, effective_date: '2025-08-03', contract_year: 2, production_type: 'animation', location: 'Los Angeles' },
];

async function insertLocal839Rates() {
  const client = await pool.connect();

  try {
    console.log('Starting IATSE Local 839 rate insertion...');

    // Delete existing Local 839 rates from 2024+ to avoid duplicates
    const deleteResult = await client.query(`
      DELETE FROM rate_cards
      WHERE union_local = 'IATSE Local 839'
      AND effective_date >= '2024-08-04'
    `);
    console.log(`Cleared ${deleteResult.rowCount} existing Local 839 rates from 2024+`);

    let insertedCount = 0;

    for (const rate of LOCAL839_RATES) {
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
        'IATSE Local 839',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        rate.location || 'Los Angeles',
        rate.production_type || 'animation',
        rate.effective_date,
        rate.contract_year,
        rate.tier || null,
        JSON.stringify({ source: 'AMPTP 2024-27 Local 839 Animation Agreement' })
      ]);

      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} IATSE Local 839 rate cards`);

    // Verify insertion
    const result = await client.query(`
      SELECT COUNT(*) as count,
             MIN(effective_date) as earliest,
             MAX(effective_date) as latest
      FROM rate_cards
      WHERE union_local = 'IATSE Local 839'
    `);
    console.log('IATSE Local 839 rate cards summary:', result.rows[0]);

  } catch (error) {
    console.error('Error inserting Local 839 rates:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  insertLocal839Rates()
    .then(() => {
      console.log('IATSE Local 839 rate insertion complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to insert Local 839 rates:', error);
      process.exit(1);
    });
}

module.exports = { insertLocal839Rates, LOCAL839_RATES };
