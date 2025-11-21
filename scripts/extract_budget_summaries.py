#!/usr/bin/env python3
"""
Extract summary data from all production budget PDFs.
Extracts only page 1 (summary page) to avoid size issues.
Outputs CSV with: Location, Version, Grand_Total, ATL, BTL, Other, Tax_Credit, Net_Cost
"""

import os
import re
import csv
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    os.system("pip3 install pdfplumber")
    import pdfplumber


def extract_budget_summary(pdf_path):
    """Extract key financial data from budget PDF first page."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Extract only first page text
            first_page = pdf.pages[0]
            text = first_page.extract_text()

            # Parse location from filename
            filename = os.path.basename(pdf_path)
            location = extract_location_from_filename(filename)

            # Extract financial data using exact Movie Magic Budget patterns
            # Try multiple patterns as different budgets use different formats
            grand_total = (
                extract_amount(text, r'GrandTotal') or
                extract_amount(text, r'TotalAboveandBelow-The-Line')
            )

            atl_total = extract_amount(text, r'TotalAbove-The-Line')
            btl_total = extract_amount(text, r'TotalBelow-The-Line')
            other_total = extract_amount(text, r'TotalOther')
            production_total = (
                extract_amount(text, r'TotalProduction') or
                extract_amount(text, r'TotalBelow-The-LineProduction')
            )
            post_total = (
                extract_amount(text, r'TotalPostProduction') or
                extract_amount(text, r'TotalBelow-The-LineOther')
            )

            data = {
                'filename': filename,
                'location': location,
                'grand_total': grand_total,
                'atl_total': atl_total,
                'btl_total': btl_total,
                'other_total': other_total,
                'production_total': production_total,
                'post_total': post_total,
            }

            return data

    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return None


def extract_location_from_filename(filename):
    """Extract location name from filename."""
    # Remove file extension
    name = filename.replace('.pdf', '').replace('.PDF', '')

    # Location mapping (code -> full name)
    location_map = {
        'ATL': 'Atlanta',
        'BOS': 'Boston',
        'CHA': 'Charleston, SC',
        'CHI': 'Chicago',
        'LA': 'Los Angeles',
        'MTL': 'Montréal',
        'NOLA': 'New Orleans',
        'NY': 'New York',
        'PIT': 'Pittsburgh',
        'Portland': 'Portland, OR',
        'Santa Fe': 'Santa Fe, NM',
        'TOR': 'Toronto',
        'VAN': 'Vancouver',
        'WIL': 'Wilmington, NC',
    }

    # Check for location codes first (e.g., "Cable ATL", "One Hour Pilot VAN")
    for code, full_name in location_map.items():
        if f' {code} ' in name or name.endswith(f' {code}') or name.startswith(f'{code} '):
            return full_name

    # Check for full location names in the path or filename
    for code, full_name in location_map.items():
        if full_name.lower() in name.lower():
            return full_name

    return 'Unknown'


def extract_amount(text, pattern):
    """Extract dollar amount following a pattern."""
    try:
        # Look for pattern followed by dollar amount (with or without commas)
        # Movie Magic budgets use format: "TotalAbove-The-Line $348,583 $348,583 $0"
        regex = rf'{pattern}\s+\$\s*([\d,]+)'
        match = re.search(regex, text, re.IGNORECASE)

        if match:
            # Clean up the amount (remove commas, convert to float)
            amount_str = match.group(1).replace(',', '')
            return float(amount_str)

        return None

    except Exception as e:
        return None


def main():
    # Find all budget PDFs
    budgets_dir = Path.home() / 'Documents' / 'budgets'
    pdf_files = list(budgets_dir.rglob('*.pdf'))

    # Filter to only production budgets (exclude guild agreements, manuals, etc.)
    production_budgets = [
        f for f in pdf_files
        if any(keyword in f.name for keyword in ['2021', 'Pilot', 'Cable', 'Multicam', 'One Hour'])
    ]

    print(f"Found {len(pdf_files)} total PDFs")
    print(f"Filtered to {len(production_budgets)} production budgets")
    print("Extracting summary data from each...\n")

    results = []

    for idx, pdf_path in enumerate(production_budgets, 1):
        print(f"[{idx}/{len(production_budgets)}] Processing: {pdf_path.name}")

        data = extract_budget_summary(pdf_path)
        if data and data.get('grand_total'):  # Only include if we found budget data
            results.append(data)

    # Write results to CSV
    output_file = '/Users/anthonyvazquez/ai-budget-system/database/budget_summaries.csv'

    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = ['filename', 'location', 'grand_total', 'atl_total',
                     'btl_total', 'other_total', 'production_total', 'post_total']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for row in results:
            writer.writerow(row)

    print(f"\n✅ Extracted data from {len(results)} budgets")
    print(f"📊 Output saved to: {output_file}")

    # Print summary statistics
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)

    # Group by location
    by_location = {}
    for r in results:
        loc = r['location']
        if loc not in by_location:
            by_location[loc] = []
        by_location[loc].append(r)

    print(f"\nLocations analyzed: {len(by_location)}")
    for loc, budgets in sorted(by_location.items()):
        print(f"  {loc}: {len(budgets)} budget versions")

    # Calculate averages
    totals = [r['grand_total'] for r in results if r['grand_total']]
    if totals:
        avg_budget = sum(totals) / len(totals)
        print(f"\nAverage Budget: ${avg_budget:,.2f}")
        print(f"Min Budget: ${min(totals):,.2f}")
        print(f"Max Budget: ${max(totals):,.2f}")


if __name__ == '__main__':
    main()
