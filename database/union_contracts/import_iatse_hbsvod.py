#!/usr/bin/env python3
"""
Import IATSE High Budget SVOD (HBSVOD) Agreement rates.
2024-2025 rates based on the 2024 IATSE Basic Agreement.

High Budget SVOD rates apply to streaming content with budgets above thresholds:
- Streaming feature (limited): ≥66 min, <$37.2M budget
- Streaming feature (high budget): ≥96 min, ≥$37.2M budget
- Episodic HBSVOD: Major streaming platforms

Key Changes in 2024 Agreement:
- 7% increase Year 1, 4% Year 2, 3.5% Year 3
- New streaming residuals for high-budget SVOD
- Performance-metric bonus residual for high-viewership shows
- MOW/miniseries streaming rates increased 21-30%
"""

import os
import psycopg2
from datetime import date

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:NewSecure1763768664Pass@caboose.proxy.rlwy.net:14463/railway')

# IATSE HBSVOD Crew Rates (2024-2025)
# Based on 2024 IATSE Basic Agreement with 7% increase from theatrical rates
IATSE_HBSVOD_RATES = [
    # =========================================================================
    # LOCAL 600 - CAMERA (High Budget SVOD)
    # =========================================================================

    # Director of Photography
    {'position': 'Director of Photography', 'rate': 4500, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Director of Photography', 'rate': 16875, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # Camera Operator
    {'position': 'Camera Operator', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Camera Operator', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # First Assistant Camera
    {'position': 'First Assistant Camera', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'First Assistant Camera', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # Second Assistant Camera
    {'position': 'Second Assistant Camera', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Second Assistant Camera', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # Digital Imaging Technician (DIT)
    {'position': 'Digital Imaging Technician', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Digital Imaging Technician', 'rate': 3169, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # Camera Utility
    {'position': 'Camera Utility', 'rate': 525, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Camera Utility', 'rate': 2352, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # Steadicam Operator
    {'position': 'Steadicam Operator', 'rate': 850, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '600'},
    {'position': 'Steadicam Operator', 'rate': 3400, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '600'},

    # =========================================================================
    # LOCAL 728 - ELECTRIC (High Budget SVOD)
    # =========================================================================

    # Gaffer
    {'position': 'Gaffer', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '728'},
    {'position': 'Gaffer', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '728'},

    # Best Boy Electric
    {'position': 'Best Boy Electric', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '728'},
    {'position': 'Best Boy Electric', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '728'},

    # Set Lighting Technician (Electrician)
    {'position': 'Set Lighting Technician', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '728'},
    {'position': 'Set Lighting Technician', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '728'},

    # Rigging Gaffer
    {'position': 'Rigging Gaffer', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '728'},
    {'position': 'Rigging Gaffer', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '728'},

    # Generator Operator
    {'position': 'Generator Operator', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '728'},
    {'position': 'Generator Operator', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '728'},

    # =========================================================================
    # LOCAL 80 - GRIPS (High Budget SVOD)
    # =========================================================================

    # Key Grip
    {'position': 'Key Grip', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '80'},
    {'position': 'Key Grip', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '80'},

    # Best Boy Grip
    {'position': 'Best Boy Grip', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '80'},
    {'position': 'Best Boy Grip', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '80'},

    # Dolly Grip
    {'position': 'Dolly Grip', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '80'},
    {'position': 'Dolly Grip', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '80'},

    # Grip
    {'position': 'Grip', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '80'},
    {'position': 'Grip', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '80'},

    # Rigging Key Grip
    {'position': 'Rigging Key Grip', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '80'},
    {'position': 'Rigging Key Grip', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '80'},

    # =========================================================================
    # LOCAL 800 - ART DEPARTMENT (High Budget SVOD)
    # =========================================================================

    # Production Designer
    {'position': 'Production Designer', 'rate': 4200, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '800'},
    {'position': 'Production Designer', 'rate': 15750, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '800'},

    # Art Director
    {'position': 'Art Director', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '800'},
    {'position': 'Art Director', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '800'},

    # Set Designer
    {'position': 'Set Designer', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '800'},
    {'position': 'Set Designer', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '800'},

    # Illustrator
    {'position': 'Illustrator', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '800'},
    {'position': 'Illustrator', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '800'},

    # Storyboard Artist
    {'position': 'Storyboard Artist', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '800'},
    {'position': 'Storyboard Artist', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '800'},

    # =========================================================================
    # LOCAL 44 - PROPS (High Budget SVOD)
    # =========================================================================

    # Property Master
    {'position': 'Property Master', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '44'},
    {'position': 'Property Master', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '44'},

    # Assistant Property Master
    {'position': 'Assistant Property Master', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '44'},
    {'position': 'Assistant Property Master', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '44'},

    # Prop Maker
    {'position': 'Prop Maker', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '44'},
    {'position': 'Prop Maker', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '44'},

    # =========================================================================
    # LOCAL 700 - EDITORS (High Budget SVOD)
    # =========================================================================

    # Film Editor
    {'position': 'Film Editor', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '700'},
    {'position': 'Film Editor', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '700'},

    # Assistant Editor
    {'position': 'Assistant Editor', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '700'},
    {'position': 'Assistant Editor', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '700'},

    # Post-Production Supervisor
    {'position': 'Post-Production Supervisor', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '700'},
    {'position': 'Post-Production Supervisor', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '700'},

    # Post-Production Coordinator
    {'position': 'Post-Production Coordinator', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '700'},
    {'position': 'Post-Production Coordinator', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '700'},

    # =========================================================================
    # LOCAL 695 - SOUND (High Budget SVOD)
    # =========================================================================

    # Production Sound Mixer
    {'position': 'Production Sound Mixer', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '695'},
    {'position': 'Production Sound Mixer', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '695'},

    # Boom Operator
    {'position': 'Boom Operator', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '695'},
    {'position': 'Boom Operator', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '695'},

    # Utility Sound Technician
    {'position': 'Utility Sound Technician', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '695'},
    {'position': 'Utility Sound Technician', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '695'},

    # Video Assist Operator
    {'position': 'Video Assist Operator', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '695'},
    {'position': 'Video Assist Operator', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '695'},

    # =========================================================================
    # LOCAL 706 - MAKEUP & HAIR (High Budget SVOD)
    # =========================================================================

    # Department Head Makeup Artist
    {'position': 'Department Head Makeup Artist', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '706'},
    {'position': 'Department Head Makeup Artist', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '706'},

    # Key Makeup Artist
    {'position': 'Key Makeup Artist', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '706'},
    {'position': 'Key Makeup Artist', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '706'},

    # Department Head Hair Stylist
    {'position': 'Department Head Hair Stylist', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '706'},
    {'position': 'Department Head Hair Stylist', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '706'},

    # Key Hair Stylist
    {'position': 'Key Hair Stylist', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '706'},
    {'position': 'Key Hair Stylist', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '706'},

    # =========================================================================
    # LOCAL 705 - COSTUMERS (High Budget SVOD)
    # =========================================================================

    # Costume Designer
    {'position': 'Costume Designer', 'rate': 850, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '705'},
    {'position': 'Costume Designer', 'rate': 3400, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '705'},

    # Costume Supervisor
    {'position': 'Costume Supervisor', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '705'},
    {'position': 'Costume Supervisor', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '705'},

    # Set Costumer
    {'position': 'Set Costumer', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '705'},
    {'position': 'Set Costumer', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '705'},

    # =========================================================================
    # LOCAL 871 - SCRIPT SUPERVISORS (High Budget SVOD)
    # =========================================================================

    # Script Supervisor
    {'position': 'Script Supervisor', 'rate': 599, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '871'},
    {'position': 'Script Supervisor', 'rate': 2395, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '871'},

    # =========================================================================
    # LOCAL 892 - CASTING (High Budget SVOD)
    # =========================================================================

    # Casting Director
    {'position': 'Casting Director', 'rate': 850, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '892'},
    {'position': 'Casting Director', 'rate': 3400, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '892'},

    # Casting Associate
    {'position': 'Casting Associate', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '892'},
    {'position': 'Casting Associate', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '892'},

    # =========================================================================
    # LOCAL 729 - SET PAINTERS (High Budget SVOD)
    # =========================================================================

    # Paint Foreman
    {'position': 'Paint Foreman', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '729'},
    {'position': 'Paint Foreman', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '729'},

    # Set Painter
    {'position': 'Set Painter', 'rate': 534, 'rate_type': 'daily', 'production_type': 'hbsvod', 'local': '729'},
    {'position': 'Set Painter', 'rate': 2136, 'rate_type': 'weekly', 'production_type': 'hbsvod', 'local': '729'},

    # =========================================================================
    # SPECIAL EFFECTS (High Budget SVOD)
    # =========================================================================

    # Special Effects Coordinator
    {'position': 'Special Effects Coordinator', 'rate': 691, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Special Effects Coordinator', 'rate': 2765, 'rate_type': 'weekly', 'production_type': 'hbsvod'},

    # Special Effects Technician
    {'position': 'Special Effects Technician', 'rate': 556, 'rate_type': 'daily', 'production_type': 'hbsvod'},
    {'position': 'Special Effects Technician', 'rate': 2225, 'rate_type': 'weekly', 'production_type': 'hbsvod'},
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def create_hbsvod_agreement(conn):
    """Create the IATSE HBSVOD agreement"""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM agreements WHERE short_name = 'HBSVOD' AND union_name = 'IATSE'")
        row = cur.fetchone()
        if row:
            print(f"IATSE HBSVOD agreement already exists: {row[0]}")
            return row[0]

        cur.execute("""
            INSERT INTO agreements (name, short_name, union_name, effective_start, effective_end, description, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'IATSE High Budget SVOD Agreement 2024',
            'HBSVOD',
            'IATSE',
            date(2024, 8, 4),
            date(2027, 8, 1),
            'IATSE High Budget SVOD Agreement covers crew for streaming content on major platforms. Based on 2024 IATSE Basic Agreement with streaming-specific residuals.',
            '''{
                "type": "hbsvod",
                "coverage": ["streaming_series", "streaming_features"],
                "budget_thresholds": {
                    "streaming_feature_limited": {"min_runtime": 66, "max_budget": 37212698},
                    "streaming_feature_high": {"min_runtime": 96, "min_budget": 37212698}
                },
                "wage_increases": {"year1": 0.07, "year2": 0.04, "year3": 0.035},
                "residuals": ["primary_market", "secondary_market", "performance_metric_bonus"],
                "notes": "7% increase Year 1, 4% Year 2, 3.5% Year 3. MOW/miniseries streaming rates increased 21-30%"
            }'''
        ))
        agreement_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created IATSE HBSVOD agreement: {agreement_id}")
        return agreement_id


def insert_rate_cards(conn, agreement_id, rates, effective_date):
    """Insert rate cards"""
    count = 0
    with conn.cursor() as cur:
        for rate in rates:
            # Use union_local field to track the specific local
            union_local = f"IATSE Local {rate.get('local', '')}" if rate.get('local') else 'IATSE'
            cur.execute("""
                INSERT INTO rate_cards (
                    union_local, job_classification, base_rate, rate_type,
                    location, production_type, effective_date, agreement_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (union_local, job_classification, location, production_type, effective_date)
                DO UPDATE SET base_rate = EXCLUDED.base_rate, agreement_id = EXCLUDED.agreement_id
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
            count += 1
    conn.commit()
    return count


def main():
    conn = get_connection()

    try:
        agreement_id = create_hbsvod_agreement(conn)

        print(f"\nInserting {len(IATSE_HBSVOD_RATES)} IATSE HBSVOD rate cards...")
        count = insert_rate_cards(conn, agreement_id, IATSE_HBSVOD_RATES, date(2024, 8, 4))
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
