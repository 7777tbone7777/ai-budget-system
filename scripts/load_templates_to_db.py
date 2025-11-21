#!/usr/bin/env python3
"""
Load extracted budget templates into PostgreSQL database.
Applies migration 006 and imports all JSON templates.
"""

import os
import json
import glob
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    print("Installing psycopg2...")
    os.system("pip3 install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import Json

DATABASE_URL = "postgresql://postgres:fokBnhssuYOYzrtLlUuGkuvHOCrhAejf@caboose.proxy.rlwy.net:14463/railway"

def apply_migration(conn):
    """Apply migration 006 to create template tables."""
    print("Applying migration 006_add_budget_templates.sql...")

    migration_file = '/Users/anthonyvazquez/ai-budget-system/database/migrations/006_add_budget_templates.sql'

    with open(migration_file, 'r') as f:
        migration_sql = f.read()

    cursor = conn.cursor()
    try:
        cursor.execute(migration_sql)
        conn.commit()
        print("✓ Migration applied successfully")
    except Exception as e:
        conn.rollback()
        print(f"Migration error: {e}")
        raise
    finally:
        cursor.close()


def extract_location_name(location_str):
    """Extract clean location name from metadata."""
    if not location_str:
        return 'Unknown'

    # Handle formats like "Atlanta, GA Shoot -15 Local Location Days"
    location_map = {
        'Atlanta': 'Atlanta',
        'Los Angeles': 'Los Angeles',
        'Chicago': 'Chicago',
        'Vancouver': 'Vancouver',
        'Toronto': 'Toronto',
        'Montreal': 'Montreal',
        'New Orleans': 'New Orleans',
        'Boston': 'Boston',
        'New York': 'New York',
        'Pittsburgh': 'Pittsburgh',
        'Portland': 'Portland',
        'Santa Fe': 'Santa Fe',
        'Charleston': 'Charleston',
        'Wilmington': 'Wilmington'
    }

    for key, value in location_map.items():
        if key.lower() in location_str.lower():
            return value

    return location_str.split(',')[0].strip()


def determine_production_type(filename):
    """Determine production type from filename."""
    filename_lower = filename.lower()

    if 'multicam' in filename_lower:
        return 'multi_cam'
    elif 'pattern' in filename_lower:
        return 'pattern_budget'
    elif 'amort' in filename_lower:
        return 'amortization'
    elif 'pilot' in filename_lower or 'one hour' in filename_lower:
        return 'one_hour_pilot'
    elif 'cable' in filename_lower:
        return 'cable_series'
    else:
        return 'unknown'


def calculate_totals(template_data):
    """Calculate total budget from template data."""
    total = 0
    for dept in template_data.get('departments', []):
        dept_total = dept.get('total', 0)
        if dept_total:
            total += float(dept_total)
    return total


def load_template(conn, json_file):
    """Load a single template JSON file into database."""
    with open(json_file, 'r') as f:
        data = json.load(f)

    metadata = data.get('metadata', {})
    departments = data.get('departments', [])

    # Extract template info
    filename = metadata.get('filename', os.path.basename(json_file))
    location = extract_location_name(metadata.get('location', ''))
    production_type = determine_production_type(filename)
    shoot_days = metadata.get('shoot_days')
    shoot_dates = metadata.get('shoot_dates')

    # Calculate totals
    total_budget = calculate_totals(data)

    # Count departments and line items
    dept_count = len(departments)
    item_count = sum(len(dept.get('line_items', [])) for dept in departments)

    # Generate template name
    template_name = filename.replace('.pdf', '').replace('_', ' ')

    cursor = conn.cursor()
    try:
        # Insert template
        cursor.execute("""
            INSERT INTO budget_templates (
                name, location, production_type,
                total_budget, shoot_days, shoot_dates,
                template_data, source_filename,
                department_count, line_item_count,
                completeness_score
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                     calculate_template_completeness(%s::jsonb))
            RETURNING id
        """, (
            template_name, location, production_type,
            total_budget, shoot_days, shoot_dates,
            Json(data), filename,
            dept_count, item_count,
            Json(data)
        ))

        template_id = cursor.fetchone()[0]

        # Insert departments
        for idx, dept in enumerate(departments):
            cursor.execute("""
                INSERT INTO template_departments (
                    template_id, name, account, total, sort_order
                ) VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                template_id,
                dept.get('name'),
                dept.get('account'),
                dept.get('total'),
                idx
            ))

            dept_id = cursor.fetchone()[0]

            # Insert line items
            for item_idx, item in enumerate(dept.get('line_items', [])):
                cursor.execute("""
                    INSERT INTO template_line_items (
                        template_id, department_id,
                        account, description, position,
                        quantity, unit, rate, subtotal, total,
                        detail_lines, periods, sort_order
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    template_id, dept_id,
                    item.get('account'),
                    item.get('description'),
                    item.get('position'),
                    item.get('quantity'),
                    item.get('unit'),
                    item.get('rate'),
                    item.get('subtotal'),
                    item.get('total'),
                    Json(item.get('detail_lines', [])),
                    Json(item.get('periods', {})),
                    item_idx
                ))

        conn.commit()
        return True, template_name, dept_count, item_count

    except Exception as e:
        conn.rollback()
        return False, str(e), 0, 0
    finally:
        cursor.close()


def main():
    print("="*70)
    print("LOADING BUDGET TEMPLATES TO DATABASE")
    print("="*70)
    print()

    # Connect to database
    print(f"Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    print("✓ Connected")
    print()

    # Apply migration
    apply_migration(conn)
    print()

    # Find all JSON templates
    templates_dir = '/Users/anthonyvazquez/ai-budget-system/database/budget_templates'
    json_files = glob.glob(f"{templates_dir}/*.json")

    print(f"Found {len(json_files)} template JSON files")
    print()

    # Load each template
    success_count = 0
    fail_count = 0
    total_depts = 0
    total_items = 0

    for idx, json_file in enumerate(json_files, 1):
        filename = os.path.basename(json_file)
        print(f"[{idx}/{len(json_files)}] Loading {filename}...")

        success, result, dept_count, item_count = load_template(conn, json_file)

        if success:
            print(f"  ✓ {result} ({dept_count} depts, {item_count} items)")
            success_count += 1
            total_depts += dept_count
            total_items += item_count
        else:
            print(f"  ✗ Failed: {result}")
            fail_count += 1

    print()
    print("="*70)
    print("LOADING SUMMARY")
    print("="*70)
    print(f"Templates loaded: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Total departments: {total_depts}")
    print(f"Total line items: {total_items}")
    print()

    # Query template summary
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            location,
            COUNT(*) as template_count,
            AVG(total_budget)::DECIMAL(12,2) as avg_budget,
            SUM(line_item_count) as total_items
        FROM budget_templates
        WHERE is_active = true
        GROUP BY location
        ORDER BY avg_budget
    """)

    print("Templates by Location:")
    print("-" * 70)
    for row in cursor.fetchall():
        location, count, avg_budget, items = row
        print(f"  {location:20s} | {count:2d} templates | Avg: ${avg_budget:,.0f} | {items:4d} items")

    cursor.close()
    conn.close()

    print()
    print("✅ Template loading complete!")


if __name__ == '__main__':
    main()
