#!/usr/bin/env python3
"""
Import DGA FLTTA (Freelance Live & Tape Television Agreement) 2023-2026 rates.
Covers live TV, variety, quiz/game shows, sports, news, etc.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# Using 2024-2025 rates (4th column from PDF - current rates)
DGA_FLTTA_RATES = [
    # === DIRECTORS - Dramatic Programs ===
    # Network Prime Time
    {'position': 'Director - Network Prime Time (0-15 min)', 'rate': 21223, 'rate_type': 'program', 'production_type': 'network_tv'},
    {'position': 'Director - Network Prime Time (16-30 min)', 'rate': 32642, 'rate_type': 'program', 'production_type': 'network_tv'},
    {'position': 'Director - Network Prime Time (31-60 min)', 'rate': 55434, 'rate_type': 'program', 'production_type': 'network_tv'},
    {'position': 'Director - Network Prime Time (61-90 min)', 'rate': 92393, 'rate_type': 'program', 'production_type': 'network_tv'},
    {'position': 'Director - Network Prime Time (91-120 min)', 'rate': 155213, 'rate_type': 'program', 'production_type': 'network_tv'},

    # Non-Network/Non-Prime Time High Budget
    {'position': 'Director - Non-Network High Budget (0-15 min)', 'rate': 7331, 'rate_type': 'program', 'production_type': 'cable_tv'},
    {'position': 'Director - Non-Network High Budget (16-30 min)', 'rate': 13954, 'rate_type': 'program', 'production_type': 'cable_tv'},
    {'position': 'Director - Non-Network High Budget (31-60 min)', 'rate': 25653, 'rate_type': 'program', 'production_type': 'cable_tv'},
    {'position': 'Director - Non-Network High Budget (61-90 min)', 'rate': 41000, 'rate_type': 'program', 'production_type': 'cable_tv'},

    # Non-Network Low Budget
    {'position': 'Director - Non-Network Low Budget (0-15 min)', 'rate': 3649, 'rate_type': 'program', 'production_type': 'low_budget'},
    {'position': 'Director - Non-Network Low Budget (16-30 min)', 'rate': 6271, 'rate_type': 'program', 'production_type': 'low_budget'},
    {'position': 'Director - Non-Network Low Budget (31-60 min)', 'rate': 7271, 'rate_type': 'program', 'production_type': 'low_budget'},

    # === DIRECTORS - Variety Programs ===
    {'position': 'Director - Variety Network Prime Time (0-15 min)', 'rate': 7841, 'rate_type': 'program', 'production_type': 'variety'},
    {'position': 'Director - Variety Network Prime Time (16-30 min)', 'rate': 12049, 'rate_type': 'program', 'production_type': 'variety'},
    {'position': 'Director - Variety Network Prime Time (31-60 min)', 'rate': 20888, 'rate_type': 'program', 'production_type': 'variety'},
    {'position': 'Director - Variety Network Prime Time (61-90 min)', 'rate': 41791, 'rate_type': 'program', 'production_type': 'variety'},

    # === DIRECTORS - Quiz and Game Shows ===
    {'position': 'Director - Quiz/Game (0-15 min)', 'rate': 5774, 'rate_type': 'program', 'production_type': 'game_show'},
    {'position': 'Director - Quiz/Game (16-30 min)', 'rate': 8883, 'rate_type': 'program', 'production_type': 'game_show'},
    {'position': 'Director - Quiz/Game (31-60 min)', 'rate': 10495, 'rate_type': 'program', 'production_type': 'game_show'},

    # === DIRECTORS - Sports ===
    {'position': 'Director - Sports', 'rate': 2617, 'rate_type': 'program', 'production_type': 'sports'},

    # === ASSOCIATE DIRECTORS - Prime Time Dramatic ===
    {'position': 'Associate Director - Prime Time Dramatic', 'rate': 6025, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Associate Director - Prime Time Dramatic', 'rate': 8429, 'rate_type': 'weekly', 'location': 'Location'},

    # === STAGE MANAGERS - Prime Time Dramatic ===
    {'position': 'First Stage Manager - Prime Time Dramatic', 'rate': 4994, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'First Stage Manager - Prime Time Dramatic', 'rate': 6974, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'Second Stage Manager - Prime Time Dramatic', 'rate': 4172, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Second Stage Manager - Prime Time Dramatic', 'rate': 5828, 'rate_type': 'weekly', 'location': 'Location'},

    # === ASSOCIATE DIRECTORS - Other Programs ===
    {'position': 'Associate Director - Variety/Game Show', 'rate': 4200, 'rate_type': 'weekly', 'production_type': 'variety'},
    {'position': 'Associate Director - Sports', 'rate': 3800, 'rate_type': 'weekly', 'production_type': 'sports'},
    {'position': 'Associate Director - News', 'rate': 3500, 'rate_type': 'weekly', 'production_type': 'news'},

    # === STAGE MANAGERS - Other Programs ===
    {'position': 'Stage Manager - Variety', 'rate': 3600, 'rate_type': 'weekly', 'production_type': 'variety'},
    {'position': 'Stage Manager - Game Show', 'rate': 3400, 'rate_type': 'weekly', 'production_type': 'game_show'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_fltta_agreement(conn):
    """Create the DGA FLTTA agreement"""
    with conn.cursor() as cur:
        # Check if it already exists
        cur.execute("SELECT id FROM agreements WHERE short_name = 'FLTTA' AND union_name = 'DGA'")
        row = cur.fetchone()
        if row:
            print(f"DGA FLTTA agreement already exists: {row[0]}")
            return row[0]

        # Create new agreement
        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'DGA Freelance Live & Tape Television Agreement 2023',
            'FLTTA',
            'DGA',
            date(2023, 7, 1),
            date(2026, 6, 30),
            'DGA FLTTA covers live TV, variety shows, quiz/game shows, sports, and news programs',
            '{"type": "live_tape", "coverage": "national", "production_types": ["live_tv", "variety", "game_show", "sports", "news"]}'
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created DGA FLTTA agreement: {agreement_id}")
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
        # Create the FLTTA agreement
        agreement_id = create_fltta_agreement(conn)

        # Insert rates
        print(f"\nInserting {len(DGA_FLTTA_RATES)} DGA FLTTA rate cards...")
        count = insert_rate_cards(conn, agreement_id, DGA_FLTTA_RATES, date(2024, 7, 1))
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
