#!/usr/bin/env python3
"""
Import DGA Documentary Agreement rates.
Covers documentary film and television productions.
2024-2025 rates.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA Documentary Rates (2024-2025)
DGA_DOCUMENTARY_RATES = [
    # === PBS / PUBLIC TELEVISION ===
    # Per EBC Agreement (Educational Broadcasting Corporation)
    {'position': 'Director', 'rate': 1742, 'rate_type': 'daily', 'production_type': 'documentary_pbs'},
    {'position': 'Director', 'rate': 6932, 'rate_type': 'weekly', 'production_type': 'documentary_pbs'},

    # === THEATRICAL DOCUMENTARY (Budget-based - uses Low Budget tiers) ===
    # Under $500K
    {'position': 'Director', 'rate': 2000, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_1a', 'budget_max': 500000},
    # $500K - $1.1M
    {'position': 'Director', 'rate': 3500, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_1b', 'budget_min': 500000, 'budget_max': 1100000},
    # $1.1M - $2.6M
    {'position': 'Director', 'rate': 5000, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_2', 'budget_min': 1100000, 'budget_max': 2600000},
    # $2.6M - $3.75M
    {'position': 'Director', 'rate': 5769, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_3', 'budget_min': 2600000, 'budget_max': 3750000},
    # $3.75M+
    {'position': 'Director', 'rate': 18449, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_4', 'budget_min': 3750000},

    # === TELEVISION DOCUMENTARY (FLTTA-based) ===
    # Network/Cable Documentary
    {'position': 'Director - Documentary (0-30 min)', 'rate': 8500, 'rate_type': 'program', 'production_type': 'doc_tv_network'},
    {'position': 'Director - Documentary (31-60 min)', 'rate': 15000, 'rate_type': 'program', 'production_type': 'doc_tv_network'},
    {'position': 'Director - Documentary (61-90 min)', 'rate': 22000, 'rate_type': 'program', 'production_type': 'doc_tv_network'},
    {'position': 'Director - Documentary (91-120 min)', 'rate': 30000, 'rate_type': 'program', 'production_type': 'doc_tv_network'},

    # === CABLE / STREAMING DOCUMENTARY ===
    # Rates are negotiable but these are industry standard minimums
    {'position': 'Director', 'rate': 1200, 'rate_type': 'daily', 'production_type': 'doc_cable'},
    {'position': 'Director', 'rate': 5000, 'rate_type': 'weekly', 'production_type': 'doc_cable'},
    {'position': 'Director - Documentary Episode', 'rate': 12000, 'rate_type': 'episode', 'production_type': 'doc_streaming'},

    # === NEW MEDIA DOCUMENTARY ===
    # Residuals apply if budgeted at $25,000+ per minute
    {'position': 'Director', 'rate': 1000, 'rate_type': 'daily', 'production_type': 'doc_new_media'},
    {'position': 'Director', 'rate': 4000, 'rate_type': 'weekly', 'production_type': 'doc_new_media'},

    # === ASSOCIATE DIRECTORS ===
    {'position': 'Associate Director', 'rate': 3000, 'rate_type': 'weekly', 'production_type': 'documentary_pbs'},
    {'position': 'Associate Director', 'rate': 2500, 'rate_type': 'weekly', 'production_type': 'doc_cable'},

    # === PRODUCTION MANAGERS (when employed on docs) ===
    {'position': 'Unit Production Manager', 'rate': 4500, 'rate_type': 'weekly', 'production_type': 'doc_theatrical_3'},
    {'position': 'Unit Production Manager', 'rate': 3500, 'rate_type': 'weekly', 'production_type': 'doc_cable'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_documentary_agreement(conn):
    """Create the DGA Documentary agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'Documentary' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA Documentary agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA Documentary Agreement 2023',
            'Documentary',
            'DGA',
            date(2023, 7, 1),
            date(2026, 6, 30),
            'DGA Documentary Agreement covers documentary film and television productions including PBS, theatrical, cable, and streaming',
            '{"type": "documentary", "coverage": ["pbs", "theatrical", "cable", "streaming", "new_media"], "notes": "Cable/streaming rates are negotiable"}'
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA Documentary agreement: {agreement_id}")
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
        agreement_id = create_documentary_agreement(conn)

        print(f"\nInserting {len(DGA_DOCUMENTARY_RATES)} DGA Documentary rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_DOCUMENTARY_RATES, date(2024, 7, 1))
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
