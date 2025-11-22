#!/usr/bin/env python3
"""
Import DGA Reality TV Agreement rates.
Covers unscripted/reality television productions.
2024-2025 rates.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA Reality TV Rates (2024-2025)
# Note: Basic Cable rates are fully negotiable, so we include estimates based on industry standards
DGA_REALITY_RATES = [
    # === NETWORK / PAY TV / SYNDICATION ===
    # Show Director - $8,075 per episode (up to 5 days: prep, shoot, edit)
    {'position': 'Show Director', 'rate': 8075, 'rate_type': 'episode', 'production_type': 'reality_network'},
    {'position': 'Show Director', 'rate': 1615, 'rate_type': 'daily', 'production_type': 'reality_network'},  # $8075/5 days

    # Segment/Field Directors (when required for re-enactments, stunts, etc.)
    {'position': 'Segment Director', 'rate': 6500, 'rate_type': 'episode', 'production_type': 'reality_network'},
    {'position': 'Field Director', 'rate': 1300, 'rate_type': 'daily', 'production_type': 'reality_network'},

    # === BASIC CABLE (Negotiable - industry standard estimates) ===
    {'position': 'Show Director', 'rate': 5000, 'rate_type': 'episode', 'production_type': 'reality_cable'},
    {'position': 'Show Director', 'rate': 1000, 'rate_type': 'daily', 'production_type': 'reality_cable'},
    {'position': 'Segment Director', 'rate': 4000, 'rate_type': 'episode', 'production_type': 'reality_cable'},
    {'position': 'Field Director', 'rate': 800, 'rate_type': 'daily', 'production_type': 'reality_cable'},

    # === STREAMING / SVOD ===
    {'position': 'Show Director', 'rate': 7000, 'rate_type': 'episode', 'production_type': 'reality_streaming'},
    {'position': 'Show Director', 'rate': 1400, 'rate_type': 'daily', 'production_type': 'reality_streaming'},
    {'position': 'Segment Director', 'rate': 5500, 'rate_type': 'episode', 'production_type': 'reality_streaming'},

    # === ASSOCIATE DIRECTORS (when employed) ===
    {'position': 'Associate Director', 'rate': 3200, 'rate_type': 'weekly', 'production_type': 'reality_network'},
    {'position': 'Associate Director', 'rate': 2500, 'rate_type': 'weekly', 'production_type': 'reality_cable'},

    # === STAGE MANAGERS (when employed) ===
    {'position': 'Stage Manager', 'rate': 2800, 'rate_type': 'weekly', 'production_type': 'reality_network'},
    {'position': 'Stage Manager', 'rate': 2200, 'rate_type': 'weekly', 'production_type': 'reality_cable'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_reality_agreement(conn):
    """Create the DGA Reality TV agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'Reality TV' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA Reality TV agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA Reality Television Agreement 2023',
            'Reality TV',
            'DGA',
            date(2023, 7, 1),
            date(2026, 6, 30),
            'DGA Reality TV Agreement covers unscripted/reality television productions',
            '{"type": "reality", "coverage": ["network", "cable", "streaming"], "notes": "Basic cable rates are negotiable"}'
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA Reality TV agreement: {agreement_id}")
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
        agreement_id = create_reality_agreement(conn)

        print(f"\nInserting {len(DGA_REALITY_RATES)} DGA Reality TV rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_REALITY_RATES, date(2024, 7, 1))
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
