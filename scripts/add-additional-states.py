#!/usr/bin/env python3
"""Add additional states found through web research"""

import os
import psycopg2

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

additional_states = [
    {
        "state": "New York",
        "incentive_min_percent": 30,
        "incentive_max_percent": 40,
        "incentive_type": "Refundable",
        "incentive_mechanism": "Tax Credit",
        "resident_atl_percent": 30,
        "resident_btl_percent": 30,
        "non_resident_atl_percent": 30,
        "non_resident_btl_percent": 30,
        "qualified_spend_percent": 30,
        "minimum_spend": 500000,
        "annual_cap": 800000000,
        "labor_uplifts": "10% on qualified labor in upstate counties; 10% Production Plus bonus for $100M+ spend; 5% bonus for indie projects",
        "source": "Web Research - Empire State Development 2025"
    },
    {
        "state": "North Carolina",
        "incentive_min_percent": 25,
        "incentive_max_percent": 25,
        "incentive_type": "Grant",
        "incentive_mechanism": "Rebate",
        "resident_atl_percent": 25,
        "resident_btl_percent": 25,
        "non_resident_atl_percent": 25,
        "non_resident_btl_percent": 25,
        "qualified_spend_percent": 25,
        "minimum_spend": 1500000,  # Features
        "project_cap": 7000000,  # Features (TV series is 15M)
        "annual_cap": 31000000,
        "compensation_cap": 1000000,
        "source": "Web Research - NC Film Office 2024"
    },
    {
        "state": "Massachusetts",
        "incentive_min_percent": 25,
        "incentive_max_percent": 25,
        "incentive_type": "Transferable",
        "incentive_mechanism": "Tax Credit",
        "resident_atl_percent": 25,
        "resident_btl_percent": 25,
        "non_resident_atl_percent": 25,
        "non_resident_btl_percent": 25,
        "qualified_spend_percent": 25,
        "minimum_spend": 50000,
        "spend_uplifts": "Sales tax exemption; Can cash out at 90% or transfer at market rate; No caps",
        "source": "Web Research - Massachusetts Film Office 2024"
    },
    {
        "state": "Arizona",
        "incentive_min_percent": 15,
        "incentive_max_percent": 22.5,
        "incentive_type": "Tax Credit",
        "incentive_mechanism": "Tax Credit",
        "resident_atl_percent": 15,
        "resident_btl_percent": 17.5,
        "non_resident_atl_percent": 15,
        "non_resident_btl_percent": 15,
        "qualified_spend_percent": 15,
        "annual_cap": 100000000,
        "labor_uplifts": "2.5% for resident BTL labor",
        "spend_uplifts": "2.5% for using qualified facility + in-state post; Tiered: 17.5% for $10M-$35M, 20% for $35M+",
        "source": "Web Research - Arizona Commerce 2024"
    },
    {
        "state": "Kentucky",
        "incentive_min_percent": 30,
        "incentive_max_percent": 35,
        "incentive_type": "Refundable",
        "incentive_mechanism": "Tax Credit",
        "resident_atl_percent": 35,
        "resident_btl_percent": 35,
        "non_resident_atl_percent": 30,
        "non_resident_btl_percent": 30,
        "qualified_spend_percent": 30,
        "minimum_spend": 250000,
        "annual_cap": 75000000,
        "labor_uplifts": "5% uplift for Enhanced Incentive Counties",
        "source": "Web Research - Kentucky Economic Development Cabinet 2024"
    },
    {
        "state": "Tennessee",
        "incentive_min_percent": 25,
        "incentive_max_percent": 25,
        "incentive_type": "Grant",
        "incentive_mechanism": "Grant",
        "resident_atl_percent": 25,
        "resident_btl_percent": 25,
        "non_resident_atl_percent": 25,
        "non_resident_btl_percent": 25,
        "qualified_spend_percent": 25,
        "annual_cap": 8500000,
        "spend_uplifts": "Occupancy sales tax rebate after 90 hotel days; No state income taxes",
        "source": "Web Research - Tennessee Entertainment Commission 2024"
    },
    {
        "state": "Texas",
        "incentive_min_percent": 20,
        "incentive_max_percent": 31,
        "incentive_type": "Grant",
        "incentive_mechanism": "Cash Grant",
        "resident_atl_percent": 20,
        "resident_btl_percent": 20,
        "non_resident_atl_percent": 20,
        "non_resident_btl_percent": 20,
        "qualified_spend_percent": 20,
        "spend_uplifts": "Stackable 2.5% bonuses: Underutilized/Distressed Areas, 5% veterans, 10% in-state post",
        "source": "Web Research - Texas Moving Image Industry Incentive Program 2024"
    }
]

print(f"🎬 Adding {len(additional_states)} additional states to database...\n")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

inserted = 0
errors = []

for state_data in additional_states:
    try:
        cur.execute("""
            INSERT INTO tax_incentives (
                state,
                country,
                incentive_min_percent,
                incentive_max_percent,
                incentive_type,
                incentive_mechanism,
                resident_atl_percent,
                resident_btl_percent,
                non_resident_atl_percent,
                non_resident_btl_percent,
                qualified_spend_percent,
                minimum_spend,
                project_cap,
                annual_cap,
                compensation_cap,
                labor_uplifts,
                spend_uplifts,
                source,
                extracted_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE
            )
            ON CONFLICT DO NOTHING
        """, (
            state_data['state'],
            'US',
            state_data['incentive_min_percent'],
            state_data['incentive_max_percent'],
            state_data['incentive_type'],
            state_data['incentive_mechanism'],
            state_data.get('resident_atl_percent'),
            state_data.get('resident_btl_percent'),
            state_data.get('non_resident_atl_percent'),
            state_data.get('non_resident_btl_percent'),
            state_data.get('qualified_spend_percent'),
            state_data.get('minimum_spend'),
            state_data.get('project_cap'),
            state_data.get('annual_cap'),
            state_data.get('compensation_cap'),
            state_data.get('labor_uplifts'),
            state_data.get('spend_uplifts'),
            state_data['source']
        ))

        inserted += 1
        print(f"✓ {state_data['state']}")

    except Exception as e:
        errors.append(f"{state_data['state']}: {e}")
        conn.rollback()
        continue

conn.commit()
cur.close()
conn.close()

print(f"\n✅ Load complete!")
print(f"   Inserted: {inserted}")

if errors:
    print(f"\n❌ Errors ({len(errors)}):")
    for error in errors:
        print(f"   {error}")

# Verify total count
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM tax_incentives')
total = cur.fetchone()[0]
print(f"\n📊 Total states in database: {total}")
cur.close()
conn.close()
