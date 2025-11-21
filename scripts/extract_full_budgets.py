#!/usr/bin/env python3
"""
Extract complete line item details from Movie Magic Budget PDFs.

This script processes Movie Magic Budget PDFs and extracts:
1. Budget metadata (location, type, totals)
2. Complete department/group structure
3. All line items with detailed breakdowns (prep/shoot/wrap periods)
4. Fringe calculations
5. Multi-period rate structures

Output: Individual JSON files per budget + summary CSV
"""

import os
import re
import json
import csv
from pathlib import Path
from typing import Dict, List, Any, Optional
from decimal import Decimal

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    os.system("pip3 install pdfplumber")
    import pdfplumber


def clean_amount(amount_str: str) -> Optional[float]:
    """Convert amount string to float, handling various formats."""
    if not amount_str:
        return None

    try:
        # Remove $, commas, parentheses, and whitespace
        cleaned = amount_str.replace('$', '').replace(',', '').replace('(', '-').replace(')', '').strip()
        if not cleaned or cleaned == '-':
            return None
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def extract_metadata(pdf) -> Dict[str, Any]:
    """Extract budget metadata from first 3 pages."""
    metadata = {
        'filename': '',
        'location': None,
        'production_type': None,
        'shoot_days': None,
        'shoot_dates': None,
        'total_budget': None,
        'atl_total': None,
        'btl_total': None,
        'other_total': None,
        'post_total': None,
        'production_total': None,
    }

    # Extract from first page
    if len(pdf.pages) > 0:
        text = pdf.pages[0].extract_text()

        # Location
        location_match = re.search(r'Location:\s*([^\n]+)', text)
        if location_match:
            metadata['location'] = location_match.group(1).strip()

        # Shoot days
        days_match = re.search(r'(\d+)\s*(?:Local\s*)?Location\s*Days', text, re.IGNORECASE)
        if days_match:
            metadata['shoot_days'] = int(days_match.group(1))

        # Shoot dates
        dates_match = re.search(r'Shoot\s*Dates?:\s*([^\n]+)', text, re.IGNORECASE)
        if dates_match:
            metadata['shoot_dates'] = dates_match.group(1).strip()

        # Production type from header
        if 'ONE HOUR' in text.upper():
            metadata['production_type'] = 'one_hour_pilot'
        elif 'HALF HOUR' in text.upper():
            metadata['production_type'] = 'half_hour_pilot'
        elif 'MULTI' in text.upper():
            metadata['production_type'] = 'multicam_pilot'

        # Extract totals from first page table
        tables = pdf.pages[0].extract_tables()
        if tables:
            for row in tables[0]:
                if row and len(row) >= 2:
                    desc = str(row[0]) if row[0] else ''
                    amount = str(row[-1]) if row[-1] else ''

                    if 'Above-The-Line' in desc or 'ATL' in desc:
                        if 'Total' in desc:
                            metadata['atl_total'] = clean_amount(amount)
                    elif 'Below-The-Line' in desc or 'BTL' in desc:
                        if 'Production' in desc:
                            metadata['production_total'] = clean_amount(amount)
                        elif 'Other' in desc or 'Post' in desc:
                            metadata['post_total'] = clean_amount(amount)
                        elif 'Total' in desc:
                            metadata['btl_total'] = clean_amount(amount)
                    elif 'Other' in desc and 'Total' in desc:
                        metadata['other_total'] = clean_amount(amount)

    # Get grand total from page 2
    if len(pdf.pages) > 1:
        tables = pdf.pages[1].extract_tables()
        if tables:
            for row in tables[0]:
                if row and 'Grand' in str(row[0]):
                    metadata['total_budget'] = clean_amount(str(row[-1]))

    return metadata


