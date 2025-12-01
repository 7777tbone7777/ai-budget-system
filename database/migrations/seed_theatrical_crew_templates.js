/**
 * Seed production_type_crews with comprehensive theatrical crew templates
 * Based on industry-standard crew structures for $5M+ theatrical features
 *
 * Run with: railway run --service backend node database/migrations/seed_theatrical_crew_templates.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// Comprehensive theatrical crew for $5M+ budget features
// Account codes follow Standard Film/TV COA structure
const theatricalCrew = [
  // PRODUCTION (Account 20xx)
  { dept: 'Production', title: 'Unit Production Manager', account_code: '2001', prep: 12, shoot: 60, wrap: 9, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Line Producer', account_code: '2002', prep: 12, shoot: 60, wrap: 9, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'First Assistant Director', account_code: '2003', prep: 8, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Second Assistant Director', account_code: '2004', prep: 4, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Second Second Assistant Director', account_code: '2005', prep: 2, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Production Coordinator', account_code: '2006', prep: 10, shoot: 60, wrap: 8, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Assistant Production Coordinator', account_code: '2007', prep: 8, shoot: 60, wrap: 6, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Production Secretary', account_code: '2008', prep: 8, shoot: 60, wrap: 6, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Travel Coordinator', account_code: '2009', prep: 4, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Production Accountant', account_code: '2010', prep: 10, shoot: 60, wrap: 12, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'First Assistant Accountant', account_code: '2011', prep: 8, shoot: 60, wrap: 10, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Second Assistant Accountant', account_code: '2012', prep: 6, shoot: 60, wrap: 8, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Payroll Accountant', account_code: '2013', prep: 8, shoot: 60, wrap: 10, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Script Supervisor', account_code: '2014', prep: 2, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Production', title: 'Production Assistant', account_code: '2015', prep: 2, shoot: 60, wrap: 1, qty: 6, rate_type: 'daily' },

  // ART DEPARTMENT (Account 22xx)
  { dept: 'Art Department', title: 'Production Designer', account_code: '2201', prep: 16, shoot: 60, wrap: 6, qty: 1, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Supervising Art Director', account_code: '2202', prep: 14, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Art Director', account_code: '2203', prep: 12, shoot: 60, wrap: 3, qty: 2, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Assistant Art Director', account_code: '2204', prep: 10, shoot: 60, wrap: 2, qty: 2, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Set Designer', account_code: '2205', prep: 10, shoot: 40, wrap: 2, qty: 2, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Graphic Designer', account_code: '2206', prep: 8, shoot: 30, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Storyboard Artist', account_code: '2207', prep: 10, shoot: 20, wrap: 0, qty: 1, rate_type: 'weekly' },
  { dept: 'Art Department', title: 'Illustrator', account_code: '2208', prep: 6, shoot: 15, wrap: 0, qty: 1, rate_type: 'weekly' },

  // SET CONSTRUCTION (Account 23xx)
  { dept: 'Set Construction', title: 'Construction Coordinator', account_code: '2301', prep: 14, shoot: 40, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Head Carpenter', account_code: '2302', prep: 12, shoot: 35, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Carpenter', account_code: '2303', prep: 10, shoot: 30, wrap: 2, qty: 6, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Painter Foreman', account_code: '2304', prep: 8, shoot: 25, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Painter', account_code: '2305', prep: 6, shoot: 20, wrap: 1, qty: 4, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Plasterer', account_code: '2306', prep: 6, shoot: 15, wrap: 1, qty: 2, rate_type: 'weekly' },
  { dept: 'Set Construction', title: 'Laborer', account_code: '2307', prep: 8, shoot: 25, wrap: 2, qty: 4, rate_type: 'weekly' },

  // SET OPERATIONS (Account 24xx)
  { dept: 'Set Operations', title: 'Key Greens', account_code: '2401', prep: 4, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Operations', title: 'Best Boy Greens', account_code: '2402', prep: 2, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Operations', title: 'Greensperson', account_code: '2403', prep: 1, shoot: 60, wrap: 1, qty: 2, rate_type: 'weekly' },

  // GRIP (Account 25xx)
  { dept: 'Grip', title: 'Key Grip', account_code: '2501', prep: 8, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Best Boy Grip', account_code: '2502', prep: 6, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Dolly Grip', account_code: '2503', prep: 2, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Grip', account_code: '2504', prep: 2, shoot: 60, wrap: 1, qty: 6, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Rigging Key Grip', account_code: '2505', prep: 10, shoot: 30, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Rigging Best Boy Grip', account_code: '2506', prep: 8, shoot: 25, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Grip', title: 'Rigging Grip', account_code: '2507', prep: 6, shoot: 20, wrap: 1, qty: 4, rate_type: 'weekly' },

  // PROPERTY (Account 26xx)
  { dept: 'Property', title: 'Property Master', account_code: '2601', prep: 12, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Property', title: 'Assistant Property Master', account_code: '2602', prep: 10, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Property', title: 'Property Assistant', account_code: '2603', prep: 8, shoot: 60, wrap: 2, qty: 2, rate_type: 'weekly' },

  // SET DRESSING (Account 27xx)
  { dept: 'Set Dressing', title: 'Set Decorator', account_code: '2701', prep: 12, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Dressing', title: 'Leadperson', account_code: '2702', prep: 10, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Set Dressing', title: 'Set Dresser', account_code: '2703', prep: 8, shoot: 60, wrap: 2, qty: 4, rate_type: 'weekly' },
  { dept: 'Set Dressing', title: 'Swing Gang', account_code: '2704', prep: 6, shoot: 60, wrap: 1, qty: 3, rate_type: 'weekly' },

  // WARDROBE (Account 29xx)
  { dept: 'Wardrobe', title: 'Costume Designer', account_code: '2901', prep: 14, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Wardrobe', title: 'Assistant Costume Designer', account_code: '2902', prep: 12, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Wardrobe', title: 'Costume Supervisor', account_code: '2903', prep: 10, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Wardrobe', title: 'Key Costumer', account_code: '2904', prep: 8, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Wardrobe', title: 'Set Costumer', account_code: '2905', prep: 4, shoot: 60, wrap: 1, qty: 3, rate_type: 'weekly' },

  // MAKEUP (Account 30xx)
  { dept: 'Makeup', title: 'Key Makeup Artist', account_code: '3001', prep: 4, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Makeup', title: 'Makeup Artist', account_code: '3002', prep: 2, shoot: 60, wrap: 1, qty: 2, rate_type: 'weekly' },

  // HAIR (Account 31xx)
  { dept: 'Hair', title: 'Key Hair Stylist', account_code: '3101', prep: 4, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Hair', title: 'Hair Stylist', account_code: '3102', prep: 2, shoot: 60, wrap: 1, qty: 2, rate_type: 'weekly' },

  // ELECTRIC (Account 32xx)
  { dept: 'Electric', title: 'Gaffer', account_code: '3201', prep: 8, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Electric', title: 'Best Boy Electric', account_code: '3202', prep: 6, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Electric', title: 'Electric', account_code: '3203', prep: 2, shoot: 60, wrap: 1, qty: 6, rate_type: 'weekly' },
  { dept: 'Electric', title: 'Rigging Gaffer', account_code: '3204', prep: 10, shoot: 30, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Electric', title: 'Rigging Best Boy Electric', account_code: '3205', prep: 8, shoot: 25, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Electric', title: 'Rigging Electric', account_code: '3206', prep: 6, shoot: 20, wrap: 1, qty: 4, rate_type: 'weekly' },

  // CAMERA (Account 33xx)
  { dept: 'Camera', title: 'Director of Photography', account_code: '3301', prep: 10, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Camera', title: 'Camera Operator', account_code: '3302', prep: 6, shoot: 60, wrap: 2, qty: 2, rate_type: 'weekly' },
  { dept: 'Camera', title: 'First Assistant Camera', account_code: '3303', prep: 6, shoot: 60, wrap: 2, qty: 2, rate_type: 'weekly' },
  { dept: 'Camera', title: 'Second Assistant Camera', account_code: '3304', prep: 4, shoot: 60, wrap: 1, qty: 2, rate_type: 'weekly' },
  { dept: 'Camera', title: 'Digital Imaging Technician', account_code: '3305', prep: 4, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Camera', title: 'Loader', account_code: '3306', prep: 2, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Camera', title: 'Still Photographer', account_code: '3307', prep: 1, shoot: 40, wrap: 0, qty: 1, rate_type: 'daily' },

  // SOUND (Account 34xx)
  { dept: 'Sound', title: 'Production Sound Mixer', account_code: '3401', prep: 4, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Sound', title: 'Boom Operator', account_code: '3402', prep: 2, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Sound', title: 'Utility Sound', account_code: '3403', prep: 1, shoot: 60, wrap: 1, qty: 1, rate_type: 'weekly' },

  // TRANSPORTATION (Account 35xx)
  { dept: 'Transportation', title: 'Transportation Coordinator', account_code: '3501', prep: 8, shoot: 60, wrap: 3, qty: 1, rate_type: 'weekly' },
  { dept: 'Transportation', title: 'Transportation Captain', account_code: '3502', prep: 6, shoot: 60, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Transportation', title: 'Driver', account_code: '3503', prep: 2, shoot: 60, wrap: 1, qty: 10, rate_type: 'weekly' },

  // LOCATION (Account 36xx)
  { dept: 'Location', title: 'Location Manager', account_code: '3601', prep: 12, shoot: 60, wrap: 4, qty: 1, rate_type: 'weekly' },
  { dept: 'Location', title: 'Assistant Location Manager', account_code: '3602', prep: 10, shoot: 60, wrap: 3, qty: 2, rate_type: 'weekly' },
  { dept: 'Location', title: 'Location Scout', account_code: '3603', prep: 10, shoot: 20, wrap: 0, qty: 1, rate_type: 'weekly' },
  { dept: 'Location', title: 'Location Assistant', account_code: '3604', prep: 4, shoot: 60, wrap: 1, qty: 2, rate_type: 'weekly' },

  // SPECIAL EFFECTS (Account 38xx)
  { dept: 'Special Effects', title: 'Special Effects Coordinator', account_code: '3801', prep: 6, shoot: 40, wrap: 2, qty: 1, rate_type: 'weekly' },
  { dept: 'Special Effects', title: 'Special Effects Foreman', account_code: '3802', prep: 4, shoot: 35, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Special Effects', title: 'Special Effects Technician', account_code: '3803', prep: 2, shoot: 30, wrap: 1, qty: 3, rate_type: 'weekly' },

  // STUNTS (Account 40xx)
  { dept: 'Stunts', title: 'Stunt Coordinator', account_code: '4001', prep: 6, shoot: 30, wrap: 1, qty: 1, rate_type: 'weekly' },
  { dept: 'Stunts', title: 'Stunt Performers', account_code: '4002', prep: 1, shoot: 20, wrap: 0, qty: 4, rate_type: 'daily' },

  // EDITORIAL (Account 42xx)
  { dept: 'Editorial', title: 'Editor', account_code: '4201', prep: 0, shoot: 20, wrap: 30, qty: 1, rate_type: 'weekly' },
  { dept: 'Editorial', title: 'Assistant Editor', account_code: '4202', prep: 0, shoot: 15, wrap: 25, qty: 2, rate_type: 'weekly' },

  // POST PRODUCTION (Account 43xx)
  { dept: 'Post Production', title: 'Post Production Supervisor', account_code: '4301', prep: 4, shoot: 12, wrap: 30, qty: 1, rate_type: 'weekly' },
  { dept: 'Post Production', title: 'Post Production Coordinator', account_code: '4302', prep: 2, shoot: 8, wrap: 25, qty: 1, rate_type: 'weekly' },
];

async function main() {
  const client = await pool.connect();

  try {
    console.log('🎬 Seeding theatrical crew templates...\n');

    // Start transaction
    await client.query('BEGIN');

    // Clear existing theatrical templates
    await client.query(`DELETE FROM production_type_crews WHERE production_type = 'theatrical'`);
    console.log('🗑️  Cleared existing theatrical templates\n');

    // Insert crew positions
    let insertedCount = 0;

    for (const crew of theatricalCrew) {
      await client.query(`
        INSERT INTO production_type_crews (
          production_type,
          min_budget,
          max_budget,
          position_title,
          department,
          account_code,
          typical_prep_days,
          typical_shoot_days,
          typical_wrap_days,
          typical_quantity,
          typical_rate_type,
          typical_fringe_rate,
          sort_order,
          is_essential,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        'theatrical',           // production_type
        5000000,                // min_budget ($5M+)
        null,                   // max_budget (no max)
        crew.title,             // position_title
        crew.dept,              // department
        crew.account_code,      // account_code (sequential by department)
        crew.prep,              // typical_prep_days
        crew.shoot,             // typical_shoot_days
        crew.wrap,              // typical_wrap_days
        crew.qty,               // typical_quantity
        crew.rate_type,         // typical_rate_type
        32.00,                  // typical_fringe_rate (32% default)
        insertedCount,          // sort_order
        true,                   // is_essential
        'Industry-standard theatrical feature crew template for $5M+ budget with Standard Film/TV COA'
      ]);

      insertedCount++;
      if (insertedCount % 10 === 0) {
        process.stdout.write(`\r✍️  Inserted ${insertedCount} positions...`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`\n\n✅ Successfully inserted ${insertedCount} crew positions`);

    // Show summary by department
    const summary = await client.query(`
      SELECT department, COUNT(*) as count, SUM(typical_quantity) as total_people
      FROM production_type_crews
      WHERE production_type = 'theatrical'
      GROUP BY department
      ORDER BY count DESC
    `);

    console.log('\n📋 Crew positions by department:');
    let totalPositions = 0;
    let totalPeople = 0;
    for (const row of summary.rows) {
      console.log(`   ${row.department.padEnd(20)} ${row.count} positions, ${row.total_people} people`);
      totalPositions += parseInt(row.count);
      totalPeople += parseInt(row.total_people);
    }
    console.log(`\n   ${'TOTAL'.padEnd(20)} ${totalPositions} positions, ${totalPeople} people`);

    console.log('\n🎉 Template creation complete!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
