#!/usr/bin/env python3
"""
SAG-AFTRA Sideletter Rules Loader
From 2023 MOA (November 9, 2023 - June 30, 2026)
Source: 2023_Theatrical_Television_MOA.pdf
"""

import os
import psycopg2
import uuid
import json

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# SAG-AFTRA Sideletter Rules from 2023 MOA
SAG_AFTRA_SIDELETTERS = [
    # ============================================
    # 2023-2026 WAGE INCREASES
    # ============================================
    {
        "sideletter_name": "SAG-AFTRA 2023-2026 Wage Increases",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "increases": [
                {"effective_date": "2023-11-09", "percent": 7.0, "description": "Initial increase"},
                {"effective_date": "2024-07-01", "percent": 4.0, "description": "Year 2 increase"},
                {"effective_date": "2025-07-01", "percent": 3.5, "description": "Year 3 increase"}
            ],
            "compounded": True,
            "total_compounded_increase": 15.04,  # 1.07 * 1.04 * 1.035 = 1.1504
            "description": "Minimum salary rates increase 7% (Nov 2023), 4% (July 2024), 3.5% (July 2025), compounded",
            "source": "2023 SAG-AFTRA MOA Item 2.a"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # BACKGROUND ACTOR WAGE INCREASES (Schedule X)
    # ============================================
    {
        "sideletter_name": "Background Actors (Schedule X) Wage Increase",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 11,
        "applies_when": {
            "initial_increase": 11.0,
            "effective_date": "2023-11-09",
            "subsequent_increases": "Standard 4%/3.5% in years 2 and 3",
            "description": "Schedule X-I and X-II minimum daily rates increased by 11% effective Nov 9, 2023",
            "source": "2023 SAG-AFTRA MOA Item 2.b"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # STUNT COORDINATOR FLAT DEAL INCREASES
    # ============================================
    {
        "sideletter_name": "Stunt Coordinator Flat Deal Wage Increases",
        "production_type": "television",
        "distribution_platform": "all",
        "wage_adjustment_pct": 10,
        "applies_when": {
            "increases": [
                {"effective_date": "2023-11-09", "percent": 10.0},
                {"effective_date": "2024-07-01", "percent": 6.5},
                {"effective_date": "2025-07-01", "percent": 5.0}
            ],
            "compounded": True,
            "total_compounded_increase": 23.0,  # 1.10 * 1.065 * 1.05 = 1.23
            "description": "Stunt coordinator flat deal contracts increased 10%/6.5%/5% compounded",
            "source": "2023 SAG-AFTRA MOA Item 2.c"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # CONTRIBUTION CEILINGS
    # ============================================
    {
        "sideletter_name": "P&H Contribution Ceiling - Half Hour",
        "production_type": "half_hour",
        "distribution_platform": "television",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "contribution_ceiling": 25000,
            "runtime_max_minutes": 35,
            "effective_date": "2024-07-01",
            "description": "P&H contribution ceiling for half-hour (35 min or less) is $25,000 per episode",
            "source": "2023 SAG-AFTRA MOA Item 3.a.i"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "P&H Contribution Ceiling - One Hour",
        "production_type": "one_hour",
        "distribution_platform": "television",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "contribution_ceiling": 35000,
            "runtime_min_minutes": 36,
            "runtime_max_minutes": 65,
            "effective_date": "2024-07-01",
            "description": "P&H contribution ceiling for one-hour (36-65 min) is $35,000 per episode",
            "source": "2023 SAG-AFTRA MOA Item 3.a.ii"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # MAJOR ROLE PERFORMER THRESHOLDS
    # ============================================
    {
        "sideletter_name": "Major Role Performer - Half Hour",
        "production_type": "half_hour_series",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "threshold_per_episode": 65000,
            "description": "Major role performer provisions apply at less than $65,000/episode for half-hour series",
            "source": "2023 SAG-AFTRA MOA Item 6"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Major Role Performer - One Hour",
        "production_type": "one_hour_series",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "threshold_per_episode": 70000,
            "description": "Major role performer provisions apply at less than $70,000/episode for one-hour series",
            "source": "2023 SAG-AFTRA MOA Item 6"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Series Contract Performer Threshold",
        "production_type": "television",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "threshold_per_episode": 32000,
            "description": "Series contract performers guaranteed less than $32,000 per episode subject to standard option provisions",
            "source": "2023 SAG-AFTRA MOA Item 6"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # RELOCATION ALLOWANCES
    # ============================================
    {
        "sideletter_name": "Relocation Allowance - Out of LA",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "minimum_allowance": 10000,
            "location": "outside Los Angeles",
            "description": "Series regular relocating outside LA receives minimum $10,000 relocation allowance per season",
            "source": "2023 SAG-AFTRA MOA Item 7"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Relocation Allowance - Within LA",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "minimum_allowance": 5000,
            "location": "within Los Angeles",
            "description": "Series regular from outside LA relocating to LA receives minimum $5,000 relocation allowance per season",
            "source": "2023 SAG-AFTRA MOA Item 7"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # STREAMING RESIDUALS THRESHOLDS
    # ============================================
    {
        "sideletter_name": "Streaming Residuals Buyout Threshold - Per Episode",
        "production_type": "streaming_series",
        "distribution_platform": "SVOD",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "threshold_per_episode": 9500,
            "new_threshold": 11000,
            "effective_date_new": "year_2",
            "description": "Streaming residuals buyout permitted at $9,500/episode ($11,000 for contracts year 2+)",
            "source": "2023 SAG-AFTRA MOA Item 10"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Streaming Residuals Buyout Threshold - Per Series",
        "production_type": "streaming_series",
        "distribution_platform": "SVOD",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "threshold_per_series": 125000,
            "description": "Streaming residuals buyout permitted at $125,000 per series",
            "source": "2023 SAG-AFTRA MOA Item 10"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # DIGITAL REPLICA PROVISIONS (NEW 2023)
    # ============================================
    {
        "sideletter_name": "Employment-Based Digital Replica - Creation",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "notification_hours": 48,
            "consent_required": True,
            "work_time_treatment": "Services count as work time when on same day as other work",
            "standalone_session_pay": "1 day at pro rata daily salary (not less than day performer minimum)",
            "half_day_session_pay": "½ pro rata daily for 4-hour session (if scheduled to accommodate performer)",
            "description": "Performer must be notified 48 hours in advance; paid pro rata daily or half-day rate",
            "source": "2023 SAG-AFTRA MOA Item 15 - Section XX.A.2.a"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Employment-Based Digital Replica - Use in Same Production",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "consent_required": True,
            "consent_for_new_photography": "Required for new photography/sound not previously recorded",
            "compensation": "Pro rata daily rate or minimum, whichever higher, for each day of digital performance",
            "residuals": "Entitled to residuals as if performer performed scenes in person",
            "description": "Use in same production requires consent; paid for days of digital performance; residuals apply",
            "source": "2023 SAG-AFTRA MOA Item 15 - Section XX.A.2.b.i"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Employment-Based Digital Replica - Use in Other Production",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "consent_required": True,
            "must_be_obtained": "Prior to use, in separate writing signed by performer",
            "minimum_compensation": "Day performer rate is minimum for bargaining",
            "residuals": "Subject to residuals per applicable collective bargaining agreement",
            "description": "Use in other productions requires separate consent and bargaining at day performer minimum",
            "source": "2023 SAG-AFTRA MOA Item 15 - Section XX.A.2.b.ii"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Independently Created Digital Replica",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "consent_required": True,
            "bargaining_required": True,
            "description_required": "Reasonably specific description of intended use",
            "ph_contributions": "Subject to P&H contributions per Section 34/Section 22",
            "deceased_performer": "Consent from authorized representative or Union if cannot be identified",
            "description": "Creating likeness without employment requires consent, bargaining, and P&H contributions",
            "source": "2023 SAG-AFTRA MOA Item 15 - Section XX.A.3"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "Digital Alteration of Performance",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "consent_required": True,
            "applies_to": "Digital alteration of performer's voice or likeness in previously recorded content",
            "effective_date": "90 days after ratification notice",
            "description": "Consent required to digitally alter a performer's performance in previously recorded content",
            "source": "2023 SAG-AFTRA MOA Item 15 - Section XX.B"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # HIGH BUDGET SVOD THRESHOLDS (Updated)
    # ============================================
    {
        "sideletter_name": "High Budget SVOD - 20-35 Minutes",
        "production_type": "streaming_series",
        "distribution_platform": "SVOD",
        "min_budget_amount": 1300000,
        "max_budget_amount": None,
        "wage_adjustment_pct": 0,
        "applies_when": {
            "runtime_minutes_min": 20,
            "runtime_minutes_max": 35,
            "description": "Programs 20-35 min with budget $1.3M+ qualify as High Budget SVOD",
            "source": "2023 SAG-AFTRA MOA - referenced from 2020 MOA"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "High Budget SVOD - 36-65 Minutes",
        "production_type": "streaming_series",
        "distribution_platform": "SVOD",
        "min_budget_amount": 2500000,
        "max_budget_amount": None,
        "wage_adjustment_pct": 0,
        "applies_when": {
            "runtime_minutes_min": 36,
            "runtime_minutes_max": 65,
            "description": "Programs 36-65 min with budget $2.5M+ qualify as High Budget SVOD",
            "source": "2023 SAG-AFTRA MOA - referenced from 2020 MOA"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
    {
        "sideletter_name": "High Budget SVOD - 66+ Minutes",
        "production_type": "streaming_series",
        "distribution_platform": "SVOD",
        "min_budget_amount": 3000000,
        "max_budget_amount": None,
        "wage_adjustment_pct": 0,
        "applies_when": {
            "runtime_minutes_min": 66,
            "runtime_minutes_max": None,
            "description": "Programs 66+ min with budget $3M+ qualify as High Budget SVOD",
            "source": "2023 SAG-AFTRA MOA - referenced from 2020 MOA"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # OPTION PERIOD PROVISIONS
    # ============================================
    {
        "sideletter_name": "Option Period Between Seasons",
        "production_type": "television",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "option_period_max": "1 year from completion of principal photography",
            "extensions_allowed": 2,
            "extension_length_months": 6,
            "extension_payment": "Episodic fee for each 6-month extension",
            "threshold": 32000,
            "description": "Options for performers guaranteed less than $32,000 expire after 1 year with two 6-month extensions available",
            "source": "2023 SAG-AFTRA MOA Item 6"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },

    # ============================================
    # CASTING PROVISIONS
    # ============================================
    {
        "sideletter_name": "Casting - Self Tape Requirements",
        "production_type": "all",
        "distribution_platform": "all",
        "wage_adjustment_pct": 0,
        "applies_when": {
            "materials_available_hours": 48,
            "restrictions": [
                "Producer may not make self-tape available publicly without prior written consent",
                "Must offer live interview option when requested"
            ],
            "description": "Character breakdowns and sides must be available 48 hours in advance; self-tapes cannot be made public",
            "source": "2023 SAG-AFTRA MOA Item 9"
        },
        "applicable_unions": ["SAG-AFTRA"]
    },
]

def main():
    print("=" * 60)
    print("SAG-AFTRA SIDELETTER RULES LOADER")
    print("From 2023 MOA (November 9, 2023 - June 30, 2026)")
    print("=" * 60)

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Get current count
    cursor.execute("SELECT COUNT(*) FROM sideletter_rules WHERE 'SAG-AFTRA' = ANY(applicable_unions)")
    before_count = cursor.fetchone()[0]
    print(f"\nCurrent SAG-AFTRA sideletter rules: {before_count}")

    inserted = 0
    skipped = 0

    for rule in SAG_AFTRA_SIDELETTERS:
        # Check if rule already exists
        cursor.execute("""
            SELECT id FROM sideletter_rules
            WHERE sideletter_name = %s
            LIMIT 1
        """, (rule['sideletter_name'],))

        if cursor.fetchone():
            skipped += 1
            print(f"  - SKIP: {rule['sideletter_name']} (exists)")
            continue

        # Insert new rule
        cursor.execute("""
            INSERT INTO sideletter_rules (
                id, sideletter_name, production_type, distribution_platform,
                min_budget_amount, max_budget_amount,
                wage_adjustment_pct, holiday_pay_pct, vacation_pay_pct,
                applies_when, applicable_unions
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()),
            rule['sideletter_name'],
            rule.get('production_type'),
            rule.get('distribution_platform'),
            rule.get('min_budget_amount'),
            rule.get('max_budget_amount'),
            rule.get('wage_adjustment_pct', 0),
            rule.get('holiday_pay_pct', 100),
            rule.get('vacation_pay_pct', 100),
            json.dumps(rule.get('applies_when', {})),
            rule.get('applicable_unions', [])
        ))
        inserted += 1
        print(f"  + {rule['sideletter_name']}")

    conn.commit()

    # Get new count
    cursor.execute("SELECT COUNT(*) FROM sideletter_rules WHERE 'SAG-AFTRA' = ANY(applicable_unions)")
    after_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("LOAD COMPLETE")
    print("=" * 60)
    print(f"Rules before: {before_count}")
    print(f"Inserted: {inserted}")
    print(f"Skipped (duplicates): {skipped}")
    print(f"Rules after: {after_count}")
    print(f"Net added: {after_count - before_count}")

    print("\n" + "=" * 60)
    print("KEY RULES LOADED FROM 2023 MOA")
    print("=" * 60)
    print("  - 2023-2026 wage increases (7% + 4% + 3.5% compounded = 15.04%)")
    print("  - Background actors 11% initial increase (Schedule X)")
    print("  - Stunt coordinator flat deal increases (10%/6.5%/5%)")
    print("  - P&H contribution ceilings ($25K half-hour, $35K one-hour)")
    print("  - Major role performer thresholds")
    print("  - Digital Replica provisions (Employment-Based & Independently Created)")
    print("  - Digital Alteration consent requirements")
    print("  - Streaming residuals buyout thresholds")
    print("  - High Budget SVOD thresholds")
    print("  - Option period provisions")
    print("  - Casting/self-tape requirements")

if __name__ == "__main__":
    main()
