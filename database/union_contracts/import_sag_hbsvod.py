#!/usr/bin/env python3
"""
Import SAG-AFTRA High Budget SVOD (HBSVOD) Agreement rates.
2024-2025 rates based on the 2023 Codified Basic Television Agreement.

For HBSVOD (productions >$1M per episode), SAG-AFTRA uses standard
Theatrical/Television rates. The subscriber tier affects residuals,
not initial compensation.

Platforms covered: Netflix, Amazon, Disney+, Apple TV+, Max, Paramount+, Peacock
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# SAG-AFTRA HBSVOD Performer Rates (2025 - effective July 1, 2025)
SAG_HBSVOD_RATES = [
    # =========================================================================
    # PRINCIPAL PERFORMERS - High Budget SVOD (>$1M budget)
    # Same as Theatrical Basic Agreement rates
    # =========================================================================

    # Day Players
    {'position': 'Day Performer', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Weekly Performer', 'rate': 4326, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': '3-Day Performer', 'rate': 3246, 'rate_type': 'flat', 'production_type': 'hbsvod'},

    # Series Regulars (13 out of 13 guarantee)
    {'position': 'Series Regular (Major Role)', 'rate': 10000, 'rate_type': 'episode', 'production_type': 'hbsvod'},
    {'position': 'Series Regular (13/13)', 'rate': 5615, 'rate_type': 'weekly', 'production_type': 'hbsvod'},

    # Guest Stars / Co-Stars
    {'position': 'Guest Star (Top of Show)', 'rate': 8000, 'rate_type': 'episode', 'production_type': 'hbsvod'},
    {'position': 'Guest Star', 'rate': 4326, 'rate_type': 'episode', 'production_type': 'hbsvod'},
    {'position': 'Co-Star', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # =========================================================================
    # STUNT PERFORMERS - High Budget SVOD
    # =========================================================================

    {'position': 'Stunt Performer', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Stunt Performer', 'rate': 4646, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Stunt Coordinator (10-19 weeks)', 'rate': 3715, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Stunt Coordinator (20+ weeks)', 'rate': 3091, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Stunt Coordinator (1-9 weeks)', 'rate': 4326, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
    {'position': 'Stunt Double', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Utility Stunt Performer', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # =========================================================================
    # BACKGROUND ACTORS - High Budget SVOD
    # =========================================================================

    {'position': 'Background Actor (General)', 'rate': 224, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Background Actor (Schedule X-I)', 'rate': 224, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Background Actor (Schedule X-II)', 'rate': 224, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Stand-In', 'rate': 262, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Photo Double', 'rate': 262, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Special Ability Background', 'rate': 262, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Dancer (Background)', 'rate': 350, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Swimmer/Skater (Background)', 'rate': 285, 'rate_type': 'daily', 'production_type': 'hbsvod'},

    # =========================================================================
    # VOICE PERFORMERS - High Budget SVOD
    # =========================================================================

    {'position': 'Voice Performer (0-30 min)', 'rate': 1100, 'rate_type': 'session', 'production_type': 'hbsvod'},
    {'position': 'Voice Performer (31-60 min)', 'rate': 1650, 'rate_type': 'session', 'production_type': 'hbsvod'},
    {'position': 'Voice Performer (61-90 min)', 'rate': 2200, 'rate_type': 'session', 'production_type': 'hbsvod'},
    {'position': 'Voice Performer (91-120 min)', 'rate': 2750, 'rate_type': 'session', 'production_type': 'hbsvod'},
    {'position': 'ADR/Looping', 'rate': 1100, 'rate_type': 'session', 'production_type': 'hbsvod'},

    # =========================================================================
    # SINGERS / DANCERS - High Budget SVOD
    # =========================================================================

    {'position': 'Singer (Solo/Duo)', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Singer (Group 3-8)', 'rate': 810, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Singer (Group 9+)', 'rate': 623, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Dancer (Principal)', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Choreographer', 'rate': 1869, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Choreographer', 'rate': 6489, 'rate_type': 'weekly', 'production_type': 'hbsvod'},

    # =========================================================================
    # PILOTS & SPECIALS - High Budget SVOD
    # =========================================================================

    {'position': 'Pilot - Day Performer', 'rate': 1370, 'rate_type': 'daily', 'production_type': 'hbsvod_pilot'},
    {'position': 'Pilot - Weekly Performer', 'rate': 4759, 'rate_type': 'weekly', 'production_type': 'hbsvod_pilot'},
    {'position': 'Pilot - 3-Day Performer', 'rate': 3571, 'rate_type': 'flat', 'production_type': 'hbsvod_pilot'},

    # =========================================================================
    # OVERTIME / PREMIUMS
    # =========================================================================

    {'position': 'Golden Time Premium (After 16 hrs)', 'rate': 200, 'rate_type': 'percentage', 'production_type': 'hbsvod'},
    {'position': '6th Day Premium', 'rate': 150, 'rate_type': 'percentage', 'production_type': 'hbsvod'},
    {'position': '7th Day/Holiday Premium', 'rate': 200, 'rate_type': 'percentage', 'production_type': 'hbsvod'},
    {'position': 'Night Premium (8pm-6am)', 'rate': 10, 'rate_type': 'percentage', 'production_type': 'hbsvod'},

    # =========================================================================
    # RESIDUAL BASES (for streaming bonus calculations)
    # =========================================================================

    {'position': 'Streaming Success Bonus - Half Hour', 'rate': 3750, 'rate_type': 'bonus', 'production_type': 'hbsvod'},
    {'position': 'Streaming Success Bonus - One Hour', 'rate': 7500, 'rate_type': 'bonus', 'production_type': 'hbsvod'},
    {'position': 'Streaming Success Bonus - Feature', 'rate': 15000, 'rate_type': 'bonus', 'production_type': 'hbsvod'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_hbsvod_agreement(conn):
    """Create the SAG-AFTRA HBSVOD agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'HBSVOD' AND union_name = 'SAG-AFTRA'")
        row = cur.fetchone()
        if row:
            print(f"SAG-AFTRA HBSVOD agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'SAG-AFTRA High Budget SVOD Agreement 2023',
            'HBSVOD',
            'SAG-AFTRA',
            date(2023, 11, 9),
            date(2026, 6, 30),
            'SAG-AFTRA High Budget SVOD Agreement covers performers on streaming platforms with >$1M budget per episode',
            '''{
                "type": "hbsvod",
                "coverage": ["streaming_series", "streaming_features"],
                "budget_threshold": 1000000,
                "platforms": ["Netflix", "Amazon", "Disney+", "Apple TV+", "Max", "Paramount+", "Peacock", "Hulu"],
                "pension_health": {"performers": 0.21, "background": 0.205},
                "streaming_success_bonus": "Available for series meeting viewership thresholds on platforms with 20M+ subscribers",
                "notes": "Productions >$1M use standard theatrical/TV rates"
            }'''
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created SAG-AFTRA HBSVOD agreement: {agreement_id}")
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
                'SAG-AFTRA',
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

        print(f"\nInserting {len(SAG_HBSVOD_RATES)} SAG-AFTRA HBSVOD rate cards...")
        count = insert_rate_cards(conn, agreement_id, SAG_HBSVOD_RATES, date(2025, 7, 1))
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
