#!/usr/bin/env python3
"""
Import DGA, SAG-AFTRA, and WGA rate cards into the database.
Links each rate to its appropriate agreement.
"""

import os
import psycopg2
from psycopg2.extras import execute_values
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# DGA Rate Cards (2024-2025 rates)
DGA_RATES = [
    # Directors
    {'position': 'Director - Theatrical Motion Picture', 'rate': 23767, 'rate_type': 'weekly', 'production_type': 'theatrical'},
    {'position': 'Director - Television Network Prime-Time', 'rate': 32642, 'rate_type': 'weekly', 'production_type': 'network_tv'},
    {'position': 'Director - Television Non-Network', 'rate': 14666, 'rate_type': 'weekly', 'production_type': 'cable_tv'},
    {'position': 'Director - High Budget SVOD', 'rate': 18509, 'rate_type': 'weekly', 'production_type': 'hb_svod'},

    # UPM - Studio
    {'position': 'Unit Production Manager', 'rate': 6523, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Unit Production Manager', 'rate': 1631, 'rate_type': 'daily', 'location': 'Studio'},
    # UPM - Location
    {'position': 'Unit Production Manager', 'rate': 9133, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'Unit Production Manager', 'rate': 2283, 'rate_type': 'daily', 'location': 'Location'},

    # 1st AD - Studio
    {'position': 'First Assistant Director', 'rate': 6202, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'First Assistant Director', 'rate': 1551, 'rate_type': 'daily', 'location': 'Studio'},
    # 1st AD - Location
    {'position': 'First Assistant Director', 'rate': 8675, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'First Assistant Director', 'rate': 2169, 'rate_type': 'daily', 'location': 'Location'},

    # 2nd AD - Studio
    {'position': 'Second Assistant Director', 'rate': 4156, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Second Assistant Director', 'rate': 1039, 'rate_type': 'daily', 'location': 'Studio'},
    # 2nd AD - Location
    {'position': 'Second Assistant Director', 'rate': 5808, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'Second Assistant Director', 'rate': 1452, 'rate_type': 'daily', 'location': 'Location'},

    # Additional 2nd AD - Studio
    {'position': 'Additional Second Assistant Director', 'rate': 3923, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Additional Second Assistant Director', 'rate': 981, 'rate_type': 'daily', 'location': 'Studio'},
    # Additional 2nd AD - Location
    {'position': 'Additional Second Assistant Director', 'rate': 5486, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'Additional Second Assistant Director', 'rate': 1372, 'rate_type': 'daily', 'location': 'Location'},

    # Key 2nd AD
    {'position': 'Key Second Assistant Director', 'rate': 2388, 'rate_type': 'weekly', 'location': 'Studio'},
    {'position': 'Key Second Assistant Director', 'rate': 597, 'rate_type': 'daily', 'location': 'Studio'},
    {'position': 'Key Second Assistant Director', 'rate': 3350, 'rate_type': 'weekly', 'location': 'Location'},
    {'position': 'Key Second Assistant Director', 'rate': 838, 'rate_type': 'daily', 'location': 'Location'},
]

# SAG-AFTRA Rate Cards (2024-2025 rates)
SAG_THEATRICAL_RATES = [
    # Basic Theatrical (Budget > $2MM)
    {'position': 'Performer - Day Player', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'theatrical'},
    {'position': 'Performer - Weekly', 'rate': 4326, 'rate_type': 'weekly', 'production_type': 'theatrical'},

    # Television Single Episode
    {'position': 'Performer - Day Player (TV)', 'rate': 1246, 'rate_type': 'daily', 'production_type': 'network_tv'},
    {'position': 'Performer - 3-Day Player (TV)', 'rate': 3157, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Performer - Weekly (TV)', 'rate': 4326, 'rate_type': 'weekly', 'production_type': 'network_tv'},

    # Series Regular - Half Hour
    {'position': 'Series Regular (Half Hour) - 13 episodes', 'rate': 4326, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
    {'position': 'Series Regular (Half Hour) - 7-12 episodes', 'rate': 4952, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
    {'position': 'Series Regular (Half Hour) - 6 episodes', 'rate': 5774, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},

    # Series Regular - One Hour
    {'position': 'Series Regular (One Hour) - 13 episodes', 'rate': 5205, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
    {'position': 'Series Regular (One Hour) - 7-12 episodes', 'rate': 5807, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
    {'position': 'Series Regular (One Hour) - 6 episodes', 'rate': 6792, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},

    # Major Role
    {'position': 'Major Role (Half Hour)', 'rate': 6853, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
    {'position': 'Major Role (One Hour)', 'rate': 10965, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},
]

SAG_LOW_BUDGET_RATES = [
    # Low Budget ($700K-$2MM)
    {'position': 'Performer - Day Player (Low Budget)', 'rate': 810, 'rate_type': 'daily', 'production_type': 'low_budget'},
    {'position': 'Performer - Weekly (Low Budget)', 'rate': 2812, 'rate_type': 'weekly', 'production_type': 'low_budget'},

    # Moderate Low Budget ($300K-$700K)
    {'position': 'Performer - Day Player (Mod Low Budget)', 'rate': 436, 'rate_type': 'daily', 'production_type': 'mod_low_budget'},
    {'position': 'Performer - Weekly (Mod Low Budget)', 'rate': 1514, 'rate_type': 'weekly', 'production_type': 'mod_low_budget'},

    # Ultra Low Budget (<$300K)
    {'position': 'Performer - Day Player (Ultra Low Budget)', 'rate': 249, 'rate_type': 'daily', 'production_type': 'ultra_low_budget'},

    # New Media Categories
    {'position': 'Performer - Day Player (New Media Cat A)', 'rate': 249, 'rate_type': 'daily', 'production_type': 'new_media'},
    {'position': 'Performer - Day Player (New Media Cat B)', 'rate': 436, 'rate_type': 'daily', 'production_type': 'new_media'},
    {'position': 'Performer - Weekly (New Media Cat B)', 'rate': 1514, 'rate_type': 'weekly', 'production_type': 'new_media'},
    {'position': 'Performer - Day Player (New Media Cat C)', 'rate': 810, 'rate_type': 'daily', 'production_type': 'new_media'},
    {'position': 'Performer - Weekly (New Media Cat C)', 'rate': 2812, 'rate_type': 'weekly', 'production_type': 'new_media'},
]

# WGA Rate Cards (2024-2025 rates)
WGA_RATES = [
    # High Budget Theatrical
    {'position': 'Screenplay, Including Treatment (High Budget)', 'rate': 170655, 'rate_type': 'flat', 'production_type': 'high_budget'},
    {'position': 'Non-Original Screenplay (High Budget)', 'rate': 102288, 'rate_type': 'flat', 'production_type': 'high_budget'},
    {'position': 'Rewrite (High Budget)', 'rate': 45470, 'rate_type': 'flat', 'production_type': 'high_budget'},
    {'position': 'Polish (High Budget)', 'rate': 22736, 'rate_type': 'flat', 'production_type': 'high_budget'},

    # Low Budget Theatrical
    {'position': 'Screenplay, Including Treatment (Low Budget)', 'rate': 90904, 'rate_type': 'flat', 'production_type': 'low_budget'},
    {'position': 'Non-Original Screenplay (Low Budget)', 'rate': 49702, 'rate_type': 'flat', 'production_type': 'low_budget'},
    {'position': 'Rewrite (Low Budget)', 'rate': 29826, 'rate_type': 'flat', 'production_type': 'low_budget'},
    {'position': 'Polish (Low Budget)', 'rate': 14924, 'rate_type': 'flat', 'production_type': 'low_budget'},

    # Staff Writer
    {'position': 'Staff Writer', 'rate': 5935, 'rate_type': 'weekly', 'production_type': 'episodic_tv'},

    # Story and Teleplay
    {'position': 'Story (60 minutes or more)', 'rate': 36765, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Teleplay (60 minutes or more)', 'rate': 45978, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Story and Teleplay (60 minutes or more)', 'rate': 68728, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Story (30 minutes)', 'rate': 24534, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Teleplay (30 minutes)', 'rate': 30667, 'rate_type': 'flat', 'production_type': 'network_tv'},
    {'position': 'Story and Teleplay (30 minutes)', 'rate': 45978, 'rate_type': 'flat', 'production_type': 'network_tv'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def get_agreement_ids(conn):
    """Get agreement IDs from database"""
    with conn.cursor() as cur:
        cur.execute("SELECT id, union_name, short_name FROM agreements")
        agreements = cur.fetchall()

    result = {}
    for aid, union_name, short_name in agreements:
        result[f"{union_name}_{short_name}"] = aid
    return result


def insert_rate_cards(conn, union_local, agreement_id, rates, effective_date):
    """Insert rate cards with agreement linkage"""
    with conn.cursor() as cur:
        for rate in rates:
            cur.execute("""
                INSERT INTO rate_cards (
                    union_local, job_classification, base_rate, rate_type,
                    location, production_type, effective_date, agreement_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
                DO UPDATE SET base_rate = EXCLUDED.base_rate, agreement_id = EXCLUDED.agreement_id
                RETURNING id
            """, (
                union_local,
                rate['position'],
                rate['rate'],
                rate['rate_type'],
                rate.get('location'),
                rate.get('production_type'),
                effective_date,
                agreement_id
            ))
    conn.commit()


def main():
    conn = get_connection()

    try:
        # Get agreement IDs
        agreements = get_agreement_ids(conn)
        print(f"Found {len(agreements)} agreements:")
        for key, aid in agreements.items():
            print(f"  {key}: {aid}")

        # Insert DGA rates
        dga_agreement_id = agreements.get('DGA_DGA Basic')
        if dga_agreement_id:
            print(f"\nInserting {len(DGA_RATES)} DGA rate cards...")
            insert_rate_cards(conn, 'DGA', dga_agreement_id, DGA_RATES, date(2024, 7, 1))
            print("  Done!")
        else:
            print("WARNING: DGA Basic agreement not found!")

        # Insert SAG-AFTRA Theatrical rates
        sag_theatrical_id = agreements.get('SAG-AFTRA_TV/Theatrical')
        if sag_theatrical_id:
            print(f"\nInserting {len(SAG_THEATRICAL_RATES)} SAG-AFTRA Theatrical rate cards...")
            insert_rate_cards(conn, 'SAG-AFTRA', sag_theatrical_id, SAG_THEATRICAL_RATES, date(2023, 7, 1))
            print("  Done!")
        else:
            print("WARNING: SAG-AFTRA TV/Theatrical agreement not found!")

        # Insert SAG-AFTRA Low Budget rates
        sag_lowbudget_id = agreements.get('SAG-AFTRA_Low Budget')
        if sag_lowbudget_id:
            print(f"\nInserting {len(SAG_LOW_BUDGET_RATES)} SAG-AFTRA Low Budget rate cards...")
            insert_rate_cards(conn, 'SAG-AFTRA', sag_lowbudget_id, SAG_LOW_BUDGET_RATES, date(2023, 7, 1))
            print("  Done!")
        else:
            print("WARNING: SAG-AFTRA Low Budget agreement not found!")

        # Insert WGA rates
        wga_agreement_id = agreements.get('WGA_MBA')
        if wga_agreement_id:
            print(f"\nInserting {len(WGA_RATES)} WGA rate cards...")
            insert_rate_cards(conn, 'WGA', wga_agreement_id, WGA_RATES, date(2023, 9, 25))
            print("  Done!")
        else:
            print("WARNING: WGA MBA agreement not found!")

        # Show final counts
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.union_name, a.short_name, COUNT(rc.id) as rate_count
                FROM agreements a
                LEFT JOIN rate_cards rc ON rc.agreement_id = a.id
                GROUP BY a.id, a.union_name, a.short_name
                ORDER BY a.union_name
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