def parse_line_item(rows: List, start_idx: int) -> tuple[Optional[Dict], int]:
    """
    Parse a single line item from table rows.
    Movie Magic Budget format:
    - Row N: Account# | Description | (empty columns)
    - Row N+1: (empty) | Position/Name | Amt | Units | X | Rate | SubT | Total
    - Row N+2+: Periods or details

    Returns (line_item_dict, next_row_index)
    """
    if start_idx >= len(rows):
        return None, start_idx

    row = rows[start_idx]

    # Skip empty rows
    if not row or all(not cell for cell in row):
        return None, start_idx + 1

    # Check if this is a line item (has account number or description)
    acct_col = str(row[0]).strip() if row[0] else ''
    desc_col = str(row[1]).strip() if len(row) > 1 and row[1] else ''

    # Skip total rows, subtotal rows, and section headers
    if any(keyword in acct_col.lower() + desc_col.lower()
           for keyword in ['total', 'subtotal', 'account total', 'continuation']):
        return None, start_idx + 1

    # Try to extract account number (4-digit format like "1101")
    account_match = re.match(r'^(\d{4})\s*$', acct_col)

    if not account_match:
        # Not a line item header
        return None, start_idx + 1

    line_item = {
        'account': account_match.group(1),
        'description': desc_col,
        'position': desc_col,
        'quantity': None,
        'unit': None,
        'rate': None,
        'subtotal': None,
        'total': None,
        'periods': {},
        'detail_lines': [],
    }

    # Look at next row for actual data
    next_idx = start_idx + 1

    # Parse detail rows (the actual position/rates)
    while next_idx < len(rows):
        detail_row = rows[next_idx]

        if not detail_row:
            next_idx += 1
            continue

        # Check if this row is a continuation of the line item or next account
        first_col = str(detail_row[0]).strip() if detail_row[0] else ''
        second_col = str(detail_row[1]).strip() if len(detail_row) > 1 and detail_row[1] else ''

        # Check if we hit next account or total line
        if re.match(r'^\d{4}\s*$', first_col):
            # Next line item starting
            break
        if any(keyword in first_col.lower() + second_col.lower()
               for keyword in ['account total', 'total fringes']):
            break
        if first_col.startswith('Total $'):
            # Subtotal for this position
            next_idx += 1
            continue

        # Parse the detail line
        if len(detail_row) >= 6:
            position_name = second_col
            amt_col = str(detail_row[2]).strip() if detail_row[2] else ''
            unit_col = str(detail_row[3]).strip() if detail_row[3] else ''
            mult_col = str(detail_row[4]).strip() if detail_row[4] else ''
            rate_col = str(detail_row[5]).strip() if detail_row[5] else ''
            subt_col = str(detail_row[6]).strip() if detail_row[6] else ''
            total_col = str(detail_row[7]).strip() if len(detail_row) > 7 and detail_row[7] else ''

            # Parse values
            detail = {
                'position': position_name,
                'quantity': None,
                'unit': None,
                'multiplier': None,
                'rate': None,
                'subtotal': None,
                'total': None,
            }

            # Parse quantity
            try:
                if amt_col and re.match(r'^[\d.,]+$', amt_col):
                    detail['quantity'] = float(amt_col.replace(',', ''))
            except:
                pass

            # Parse unit
            if unit_col:
                detail['unit'] = unit_col.lower()

            # Parse multiplier
            try:
                if mult_col and re.match(r'^[\d.,]+$', mult_col):
                    detail['multiplier'] = float(mult_col.replace(',', ''))
            except:
                pass

            # Parse rate
            detail['rate'] = clean_amount(rate_col)

            # Parse subtotal
            detail['subtotal'] = clean_amount(subt_col)

            # Parse total
            detail['total'] = clean_amount(total_col)

            # Check if this is a period breakdown
            position_lower = position_name.lower()
            is_period = False
            for period in ['prep', 'shoot', 'wrap', 'hiatus', 'post']:
                if position_lower == period or position_lower.startswith(period + ' '):
                    line_item['periods'][period] = {
                        'quantity': detail['quantity'],
                        'unit': detail['unit'],
                        'rate': detail['rate'],
                        'subtotal': detail['subtotal']
                    }
                    is_period = True
                    break

            if not is_period and position_name:
                # This is actual detail data
                if detail['quantity'] or detail['rate'] or detail['subtotal']:
                    line_item['detail_lines'].append(detail)

                    # Update summary fields
                    if not line_item['position'] or line_item['position'] == line_item['description']:
                        line_item['position'] = position_name
                    if detail['quantity'] and not line_item['quantity']:
                        line_item['quantity'] = detail['quantity']
                    if detail['unit'] and not line_item['unit']:
                        line_item['unit'] = detail['unit']
                    if detail['rate'] and not line_item['rate']:
                        line_item['rate'] = detail['rate']
                    if detail['subtotal']:
                        line_item['subtotal'] = (line_item['subtotal'] or 0) + detail['subtotal']

        next_idx += 1

        # Stop after reasonable number of detail lines (prevent runaway)
        if next_idx - start_idx > 20:
            break

    # Return the parsed line item
    if line_item['account'] and (line_item['detail_lines'] or line_item['periods']):
        return line_item, next_idx

    return None, start_idx + 1


