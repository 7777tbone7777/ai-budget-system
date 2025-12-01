/**
 * IATSE Local 873 (Toronto) Rate Extraction Script
 *
 * Source: Wage_Scales_2024-28_Local_873_Toronto.pdf
 * Contract Period: April 2, 2023 - March 31, 2028
 * These rates are Year 2 (Effective March 30, 2025)
 *
 * Covers: Below-the-line crew for Feature Films and Television
 * in the Toronto/Ontario region
 *
 * Production Types covered:
 * - Feature Film (Standard)
 * - Low Budget Feature ($8M-$14M, $3M-$8M, $3M and below)
 * - Television (Network, Cable, SVOD by tier and season)
 *
 * Currency: Canadian Dollars (CAD)
 * Location: Toronto/Ontario
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VFlzOYAahWhmRpVnuvIEraoKp628e1vp@caboose.proxy.rlwy.net:14463/railway';

// IATSE Local 873 Year 2 Rates (Effective March 30, 2025)
// Focus on Feature Film standard rates and 3rd+ Season Network/Tier 1 SVOD TV rates
const IATSE_LOCAL_873_RATES = [
  // =============================================
  // FEATURE FILM - STANDARD RATES (Year 2)
  // =============================================

  // Construction Department
  { job_classification: 'Head Carpenter/On-set Carpenter', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Head Carpenter', rate_type: 'hourly', base_rate: 53.57, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Carpenter', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },

  // Costume Department
  { job_classification: 'Assistant Costume Designer', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Costume Supervisor', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Costume Set Supervisor', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Costume Set Supervisor', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Costume Dresser/Sewer', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Costume Assistant', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Electric Department
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Second Lighting Technician', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Lighting Technician', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Generator Operator', rate_type: 'hourly', base_rate: 50.51, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Head Rigging Lighting Technician', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Second Rigging Lighting Technician', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Rigging Lighting Technician', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Grip Department
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Key Grip', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Dolly Grip', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Key Rigging Grip', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Rigging Grip', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Rigging Grip', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Hair Department
  { job_classification: 'Key Hair Stylist', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Hair Stylist', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },

  // Make-up Department
  { job_classification: 'Assistant Head of Make-up Department', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },

  // Misc
  { job_classification: 'Mould Maker', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Production Labourer', rate_type: 'hourly', base_rate: 38.86, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 38.86, production_type: 'theatrical', tier: 'Standard Feature' },

  // Property Department
  { job_classification: 'Property Master/Buyer', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Property Master', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Prop Person', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Scenic/Paint Department
  { job_classification: 'Scenic Artist', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Head Painter/On-set Painter', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Head Painter', rate_type: 'hourly', base_rate: 53.57, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Painter/Sign Writer', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },

  // Script Department
  { job_classification: 'Script Supervisor', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Script Assistant', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },

  // Set Decorating
  { job_classification: 'Set Decorator/Buyer', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Set Decorator', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'On-Set Dresser', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant On-Set Dresser', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Set Dresser', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Key Greens-Person', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Greens-Person', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Greens-Person', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Sound Department
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Playback Operator', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Sound Utility', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Special Effects Department
  { job_classification: 'Head of Special Effects', rate_type: 'hourly', base_rate: 56.12, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Assistant Head of Special Effects', rate_type: 'hourly', base_rate: 52.55, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Special Effects Technician', rate_type: 'hourly', base_rate: 46.96, production_type: 'theatrical', tier: 'Standard Feature' },

  // Transportation Department
  { job_classification: 'Transport Coordinator', rate_type: 'hourly', base_rate: 47.90, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Transport Captain', rate_type: 'hourly', base_rate: 44.79, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Picture Vehicle Captain', rate_type: 'hourly', base_rate: 44.79, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Transport Co-Captain', rate_type: 'hourly', base_rate: 42.11, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Driver', rate_type: 'hourly', base_rate: 41.91, production_type: 'theatrical', tier: 'Standard Feature' },
  { job_classification: 'Tractor Trailer Driver/Bus Driver', rate_type: 'hourly', base_rate: 42.41, production_type: 'theatrical', tier: 'Standard Feature' },

  // =============================================
  // TELEVISION - 3rd+ Season Network/Tier 1 SVOD (Year 2)
  // =============================================

  // Construction Department
  { job_classification: 'Head Carpenter/On-set Carpenter', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Head Carpenter', rate_type: 'hourly', base_rate: 43.79, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Carpenter', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Costume Department
  { job_classification: 'Assistant Costume Designer', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Costume Supervisor', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Costume Set Supervisor', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Costume Set Supervisor', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Costume Dresser/Sewer', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Costume Assistant', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Electric Department
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Second Lighting Technician', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Lighting Technician', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Generator Operator', rate_type: 'hourly', base_rate: 41.29, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Head Rigging Lighting Technician', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Second Rigging Lighting Technician', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Rigging Lighting Technician', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Grip Department
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Key Grip', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Dolly Grip', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Key Rigging Grip', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Rigging Grip', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Rigging Grip', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Hair Department
  { job_classification: 'Key Hair Stylist', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Hair Stylist', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Make-up Department
  { job_classification: 'Assistant Head of Make-up Department', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Misc
  { job_classification: 'Mould Maker', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Production Labourer', rate_type: 'hourly', base_rate: 31.77, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 31.77, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Property Department
  { job_classification: 'Property Master/Buyer', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Property Master', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Prop Person', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Scenic/Paint Department
  { job_classification: 'Scenic Artist', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Head Painter/On-set Painter', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Head Painter', rate_type: 'hourly', base_rate: 43.79, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Painter/Sign Writer', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Script Department
  { job_classification: 'Script Supervisor', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Script Assistant', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Set Decorating
  { job_classification: 'Set Decorator/Buyer', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Set Decorator', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'On-Set Dresser', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant On-Set Dresser', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Set Dresser', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Key Greens-Person', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Greens-Person', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Greens-Person', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Sound Department
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Playback Operator', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Sound Utility', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Special Effects Department
  { job_classification: 'Head of Special Effects', rate_type: 'hourly', base_rate: 45.88, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Assistant Head of Special Effects', rate_type: 'hourly', base_rate: 42.96, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Special Effects Technician', rate_type: 'hourly', base_rate: 38.39, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // Transportation Department
  { job_classification: 'Transport Coordinator', rate_type: 'hourly', base_rate: 40.48, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Transport Captain', rate_type: 'hourly', base_rate: 39.19, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Picture Vehicle Captain', rate_type: 'hourly', base_rate: 39.19, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Transport Co-Captain', rate_type: 'hourly', base_rate: 38.11, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Driver', rate_type: 'hourly', base_rate: 37.93, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },
  { job_classification: 'Tractor Trailer Driver/Bus Driver', rate_type: 'hourly', base_rate: 38.43, production_type: 'television', tier: '3rd+ Season Network/Tier 1 SVOD' },

  // =============================================
  // LOW BUDGET FEATURE - $8M-$14M (Year 2)
  // =============================================

  // Key positions at Low Budget $8M-$14M rates
  { job_classification: 'Head Carpenter/On-set Carpenter', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Key Hair Stylist', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Property Master/Buyer', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Script Supervisor', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Set Decorator/Buyer', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Head of Special Effects', rate_type: 'hourly', base_rate: 43.71, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Lighting Technician', rate_type: 'hourly', base_rate: 36.47, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 36.47, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Production Labourer', rate_type: 'hourly', base_rate: 30.19, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 30.19, production_type: 'theatrical', tier: 'Low Budget $8M-$14M' },

  // =============================================
  // LOW BUDGET FEATURE - $3M-$8M (Year 2)
  // =============================================

  { job_classification: 'Head Carpenter/On-set Carpenter', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Key Hair Stylist', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Property Master/Buyer', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Script Supervisor', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Set Decorator/Buyer', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 39.34, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Lighting Technician', rate_type: 'hourly', base_rate: 32.82, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 32.82, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Production Labourer', rate_type: 'hourly', base_rate: 27.18, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 27.18, production_type: 'theatrical', tier: 'Low Budget $3M-$8M' },

  // =============================================
  // LOW BUDGET FEATURE - $3M and Below (Year 2)
  // =============================================

  { job_classification: 'Head Carpenter/On-set Carpenter', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Head Lighting Technician', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Key Grip', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Key Hair Stylist', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Property Master/Buyer', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Script Supervisor', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Set Decorator/Buyer', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 37.16, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Lighting Technician', rate_type: 'hourly', base_rate: 31.00, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Grip', rate_type: 'hourly', base_rate: 31.00, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Production Labourer', rate_type: 'hourly', base_rate: 25.67, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
  { job_classification: 'Craft Service', rate_type: 'hourly', base_rate: 25.67, production_type: 'theatrical', tier: 'Low Budget Under $3M' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of IATSE_LOCAL_873_RATES) {
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
        'IATSE Local 873',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2025-03-30', // Year 2 effective date
        'Toronto',
        rate.production_type,
        2, // Contract Year 2
        rate.tier || null,
        JSON.stringify({ currency: 'CAD', source: 'AMPTP IATSE Local 873 Wage Scales 2024-28' })
      ];

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
        insertedCount++;
        console.log(`Inserted: ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type} [${rate.tier || 'Standard'}]`);
      } else {
        skippedCount++;
        console.log(`Skipped (duplicate): ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type}`);
      }
    }

    console.log(`\n=== IATSE Local 873 Rate Insertion Complete ===`);
    console.log(`Total rates processed: ${IATSE_LOCAL_873_RATES.length}`);
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
