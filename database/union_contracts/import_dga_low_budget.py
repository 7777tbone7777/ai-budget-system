#!/usr/bin/env python3
"""
Import DGA Low Budget Theatrical Agreement rates.
7 budget tiers from $0 to $11M.
2024-2025 rates.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA Low Budget Rates by Tier (2024-2025)
DGA_LOW_BUDGET_RATES = [
    # === LEVEL 4C: $8.5M - $11M ===
    {'position': 'Director', 'rate': 22139, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'budget_min': 8500000, 'budget_max': 11000000},
    {'position': 'Director', 'rate': 5535, 'rate_type': 'daily', 'production_type': 'low_budget_4c', 'budget_min': 8500000, 'budget_max': 11000000},
    {'position': 'Unit Production Manager', 'rate': 6319, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 8847, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 6008, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 8404, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'location': 'Location'},
    {'position': 'Key Second Assistant Director', 'rate': 4026, 'rate_type': 'weekly', 'production_type': 'low_budget_4c', 'location': 'Studio'},

    # === LEVEL 4B: $5.5M - $8.5M ===
    {'position': 'Director', 'rate': 18449, 'rate_type': 'weekly', 'production_type': 'low_budget_4b', 'budget_min': 5500000, 'budget_max': 8500000},
    {'position': 'Unit Production Manager', 'rate': 5617, 'rate_type': 'weekly', 'production_type': 'low_budget_4b', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 7864, 'rate_type': 'weekly', 'production_type': 'low_budget_4b', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 5341, 'rate_type': 'weekly', 'production_type': 'low_budget_4b', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 7471, 'rate_type': 'weekly', 'production_type': 'low_budget_4b', 'location': 'Location'},

    # === LEVEL 4A: $3.75M - $5.5M ===
    {'position': 'Director', 'rate': 18449, 'rate_type': 'weekly', 'production_type': 'low_budget_4a', 'budget_min': 3750000, 'budget_max': 5500000},
    {'position': 'Unit Production Manager', 'rate': 4915, 'rate_type': 'weekly', 'production_type': 'low_budget_4a', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 6881, 'rate_type': 'weekly', 'production_type': 'low_budget_4a', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 4673, 'rate_type': 'weekly', 'production_type': 'low_budget_4a', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 6534, 'rate_type': 'weekly', 'production_type': 'low_budget_4a', 'location': 'Location'},

    # === LEVEL 3: $2.6M - $3.75M ===
    # Director: $75,000 minimum for 13 week guarantee (~$5,769/week)
    {'position': 'Director', 'rate': 5769, 'rate_type': 'weekly', 'production_type': 'low_budget_3', 'budget_min': 2600000, 'budget_max': 3750000},
    {'position': 'Unit Production Manager', 'rate': 4213, 'rate_type': 'weekly', 'production_type': 'low_budget_3', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 5898, 'rate_type': 'weekly', 'production_type': 'low_budget_3', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 4006, 'rate_type': 'weekly', 'production_type': 'low_budget_3', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 5602, 'rate_type': 'weekly', 'production_type': 'low_budget_3', 'location': 'Location'},

    # === LEVEL 2: $1.1M - $2.6M ===
    # Rates negotiable, but UPM/AD have minimums
    {'position': 'Unit Production Manager', 'rate': 3500, 'rate_type': 'weekly', 'production_type': 'low_budget_2', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 4900, 'rate_type': 'weekly', 'production_type': 'low_budget_2', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 3328, 'rate_type': 'weekly', 'production_type': 'low_budget_2', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 4660, 'rate_type': 'weekly', 'production_type': 'low_budget_2', 'location': 'Location'},

    # === LEVEL 1B: $500K - $1.1M ===
    {'position': 'Unit Production Manager', 'rate': 2800, 'rate_type': 'weekly', 'production_type': 'low_budget_1b', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 2660, 'rate_type': 'weekly', 'production_type': 'low_budget_1b', 'location': 'Studio'},

    # === LEVEL 1A: $0 - $500K ===
    {'position': 'Unit Production Manager', 'rate': 2000, 'rate_type': 'weekly', 'production_type': 'low_budget_1a', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 1900, 'rate_type': 'weekly', 'production_type': 'low_budget_1a', 'location': 'Studio'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_low_budget_agreement(conn):
    """Create the DGA Low Budget agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'Low Budget' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA Low Budget agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA Low Budget Theatrical Agreement 2023',
            'Low Budget',
            'DGA',
            date(2023, 7, 1),
            date(2026, 6, 30),
            'DGA Low Budget Agreement covers theatrical films with budgets up to $11M across 7 tiers',
            '{"type": "low_budget", "budget_tiers": ["1a", "1b", "2", "3", "4a", "4b", "4c"], "max_budget": 11000000}'
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA Low Budget agreement: {agreement_id}")
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
        agreement_id = create_low_budget_agreement(conn)

        print(f"\nInserting {len(DGA_LOW_BUDGET_RATES)} DGA Low Budget rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_LOW_BUDGET_RATES, date(2024, 7, 1))
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