def extract_department(pdf, page_start: int, page_end: int) -> Optional[Dict]:
    """Extract a complete department/group with all line items."""
    department = {
        'name': None,
        'account': None,
        'total': None,
        'line_items': []
    }

    current_account_name = None

    for page_num in range(page_start, min(page_end + 1, len(pdf.pages))):
        page = pdf.pages[page_num]
        tables = page.extract_tables()

        if not tables:
            continue

        table = tables[0]

        for row_idx, row in enumerate(table):
            if not row:
                continue

            first_col = str(row[0]).strip() if row[0] else ''

            # Check for department/account header (e.g., "1100 WRITER")
            dept_match = re.match(r'^(\d{4})\s+([A-Z\s&]+)$', first_col)
            if dept_match:
                account_num = dept_match.group(1)
                account_name = dept_match.group(2).strip()

                # If this is a new main account, save previous department
                if current_account_name and account_num[:2] != department.get('account', '')[:2]:
                    if department['line_items']:
                        return department

                # Start new department
                if not department['account']:
                    department['account'] = account_num
                    department['name'] = account_name
                    current_account_name = account_name

            # Check for account total
            if 'AccountTotalfor' in first_col or 'Account Total for' in first_col:
                total_match = re.search(r'\$\s*([\d,]+)', first_col)
                if total_match:
                    department['total'] = clean_amount(total_match.group(1))
                # Department is complete
                if department['line_items']:
                    return department

            # Try to parse as line item
            if department['account']:
                line_item, _ = parse_line_item(table, row_idx)
                if line_item and (line_item['account'] or line_item['description']):
                    # Skip fringe items (they're calculated, not actual line items)
                    if line_item.get('description') and 'fringes' not in line_item['description'].lower():
                        department['line_items'].append(line_item)

    if department['account'] and department['line_items']:
        return department

    return None


def extract_all_departments(pdf) -> List[Dict]:
    """Extract all departments from the PDF."""
    departments = []

    # Start from page 3 (skip summary pages)
    page_idx = 3

    while page_idx < len(pdf.pages):
        # Try to extract department starting from this page
        # Look ahead up to 10 pages for complete department
        dept = extract_department(pdf, page_idx, page_idx + 10)

        if dept:
            departments.append(dept)
            # Move to next page after last line item
            page_idx += 3  # Move forward
        else:
            page_idx += 1

    return departments


