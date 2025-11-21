#!/usr/bin/env python3
"""
Clean extracted rate data and upload to Railway PostgreSQL database.
"""

import json
import re
import os
import psycopg2
from pathlib import Path
from datetime import datetime
import uuid

DATABASE_URL = os.environ.get('DATABASE_URL',
    "postgresql://postgres:fokBnhssuYOYzrtLlUuGkuvHOCrhAejf@caboose.proxy.rlwy.net:14463/railway")

BASE_DIR = Path(__file__).parent
RATES_FILE = BASE_DIR / "extracted_rates" / "all_rates_v2.json"

def clean_job_title(title: str) -> str:
    """Clean and normalize job titles."""
    if not title:
        return None

    # Remove leading/trailing whitespace
    title = title.strip()

    # Remove trailing footnote numbers
    title = re.sub(r'\d+\s*$', '', title).strip()

    # Fix common truncation patterns
    if title.startswith("mos. in Industry"):
        return None

    # Skip sentence fragments and garbage
    garbage_phrases = [
        'effective july', 'effective december', 'effective august',
        'drivers of forty', 'drivers of thirty', 'drivers of other vehicles which',
        'non-affiliate accountants group', 'specialized equipment driver rate',
        'rate effective', 'group effective', 'gen. foreman',
    ]
    if any(p in title.lower() for p in garbage_phrases):
        return None

    # Remove trailing punctuation and parentheses fragments
    title = re.sub(r'[\(\)\.,]+$', '', title).strip()

    # Normalize spacing
    title = re.sub(r'\s+', ' ', title)

    # Remove schedule codes from titles
    title = re.sub(r'\s+Y-\s*$', '', title).strip()
    title = re.sub(r'\s+\.\s*$', '', title).strip()

    # Title case if all caps
    if title.isupper():
        title = title.title()

    # Filter out garbage entries
    if len(title) < 4:
        return None
    if title.isdigit():
        return None
    if re.match(r'^[\d\s\.\-/]+$', title):
        return None
    if title.lower() in ['page', 'code', 'weekly', 'hourly', 'daily', 'rate', 'schedule']:
        return None

    return title

def parse_effective_date(period_str) -> str:
    """Parse effective date from period string."""
    # Handle None or non-string
    if not period_str or not isinstance(period_str, str):
        return "2024-08-04"

    # Try to extract start date from patterns like "8/4/24-8/2/25"
    match = re.search(r'(\d{1,2}/\d{1,2}/\d{2,4})', period_str)
    if match:
        date_str = match.group(1)
        parts = date_str.split('/')
        if len(parts) == 3:
            month, day, year = parts
            if len(year) == 2:
                year = '20' + year
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

    # Default to 2024
    return "2024-08-04"

def clean_rates(rates: list) -> list:
    """Clean and filter rate data."""
    cleaned = []
    seen = set()

    for rate in rates:
        # Skip Unknown union entries (from IATSE Basic which applies to multiple locals)
        if rate['union_local'] == 'Unknown':
            continue

        # Clean job title
        job = clean_job_title(rate['job_classification'])
        if not job:
            continue

        # Validate rate (must be reasonable for union wages)
        base_rate = rate['base_rate']

        # Determine rate type and validate
        rate_type = rate['rate_type']

        # Filter out unreasonably low rates (likely parsing errors)
        # Union hourly rates typically start around $25/hr
        # Union weekly rates typically start around $1000/week
        if rate_type == 'hourly' and (base_rate < 20 or base_rate > 500):
            continue
        elif rate_type == 'weekly' and (base_rate < 500 or base_rate > 15000):
            continue
        elif base_rate < 20 or base_rate > 15000:
            continue

        # Refine rate type based on value
        if base_rate >= 20 and base_rate < 500:
            rate_type = 'hourly'
        elif base_rate >= 500:
            rate_type = 'weekly'

        # Create clean entry
        clean_entry = {
            'union_local': rate['union_local'],
            'job_classification': job,
            'rate_type': rate_type,
            'base_rate': base_rate,
            'effective_date': parse_effective_date(rate.get('effective_period', '')),
            'location': None,
            'production_type': 'theatrical',  # Default
        }

        # Deduplicate
        key = (clean_entry['union_local'], clean_entry['job_classification'],
               clean_entry['base_rate'], clean_entry['rate_type'])
        if key not in seen:
            seen.add(key)
            cleaned.append(clean_entry)

    return cleaned

