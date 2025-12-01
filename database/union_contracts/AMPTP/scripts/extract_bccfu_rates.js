/**
 * BCCFU (BC Council of Film Unions) 2025-28 Wage Scale Rate Extraction
 * Source: AMPTP 2025-28 BCCFU Master Agreement Wage Schedules
 * Contract Period: 3/31/2024 - 3/31/2028
 * Current Year (Y2): 3/30/2025 - 3/28/2026
 *
 * Includes: IATSE Local 891, Teamsters Local 155, ICG Local 669
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// BCCFU Year 2 rates (3/30/2025 - 3/28/2026) - Television rates
const BCCFU_RATES = [
  // ============================================
  // IATSE LOCAL 891 - ACCOUNTING
  // ============================================
  { job_classification: 'Assistant Accountant', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Accounting Clerk 1', rate_type: 'hourly', base_rate: 33.22, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Accounting Clerk 2', rate_type: 'hourly', base_rate: 27.42, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Accounting Trainee', rate_type: 'hourly', base_rate: 23.27, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - ART DEPARTMENT
  // ============================================
  { job_classification: 'Art Director', rate_type: 'hourly', base_rate: 60.44, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Art Director', rate_type: 'hourly', base_rate: 52.48, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Draftsperson', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Graphics/Illustrator/Storyboard Artist/Set Designer', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Art Department Assistant', rate_type: 'hourly', base_rate: 23.27, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Art Department Coordinator', rate_type: 'hourly', base_rate: 29.64, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - CONSTRUCTION
  // ============================================
  { job_classification: 'Construction Coordinator', rate_type: 'hourly', base_rate: 55.20, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Construction Foreperson', rate_type: 'hourly', base_rate: 52.91, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lead Carpenter', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Scenic Carpenter', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Scenic Helper', rate_type: 'hourly', base_rate: 43.56, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lead Metal Fabricator', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Scenic Metal Fabricator', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Metal Fabricator Helper', rate_type: 'hourly', base_rate: 37.19, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Construction Buyer', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Sculptor', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Model Maker', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - COSTUME
  // ============================================
  { job_classification: 'Assistant Costume Designer/Coordinator', rate_type: 'hourly', base_rate: 47.87, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Supervisor (Costume)', rate_type: 'hourly', base_rate: 47.87, production_type: 'television', location: 'British Columbia' },
  { job_classification: "Performer's Costumer", rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Costumer', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Prep Costumer', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Cutter', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Costume Breakdown/FX', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dresser', rate_type: 'hourly', base_rate: 35.81, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stitcher', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - EDITING
  // ============================================
  { job_classification: 'Supervising Editor', rate_type: 'hourly', base_rate: 57.69, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Supervising Sound Editor', rate_type: 'hourly', base_rate: 57.69, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Editor', rate_type: 'hourly', base_rate: 54.08, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Sound Effects Editor', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Music Editor', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Editor', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Dialogue Editor', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Sound Effects Editor', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Editor', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - FIRST AID/CRAFT SERVICE
  // ============================================
  { job_classification: 'First Aid/Craft Service', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Aid', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 37.19, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - GREENS
  // ============================================
  { job_classification: 'Head Greensperson', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Best Person (Greens)', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Greensperson', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Greens Helper', rate_type: 'hourly', base_rate: 35.81, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - GRIPS
  // ============================================
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Grip', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lead Grip/Setup', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dolly Operator', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Rigging Grip', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - HAIR
  // ============================================
  { job_classification: 'Hair Department Head', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Hairstylist', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Hairstylist', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - LIGHTING/ELECTRICS
  // ============================================
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Head Lighting Technician', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lighting Board Operator', rate_type: 'hourly', base_rate: 43.66, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Head Rigging Lighting Technician', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Generator Operator', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lighting Technician/Lamp Operator', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Wire Technician', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - MAKE-UP
  // ============================================
  { job_classification: 'Makeup Department Head', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Makeup Artist', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Makeup Artist', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Third Assistant Makeup Artist', rate_type: 'hourly', base_rate: 27.21, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - PAINTING
  // ============================================
  { job_classification: 'Paint Coordinator', rate_type: 'hourly', base_rate: 54.51, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lead Painter', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Scenic Artist', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Sign Painter/Fabricator', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Automotive Sprayer', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Scenic Painter', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wallpaper Hanger', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Plasterer (Paint)', rate_type: 'hourly', base_rate: 46.74, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Painter', rate_type: 'hourly', base_rate: 44.46, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Paint Labourer', rate_type: 'hourly', base_rate: 34.14, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - PRODUCTION OFFICE
  // ============================================
  { job_classification: 'Production Office Coordinator', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Production Coordinator', rate_type: 'hourly', base_rate: 43.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: '2nd Assistant Production Coordinator', rate_type: 'hourly', base_rate: 25.54, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - PROPS
  // ============================================
  { job_classification: 'Property Master', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Property Master', rate_type: 'hourly', base_rate: 47.87, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Props Buyer', rate_type: 'hourly', base_rate: 43.56, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Props', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - SCRIPT SUPERVISORS
  // ============================================
  { job_classification: 'Script Supervisor/Continuity Coordinator', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Script Supervisor/Continuity Coordinator Assistant', rate_type: 'hourly', base_rate: 27.63, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - SET DECORATING
  // ============================================
  { job_classification: 'Set Decorator', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Set Decorator', rate_type: 'hourly', base_rate: 45.54, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Buyer', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Lead Dresser', rate_type: 'hourly', base_rate: 41.32, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'On-Set Dresser', rate_type: 'hourly', base_rate: 41.32, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Dresser', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Draper/Upholsterer', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Set Dresser', rate_type: 'hourly', base_rate: 33.22, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - SOUND
  // ============================================
  { job_classification: 'Mixer (Production and Dubbing)', rate_type: 'hourly', base_rate: 63.76, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 53.56, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Sound Assistant', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Public Address Operator', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Playback Operator', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Sound Maintenance', rate_type: 'hourly', base_rate: 40.18, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - SPECIAL EFFECTS
  // ============================================
  { job_classification: 'Special Effects Coordinator', rate_type: 'hourly', base_rate: 54.10, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Special Effects', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Special Effects Assistant', rate_type: 'hourly', base_rate: 42.63, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Special Effects Labourer', rate_type: 'hourly', base_rate: 34.14, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - VIDEO
  // ============================================
  { job_classification: 'Video Sound Mixer', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Video Lighting Director', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Video Script Supervisor', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Colourist', rate_type: 'hourly', base_rate: 48.96, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // IATSE LOCAL 891 - VISUAL EFFECTS
  // ============================================
  { job_classification: 'VFX Artist - Level 1', rate_type: 'weekly', base_rate: 2279.48, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'VFX Artist - Level 2', rate_type: 'weekly', base_rate: 2116.66, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'VFX Artist - Level 3', rate_type: 'weekly', base_rate: 1738.86, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'VFX Technician - Level 1', rate_type: 'weekly', base_rate: 2116.66, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'VFX Technician - Level 2', rate_type: 'weekly', base_rate: 1738.86, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // TEAMSTERS LOCAL 155 - DRIVERS (Television)
  // ============================================
  { job_classification: 'Transportation Coordinator', rate_type: 'hourly', base_rate: 46.99, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Driver Captain', rate_type: 'hourly', base_rate: 43.91, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Co-Captain (Driver)', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Tractor Trailer (Prod. Van) Driver', rate_type: 'hourly', base_rate: 43.60, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Special Equipment Driver', rate_type: 'hourly', base_rate: 43.60, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Camera Car Driver', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Catering Vehicle Operator - Cook', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Assistant Catering Vehicle Operator - Cook', rate_type: 'hourly', base_rate: 40.46, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Bus Driver (Class #2)', rate_type: 'hourly', base_rate: 42.01, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Set Decorator Driver', rate_type: 'hourly', base_rate: 42.01, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Construction Driver', rate_type: 'hourly', base_rate: 42.01, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Mini Bus Driver (Class #4)', rate_type: 'hourly', base_rate: 41.49, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Truck Driver - Over 1 Ton', rate_type: 'hourly', base_rate: 41.49, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Fork Lift Driver', rate_type: 'hourly', base_rate: 41.49, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Car Chauffeur/Econoline Truck Driver', rate_type: 'hourly', base_rate: 41.15, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Auto Service (non-Mechanic)', rate_type: 'hourly', base_rate: 40.36, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Automotive Mechanic', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Automotive Wrangler/Picture Car Coordinator', rate_type: 'hourly', base_rate: 43.70, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dispatcher (Transportation)', rate_type: 'hourly', base_rate: 41.58, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // TEAMSTERS LOCAL 155 - ANIMAL WRANGLERS
  // ============================================
  { job_classification: 'Head Wrangler', rate_type: 'hourly', base_rate: 42.37, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wrangler', rate_type: 'hourly', base_rate: 41.15, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wrangler (Pick Up)', rate_type: 'hourly', base_rate: 54.15, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wrangler (Braider)', rate_type: 'hourly', base_rate: 45.60, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainers (Stable)', rate_type: 'hourly', base_rate: 50.78, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wild Animal Trainers', rate_type: 'hourly', base_rate: 50.78, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Wild Animal Handlers', rate_type: 'hourly', base_rate: 45.85, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dog Trainer', rate_type: 'hourly', base_rate: 45.85, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Dog Handler', rate_type: 'hourly', base_rate: 41.15, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Swamper', rate_type: 'hourly', base_rate: 35.13, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // TEAMSTERS LOCAL 155 - MARINE/SECURITY
  // ============================================
  { job_classification: 'Marine Coordinator', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Boat Operator', rate_type: 'hourly', base_rate: 42.01, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Safety Diver', rate_type: 'hourly', base_rate: 42.93, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Security Captain', rate_type: 'hourly', base_rate: 33.12, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Security Personnel', rate_type: 'hourly', base_rate: 32.12, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // ICG LOCAL 669 - CAMERA (Television Hourly)
  // ============================================
  { job_classification: 'Director of Photography', rate_type: 'hourly', base_rate: 130.68, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Camera Operator', rate_type: 'hourly', base_rate: 86.88, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Camera', rate_type: 'hourly', base_rate: 65.26, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Camera', rate_type: 'hourly', base_rate: 47.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stills Photographer I', rate_type: 'hourly', base_rate: 80.22, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stills Photographer II', rate_type: 'hourly', base_rate: 120.33, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee (Camera)', rate_type: 'hourly', base_rate: 23.27, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Motion Picture Video Coordinator', rate_type: 'hourly', base_rate: 51.10, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Motion Picture Video Assistant 1', rate_type: 'hourly', base_rate: 38.45, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Motion Picture Video Assistant 2', rate_type: 'hourly', base_rate: 28.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Digital Imaging Technician', rate_type: 'hourly', base_rate: 65.26, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Electronic Director of Photography', rate_type: 'hourly', base_rate: 95.64, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Electronic Camera Operator', rate_type: 'hourly', base_rate: 71.71, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Electronic Camera Assistant', rate_type: 'hourly', base_rate: 47.87, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Drone Camera Operator', rate_type: 'hourly', base_rate: 86.88, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Drone Camera Assistant', rate_type: 'hourly', base_rate: 65.26, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // ICG LOCAL 669 - CAMERA (Television Weekly - 60hr/70 pay hrs)
  // ============================================
  { job_classification: 'Director of Photography', rate_type: 'weekly', base_rate: 8671.60, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Camera Operator', rate_type: 'weekly', base_rate: 5764.50, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'First Assistant Camera', rate_type: 'weekly', base_rate: 4327.40, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Second Assistant Camera', rate_type: 'weekly', base_rate: 3187.80, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Stills Photographer', rate_type: 'weekly', base_rate: 5322.10, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Trainee (Camera)', rate_type: 'weekly', base_rate: 1628.90, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Motion Picture Video Coordinator', rate_type: 'weekly', base_rate: 3391.50, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Digital Imaging Technician', rate_type: 'weekly', base_rate: 4327.40, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // ICG LOCAL 669 - PUBLICITY
  // ============================================
  { job_classification: 'Senior Unit Publicist', rate_type: 'hourly', base_rate: 49.94, production_type: 'television', location: 'British Columbia' },
  { job_classification: 'Junior Unit Publicist', rate_type: 'hourly', base_rate: 34.14, production_type: 'television', location: 'British Columbia' },

  // ============================================
  // FEATURE RATES (Higher tier) - Key positions
  // ============================================
  { job_classification: 'Assistant Accountant', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Art Director', rate_type: 'hourly', base_rate: 63.48, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Construction Coordinator', rate_type: 'hourly', base_rate: 57.94, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Hair Department Head', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Makeup Department Head', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Property Master', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Set Decorator', rate_type: 'hourly', base_rate: 51.41, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Mixer (Production and Dubbing)', rate_type: 'hourly', base_rate: 66.91, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Special Effects Coordinator', rate_type: 'hourly', base_rate: 56.84, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Director of Photography', rate_type: 'hourly', base_rate: 137.22, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Camera Operator', rate_type: 'hourly', base_rate: 91.20, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'First Assistant Camera', rate_type: 'hourly', base_rate: 68.51, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Transportation Coordinator', rate_type: 'hourly', base_rate: 48.33, production_type: 'theatrical', location: 'British Columbia' },
  { job_classification: 'Driver Captain', rate_type: 'hourly', base_rate: 45.15, production_type: 'theatrical', location: 'British Columbia' },
];

async function insertRates() {
  const client = await pool.connect();

  try {
    console.log('Deleting existing BCCFU rates...');
    await client.query(`DELETE FROM rate_cards WHERE union_local = 'BCCFU'`);

    console.log(`Inserting ${BCCFU_RATES.length} BCCFU rates...`);

    let inserted = 0;
    for (const rate of BCCFU_RATES) {
      await client.query(`
        INSERT INTO rate_cards (
          union_local, job_classification, rate_type, base_rate,
          effective_date, contract_year, production_type, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING
      `, [
        'BCCFU',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-30',  // Year 2 start
        2,
        rate.production_type,
        rate.location
      ]);
      inserted++;
    }

    console.log(`Successfully inserted ${inserted} rates for BCCFU`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM rate_cards WHERE union_local = 'BCCFU'
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
