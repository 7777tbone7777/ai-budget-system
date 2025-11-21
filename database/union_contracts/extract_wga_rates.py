#!/usr/bin/env python3
"""
WGA Schedule of Minimums Rate Extractor
Extracts writer compensation minimums from WGA PDF text.
"""

import re
import json
import psycopg2
import uuid
import os
from pathlib import Path
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

BASE_DIR = Path(__file__).parent
WGA_TEXT_FILE = BASE_DIR / "extracted_text" / "WGA" / "WGA_2023_Schedule_of_Minimums_Full.txt"

def clean_rate(rate_str: str) -> float:
    """Convert rate string to float."""
    rate_str = rate_str.replace(',', '').replace('$', '').strip()
    return float(rate_str)

def extract_wga_rates(text: str) -> list:
    """Extract WGA writer rates from text."""
    rates = []
    lines = text.split('\n')

    # Pattern for rates like "$138,756" or "$ 143,612"
    rate_pattern = re.compile(r'\$\s*([\d,]+(?:\.\d{2})?)')

    # Key rate categories to extract
    categories = {
        'Screenplay, Including Treatment (High Budget)': None,
        'Non-Original Screenplay (High Budget)': None,
        'Story Only (High Budget)': None,
        'First Draft Screenplay (High Budget)': None,
        'Final Draft Screenplay (High Budget)': None,
        'Screenplay (Low Budget)': None,
        'Story & Teleplay (Network Prime Time)': None,
        'Teleplay Only (Network Prime Time)': None,
        'Story Only (Network Prime Time)': None,
        'Week-to-Week Staff Writer': None,
        '14 Out of 14 Weeks Staff Writer': None,
        'Staff Writer (40 Weeks)': None,
    }

    current_section = ""

    for i, line in enumerate(lines):
        line_stripped = line.strip()

        # Track sections
        if 'HIGH BUDGET' in line.upper():
            current_section = "High Budget"
        elif 'LOW BUDGET' in line.upper():
            current_section = "Low Budget"
        elif 'NETWORK PRIME TIME' in line.upper():
            current_section = "Network Prime Time"
        elif 'STAFF WRITER' in line.upper() and 'WEEK' in line.upper():
            current_section = "Staff Writer"

        # Look for specific rate lines
        # Pattern: "A.     Original Screenplay, Including Treatment              $186,418          $ 192,943         $ 198,712"

        if 'Original Screenplay' in line and 'Treatment' in line:
            rates_found = rate_pattern.findall(line)
            if rates_found:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Screenplay, Including Treatment ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),  # Latest year
                    'effective_date': '2025-05-02',
                })

        elif 'Non-Original Screenplay' in line:
            rates_found = rate_pattern.findall(line)
            if rates_found:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Non-Original Screenplay ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif re.search(r'First\s+Draft\s+Screenplay', line):
            rates_found = rate_pattern.findall(line)
            if rates_found and len(rates_found) >= 1:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'First Draft Screenplay ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif re.search(r'Final\s+Draft\s+Screenplay', line):
            rates_found = rate_pattern.findall(line)
            if rates_found and len(rates_found) >= 1:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Final Draft Screenplay ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif 'Story Only' in line and 'Teleplay' not in line:
            rates_found = rate_pattern.findall(line)
            if rates_found and len(rates_found) >= 1:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Story Only ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif 'Story & Teleplay' in line or 'Story and Teleplay' in line:
            rates_found = rate_pattern.findall(line)
            if rates_found and len(rates_found) >= 1:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Story & Teleplay ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif 'Teleplay Only' in line:
            rates_found = rate_pattern.findall(line)
            if rates_found and len(rates_found) >= 1:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Teleplay Only ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        # Staff Writer weekly rates
        elif 'Week-to-Week' in line and rate_pattern.search(line):
            rates_found = rate_pattern.findall(line)
            if rates_found:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': 'Staff Writer (Week-to-Week)',
                    'rate_type': 'weekly',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif re.search(r'14\s+out\s+of\s+14', line, re.IGNORECASE) and rate_pattern.search(line):
            rates_found = rate_pattern.findall(line)
            if rates_found:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': 'Staff Writer (14 out of 14 Weeks)',
                    'rate_type': 'weekly',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif re.search(r'40\s+(?:out\s+of\s+)?(?:52\s+)?[Ww]eeks', line) and rate_pattern.search(line):
            rates_found = rate_pattern.findall(line)
            if rates_found:
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': 'Staff Writer (40 Weeks Term)',
                    'rate_type': 'weekly',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        # Rewrite/Polish
        elif 'Rewrite' in line and 'Polish' not in line and rate_pattern.search(line):
            rates_found = rate_pattern.findall(line)
            if rates_found and clean_rate(rates_found[-1]) > 1000:  # Filter noise
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Rewrite ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

        elif 'Polish' in line and rate_pattern.search(line):
            rates_found = rate_pattern.findall(line)
            if rates_found and clean_rate(rates_found[-1]) > 1000:  # Filter noise
                rates.append({
                    'union_local': 'WGA',
                    'job_classification': f'Polish ({current_section})',
                    'rate_type': 'flat',
                    'base_rate': clean_rate(rates_found[-1]),
                    'effective_date': '2025-05-02',
                })

    return rates

def deduplicate_rates(rates: list) -> list:
    """Remove exact duplicates."""
    seen = set()
    unique = []
    for rate in rates:
        key = (rate['union_local'], rate['job_classification'], rate['base_rate'])
        if key not in seen:
            seen.add(key)
            unique.append(rate)
    return unique

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
                AND base_rate = %s
                LIMIT 1
            """, (rate['union_local'], rate['job_classification'], rate['base_rate']))

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
                None,
                'theatrical',
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
    print("WGA SCHEDULE OF MINIMUMS EXTRACTION")
    print("=" * 60)

    # Read text file
    print(f"\nReading: {WGA_TEXT_FILE}")
    with open(WGA_TEXT_FILE, 'r') as f:
        text = f.read()

    print(f"Text length: {len(text)} characters")

    # Extract rates
    rates = extract_wga_rates(text)
    print(f"\nRaw rates extracted: {len(rates)}")

    # Deduplicate
    unique_rates = deduplicate_rates(rates)
    print(f"Unique rates: {len(unique_rates)}")

    # Show extracted rates
    print("\nExtracted WGA Rates:")
    for rate in unique_rates:
        print(f"  {rate['job_classification']}: ${rate['base_rate']:,.2f} ({rate['rate_type']})")

    # Save to JSON
    output_file = BASE_DIR / "extracted_rates" / "wga_rates.json"
    with open(output_file, 'w') as f:
        json.dump({
            'extracted_at': datetime.now().isoformat(),
            'source': str(WGA_TEXT_FILE),
            'total_rates': len(unique_rates),
            'rates': unique_rates,
        }, f, indent=2)
    print(f"\nSaved to: {output_file}")

    # Upload to database
    print("\n" + "=" * 60)
    print("UPLOADING TO DATABASE")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected to database")

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rate_cards WHERE union_local = 'WGA'")
        before_count = cursor.fetchone()[0]
        cursor.close()

        inserted, skipped = upload_to_database(unique_rates, conn)

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rate_cards WHERE union_local = 'WGA'")
        after_count = cursor.fetchone()[0]
        cursor.close()

        conn.close()

        print(f"\nWGA rates before: {before_count}")
        print(f"Inserted: {inserted}")
        print(f"Skipped (duplicates): {skipped}")
        print(f"WGA rates after: {after_count}")

    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    main()
