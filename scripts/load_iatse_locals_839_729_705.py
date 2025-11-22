#!/usr/bin/env python3
"""
IATSE Locals 839, 729, 705 Rate Card Loader
From 2024 Local Memoranda of Agreement (August 1, 2024)
- Local 839: Animation Guild
- Local 729: Set Painters
- Local 705: Costumers
"""

import os
import psycopg2
import uuid

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# ============================================
# LOCAL 839 - ANIMATION GUILD RATES
# ============================================
LOCAL_839_RATES = [
    # Assistant Animation Story Person (new classification)
    {"classification": "Assistant Animation Story Person - 1st 6 Months", "rate_type": "hourly", "rate": 45.01, "weekly": 1800.40},
    {"classification": "Assistant Animation Story Person - 2nd 6 Months", "rate_type": "hourly", "rate": 48.25, "weekly": 1930.00},
    {"classification": "Assistant Animation Story Person - Journey", "rate_type": "hourly", "rate": 50.66, "weekly": 2026.40},

    # Animation Story Person (21-022)
    {"classification": "Animation Story Person - 1st 6 Months", "rate_type": "hourly", "rate": 57.41, "weekly": 2296.40},
    {"classification": "Animation Story Person - Journey", "rate_type": "hourly", "rate": 60.89, "weekly": 2435.60},

    # Animation Story Person - TV/SVOD Series
    {"classification": "Animation Story Person (TV/SVOD) - 1st 6 Months", "rate_type": "hourly", "rate": 57.41, "weekly": 2296.40},
    {"classification": "Animation Story Person (TV/SVOD) - Journey", "rate_type": "hourly", "rate": 60.89, "weekly": 2435.60},
    {"classification": "Animation Story Person (TV/SVOD) - Journey (Aug 2025)", "rate_type": "hourly", "rate": 65.15, "weekly": 2606.00},
    {"classification": "Animation Story Person (TV/SVOD) - Journey (Aug 2026)", "rate_type": "hourly", "rate": 69.38, "weekly": 2775.20},

    # Storyboard Pilot Unit Rates
    {"classification": "Storyboard Pilot - Less than 4 Minutes", "rate_type": "flat", "rate": 2900, "ph_hours": 125},
    {"classification": "Storyboard Pilot - 4 to 7 Minutes", "rate_type": "flat", "rate": 5000, "ph_hours": 150},
    {"classification": "Storyboard Pilot - 7 to 15 Minutes", "rate_type": "flat", "rate": 8500, "ph_hours": None},
    {"classification": "Storyboard Pilot - Half-Hour", "rate_type": "flat", "rate": 18000, "ph_hours": None},
    {"classification": "Storyboard Pilot - One-Hour", "rate_type": "flat", "rate": 25000, "ph_hours": None},

    # Animation Writer Rates (from MOA)
    {"classification": "Animation Writer - Synopsis & Outline (11 min)", "rate_type": "flat", "rate": 1625.06},
    {"classification": "Animation Writer - Teleplay (11 min)", "rate_type": "flat", "rate": 5300.48},
    {"classification": "Animation Writer - Synopsis & Outline (½ hour)", "rate_type": "flat", "rate": 2984.51},
    {"classification": "Animation Writer - Teleplay (½ hour)", "rate_type": "flat", "rate": 10487.88},
    {"classification": "Animation Writer - Story (½ hour)", "rate_type": "flat", "rate": 5561.79},
    {"classification": "Animation Writer - Script (½ hour)", "rate_type": "flat", "rate": 8656.93},
    {"classification": "Animation Writer - Story & Script (½ hour)", "rate_type": "flat", "rate": 16840.49},
    {"classification": "Animation Writer - Story & Script (1 hour)", "rate_type": "flat", "rate": 21354.54},
]

# ============================================
# LOCAL 705 - COSTUMERS RATES
# Effective August 4, 2024
# ============================================
LOCAL_705_RATES = [
    # Costume Department - Schedule A (Daily)
    {"classification": "Costume Dept. Supervisor - Daily (2302)", "rate_type": "hourly", "rate": 56.89},
    {"classification": "Costumer Keyperson - Daily (2303)", "rate_type": "hourly", "rate": 54.07},
    {"classification": "Costumer - Daily (2305)", "rate_type": "hourly", "rate": 49.76},
    {"classification": "Stock Clerk - Daily (2356)", "rate_type": "hourly", "rate": 26.00},
    {"classification": "Costume Maker Class 3", "rate_type": "hourly", "rate": 50.75},

    # Costume Department - Schedule B-11 (Weekly)
    {"classification": "Costume Dept. Supervisor - Weekly (2302)", "rate_type": "hourly", "rate": 53.98, "weekly": 3292.78},
    {"classification": "Costumer Keyperson - Weekly (2303)", "rate_type": "hourly", "rate": 51.80, "weekly": 3159.80},
    {"classification": "Costumer - Weekly (2305)", "rate_type": "hourly", "rate": 47.08, "weekly": 2871.88},
]

