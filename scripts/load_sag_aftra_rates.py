#!/usr/bin/env python3
"""
SAG-AFTRA Rate Card Loader
Comprehensive rates from 2023-2026 TV/Theatrical Agreement
Source: Wrapbook Guide + Official SAG-AFTRA MOA Summary
"""

import os
import psycopg2
import uuid
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# SAG-AFTRA Rates - Effective 07/01/2025 (with 7%+4%+3.5% compounded increases)
SAG_AFTRA_RATES = [
    # ============================================
    # THEATRICAL AGREEMENT RATES
    # ============================================

    # Basic Theatrical (Budget > $2MM)
    {"classification": "Actor - Day Performer (Theatrical)", "rate_type": "daily", "rate": 1246, "category": "theatrical", "budget_tier": "high"},
    {"classification": "Actor - Weekly Performer (Theatrical)", "rate_type": "weekly", "rate": 4326, "category": "theatrical", "budget_tier": "high"},
    {"classification": "Actor - 3-Day Performer (Theatrical)", "rate_type": "3-day", "rate": 3157, "category": "theatrical", "budget_tier": "high"},

    # Low Budget ($700K - $2MM)
    {"classification": "Actor - Day Performer (Low Budget)", "rate_type": "daily", "rate": 810, "category": "theatrical", "budget_tier": "low_budget"},
    {"classification": "Actor - Weekly Performer (Low Budget)", "rate_type": "weekly", "rate": 2812, "category": "theatrical", "budget_tier": "low_budget"},

    # Moderate Low Budget ($300K - $700K)
    {"classification": "Actor - Day Performer (Moderate Low Budget)", "rate_type": "daily", "rate": 436, "category": "theatrical", "budget_tier": "moderate_low"},
    {"classification": "Actor - Weekly Performer (Moderate Low Budget)", "rate_type": "weekly", "rate": 1514, "category": "theatrical", "budget_tier": "moderate_low"},

    # Ultra Low Budget (≤$300K)
    {"classification": "Actor - Day Performer (Ultra Low Budget)", "rate_type": "daily", "rate": 249, "category": "theatrical", "budget_tier": "ultra_low"},

    # Short Project (<$50K, max 40 min)
    {"classification": "Actor - Day Performer (Short Project)", "rate_type": "daily", "rate": 249, "category": "theatrical", "budget_tier": "short_project"},

    # ============================================
    # TELEVISION RATES
    # ============================================

    # Single Episode TV
    {"classification": "Actor - Day Performer (TV Single Episode)", "rate_type": "daily", "rate": 1246, "category": "tv_episodic", "budget_tier": "standard"},
    {"classification": "Actor - 3-Day Performer (TV Single Episode)", "rate_type": "3-day", "rate": 3157, "category": "tv_episodic", "budget_tier": "standard"},
    {"classification": "Actor - Weekly Performer (TV Single Episode)", "rate_type": "weekly", "rate": 4326, "category": "tv_episodic", "budget_tier": "standard"},

    # Major Role Performers - Single Episode
    {"classification": "Major Role Performer - Half Hour (1 Episode)", "rate_type": "weekly", "rate": 6853, "category": "tv_episodic", "budget_tier": "major_role"},
    {"classification": "Major Role Performer - One Hour (1 Episode)", "rate_type": "weekly", "rate": 10965, "category": "tv_episodic", "budget_tier": "major_role"},

    # Multiple Programs Weekly
    {"classification": "Actor - Half Hour (Multiple Programs)", "rate_type": "weekly", "rate": 3206, "category": "tv_multiple", "budget_tier": "standard"},
    {"classification": "Actor - One Hour (Multiple Programs)", "rate_type": "weekly", "rate": 3206, "category": "tv_multiple", "budget_tier": "standard"},
    {"classification": "Actor - 90 Minute (Multiple Programs)", "rate_type": "weekly", "rate": 3768, "category": "tv_multiple", "budget_tier": "standard"},
    {"classification": "Actor - Two Hour (Multiple Programs)", "rate_type": "weekly", "rate": 4441, "category": "tv_multiple", "budget_tier": "standard"},

    # Series Regulars - Half Hour
    {"classification": "Series Regular - Half Hour (13 of 13)", "rate_type": "weekly", "rate": 4326, "category": "tv_series_regular", "budget_tier": "half_hour"},
    {"classification": "Series Regular - Half Hour (12-7 episodes)", "rate_type": "weekly", "rate": 4952, "category": "tv_series_regular", "budget_tier": "half_hour"},
    {"classification": "Series Regular - Half Hour (6 episodes)", "rate_type": "weekly", "rate": 5774, "category": "tv_series_regular", "budget_tier": "half_hour"},

    # Series Regulars - One Hour
    {"classification": "Series Regular - One Hour (13 of 13)", "rate_type": "weekly", "rate": 5205, "category": "tv_series_regular", "budget_tier": "one_hour"},
    {"classification": "Series Regular - One Hour (12-7 episodes)", "rate_type": "weekly", "rate": 5807, "category": "tv_series_regular", "budget_tier": "one_hour"},
    {"classification": "Series Regular - One Hour (6 episodes)", "rate_type": "weekly", "rate": 6792, "category": "tv_series_regular", "budget_tier": "one_hour"},

    # ============================================
    # BACKGROUND PERFORMERS
    # ============================================
    {"classification": "Background Performer - General", "rate_type": "daily", "rate": 216, "category": "background", "budget_tier": "standard"},
    {"classification": "Background Performer - Special Ability", "rate_type": "daily", "rate": 227, "category": "background", "budget_tier": "standard"},
    {"classification": "Stand-In", "rate_type": "daily", "rate": 240, "category": "background", "budget_tier": "standard"},
    {"classification": "Photo Double", "rate_type": "daily", "rate": 240, "category": "background", "budget_tier": "standard"},

    # ============================================
    # STUNT PERFORMERS
    # ============================================
    {"classification": "Stunt Performer - Day", "rate_type": "daily", "rate": 1246, "category": "stunts", "budget_tier": "standard"},
    {"classification": "Stunt Performer - Weekly", "rate_type": "weekly", "rate": 4326, "category": "stunts", "budget_tier": "standard"},
    {"classification": "Stunt Coordinator - Day", "rate_type": "daily", "rate": 1557, "category": "stunts", "budget_tier": "standard"},
    {"classification": "Stunt Coordinator - Weekly", "rate_type": "weekly", "rate": 5408, "category": "stunts", "budget_tier": "standard"},
    {"classification": "Stunt Coordinator - Flat Deal (TV)", "rate_type": "flat", "rate": 8000, "category": "stunts", "budget_tier": "tv_flat"},

    # ============================================
    # COMMERCIAL RATES (Effective 04/01/2025)
    # ============================================

    # Class A (National Broadcast TV)
    {"classification": "Commercial - On Camera (Class A)", "rate_type": "session", "rate": 783.10, "category": "commercial", "budget_tier": "class_a"},
    {"classification": "Commercial - Off Camera (Class A)", "rate_type": "session", "rate": 588.90, "category": "commercial", "budget_tier": "class_a"},

    # Wild Spots - All Markets
    {"classification": "Wild Spot - On Camera (4 Week)", "rate_type": "use_fee", "rate": 840, "category": "commercial", "budget_tier": "wild_spot"},
    {"classification": "Wild Spot - Off Camera (4 Week)", "rate_type": "use_fee", "rate": 630, "category": "commercial", "budget_tier": "wild_spot"},
    {"classification": "Wild Spot - On Camera (13 Week)", "rate_type": "use_fee", "rate": 2100, "category": "commercial", "budget_tier": "wild_spot"},
    {"classification": "Wild Spot - Off Camera (13 Week)", "rate_type": "use_fee", "rate": 1575, "category": "commercial", "budget_tier": "wild_spot"},
    {"classification": "Wild Spot - On Camera (52 Week)", "rate_type": "use_fee", "rate": 7560, "category": "commercial", "budget_tier": "wild_spot"},
    {"classification": "Wild Spot - Off Camera (52 Week)", "rate_type": "use_fee", "rate": 5670, "category": "commercial", "budget_tier": "wild_spot"},

    # National Cable
    {"classification": "National Cable - On Camera (4 Week)", "rate_type": "use_fee", "rate": 1500, "category": "commercial", "budget_tier": "national_cable"},
    {"classification": "National Cable - Off Camera (4 Week)", "rate_type": "use_fee", "rate": 1125, "category": "commercial", "budget_tier": "national_cable"},
    {"classification": "National Cable - On Camera (13 Week)", "rate_type": "use_fee", "rate": 4100, "category": "commercial", "budget_tier": "national_cable"},
    {"classification": "National Cable - Off Camera (13 Week)", "rate_type": "use_fee", "rate": 3075, "category": "commercial", "budget_tier": "national_cable"},
    {"classification": "National Cable - On Camera (52 Week)", "rate_type": "use_fee", "rate": 13500, "category": "commercial", "budget_tier": "national_cable"},
    {"classification": "National Cable - Off Camera (52 Week)", "rate_type": "use_fee", "rate": 10125, "category": "commercial", "budget_tier": "national_cable"},

    # ============================================
    # NEW MEDIA / STREAMING RATES
    # ============================================

    # Category A ($50K - $300K budget)
    {"classification": "New Media Category A - Day Performer", "rate_type": "daily", "rate": 249.20, "category": "new_media", "budget_tier": "category_a"},

    # Category B ($300K - $700K budget)
    {"classification": "New Media Category B - Day Performer", "rate_type": "daily", "rate": 436.10, "category": "new_media", "budget_tier": "category_b"},
    {"classification": "New Media Category B - Weekly Performer", "rate_type": "weekly", "rate": 1514.10, "category": "new_media", "budget_tier": "category_b"},

    # Category C ($700K - $1MM budget)
    {"classification": "New Media Category C - Day Performer", "rate_type": "daily", "rate": 809.90, "category": "new_media", "budget_tier": "category_c"},
    {"classification": "New Media Category C - Weekly Performer", "rate_type": "weekly", "rate": 2811.90, "category": "new_media", "budget_tier": "category_c"},

    # Category D (>$1MM budget) - Follows standard theatrical rates
    {"classification": "New Media Category D - Day Performer", "rate_type": "daily", "rate": 1246, "category": "new_media", "budget_tier": "category_d"},
    {"classification": "New Media Category D - Weekly Performer", "rate_type": "weekly", "rate": 4326, "category": "new_media", "budget_tier": "category_d"},

    # ============================================
    # AI / DIGITAL REPLICA RATES (New in 2023)
    # ============================================
    {"classification": "Digital Replica Creation Session (Full Day)", "rate_type": "daily", "rate": 1246, "category": "digital_replica", "budget_tier": "standard"},
    {"classification": "Digital Replica Creation Session (Half Day)", "rate_type": "half_day", "rate": 623, "category": "digital_replica", "budget_tier": "standard"},
    {"classification": "Digital Replica Use (Per Production Day)", "rate_type": "daily", "rate": 1246, "category": "digital_replica", "budget_tier": "standard"},

    # ============================================
    # VOICE OVER / ADR RATES
    # ============================================
    {"classification": "Voice Over - Day (Theatrical)", "rate_type": "daily", "rate": 1246, "category": "voice_over", "budget_tier": "standard"},
    {"classification": "ADR Session - Day Performer", "rate_type": "daily", "rate": 1246, "category": "voice_over", "budget_tier": "standard"},
    {"classification": "Looping/Group ADR (Per Session)", "rate_type": "session", "rate": 540, "category": "voice_over", "budget_tier": "standard"},
]

