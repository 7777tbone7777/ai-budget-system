#!/usr/bin/env python3
"""
Test extraction on a single budget PDF.
"""

import sys
sys.path.insert(0, '/Users/anthonyvazquez/ai-budget-system/scripts')

from extract_full_budgets import process_budget_pdf, save_budget_json
from pathlib import Path
import json

def main():
    # Test on single PDF
    pdf_path = Path('/Users/anthonyvazquez/Documents/budgets/2021 Pilot - 1Hr/Atlanta/Ver 01/2021 Cable ATL One Hour Pilot v01.pdf')
    output_dir = Path('/Users/anthonyvazquez/ai-budget-system/database/budget_templates')
    output_dir.mkdir(parents=True, exist_ok=True)

    print("="*70)
    print("TESTING SINGLE PDF EXTRACTION")
    print("="*70)
    print(f"\nPDF: {pdf_path.name}\n")

    # Process
    budget_data = process_budget_pdf(pdf_path)

    # Print results
    print("\n" + "="*70)
    print("METADATA")
    print("="*70)
    for key, value in budget_data['metadata'].items():
        print(f"  {key}: {value}")

    print("\n" + "="*70)
    print("EXTRACTION STATS")
    print("="*70)
    for key, value in budget_data['extraction_stats'].items():
        print(f"  {key}: {value}")

    print("\n" + "="*70)
    print("DEPARTMENTS")
    print("="*70)

    for dept in budget_data['departments'][:5]:  # Show first 5
        print(f"\n{dept['account']} - {dept['name']}")
        print(f"  Total: ${dept['total']:,.2f}" if dept['total'] else "  Total: N/A")
        print(f"  Line items: {len(dept['line_items'])}")

        # Show first 3 line items
        for item in dept['line_items'][:3]:
            desc = item.get('description', 'N/A')[:40] if item.get('description') else 'N/A'
            acct = item.get('account', 'N/A') or 'N/A'
            subt = item.get('subtotal', 0) or 0
            print(f"    - {acct:6} {desc:40} ${subt:>10,.0f}")

            if item.get('periods'):
                print(f"      Periods: {', '.join(item['periods'].keys())}")

    # Save JSON
    if budget_data['departments']:
        json_path = save_budget_json(budget_data, output_dir)
        print(f"\n✓ Saved to: {json_path}")

        # Show sample of JSON structure
        print("\n" + "="*70)
        print("SAMPLE JSON OUTPUT (first department)")
        print("="*70)
        if budget_data['departments']:
            sample = {
                'metadata': budget_data['metadata'],
                'sample_department': budget_data['departments'][0]
            }
            print(json.dumps(sample, indent=2)[:2000])
            print("\n... (truncated)")

if __name__ == '__main__':
    main()