def upload_to_database(rates: list, conn) -> tuple:
    """Upload rates to database."""
    cursor = conn.cursor()

    inserted = 0
    skipped = 0

    for rate in rates:
        try:
            # Check if similar rate already exists
            cursor.execute("""
                SELECT id FROM rate_cards
                WHERE union_local = %s
                AND job_classification = %s
                AND rate_type = %s
                AND base_rate = %s
                LIMIT 1
            """, (rate['union_local'], rate['job_classification'],
                  rate['rate_type'], rate['base_rate']))

            if cursor.fetchone():
                skipped += 1
                continue

            # Insert new rate
            cursor.execute("""
                INSERT INTO rate_cards (id, union_local, job_classification, rate_type,
                                       base_rate, location, production_type, effective_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(uuid.uuid4()),
                rate['union_local'],
                rate['job_classification'],
                rate['rate_type'],
                rate['base_rate'],
                rate['location'],
                rate['production_type'],
                rate['effective_date'],
            ))
            inserted += 1

        except Exception as e:
            print(f"  Error inserting {rate['job_classification']}: {e}")
            skipped += 1

    conn.commit()
    cursor.close()

    return inserted, skipped

def main():
    print("=" * 60)
    print("RATE CARD DATA CLEANING AND UPLOAD")
    print("=" * 60)

    # Load extracted rates
    print(f"\nLoading rates from: {RATES_FILE}")
    with open(RATES_FILE, 'r') as f:
        data = json.load(f)

    raw_rates = data['rates']
    print(f"Raw rates loaded: {len(raw_rates)}")

    # Clean rates
    print("\nCleaning and validating rates...")
    clean_rates_list = clean_rates(raw_rates)
    print(f"Clean rates: {len(clean_rates_list)}")

    # Show sample of cleaned data
    print("\nSample cleaned rates:")
    by_union = {}
    for rate in clean_rates_list:
        union = rate['union_local']
        if union not in by_union:
            by_union[union] = []
        by_union[union].append(rate)

    for union, rates in sorted(by_union.items()):
        print(f"\n  {union}: {len(rates)} rates")
        for rate in rates[:3]:
            print(f"    - {rate['job_classification']}: ${rate['base_rate']:.2f}/{rate['rate_type']}")

    # Save cleaned data
    cleaned_file = BASE_DIR / "extracted_rates" / "cleaned_rates.json"
    with open(cleaned_file, 'w') as f:
        json.dump({
            'cleaned_at': datetime.now().isoformat(),
            'total_rates': len(clean_rates_list),
            'rates': clean_rates_list,
        }, f, indent=2)
    print(f"\nCleaned rates saved to: {cleaned_file}")

    # Connect to database
    print("\n" + "=" * 60)
    print("UPLOADING TO DATABASE")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected to database successfully")

        # Get current count
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rate_cards")
        before_count = cursor.fetchone()[0]
        print(f"Current rate cards in database: {before_count}")
        cursor.close()

        # Upload
        print("\nUploading rates...")
        inserted, skipped = upload_to_database(clean_rates_list, conn)

        # Get new count
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rate_cards")
        after_count = cursor.fetchone()[0]
        cursor.close()

        conn.close()

        print(f"\n{'=' * 60}")
        print("UPLOAD COMPLETE")
        print(f"{'=' * 60}")
        print(f"Inserted: {inserted}")
        print(f"Skipped (duplicates): {skipped}")
        print(f"Rate cards before: {before_count}")
        print(f"Rate cards after: {after_count}")
        print(f"Net added: {after_count - before_count}")

    except Exception as e:
        print(f"Database error: {e}")
        raise

if __name__ == "__main__":
    main()