def process_budget_pdf(pdf_path: Path) -> Dict[str, Any]:
    """Process a single budget PDF and extract all data."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Extract metadata
            metadata = extract_metadata(pdf)
            metadata['filename'] = pdf_path.name
            metadata['pdf_path'] = str(pdf_path)

            # Extract departments
            departments = extract_all_departments(pdf)

            result = {
                'metadata': metadata,
                'departments': departments,
                'extraction_stats': {
                    'total_pages': len(pdf.pages),
                    'departments_found': len(departments),
                    'line_items_found': sum(len(d['line_items']) for d in departments),
                }
            }

            return result

    except Exception as e:
        print(f"  ERROR: {e}")
        return {
            'metadata': {'filename': pdf_path.name, 'error': str(e)},
            'departments': [],
            'extraction_stats': {'error': str(e)}
        }


def save_budget_json(budget_data: Dict, output_dir: Path):
    """Save budget data as JSON file."""
    filename = budget_data['metadata']['filename']

    # Create safe filename
    safe_name = re.sub(r'[^\w\s-]', '', filename.replace('.pdf', ''))
    safe_name = re.sub(r'[-\s]+', '_', safe_name)

    output_path = output_dir / f"{safe_name}.json"

    with open(output_path, 'w') as f:
        json.dump(budget_data, f, indent=2)

    return output_path


def main():
    """Main execution function."""
    print("="*70)
    print("MOVIE MAGIC BUDGET - FULL EXTRACTION")
    print("="*70)

    # Setup paths
    budgets_dir = Path.home() / 'Documents' / 'budgets'
    output_dir = Path('/Users/anthonyvazquez/ai-budget-system/database/budget_templates')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all budget PDFs
    pdf_files = list(budgets_dir.rglob('*.pdf'))

    # Filter to production budgets
    production_budgets = [
        f for f in pdf_files
        if any(keyword in f.name for keyword in ['2021', 'Pilot', 'Cable', 'Multicam', 'One Hour'])
    ]

    print(f"\nFound {len(pdf_files)} total PDFs")
    print(f"Filtered to {len(production_budgets)} production budgets")
    print(f"Output directory: {output_dir}\n")

    # Process each budget
    results = []
    success_count = 0

    for idx, pdf_path in enumerate(production_budgets, 1):
        print(f"\n[{idx}/{len(production_budgets)}] {pdf_path.name[:50]}")

        budget_data = process_budget_pdf(pdf_path)

        # Save individual JSON
        if budget_data['departments']:
            json_path = save_budget_json(budget_data, output_dir)
            dept_count = len(budget_data['departments'])
            item_count = sum(len(d['line_items']) for d in budget_data['departments'])
            print(f"  ✓ Saved: {json_path.name} ({dept_count} depts, {item_count} items)")
            success_count += 1
        else:
            print(f"  ✗ No data extracted")

        results.append(budget_data)

    # Generate summary CSV
    summary_path = output_dir / 'extraction_summary.csv'

    with open(summary_path, 'w', newline='') as csvfile:
        fieldnames = [
            'filename', 'location', 'production_type', 'total_budget',
            'departments_found', 'line_items_found', 'total_pages', 'status'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            meta = result['metadata']
            stats = result['extraction_stats']

            row = {
                'filename': meta.get('filename', ''),
                'location': meta.get('location', ''),
                'production_type': meta.get('production_type', ''),
                'total_budget': meta.get('total_budget', ''),
                'departments_found': stats.get('departments_found', 0),
                'line_items_found': stats.get('line_items_found', 0),
                'total_pages': stats.get('total_pages', 0),
                'status': 'error' if 'error' in stats else ('success' if result['departments'] else 'no_data')
            }
            writer.writerow(row)

    # Print summary
    print("\n" + "="*70)
    print("EXTRACTION SUMMARY")
    print("="*70)
    print(f"\nTotal budgets processed: {len(production_budgets)}")
    print(f"Successful extractions: {success_count}")
    print(f"Failed/No data: {len(production_budgets) - success_count}")

    total_departments = sum(r['extraction_stats'].get('departments_found', 0) for r in results)
    total_line_items = sum(r['extraction_stats'].get('line_items_found', 0) for r in results)

    print(f"\nTotal departments extracted: {total_departments}")
    print(f"Total line items extracted: {total_line_items}")

    print(f"\n📁 JSON files saved to: {output_dir}")
    print(f"📊 Summary CSV: {summary_path}")

    # Show extraction quality by file
    print("\n" + "="*70)
    print("EXTRACTION QUALITY BY FILE")
    print("="*70)

    for result in results:
        meta = result['metadata']
        stats = result['extraction_stats']

        dept_count = stats.get('departments_found', 0)
        item_count = stats.get('line_items_found', 0)

        status = "✓" if dept_count > 0 else "✗"
        print(f"{status} {meta['filename'][:50]:50} | Depts: {dept_count:2} | Items: {item_count:3}")


if __name__ == '__main__':
    main()
