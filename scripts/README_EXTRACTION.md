# Budget PDF Extraction Scripts

This directory contains scripts for extracting data from Movie Magic Budget PDFs.

## Scripts

### 1. `extract_budget_summaries.py`
**Purpose:** Extract summary data from page 1 of budget PDFs
**Output:** CSV file with grand totals, ATL, BTL, etc.
**Use case:** Quick overview of budget totals without detailed line items

```bash
python3 scripts/extract_budget_summaries.py
```

Output: `/Users/anthonyvazquez/ai-budget-system/database/budget_summaries.csv`

### 2. `extract_full_budgets.py` (NEW)
**Purpose:** Extract complete line item details from all budget pages
**Output:** Individual JSON files per budget + summary CSV
**Use case:** Template generation, detailed analysis, AI training data

```bash
python3 scripts/extract_full_budgets.py
```

Outputs:
- JSON files: `/Users/anthonyvazquez/ai-budget-system/database/budget_templates/*.json`
- Summary: `/Users/anthonyvazquez/ai-budget-system/database/budget_templates/extraction_summary.csv`

### 3. `test_single_budget.py`
**Purpose:** Test extraction on a single PDF with detailed output
**Use case:** Debugging, validation, testing extraction quality

```bash
python3 scripts/test_single_budget.py
```

## Extracted Data Structure

### Full Budget JSON Format

```json
{
  "metadata": {
    "filename": "2021 Cable ATL One Hour Pilot v01.pdf",
    "location": "Atlanta, GA",
    "production_type": "one_hour_pilot",
    "shoot_days": 15,
    "shoot_dates": "3/1/21-3/19/21",
    "total_budget": null,
    "pdf_path": "/full/path/to/pdf"
  },
  "departments": [
    {
      "name": "WRITER",
      "account": "1100",
      "total": 185235.0,
      "line_items": [
        {
          "account": "1101",
          "description": "WRITER",
          "position": "TBD",
          "quantity": 1.0,
          "unit": "corp",
          "rate": 150000.0,
          "subtotal": 150000.0,
          "total": null,
          "periods": {},
          "detail_lines": [
            {
              "position": "TBD",
              "quantity": 1.0,
              "unit": "corp",
              "multiplier": 1.0,
              "rate": 150000.0,
              "subtotal": 150000.0,
              "total": null
            }
          ]
        }
      ]
    }
  ],
  "extraction_stats": {
    "total_pages": 62,
    "departments_found": 19,
    "line_items_found": 51
  }
}
```

## Field Definitions

### Metadata Fields
- `filename`: Original PDF filename
- `location`: Filming location (extracted from PDF header)
- `production_type`: Type of production (one_hour_pilot, half_hour_pilot, multicam_pilot)
- `shoot_days`: Number of shooting days
- `shoot_dates`: Shooting date range
- `total_budget`: Grand total (if extracted)
- `atl_total`: Above-the-line total
- `btl_total`: Below-the-line total

### Department Fields
- `name`: Department name (e.g., "CAMERA", "LIGHTING")
- `account`: 4-digit account number (e.g., "3300")
- `total`: Department total amount
- `line_items`: Array of line items in this department

### Line Item Fields
- `account`: Specific account number (e.g., "3301")
- `description`: Line item category description
- `position`: Specific position or item name
- `quantity`: Amount of units
- `unit`: Unit type (weeks, days, hours, allow, corp, etc.)
- `rate`: Rate per unit in dollars
- `subtotal`: Line item subtotal
- `periods`: Object containing prep/shoot/wrap breakdowns (if applicable)
- `detail_lines`: Array of detailed sub-items

### Detail Line Fields
- `position`: Specific position or description
- `quantity`: Number of units
- `unit`: Unit type
- `multiplier`: Multiplication factor (usually 1.0)
- `rate`: Rate per unit
- `subtotal`: Calculated subtotal

## Extraction Statistics

From November 2025 extraction run:
- **48 PDFs processed**
- **39 successful extractions (81.3%)**
- **690 total departments**
- **1,878 total line items**
- **Average: 17.7 departments per budget**
- **Average: 48.2 line items per budget**

## Common Issues & Solutions

### Issue: Some budgets fail extraction
**Cause:** PDF formatting variations
**Solution:** Check the extraction_summary.csv for status. Some PDFs use different table structures.

### Issue: Missing period breakdowns
**Cause:** Complex inline formatting of prep/shoot/wrap periods
**Solution:** Data is captured in detail_lines, but may need additional processing

### Issue: Metadata fields are null
**Cause:** Page 1/2 summary tables vary by budget version
**Solution:** Location and shoot_days are most reliable; grand_total may need manual entry

## Using Extracted Data

### Example: Load a budget JSON
```python
import json

with open('database/budget_templates/2021_Cable_ATL_One_Hour_Pilot_v01.json') as f:
    budget = json.load(f)

print(f"Location: {budget['metadata']['location']}")
print(f"Departments: {len(budget['departments'])}")

for dept in budget['departments']:
    print(f"{dept['account']} {dept['name']}: ${dept['total']:,.2f}")
```

### Example: Analyze line items
```python
import json

with open('database/budget_templates/2021_Cable_ATL_One_Hour_Pilot_v01.json') as f:
    budget = json.load(f)

# Get all camera department items
camera_dept = next(d for d in budget['departments'] if 'CAMERA' in d['name'])

for item in camera_dept['line_items']:
    print(f"{item['position']}: {item['quantity']} {item['unit']} @ ${item['rate']:,.2f}")
```

## Locations Covered

Extracted budgets cover 13 different filming locations:

**United States:**
- Atlanta, GA
- Boston, MA
- Charleston, SC
- Chicago, IL
- Los Angeles, CA
- New Orleans, LA
- New York, NY
- Pittsburgh, PA
- Portland, OR
- Santa Fe, NM
- Wilmington, NC

**Canada:**
- Montreal, QC
- Toronto, ON
- Vancouver, BC

## Dependencies

```bash
pip install pdfplumber
```

## Performance

- **Processing time:** ~2 minutes for 48 PDFs (~2.5 seconds per PDF)
- **Output size:** ~2.5 MB total (34-94 KB per JSON file)
- **Memory usage:** Low (processes one PDF at a time)

## Support

For issues or questions:
1. Check the extraction_summary.csv for status codes
2. Run test_single_budget.py to debug specific PDFs
3. Review EXTRACTION_REPORT.md for detailed statistics
