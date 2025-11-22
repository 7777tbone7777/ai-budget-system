#!/usr/bin/env python3
"""
Import DGA High Budget SVOD (HBSVOD) Agreement rates.
2024-2025 rates (effective July 1, 2024).

Covers streaming platforms with 20M+ subscribers:
- Tier 1: Netflix, Amazon Prime Video, Disney+, Hulu (45M+)
- Tier 2: Apple TV+, Max, Paramount+, Peacock (20M-45M)

Budget thresholds for High Budget SVOD:
- Half-hour: $5M+
- One-hour: $7M+
- Long-form (96+ min): $4.5M+
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA High Budget SVOD Rates (2024-2025)
DGA_HBSVOD_RATES = [
    # =========================================================================
    # DIRECTORS - High Budget SVOD (20M+ Subscribers)
    # =========================================================================

    # Half-Hour Episodes (Budget ≥$5M)
    {'position': 'Director - HBSVOD Half-Hour', 'rate': 38633, 'rate_type': 'program', 'production_type': 'hbsvod', 'budget_min': 5000000},
    {'position': 'Director - HBSVOD Half-Hour (Over-Guarantee)', 'rate': 5312, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # One-Hour Episodes (Budget ≥$7M)
    {'position': 'Director - HBSVOD One-Hour', 'rate': 68893, 'rate_type': 'program', 'production_type': 'hbsvod', 'budget_min': 7000000},
    {'position': 'Director - HBSVOD One-Hour (Over-Guarantee)', 'rate': 4800, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # Long-Form (96+ minutes, Budget ≥$4.5M)
    {'position': 'Director - HBSVOD Long-Form (96+ min)', 'rate': 160737, 'rate_type': 'program', 'production_type': 'hbsvod', 'budget_min': 4500000},
    {'position': 'Director - HBSVOD Long-Form (Over-Guarantee)', 'rate': 4462, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # =========================================================================
    # UNIT PRODUCTION MANAGERS - High Budget SVOD
    # =========================================================================

    {'position': 'Unit Production Manager - HBSVOD', 'rate': 7021, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Unit Production Manager - HBSVOD', 'rate': 9830, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},
    {'position': 'Unit Production Manager - HBSVOD', 'rate': 1755, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Unit Production Manager - HBSVOD', 'rate': 2458, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # FIRST ASSISTANT DIRECTORS - High Budget SVOD
    # =========================================================================

    {'position': 'First Assistant Director - HBSVOD', 'rate': 6676, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'First Assistant Director - HBSVOD', 'rate': 9338, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},
    {'position': 'First Assistant Director - HBSVOD', 'rate': 1669, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'First Assistant Director - HBSVOD', 'rate': 2334, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # KEY SECOND ASSISTANT DIRECTORS - High Budget SVOD
    # =========================================================================

    {'position': 'Key Second Assistant Director - HBSVOD', 'rate': 4473, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Key Second Assistant Director - HBSVOD', 'rate': 6251, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},
    {'position': 'Key Second Assistant Director - HBSVOD', 'rate': 1118, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Key Second Assistant Director - HBSVOD', 'rate': 1563, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # SECOND SECOND ASSISTANT DIRECTORS - High Budget SVOD
    # =========================================================================

    {'position': 'Second Second AD - HBSVOD', 'rate': 3957, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Second Second AD - HBSVOD', 'rate': 5540, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},
    {'position': 'Second Second AD - HBSVOD', 'rate': 989, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Second Second AD - HBSVOD', 'rate': 1385, 'rate_type': 'daily', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # ADDITIONAL SECOND ASSISTANT DIRECTORS - High Budget SVOD
    # =========================================================================

    {'position': 'Additional Second AD - HBSVOD', 'rate': 3516, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Additional Second AD - HBSVOD', 'rate': 4922, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # ASSOCIATE DIRECTORS - High Budget SVOD (Live/Tape style)
    # =========================================================================

    {'position': 'Associate Director - HBSVOD', 'rate': 6025, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Associate Director - HBSVOD', 'rate': 8429, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # STAGE MANAGERS - High Budget SVOD
    # =========================================================================

    {'position': 'First Stage Manager - HBSVOD', 'rate': 4994, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'First Stage Manager - HBSVOD', 'rate': 6974, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},
    {'position': 'Second Stage Manager - HBSVOD', 'rate': 4172, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Studio'},
    {'position': 'Second Stage Manager - HBSVOD', 'rate': 5828, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'location': 'Location'},

    # =========================================================================
    # PRODUCTION FEES (Additional to weekly salary)
    # =========================================================================

    {'position': 'Production Fee - UPM HBSVOD', 'rate': 1812, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Production Fee - First AD HBSVOD', 'rate': 1554, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Production Fee - Key Second AD HBSVOD', 'rate': 1239, 'rate_type': 'weekly', 'production_type': 'hbsvod'},

    # =========================================================================
    # PREMIUMS AND OVERTIME
    # =========================================================================

    {'position': 'Sixth Day Premium - HBSVOD (150%)', 'rate': 150, 'rate_type': 'percentage', 'production_type': 'hbsvod'},
    {'position': 'Seventh Day/Holiday Premium - HBSVOD (200%)', 'rate': 200, 'rate_type': 'percentage', 'production_type': 'hbsvod'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_hbsvod_agreement(conn):
    """Create the DGA HBSVOD agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'HBSVOD' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA HBSVOD agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA High Budget SVOD Agreement 2023',
            'HBSVOD',
            'DGA',
            date(2023, 7, 1),
            date(2026, 6, 30),
            'DGA High Budget SVOD Agreement covers directors, UPMs, and ADs for streaming content on major platforms with 20M+ subscribers',
            '''{
                "type": "hbsvod",
                "coverage": ["streaming_series", "streaming_features"],
                "budget_thresholds": {
                    "half_hour": 5000000,
                    "one_hour": 7000000,
                    "long_form_96min": 4500000
                },
                "subscriber_tiers": {
                    "tier1": {"min_subs": 45000000, "platforms": ["Netflix", "Amazon Prime Video", "Disney+", "Hulu"]},
                    "tier2": {"min_subs": 20000000, "platforms": ["Apple TV+", "Max", "Paramount+", "Peacock"]}
                },
                "pension_health": {"employer_pension": 0.0875, "employer_health": 0.1125, "employee_pension": 0.025},
                "notes": "Rates effective July 1, 2024"
            }'''
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA HBSVOD agreement: {agreement_id}")
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
                'DGA',
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

        print(f"\nInserting {len(DGA_HBSVOD_RATES)} DGA HBSVOD rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_HBSVOD_RATES, date(2024, 7, 1))
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