# Fringe Benefits (P&H Percentages)
FRINGE_RATES = {
    "performers_ph": 21.0,  # Pension & Health for performers
    "background_ph": 20.5,  # Pension & Health for background
    "commercial_ph": 23.5,  # Standard commercial P&H
    "commercial_jpc": 19.95,  # JPC member P&H
    "digital_only_ph": 40.0,  # Digital-only campaigns
}

def main():
    print("=" * 60)
    print("SAG-AFTRA RATE CARD LOADER")
    print("2023-2026 TV/Theatrical Agreement")
    print("=" * 60)

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Get current count
    cursor.execute("SELECT COUNT(*) FROM rate_cards WHERE union_local = 'SAG-AFTRA'")
    before_count = cursor.fetchone()[0]
    print(f"\nCurrent SAG-AFTRA rates in database: {before_count}")

    inserted = 0
    skipped = 0

    for rate_data in SAG_AFTRA_RATES:
        # Check if rate already exists
        cursor.execute("""
            SELECT id FROM rate_cards
            WHERE union_local = 'SAG-AFTRA'
            AND job_classification = %s
            AND rate_type = %s
            AND base_rate = %s
            LIMIT 1
        """, (rate_data['classification'], rate_data['rate_type'], rate_data['rate']))

        if cursor.fetchone():
            skipped += 1
            continue

        # Insert new rate
        cursor.execute("""
            INSERT INTO rate_cards (
                id, union_local, job_classification, rate_type,
                base_rate, location, production_type, effective_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()),
            'SAG-AFTRA',
            rate_data['classification'],
            rate_data['rate_type'],
            rate_data['rate'],
            None,  # All locations
            rate_data['category'],
            '2025-07-01'  # Latest effective date
        ))
        inserted += 1
        print(f"  + {rate_data['classification']}: ${rate_data['rate']:.2f}/{rate_data['rate_type']}")

    conn.commit()

    # Get new count
    cursor.execute("SELECT COUNT(*) FROM rate_cards WHERE union_local = 'SAG-AFTRA'")
    after_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("LOAD COMPLETE")
    print("=" * 60)
    print(f"Rates before: {before_count}")
    print(f"Inserted: {inserted}")
    print(f"Skipped (duplicates): {skipped}")
    print(f"Rates after: {after_count}")
    print(f"Net added: {after_count - before_count}")

    print("\n" + "=" * 60)
    print("P&H FRINGE RATES (Reference)")
    print("=" * 60)
    for name, pct in FRINGE_RATES.items():
        print(f"  {name}: {pct}%")

    print("\nNote: Wage increases applied:")
    print("  - 7% effective Nov 9, 2023")
    print("  - 4% effective July 1, 2024")
    print("  - 3.5% effective July 1, 2025")

if __name__ == "__main__":
    main()
