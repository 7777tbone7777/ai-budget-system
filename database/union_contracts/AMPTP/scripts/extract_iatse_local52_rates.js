/**
 * IATSE Local 52 (New York/New Jersey) Rate Extraction Script
 *
 * Source: Wage_Scales_2024-27_Local_52.pdf
 * Contract Period: 2024-2027
 * These rates are Year 2 (Effective 9/29/2024 - 9/27/2025)
 *
 * Covers: Sound, Electric, Grip, Property, Stagecraft for theatrical and TV productions
 * Location: New York, New Jersey, Connecticut, Delaware, Pennsylvania
 *
 * Currency: US Dollars (USD)
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VFlzOYAahWhmRpVnuvIEraoKp628e1vp@caboose.proxy.rlwy.net:14463/railway';

// IATSE Local 52 Year 2 Rates (Effective 9/29/2024)
const LOCAL_52_RATES = [
  // =============================================
  // THEATRICAL MOTION PICTURES - NY/NJ (Part A, Section 1.a.1)
  // Daily Rates
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'daily', base_rate: 659.10, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Boom Operator', rate_type: 'daily', base_rate: 526.33, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Sound Utility Person', rate_type: 'daily', base_rate: 526.33, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'daily', base_rate: 553.25, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Electrician - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Property Person - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Grip - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Drapery Person - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Generator Person - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'daily', base_rate: 522.83, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'daily', base_rate: 450.73, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'daily', base_rate: 450.73, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Grip - Foreperson', rate_type: 'daily', base_rate: 450.73, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'daily', base_rate: 501.40, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Electrician - Operator', rate_type: 'daily', base_rate: 430.96, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Property Person - Operator', rate_type: 'daily', base_rate: 430.96, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },
  { job_classification: 'Grip - Operator', rate_type: 'daily', base_rate: 430.96, production_type: 'theatrical', tier: 'NY/NJ Standard', location: 'New York' },

  // =============================================
  // TELEVISION - NY/NJ Standard (Part A, Section 1.a.2)
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'daily', base_rate: 659.10, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Boom Operator', rate_type: 'daily', base_rate: 521.12, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Sound Utility Person', rate_type: 'daily', base_rate: 521.12, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'daily', base_rate: 553.25, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Electrician - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Property Person - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Grip - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'daily', base_rate: 443.77, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'daily', base_rate: 443.77, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Grip - Foreperson', rate_type: 'daily', base_rate: 443.77, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'daily', base_rate: 497.98, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Electrician - Operator', rate_type: 'daily', base_rate: 427.52, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Property Person - Operator', rate_type: 'daily', base_rate: 427.52, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },
  { job_classification: 'Grip - Operator', rate_type: 'daily', base_rate: 427.52, production_type: 'television', tier: 'NY/NJ Standard TV', location: 'New York' },

  // =============================================
  // TV ONE-HOUR SERIES 3rd+ SEASON (Part A, Section 1.a.5)
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'daily', base_rate: 659.10, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Boom Operator', rate_type: 'daily', base_rate: 523.33, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Sound Utility Person', rate_type: 'daily', base_rate: 523.33, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'daily', base_rate: 553.25, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Electrician - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Property Person - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Grip - Department Head', rate_type: 'daily', base_rate: 515.91, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'daily', base_rate: 518.83, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'daily', base_rate: 446.73, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'daily', base_rate: 446.73, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Grip - Foreperson', rate_type: 'daily', base_rate: 446.73, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'daily', base_rate: 499.40, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Electrician - Operator', rate_type: 'daily', base_rate: 428.96, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Property Person - Operator', rate_type: 'daily', base_rate: 428.96, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },
  { job_classification: 'Grip - Operator', rate_type: 'daily', base_rate: 428.96, production_type: 'television', tier: '1-Hour Series 3rd+ Season', location: 'New York' },

  // =============================================
  // LONG-FORM TV / MINI-SERIES / PILOTS (Part A, Section 1.a.3)
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'daily', base_rate: 607.19, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Boom Operator', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Sound Utility Person', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'daily', base_rate: 509.84, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Electrician - Department Head', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Property Person - Department Head', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Grip - Department Head', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'daily', base_rate: 475.49, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'daily', base_rate: 409.13, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'daily', base_rate: 409.13, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Grip - Foreperson', rate_type: 'daily', base_rate: 409.13, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'daily', base_rate: 449.40, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Electrician - Operator', rate_type: 'daily', base_rate: 384.55, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Property Person - Operator', rate_type: 'daily', base_rate: 384.55, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },
  { job_classification: 'Grip - Operator', rate_type: 'daily', base_rate: 384.55, production_type: 'television', tier: 'Long-Form/Mini-Series/Pilots', location: 'New York' },

  // =============================================
  // THEATRICAL - CT/DE/PA HOURLY (Part B, Section 26.a.1)
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 48.57, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Sound Utility Person', rate_type: 'hourly', base_rate: 45.54, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Electrician - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Property Person - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Grip - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'hourly', base_rate: 48.57, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'hourly', base_rate: 48.57, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'hourly', base_rate: 48.57, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Grip - Foreperson', rate_type: 'hourly', base_rate: 48.57, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'hourly', base_rate: 45.54, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Electrician - Operator', rate_type: 'hourly', base_rate: 45.54, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Property Person - Operator', rate_type: 'hourly', base_rate: 45.54, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },
  { job_classification: 'Grip - Operator', rate_type: 'hourly', base_rate: 45.54, production_type: 'theatrical', tier: 'CT/DE/PA Hourly', location: 'Connecticut' },

  // =============================================
  // THEATRICAL - Philadelphia 30-Mile Radius HOURLY (Part B, Section 26.a.2)
  // =============================================

  // Sound Department
  { job_classification: 'Production Mixer', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Boom Operator', rate_type: 'hourly', base_rate: 49.86, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Sound Utility Person', rate_type: 'hourly', base_rate: 46.84, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },

  // Department Heads
  { job_classification: 'Shop Craftsperson - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Electrician - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Property Person - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Grip - Department Head', rate_type: 'hourly', base_rate: 53.56, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },

  // Forepersons
  { job_classification: 'Shop Craftsperson - Foreperson', rate_type: 'hourly', base_rate: 49.42, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Electrician - Foreperson', rate_type: 'hourly', base_rate: 49.42, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Property Person - Foreperson', rate_type: 'hourly', base_rate: 49.42, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Grip - Foreperson', rate_type: 'hourly', base_rate: 49.42, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },

  // Operators
  { job_classification: 'Shop Craftsperson - Operator', rate_type: 'hourly', base_rate: 47.27, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Electrician - Operator', rate_type: 'hourly', base_rate: 47.27, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Property Person - Operator', rate_type: 'hourly', base_rate: 47.27, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },
  { job_classification: 'Grip - Operator', rate_type: 'hourly', base_rate: 47.27, production_type: 'theatrical', tier: 'Philadelphia 30-Mile', location: 'Philadelphia' },

  // =============================================
  // SUPPLEMENTAL DIGITAL AGREEMENT - Non-Dramatic TV (Page 19-20)
  // =============================================

  // Daily Rates
  { job_classification: 'Audio Mixer', rate_type: 'daily', base_rate: 560, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Digital Utility Person', rate_type: 'daily', base_rate: 327, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'daily', base_rate: 376, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'daily', base_rate: 273, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'daily', base_rate: 498, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'daily', base_rate: 434, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'daily', base_rate: 358, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'daily', base_rate: 477, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },

  // Weekly Rates
  { job_classification: 'Audio Mixer', rate_type: 'weekly', base_rate: 2542, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'weekly', base_rate: 1763, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'weekly', base_rate: 1281, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'weekly', base_rate: 2305, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'weekly', base_rate: 1994, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'weekly', base_rate: 1631, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'weekly', base_rate: 2181, production_type: 'television', tier: 'SDP Non-Dramatic', location: 'New York' },

  // =============================================
  // SUPPLEMENTAL DIGITAL AGREEMENT - Reality Shows (Page 21-22)
  // =============================================

  // Daily Rates
  { job_classification: 'Audio Mixer', rate_type: 'daily', base_rate: 577, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Digital Utility Person', rate_type: 'daily', base_rate: 337, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'daily', base_rate: 387, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'daily', base_rate: 281, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'daily', base_rate: 513, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'daily', base_rate: 447, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'daily', base_rate: 369, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'daily', base_rate: 491, production_type: 'television', tier: 'SDP Reality', location: 'New York' },

  // Weekly Rates
  { job_classification: 'Audio Mixer', rate_type: 'weekly', base_rate: 2618, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'weekly', base_rate: 1816, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'weekly', base_rate: 1319, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'weekly', base_rate: 2374, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'weekly', base_rate: 2054, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'weekly', base_rate: 1680, production_type: 'television', tier: 'SDP Reality', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'weekly', base_rate: 2246, production_type: 'television', tier: 'SDP Reality', location: 'New York' },

  // =============================================
  // SUPPLEMENTAL DIGITAL AGREEMENT - Non-Prime Time Dramatic (Page 23-24)
  // =============================================

  // Daily Rates
  { job_classification: 'Audio Mixer', rate_type: 'daily', base_rate: 618, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Digital Utility Person', rate_type: 'daily', base_rate: 364, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'daily', base_rate: 418, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'daily', base_rate: 302, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'daily', base_rate: 552, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'daily', base_rate: 479, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'daily', base_rate: 398, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'daily', base_rate: 524, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },

  // Weekly Rates
  { job_classification: 'Audio Mixer', rate_type: 'weekly', base_rate: 2817, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator', rate_type: 'weekly', base_rate: 1950, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Videotape Operator - Entry Level', rate_type: 'weekly', base_rate: 1416, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Other Sound Department Persons', rate_type: 'weekly', base_rate: 2558, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Stagecraft Chief', rate_type: 'weekly', base_rate: 2214, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Other Stagecraft Department Persons', rate_type: 'weekly', base_rate: 1810, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
  { job_classification: 'Set Decorator (On Call)', rate_type: 'weekly', base_rate: 2317, production_type: 'television', tier: 'SDP Non-Prime Dramatic', location: 'New York' },
];

async function insertRates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rate of LOCAL_52_RATES) {
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
        'IATSE Local 52',
        rate.job_classification,
        rate.rate_type,
        rate.base_rate,
        '2024-09-29', // Year 2 effective date
        rate.location,
        rate.production_type,
        2, // Contract Year 2
        rate.tier,
        JSON.stringify({ currency: 'USD', source: 'AMPTP IATSE Local 52 Wage Scales 2024-27' })
      ];

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
        insertedCount++;
        console.log(`Inserted: ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type} [${rate.tier}]`);
      } else {
        skippedCount++;
        console.log(`Skipped (duplicate): ${rate.job_classification} (${rate.rate_type}) - ${rate.production_type}`);
      }
    }

    console.log(`\n=== IATSE Local 52 Rate Insertion Complete ===`);
    console.log(`Total rates processed: ${LOCAL_52_RATES.length}`);
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
