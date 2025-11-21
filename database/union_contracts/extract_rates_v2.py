#!/usr/bin/env python3
"""
Phase 2 v2: Improved rate extraction with multi-line job title handling.
Fixes truncation issues where experience levels appear on separate lines.
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
TEXT_DIR = BASE_DIR / "extracted_text"
OUTPUT_DIR = BASE_DIR / "extracted_rates"

# Experience level patterns (these often appear on separate lines)
EXPERIENCE_PATTERNS = [
    r'^\s*(?:1st|2nd|3rd|4th|5th)\s+\d+\s*(?:months?|mos\.?)',
    r'^\s*(?:first|second|third)\s+\d+\s*(?:months?|mos\.?)',
    r'^\s*thereafter\s*$',
    r'^\s*[\w\-]+\s*$',  # Schedule codes like "Z-5a", "Z-10c"
]

# Job keywords to identify rate lines
JOB_KEYWORDS = [
    'director', 'designer', 'technician', 'supervisor', 'assistant', 'editor',
    'operator', 'mixer', 'engineer', 'coordinator', 'manager', 'foreman',
    'chief', 'gaffer', 'grip', 'electrician', 'programmer', 'artist',
    'painter', 'carpenter', 'prop', 'set', 'wardrobe', 'makeup', 'hair',
    'sound', 'camera', 'script', 'accountant', 'driver', 'teamster',
    'consultant', 'illustrator', 'draftsperson', 'trainee', 'journeyman',
    'entry level', 'best boy', 'key', 'lead', 'senior', 'junior',
    'foley', 'librarian', 'apprentice', 'montage', 'serial', 'shorts',
    'trailer', 'effects', 'music', 'film', 'head', 'supervising',
    # Local 44 Props specific
    'maker', 'decorator', 'upholsterer', 'draper', 'greens', 'sewing',
    'floor coverer', 'powder', 'property', 'gang boss', 'foreperson',
    # Local 80 Grips specific
    'rigging', 'dolly', 'crane',
    # Local 600 Camera specific
    'loader', 'dit', 'still photographer', 'portrait',
]

def clean_rate(rate_str: str) -> float:
    """Convert rate string to float."""
    return float(rate_str.replace(',', '').replace('$', ''))

def extract_union_info(filepath: str, text: str) -> dict:
    """Extract union local information from filepath (including directory) and text."""
    info = {'union_local': 'Unknown', 'craft': 'Unknown'}

    # Simple patterns - just check if string is in path
    if 'Local_44' in filepath or 'Props' in filepath:
        info['union_local'] = 'IATSE Local 44'
        info['craft'] = 'Property Craftspersons'
    elif 'Local_80' in filepath and 'Grip' in filepath:
        info['union_local'] = 'IATSE Local 80'
        info['craft'] = 'Grips'
    elif 'Local_600' in filepath or 'Camera' in filepath:
        info['union_local'] = 'IATSE Local 600'
        info['craft'] = 'Camera'
    elif 'Local_700' in filepath or 'Editors' in filepath:
        info['union_local'] = 'IATSE Local 700'
        info['craft'] = 'Editors'
    elif 'Local_728' in filepath or 'Lighting' in filepath:
        info['union_local'] = 'IATSE Local 728'
        info['craft'] = 'Lighting Technicians'
    elif 'Local_800' in filepath or 'Art_Director' in filepath:
        info['union_local'] = 'IATSE Local 800'
        info['craft'] = 'Art Directors'
    elif 'Local_695' in filepath or 'Sound' in filepath:
        info['union_local'] = 'IATSE Local 695'
        info['craft'] = 'Production Sound'
    elif 'Local_798' in filepath or 'Makeup' in filepath:
        info['union_local'] = 'IATSE Local 798'
        info['craft'] = 'Makeup & Hair Stylists'
    elif 'Local_871' in filepath or 'Script' in filepath:
        info['union_local'] = 'IATSE Local 871'
        info['craft'] = 'Script Supervisors'
    elif 'Local_892' in filepath or 'Costume' in filepath:
        info['union_local'] = 'IATSE Local 892'
        info['craft'] = 'Costume Designers'
    elif 'Local_52' in filepath:
        info['union_local'] = 'IATSE Local 52'
        info['craft'] = 'Studio Mechanics (NYC)'
    elif 'SAG-AFTRA' in filepath or 'SAG_AFTRA' in filepath:
        info['union_local'] = 'SAG-AFTRA'
        info['craft'] = 'Actors'
    elif 'Teamsters' in filepath or '399' in filepath:
        info['union_local'] = 'Teamsters Local 399'
        info['craft'] = 'Drivers/Transportation'
    elif 'WGA' in filepath:
        info['union_local'] = 'WGA'
        info['craft'] = 'Writers'
    elif 'IATSE_Basic' in filepath:
        info['union_local'] = 'IATSE'
        info['craft'] = 'Multiple Crafts'

    return info

def is_experience_continuation(line: str) -> tuple:
    """
    Check if a line is an experience level continuation.
    Returns (is_continuation, experience_text, schedule_code)
    """
    line = line.strip()
    if not line or len(line) > 50:
        return False, None, None

    # Pattern: "1st 6 months Z-5a" or "thereafter Z-5c"
    match = re.match(r'^((?:1st|2nd|3rd|4th|5th)\s+\d+\s*(?:months?|mos\.?)|thereafter)\s*(\w[\w\-]*)?$', line, re.IGNORECASE)
    if match:
        exp_text = match.group(1).strip()
        schedule_code = match.group(2) or ""
        return True, exp_text, schedule_code

    # Pattern: just a schedule code "Z-5a"
    if re.match(r'^Z-\d+[a-z]*$', line):
        return True, None, line

    return False, None, None

def extract_rate_line(line: str) -> dict:
    """
    Extract rate information from a single line.
    Returns dict with job_title, occ_code, rates, etc.
    """
    # Pattern: OccCode JobTitle $Rate1 $Rate2... or JobTitle $Rate
    # Handle multiple rate columns

    # Pattern 1: "4121 Motion Picture Editor2 Z-1 $71.00 $65.55 $3,185.73 $4,014.30"
    # Also handles Local 44 format with space: "7300 Prop Maker Foreman $ 57.43 $ 3,068.62"
    match = re.match(
        r'^(\d{4})?\s*([A-Za-z][A-Za-z\s,/\-\.\'\(\)]+?)\s*'
        r'(?:Z-\d+[a-z]*)?\s*'
        r'\$\s*([\d,]+(?:\.\d{2})?)'
        r'(?:\s+\$\s*([\d,]+(?:\.\d{2})?))?'
        r'(?:\s+\$\s*([\d,]+(?:\.\d{2})?))?'
        r'(?:\s+\$\s*([\d,]+(?:\.\d{2})?))?',
        line
    )

    if not match:
        return None

    occ_code = match.group(1) or ""
    job_title = match.group(2).strip()

    # Clean up job title - remove trailing numbers/letters that are actually schedule refs
    job_title = re.sub(r'\d+\s*$', '', job_title).strip()
    job_title = re.sub(r'\s+Z-\d+[a-z]*$', '', job_title).strip()

    # Collect all rate values found
    rates = []
    for i in range(3, 7):
        grp = match.group(i)
        if grp and grp.strip() and re.match(r'^[\d,\.]+$', grp.replace('$', '')):
            try:
                rates.append(clean_rate(grp))
            except ValueError:
                continue

    if not rates:
        return None

    # Determine primary rate (usually the weekly guarantee, largest value)
    primary_rate = max(rates)

    # Determine rate type
    rate_type = "weekly"
    if primary_rate < 500:
        rate_type = "hourly"

    return {
        'occ_code': occ_code,
        'job_title': job_title,
        'rate': primary_rate,
        'all_rates': rates,
        'rate_type': rate_type,
    }

def extract_rates_from_text(text: str, source_file: str) -> list:
    """Extract rate card entries from text content with multi-line handling."""
    rates = []
    lines = text.split('\n')

    union_info = extract_union_info(source_file, text)

    # Track current context
    current_period = ""
    pending_rate = None  # Rate that might need experience continuation

    for i, line in enumerate(lines):
        line_stripped = line.strip()

        # Skip empty lines and page markers
        if not line_stripped or line_stripped.startswith('---') or 'PAGE' in line_stripped:
            continue

        # Skip header lines
        if 'printed on' in line_stripped.lower() or 'schedule' in line_stripped.lower() and len(line_stripped) < 30:
            continue

        # Check for date periods
        period_match = re.search(r'(\d{1,2}/\d{1,2}/\d{2,4})\s*[-to]+\s*(\d{1,2}/\d{1,2}/\d{2,4})', line_stripped)
        if period_match:
            current_period = f"{period_match.group(1)}-{period_match.group(2)}"
            continue

        # Check if this line is an experience continuation
        is_continuation, exp_text, schedule_code = is_experience_continuation(line_stripped)

        if is_continuation and pending_rate and exp_text:
            # Combine with pending rate
            combined_title = f"{pending_rate['job_title']}, {exp_text}"
            rate_entry = {
                'union_local': union_info['union_local'],
                'craft': union_info['craft'],
                'job_classification': combined_title,
                'occupation_code': pending_rate['occ_code'],
                'base_rate': pending_rate['rate'],
                'rate_type': pending_rate['rate_type'],
                'effective_period': current_period,
                'source_file': source_file,
            }
            rates.append(rate_entry)
            pending_rate = None
            continue
        elif is_continuation:
            # Just a schedule code or incomplete continuation - skip
            continue

        # Check if this is a rate line
        has_job_keyword = any(kw in line_stripped.lower() for kw in JOB_KEYWORDS)
        # Match rates like "$57.43" or "$ 57.43" or "$3,068.62" or "$ 3,068.62"
        has_dollar = re.search(r'\$\s*\d+(?:,\d{3})*(?:\.\d{2})?', line_stripped)

        if has_job_keyword and has_dollar:
            # If we have a pending rate without continuation, save it as-is
            if pending_rate:
                rate_entry = {
                    'union_local': union_info['union_local'],
                    'craft': union_info['craft'],
                    'job_classification': pending_rate['job_title'],
                    'occupation_code': pending_rate['occ_code'],
                    'base_rate': pending_rate['rate'],
                    'rate_type': pending_rate['rate_type'],
                    'effective_period': current_period,
                    'source_file': source_file,
                }
                rates.append(rate_entry)

            # Parse this line
            parsed = extract_rate_line(line_stripped)
            if parsed and len(parsed['job_title']) >= 3 and is_valid_job_title(parsed['job_title']):
                # Check if next line might be experience continuation
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                next_is_cont, _, _ = is_experience_continuation(next_line)

                if next_is_cont:
                    # Save as pending, wait for continuation
                    pending_rate = parsed
                else:
                    # Save immediately
                    rate_entry = {
                        'union_local': union_info['union_local'],
                        'craft': union_info['craft'],
                        'job_classification': parsed['job_title'],
                        'occupation_code': parsed['occ_code'],
                        'base_rate': parsed['rate'],
                        'rate_type': parsed['rate_type'],
                        'effective_period': current_period,
                        'source_file': source_file,
                    }
                    rates.append(rate_entry)
                    pending_rate = None

    # Don't forget the last pending rate
    if pending_rate:
        rate_entry = {
            'union_local': union_info['union_local'],
            'craft': union_info['craft'],
            'job_classification': pending_rate['job_title'],
            'occupation_code': pending_rate['occ_code'],
            'base_rate': pending_rate['rate'],
            'rate_type': pending_rate['rate_type'],
            'effective_period': current_period,
            'source_file': source_file,
        }
        rates.append(rate_entry)

    return rates

def is_valid_job_title(title: str) -> bool:
    """Check if a job title is valid (not garbage)."""
    if not title or len(title) < 5:
        return False

    # Must start with a capital letter
    if not title[0].isupper():
        return False

    # Filter out sentence fragments and garbage
    garbage_patterns = [
        r'^and\s',
        r'^or\s',
        r'^the\s',
        r'^a\s+',
        r'^at\s',
        r'^in\s',
        r'^of\s',
        r'^to\s',
        r'^for\s',
        r'^with\s',
        r'^that\s',
        r'^which\s',
        r'^shall\s',
        r'^Productions?\s+LLC',
        r'^Salary\s+of',
        r'^Alliance\s+of',
        r'^Article\s+',
        r'^Section\s+',
        r'^Commences\s+On',
        r'^set\s+forth',
        r'^does\s+not',
        r'^Artists?\s+and\s+the',
        r'SVOD|AVOD|FAST|HB\s',
        r'pursuant\s+to',
        r'accordance\s+with',
        r'\d{4}-\d{2,4}',  # Year ranges
    ]

    for pattern in garbage_patterns:
        if re.search(pattern, title, re.IGNORECASE):
            return False

    # Should contain at least one job-related keyword
    has_job_word = any(kw in title.lower() for kw in JOB_KEYWORDS)
    if not has_job_word:
        return False

    return True

def process_text_file(txt_path: Path) -> list:
    """Process a single text file and extract rates."""
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Pass full path including parent directory
    return extract_rates_from_text(content, str(txt_path))

def deduplicate_rates(rates: list) -> list:
    """Remove exact duplicate rate entries."""
    seen = {}

    for rate in rates:
        # Include base_rate in key to preserve different rate tiers
        key = (
            rate['union_local'],
            rate['job_classification'],
            rate['rate_type'],
            rate['base_rate'],
        )

        # Only skip exact duplicates
        if key not in seen:
            seen[key] = rate

    return list(seen.values())

def main():
    print("=" * 60)
    print("UNION CONTRACT RATE EXTRACTION v2")
    print("(with multi-line job title handling)")
    print("=" * 60)
    print(f"\nSource: {TEXT_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")

    OUTPUT_DIR.mkdir(exist_ok=True)

    all_rates = []
    files_processed = 0

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
    print("EXTRACTION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Files processed: {files_processed}")
    print(f"Total rates found: {len(all_rates)}")
    print(f"Unique rates (deduplicated): {len(unique_rates)}")

    # Save all rates
    output_file = OUTPUT_DIR / "all_rates_v2.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'extracted_at': datetime.now().isoformat(),
            'version': 2,
            'total_files': files_processed,
            'total_rates': len(unique_rates),
            'rates': unique_rates,
        }, f, indent=2)

    print(f"\nSaved to: {output_file}")

    # Group by union
    by_union = {}
    for rate in unique_rates:
        union = rate['union_local']
        if union not in by_union:
            by_union[union] = []
        by_union[union].append(rate)

    print("\nRates by union:")
    for union, rates in sorted(by_union.items()):
        print(f"  {union}: {len(rates)} rates")
        # Show sample with experience levels
        for rate in rates[:2]:
            print(f"    - {rate['job_classification']}: ${rate['base_rate']:.2f}/{rate['rate_type']}")

if __name__ == "__main__":
    main()
