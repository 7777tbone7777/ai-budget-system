#!/usr/bin/env python3
"""
Phase 2: Extract rate card data from union contract text files.
Uses regex patterns to extract structured rate data.
No AI/API calls - pure pattern matching for structured documents.
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
TEXT_DIR = BASE_DIR / "extracted_text"
OUTPUT_DIR = BASE_DIR / "extracted_rates"

# Common rate patterns
RATE_PATTERNS = [
    # Pattern: "Job Title $1,234.56" or "Job Title 1234.56"
    r'(?P<job>[A-Za-z][A-Za-z\s,/\-\.]+?)\s+\$?(?P<rate>\d{1,2},?\d{3}(?:\.\d{2})?)',
    # Pattern: "1234 Job Title $1,234.56" (occupation codes)
    r'(?P<code>\d{4})\s+(?P<job>[A-Za-z][A-Za-z\s,/\-\.]+?)\s+\$?(?P<rate>\d{1,2},?\d{3}(?:\.\d{2})?)',
    # Pattern: hourly rates "Job Title 45.67/hr" or "Job Title (hourly) 45.67"
    r'(?P<job>[A-Za-z][A-Za-z\s,/\-\.]+?)\s*(?:\(hourly\))?\s+\$?(?P<rate>\d{2,3}\.\d{2})',
]

# Job classification keywords to identify rate lines
JOB_KEYWORDS = [
    'director', 'designer', 'technician', 'supervisor', 'assistant', 'editor',
    'operator', 'mixer', 'engineer', 'coordinator', 'manager', 'foreman',
    'chief', 'gaffer', 'grip', 'electrician', 'programmer', 'artist',
    'painter', 'carpenter', 'prop', 'set', 'wardrobe', 'makeup', 'hair',
    'sound', 'camera', 'script', 'accountant', 'driver', 'teamster',
    'consultant', 'illustrator', 'draftsperson', 'trainee', 'journeyman',
    'entry level', 'best boy', 'key', 'lead', 'senior', 'junior',
]

def clean_rate(rate_str: str) -> float:
    """Convert rate string to float."""
    return float(rate_str.replace(',', '').replace('$', ''))

def extract_effective_dates(text: str) -> list:
    """Extract effective date ranges from text."""
    date_patterns = [
        r'(\d{1,2}/\d{1,2}/\d{2,4})\s*(?:to|through|-)\s*(\d{1,2}/\d{1,2}/\d{2,4})',
        r'effective[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})',
        r'commencing[:\s]+(?:with\s+)?(\w+\s+\d{1,2},?\s*\d{4})',
    ]
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    return dates[:5]  # Return first 5 matches

def extract_union_info(filename: str, text: str) -> dict:
    """Extract union local information from filename and text."""
    info = {
        'union_local': 'Unknown',
        'craft': 'Unknown',
    }

    # From filename
    if 'Local_700' in filename or 'Editors' in filename:
        info['union_local'] = 'IATSE Local 700'
        info['craft'] = 'Editors'
    elif 'Local_728' in filename or 'Lighting' in filename:
        info['union_local'] = 'IATSE Local 728'
        info['craft'] = 'Lighting Technicians'
    elif 'Local_800' in filename or 'Art_Director' in filename:
        info['union_local'] = 'IATSE Local 800'
        info['craft'] = 'Art Directors'
    elif 'Local_695' in filename or 'Sound' in filename:
        info['union_local'] = 'IATSE Local 695'
        info['craft'] = 'Production Sound'
    elif 'Local_798' in filename or 'Makeup' in filename:
        info['union_local'] = 'IATSE Local 798'
        info['craft'] = 'Makeup & Hair Stylists'
    elif 'Local_871' in filename or 'Script' in filename:
        info['union_local'] = 'IATSE Local 871'
        info['craft'] = 'Script Supervisors'
    elif 'Local_892' in filename or 'Costume' in filename:
        info['union_local'] = 'IATSE Local 892'
        info['craft'] = 'Costume Designers'
    elif 'Local_52' in filename:
        info['union_local'] = 'IATSE Local 52'
        info['craft'] = 'Studio Mechanics (NYC)'
    elif 'SAG-AFTRA' in filename:
        info['union_local'] = 'SAG-AFTRA'
        info['craft'] = 'Actors'
    elif 'Teamsters' in filename or '399' in filename:
        info['union_local'] = 'Teamsters Local 399'
        info['craft'] = 'Drivers/Transportation'

    return info

def extract_rates_from_text(text: str, source_file: str) -> list:
    """Extract rate card entries from text content."""
    rates = []
    lines = text.split('\n')

    union_info = extract_union_info(source_file, text)
    effective_dates = extract_effective_dates(text)

    # Track current section context
    current_section = ""
    current_period = ""

    for i, line in enumerate(lines):
        line = line.strip()

        # Skip empty lines and headers
        if not line or len(line) < 5:
            continue

        # Check for section headers (wage schedules, rate types)
        if 'wage schedule' in line.lower() or 'rate schedule' in line.lower():
            current_section = line[:100]
            continue

        if re.search(r'\d{1,2}/\d{1,2}/\d{2,4}\s*[-to]+\s*\d{1,2}/\d{1,2}/\d{2,4}', line):
            current_period = line[:50]
            continue

        # Look for rate lines - must have job keyword AND dollar amount
        has_job_keyword = any(kw in line.lower() for kw in JOB_KEYWORDS)
        has_dollar = re.search(r'\$?\d{1,2},?\d{3}(?:\.\d{2})?', line)

        if has_job_keyword and has_dollar:
            # Try to parse the rate line
            # Pattern: Code Job Title $Rate or Job Title $Rate
            match = re.search(
                r'(?:(\d{4})\s+)?([A-Za-z][A-Za-z\s,/\-\.\']+?)\s+\$?(\d{1,2},?\d{3}(?:\.\d{2})?)',
                line
            )

            if match:
                occ_code = match.group(1) or ""
                job_title = match.group(2).strip()
                rate = clean_rate(match.group(3))

                # Determine rate type (weekly vs hourly)
                rate_type = "weekly"
                if rate < 500 or 'hourly' in line.lower() or '/hr' in line.lower():
                    rate_type = "hourly"

                # Skip if job title is too short or just numbers
                if len(job_title) < 3 or job_title.isdigit():
                    continue

                rate_entry = {
                    'union_local': union_info['union_local'],
                    'craft': union_info['craft'],
                    'job_classification': job_title,
                    'occupation_code': occ_code,
                    'base_rate': rate,
                    'rate_type': rate_type,
                    'effective_period': current_period or (effective_dates[0] if effective_dates else ""),
                    'section': current_section,
                    'source_file': source_file,
                }
                rates.append(rate_entry)

    return rates

def process_text_file(txt_path: Path) -> list:
    """Process a single text file and extract rates."""
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    rates = extract_rates_from_text(content, txt_path.name)
    return rates

def deduplicate_rates(rates: list) -> list:
    """Remove duplicate rate entries."""
    seen = set()
    unique = []

    for rate in rates:
        key = (
            rate['union_local'],
            rate['job_classification'],
            rate['base_rate'],
            rate['rate_type'],
        )
        if key not in seen:
            seen.add(key)
            unique.append(rate)

    return unique

def main():
    print("=" * 60)
    print("UNION CONTRACT RATE EXTRACTION")
    print("=" * 60)
    print(f"\nSource: {TEXT_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")

    OUTPUT_DIR.mkdir(exist_ok=True)

    all_rates = []
    files_processed = 0

    # Process each text file
    for txt_file in sorted(TEXT_DIR.rglob("*.txt")):
        rel_path = txt_file.relative_to(TEXT_DIR)
        print(f"[PROCESS] {rel_path}...", end=" ", flush=True)

        rates = process_text_file(txt_file)
        all_rates.extend(rates)
        files_processed += 1

        print(f"found {len(rates)} rates")

    # Deduplicate
    unique_rates = deduplicate_rates(all_rates)

    print(f"\n{'=' * 60}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Files processed: {files_processed}")
    print(f"Total rates found: {len(all_rates)}")
    print(f"Unique rates: {len(unique_rates)}")

    # Save all rates to JSON
    output_file = OUTPUT_DIR / "all_rates.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'extracted_at': datetime.now().isoformat(),
            'total_files': files_processed,
            'total_rates': len(unique_rates),
            'rates': unique_rates,
        }, f, indent=2)

    print(f"\nSaved to: {output_file}")

    # Group by union and save separate files
    by_union = {}
    for rate in unique_rates:
        union = rate['union_local']
        if union not in by_union:
            by_union[union] = []
        by_union[union].append(rate)

    print("\nRates by union:")
    for union, rates in sorted(by_union.items()):
        print(f"  {union}: {len(rates)} rates")

        # Save union-specific file
        union_file = OUTPUT_DIR / f"{union.replace(' ', '_').replace('/', '_')}.json"
        with open(union_file, 'w', encoding='utf-8') as f:
            json.dump({
                'union_local': union,
                'rate_count': len(rates),
                'rates': rates,
            }, f, indent=2)

    print(f"\nUnion-specific files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
