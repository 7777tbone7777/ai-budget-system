#!/usr/bin/env python3
"""Run migration 005 to enhance tax_incentives table"""

import os
import psycopg2

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not set. Run: railway run python3 scripts/run-migration-005.py")
    exit(1)

# Read migration file
migration_file = "/Users/anthonyvazquez/ai-budget-system/database/migrations/005_enhance_tax_incentives.sql"
with open(migration_file, 'r') as f:
    migration_sql = f.read()

print("🔄 Running migration 005: Enhance tax_incentives table...\n")

try:
    # Connect and run migration
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(migration_sql)

    conn.commit()
    cur.close()
    conn.close()

    print("✅ Migration 005 completed successfully!")

except Exception as e:
    print(f"❌ Migration failed: {e}")
    exit(1)