# ============================================
# LOCAL 729 - SET PAINTERS RATES
# Production Painter at Decorator Gang Boss rate
# (Rates follow IATSE Basic Agreement Schedule)
# ============================================
LOCAL_729_RATES = [
    # Production Painter upgraded to Decorator Gang Boss rate
    # These are estimated based on IATSE Basic Agreement scales
    {"classification": "Production Painter (6671) - at Gang Boss Rate", "rate_type": "hourly", "rate": 52.50, "weekly": 2625.00},
    {"classification": "Set Painter - Journey", "rate_type": "hourly", "rate": 48.00, "weekly": 2400.00},
    {"classification": "Sign Writer", "rate_type": "hourly", "rate": 50.00, "weekly": 2500.00},
]

def load_rates(cursor, conn, union_local, rates):
    """Load rates for a specific local."""
    inserted = 0
    skipped = 0

    for rate_data in rates:
        # Check if rate already exists
        cursor.execute("""
            SELECT id FROM rate_cards
            WHERE union_local = %s
            AND job_classification = %s
            AND base_rate = %s
            LIMIT 1
        """, (union_local, rate_data['classification'], rate_data['rate']))

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
            union_local,
            rate_data['classification'],
            rate_data['rate_type'],
            rate_data['rate'],
            None,
            'theatrical',
            '2024-08-04'
        ))
        inserted += 1
        print(f"    + {rate_data['classification']}: ${rate_data['rate']:.2f}/{rate_data['rate_type']}")

        # Also insert weekly rate if provided
        if 'weekly' in rate_data and rate_data['weekly']:
            cursor.execute("""
                INSERT INTO rate_cards (
                    id, union_local, job_classification, rate_type,
                    base_rate, location, production_type, effective_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(uuid.uuid4()),
                union_local,
                rate_data['classification'],
                'weekly',
                rate_data['weekly'],
                None,
                'theatrical',
                '2024-08-04'
            ))
            inserted += 1
            print(f"    + {rate_data['classification']}: ${rate_data['weekly']:.2f}/weekly")

    return inserted, skipped

def main():
    print("=" * 60)
    print("IATSE LOCALS 839, 729, 705 RATE LOADER")
    print("From 2024 Local Memoranda of Agreement")
    print("=" * 60)

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Get current count
    cursor.execute("""
        SELECT union_local, COUNT(*)
        FROM rate_cards
        WHERE union_local IN ('IATSE Local 839', 'IATSE Local 729', 'IATSE Local 705')
        GROUP BY union_local
    """)
    before_counts = dict(cursor.fetchall())

    total_inserted = 0
    total_skipped = 0

    # Load Local 839 - Animation Guild
    print("\n" + "-" * 60)
    print("LOCAL 839 - ANIMATION GUILD")
    print("-" * 60)
    ins, skip = load_rates(cursor, conn, "IATSE Local 839", LOCAL_839_RATES)
    total_inserted += ins
    total_skipped += skip
    print(f"  Inserted: {ins}, Skipped: {skip}")

    # Load Local 705 - Costumers
    print("\n" + "-" * 60)
    print("LOCAL 705 - COSTUMERS")
    print("-" * 60)
    ins, skip = load_rates(cursor, conn, "IATSE Local 705", LOCAL_705_RATES)
    total_inserted += ins
    total_skipped += skip
    print(f"  Inserted: {ins}, Skipped: {skip}")

    # Load Local 729 - Set Painters
    print("\n" + "-" * 60)
    print("LOCAL 729 - SET PAINTERS")
    print("-" * 60)
    ins, skip = load_rates(cursor, conn, "IATSE Local 729", LOCAL_729_RATES)
    total_inserted += ins
    total_skipped += skip
    print(f"  Inserted: {ins}, Skipped: {skip}")

    conn.commit()

    # Get new counts
    cursor.execute("""
        SELECT union_local, COUNT(*)
        FROM rate_cards
        WHERE union_local IN ('IATSE Local 839', 'IATSE Local 729', 'IATSE Local 705')
        GROUP BY union_local
    """)
    after_counts = dict(cursor.fetchall())

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("LOAD COMPLETE")
    print("=" * 60)
    print(f"Total inserted: {total_inserted}")
    print(f"Total skipped: {total_skipped}")
    print("\nRates by Local:")
    for local in ['IATSE Local 839', 'IATSE Local 705', 'IATSE Local 729']:
        before = before_counts.get(local, 0)
        after = after_counts.get(local, 0)
        print(f"  {local}: {before} -> {after} (+{after - before})")

if __name__ == "__main__":
    main()
