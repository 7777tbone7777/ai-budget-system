#!/usr/bin/env python3
"""Load extracted tax incentive data into the database"""

import os
import json
import psycopg2
from psycopg2.extras import Json

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not set. Run: railway run python3 scripts/load-tax-incentives.py")
    exit(1)

# Load JSON data
json_file = "/Users/anthonyvazquez/ai-budget-system/data/tax-incentives.json"
with open(json_file, 'r') as f:
    data = json.load(f)

print(f"🎬 Loading {len(data['states'])} states into database...\n")

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

inserted = 0
skipped = 0
errors = []

for state_data in data['states']:
    state_name = state_data.get('state', '')
    incentive = state_data.get('incentive', {})
    labor = state_data.get('labor', {})
    qualified_spend = state_data.get('qualified_spend', {})
    minimums_caps = state_data.get('minimums_caps', {})
    uplifts = state_data.get('uplifts', {})
    requirements = state_data.get('requirements', {})

    # Skip if no valid incentive data
    if not incentive.get('min_percent'):
        skipped += 1
        continue

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
                requirements,
                source,
                extracted_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            state_name,
            'US',
            incentive.get('min_percent'),
            incentive.get('max_percent'),
            incentive.get('type'),
            incentive.get('mechanism'),
            labor.get('resident_atl'),
            labor.get('resident_btl'),
            labor.get('non_resident_atl'),
            labor.get('non_resident_btl'),
            qualified_spend.get('percent'),
            minimums_caps.get('minimum_spend'),
            minimums_caps.get('project_cap'),
            minimums_caps.get('annual_cap'),
            minimums_caps.get('compensation_cap'),
            uplifts.get('labor'),
            uplifts.get('spend'),
            Json(requirements) if requirements else None,
            data.get('source'),
            data.get('extracted_at')
        ))

        inserted += 1
        print(f"✓ {state_name}")

    except Exception as e:
        errors.append(f"{state_name}: {e}")
        conn.rollback()
        continue

# Commit all changes
conn.commit()
cur.close()
conn.close()

print(f"\n✅ Load complete!")
print(f"   Inserted: {inserted}")
print(f"   Skipped: {skipped}")

if errors:
    print(f"\n❌ Errors ({len(errors)}):")
    for error in errors:
        print(f"   {error}")
