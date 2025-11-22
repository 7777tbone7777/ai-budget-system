#!/usr/bin/env python3
"""
Import WGA High Budget SVOD (HBSVOD) Agreement rates.
2023 MBA - Year 3 (2025) rates.

HBSVOD applies to streaming content with budgets above thresholds:
- 20-35 min: $2.1M+ budget
- 36-65 min: $3.8M+ budget
- 66-95 min: $3.0M+ budget
- 96+ min: $4.5M+ budget
- Streaming Features: $30M+ budget

Subscriber Tiers (as of July 1, 2024):
- Tier 4 (45M+ subs): Netflix, Amazon, Disney+, Hulu
- Tier 3 (20M-45M subs): Apple TV+, HBO Max (Max), Paramount+, Peacock
- Tier 2 (5M-20M subs): Various smaller streamers
- Tier 1 (1M-5M subs): AMC+, BET+, etc.
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# WGA HBSVOD Rates (2025 - Year 3 of 2023 MBA)
# Initial Compensation Minimums by Program Length and Subscriber Tier
WGA_HBSVOD_RATES = [
    # =========================================================================
    # TIER 4: 45M+ Subscribers (Netflix, Amazon Prime Video, Disney+, Hulu)
    # =========================================================================

    # === Half-Hour Episodes (20-35 min, $2.1M+ budget) ===
    {'position': 'Writer - Story (20-35 min)', 'rate': 7331, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Teleplay (20-35 min)', 'rate': 12200, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Story & Teleplay (20-35 min)', 'rate': 27100, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},

    # === One-Hour Episodes (36-65 min, $3.8M+ budget) ===
    {'position': 'Writer - Story (36-65 min)', 'rate': 13954, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Teleplay (36-65 min)', 'rate': 21500, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Story & Teleplay (36-65 min)', 'rate': 39858, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},

    # === 66-95 min Programs ===
    {'position': 'Writer - Story (66-95 min)', 'rate': 20500, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Teleplay (66-95 min)', 'rate': 34000, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Story & Teleplay (66-95 min)', 'rate': 56000, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},

    # === Long-Form (96+ min, $4.5M+ budget) ===
    {'position': 'Writer - Story (96+ min)', 'rate': 25500, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Teleplay (96+ min)', 'rate': 43000, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Story & Teleplay (96+ min)', 'rate': 73784, 'rate_type': 'episode', 'production_type': 'hbsvod_tier4'},
    {'position': 'Writer - Story & Teleplay Non-Episodic (96+ min)', 'rate': 80647, 'rate_type': 'program', 'production_type': 'hbsvod_tier4'},

    # === High Budget Streaming Feature ($30M+ budget, 96+ min) ===
    {'position': 'Screenwriter - Story & Screenplay (Feature)', 'rate': 100000, 'rate_type': 'flat', 'production_type': 'hbsvod_feature'},
    {'position': 'Screenwriter - Story (Feature)', 'rate': 33000, 'rate_type': 'flat', 'production_type': 'hbsvod_feature'},
    {'position': 'Screenwriter - Screenplay (Feature)', 'rate': 67000, 'rate_type': 'flat', 'production_type': 'hbsvod_feature'},

    # =========================================================================
    # TIER 3: 20M-45M Subscribers (Apple TV+, Max, Paramount+, Peacock)
    # Factor: 100% (compared to 150% for Tier 4)
    # =========================================================================

    # === Half-Hour Episodes (20-35 min) ===
    {'position': 'Writer - Story (20-35 min)', 'rate': 4887, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Teleplay (20-35 min)', 'rate': 8133, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Story & Teleplay (20-35 min)', 'rate': 18067, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},

    # === One-Hour Episodes (36-65 min) ===
    {'position': 'Writer - Story (36-65 min)', 'rate': 9303, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Teleplay (36-65 min)', 'rate': 14333, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Story & Teleplay (36-65 min)', 'rate': 26572, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},

    # === 66-95 min Programs ===
    {'position': 'Writer - Story (66-95 min)', 'rate': 13667, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Teleplay (66-95 min)', 'rate': 22667, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Story & Teleplay (66-95 min)', 'rate': 37333, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},

    # === Long-Form (96+ min) ===
    {'position': 'Writer - Story (96+ min)', 'rate': 17000, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Teleplay (96+ min)', 'rate': 28667, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},
    {'position': 'Writer - Story & Teleplay (96+ min)', 'rate': 49189, 'rate_type': 'episode', 'production_type': 'hbsvod_tier3'},

    # =========================================================================
    # VIEWERSHIP BONUSES (20%+ of subscribers in first 90 days)
    # Effective for projects released on/after Jan 1, 2024
    # =========================================================================

    # Tier 4 Viewership Bonuses
    {'position': 'Viewership Bonus - Half-Hour Episode', 'rate': 9031, 'rate_type': 'bonus', 'production_type': 'hbsvod_tier4'},
    {'position': 'Viewership Bonus - One-Hour Episode', 'rate': 16415, 'rate_type': 'bonus', 'production_type': 'hbsvod_tier4'},
    {'position': 'Viewership Bonus - Feature ($30M+)', 'rate': 40500, 'rate_type': 'bonus', 'production_type': 'hbsvod_feature'},

    # =========================================================================
    # STAFF WRITER RATES (Weekly Minimums)
    # =========================================================================

    # Staff Writer - HBSVOD (for streaming series writers rooms)
    {'position': 'Staff Writer', 'rate': 6000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},
    {'position': 'Staff Writer', 'rate': 5200, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier3'},

    # Story Editor
    {'position': 'Story Editor', 'rate': 7500, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},
    {'position': 'Story Editor', 'rate': 6500, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier3'},

    # Executive Story Editor
    {'position': 'Executive Story Editor', 'rate': 9000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # Co-Producer (Writer-Producer)
    {'position': 'Co-Producer (Writer)', 'rate': 10500, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # Producer (Writer-Producer)
    {'position': 'Producer (Writer)', 'rate': 12000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # Supervising Producer
    {'position': 'Supervising Producer (Writer)', 'rate': 14000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # Co-Executive Producer
    {'position': 'Co-Executive Producer (Writer)', 'rate': 16000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # Executive Producer / Showrunner
    {'position': 'Executive Producer (Writer)', 'rate': 20000, 'rate_type': 'weekly', 'production_type': 'hbsvod_tier4'},

    # =========================================================================
    # RESIDUAL BASES (for calculating ongoing payments)
    # =========================================================================

    # Residual Base - Tier 4 (150% subscriber factor)
    {'position': 'Residual Base - Story & Teleplay (20-35 min)', 'rate': 18432, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier4'},
    {'position': 'Residual Base - Story & Teleplay (36-65 min)', 'rate': 33504, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier4'},
    {'position': 'Residual Base - Story & Teleplay (66-95 min)', 'rate': 50346, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier4'},
    {'position': 'Residual Base - Story & Teleplay (96+ min)', 'rate': 65981, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier4'},

    # Residual Base - Tier 3 (100% subscriber factor)
    {'position': 'Residual Base - Story & Teleplay (20-35 min)', 'rate': 12288, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier3'},
    {'position': 'Residual Base - Story & Teleplay (36-65 min)', 'rate': 22336, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier3'},
    {'position': 'Residual Base - Story & Teleplay (66-95 min)', 'rate': 33564, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier3'},
    {'position': 'Residual Base - Story & Teleplay (96+ min)', 'rate': 43987, 'rate_type': 'residual_base', 'production_type': 'hbsvod_tier3'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_hbsvod_agreement(conn):
    """Create the WGA HBSVOD agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'HBSVOD' AND union_name = 'WGA'")
        row = cur.fetchone()
        if row:
            print(f"WGA HBSVOD agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'WGA High Budget SVOD Agreement 2023',
            'HBSVOD',
            'WGA',
            date(2023, 9, 25),
            date(2026, 5, 1),
            'WGA High Budget SVOD (HBSVOD) Agreement covers streaming content on major platforms with budgets above specified thresholds',
            '''{
                "type": "hbsvod",
                "coverage": ["streaming_series", "streaming_features"],
                "budget_thresholds": {
                    "20-35_min": 2100000,
                    "36-65_min": 3800000,
                    "66-95_min": 3000000,
                    "96+_min": 4500000,
                    "feature": 30000000
                },
                "subscriber_tiers": {
                    "tier4": {"min_subs": 45000000, "factor": 1.5, "platforms": ["Netflix", "Amazon Prime Video", "Disney+", "Hulu"]},
                    "tier3": {"min_subs": 20000000, "factor": 1.0, "platforms": ["Apple TV+", "Max", "Paramount+", "Peacock"]}
                },
                "viewership_bonus": "50% of fixed residual if 20%+ subscribers view in first 90 days",
                "notes": "Year 3 (2025) rates from 2023 MBA"
            }'''
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created WGA HBSVOD agreement: {agreement_id}")
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
                'WGA',
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

        print(f"\nInserting {len(WGA_HBSVOD_RATES)} WGA HBSVOD rate cards...")
        count = insert_rate_cards(conn, agreement_id, WGA_HBSVOD_RATES, date(2025, 5, 2))
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
