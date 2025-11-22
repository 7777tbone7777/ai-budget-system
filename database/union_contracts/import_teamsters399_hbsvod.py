#!/usr/bin/env python3
"""
Import Teamsters Local 399 High Budget SVOD rates.
Transportation and Location department rates for streaming productions.
2024-2025 rates.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# Teamsters Local 399 HBSVOD Rates (2024-2025)
TEAMSTERS_HBSVOD_RATES = [
    # =========================================================================
    # TRANSPORTATION DEPARTMENT - High Budget SVOD
    # =========================================================================

    # Transportation Coordinator
    {'position': 'Transportation Coordinator', 'rate': 4500, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Transportation Coordinator', 'rate': 65, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Transportation Captain
    {'position': 'Transportation Captain', 'rate': 3800, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Transportation Captain', 'rate': 55, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Drivers - Various Classes
    {'position': 'Driver - Camera Car', 'rate': 62, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Insert Car', 'rate': 62, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Process Trailer', 'rate': 62, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Chapman Crane', 'rate': 62, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Production Van', 'rate': 63, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Special Equipment', 'rate': 56, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Class A (Semi/Trailer)', 'rate': 50, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Class B (Truck)', 'rate': 45, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Class C (Standard)', 'rate': 40, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Passenger Van', 'rate': 40, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Honeywagon', 'rate': 45, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Stake Bed', 'rate': 42, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Driver - Water Truck', 'rate': 45, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Wranglers
    {'position': 'Driver/Wrangler', 'rate': 54, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Picture Car Coordinator', 'rate': 58, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # =========================================================================
    # LOCATION DEPARTMENT - High Budget SVOD
    # =========================================================================

    # Location Manager
    {'position': 'Location Manager', 'rate': 4200, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Location Manager', 'rate': 60, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Assistant Location Manager
    {'position': 'Assistant Location Manager', 'rate': 3200, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Assistant Location Manager', 'rate': 48, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Location Scout/Assistant
    {'position': 'Location Scout', 'rate': 2800, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Location Scout', 'rate': 42, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Location Assistant', 'rate': 2400, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Location Assistant', 'rate': 36, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # Location PA (when Teamster)
    {'position': 'Location PA', 'rate': 28, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # =========================================================================
    # ANIMAL HANDLERS - High Budget SVOD
    # =========================================================================

    {'position': 'Animal Coordinator', 'rate': 55, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Animal Trainer', 'rate': 48, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Animal Handler', 'rate': 42, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Wrangler (Animals)', 'rate': 42, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # =========================================================================
    # CASTING (Local 399/817) - High Budget SVOD
    # =========================================================================

    {'position': 'Casting Director', 'rate': 7500, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Casting Director (Pilot)', 'rate': 9000, 'rate_type': 'weekly', 'production_type': 'hbsvod_pilot'},
    {'position': 'Casting Director (Subsequent Episodes)', 'rate': 5000, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Associate Casting Director', 'rate': 2500, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Casting Assistant', 'rate': 25, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Extras Casting Director', 'rate': 2200, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Extras Casting Assistant', 'rate': 22, 'rate_type': 'hourly', 'production_type': 'hbsvod'},

    # =========================================================================
    # FIRST AID / SAFETY - High Budget SVOD (when Teamster)
    # =========================================================================

    {'position': 'Set Medic', 'rate': 45, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Set Medic (Paramedic)', 'rate': 52, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
    {'position': 'Snake Abatement Technician', 'rate': 52, 'rate_type': 'hourly', 'production_type': 'hbsvod'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_hbsvod_agreement(conn):
    """Create the Teamsters 399 HBSVOD agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'HBSVOD' AND union_name = 'Teamsters Local 399'")
        row = cur.fetchone()
        if row:
            print(f"Teamsters 399 HBSVOD agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'Teamsters Local 399 High Budget SVOD Agreement 2024',
            'HBSVOD',
            'Teamsters Local 399',
            date(2024, 7, 1),
            date(2027, 6, 30),
            'Teamsters Local 399 HBSVOD Agreement covers Transportation, Location, Casting, and Animal departments for streaming productions',
            '''{
                "type": "hbsvod",
                "coverage": ["transportation", "locations", "casting", "animals", "first_aid"],
                "departments": ["Transportation", "Locations", "Casting", "Animal Handlers", "Set Medics"],
                "notes": "Covers drivers, location managers, casting directors, animal wranglers for HBSVOD productions"
            }'''
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created Teamsters 399 HBSVOD agreement: {agreement_id}")
        return agreement_id


def insert_rate_cards(conn, agreement_id, rates, effective_date):
    """Insert rate cards"""
    count = 0
    with conn.cursor() as cur:
        for rate in rates:
            cur.execute("""
                INSERT INTO rate_cards (
                    union_local, job_classification, base_rate, rate_type,
                    location, production_type, effective_date, agreement_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
                DO UPDATE SET base_rate = EXCLUDED.base_rate, agreement_id = EXCLUDED.agreement_id
            """, (
                'Teamsters Local 399',
                rate['position'],
                rate['rate'],
                rate['rate_type'],
                rate.get('location'),
                rate.get('production_type'),
                effective_date,
                agreement_id
            ))
            count += 1
    conn.commit()
    return count


def main():
    conn = get_connection()

    try:
        agreement_id = create_hbsvod_agreement(conn)

        print(f"\nInserting {len(TEAMSTERS_HBSVOD_RATES)} Teamsters 399 HBSVOD rate cards...")
        count = insert_rate_cards(conn, agreement_id, TEAMSTERS_HBSVOD_RATES, date(2024, 7, 1))
        print(f"  Inserted {count} rate cards")

        # Show final counts
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.union_name, a.short_name, COUNT(rc.id) as rate_count
                FROM agreements a
                LEFT JOIN rate_cards rc ON rc.agreement_id = a.id
                GROUP BY a.id, a.union_name, a.short_name
                ORDER BY a.union_name, a.short_name
            """)
            print("\n=== Rate Cards by Agreement ===")
            total = 0
            for union, name, count in cur.fetchall():
                print(f"  {union} - {name}: {count} rates")
                total += count
            print(f"\nTotal rate cards: {total}")

    finally:
        conn.close()


if __name__ == '__main__':
    main()
