#!/usr/bin/env python3
"""
Import DGA Commercials Agreement rates.
Covers TV and digital commercials.
December 2024 - November 2025 rates.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA Commercial Rates (Dec 2024 - Nov 2025)
DGA_COMMERCIAL_RATES = [
    # === DIRECTORS ===
    {'position': 'Director', 'rate': 1779, 'rate_type': 'daily', 'production_type': 'commercial'},
    {'position': 'Director', 'rate': 7115, 'rate_type': 'weekly', 'production_type': 'commercial'},

    # === UNIT PRODUCTION MANAGERS ===
    {'position': 'Unit Production Manager', 'rate': 1017, 'rate_type': 'daily', 'production_type': 'commercial'},
    {'position': 'Unit Production Manager', 'rate': 4067, 'rate_type': 'weekly', 'production_type': 'commercial'},

    # === FIRST ASSISTANT DIRECTORS ===
    {'position': 'First Assistant Director', 'rate': 1236, 'rate_type': 'daily', 'production_type': 'commercial'},
    {'position': 'First Assistant Director', 'rate': 4946, 'rate_type': 'weekly', 'production_type': 'commercial'},

    # === SECOND ASSISTANT DIRECTORS ===
    {'position': 'Second Assistant Director', 'rate': 830, 'rate_type': 'daily', 'production_type': 'commercial'},
    {'position': 'Second Assistant Director', 'rate': 3318, 'rate_type': 'weekly', 'production_type': 'commercial'},

    # === ADDITIONAL SECOND AD ===
    {'position': 'Additional Second Assistant Director', 'rate': 783, 'rate_type': 'daily', 'production_type': 'commercial'},
    {'position': 'Additional Second Assistant Director', 'rate': 3131, 'rate_type': 'weekly', 'production_type': 'commercial'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_commercials_agreement(conn):
    """Create the DGA Commercials agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'Commercials' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA Commercials agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA Commercials Agreement 2024',
            'Commercials',
            'DGA',
            date(2024, 12, 1),
            date(2025, 11, 30),
            'DGA Commercials Agreement covers TV and digital commercials production',
            '{"type": "commercials", "coverage": ["tv_commercials", "digital_commercials", "branded_content"]}'
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA Commercials agreement: {agreement_id}")
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
        agreement_id = create_commercials_agreement(conn)

        print(f"\nInserting {len(DGA_COMMERCIAL_RATES)} DGA Commercials rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_COMMERCIAL_RATES, date(2024, 12, 1))
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
