#!/usr/bin/env python3
"""Extract tax incentive data from chunked PDFs and output structured JSON"""

import os
import json
import re
from pathlib import Path
from pypdf import PdfReader

# Paths
chunks_dir = "/Users/anthonyvazquez/Documents/budgets/TaxIncentives/chunks"
output_file = "/Users/anthonyvazquez/ai-budget-system/data/tax-incentives.json"

# Create output directory
os.makedirs(os.path.dirname(output_file), exist_ok=True)

def extract_text_from_chunk(chunk_path):
    """Extract text from a PDF chunk"""
    text = ""
    reader = PdfReader(chunk_path)
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def parse_state_data(text):
    """Parse state tax incentive data from text"""
    states = []

    # Valid US states and territories
    valid_states = {
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
        'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
        'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming', 'Puerto Rico', 'US Virgin Islands', 'Cherokee Nation',
        'District of Columbia'
    }

    # Split by state headers (looking for state names like "Colorado", "Kentucky", etc.)
    # State sections typically start with the state name as a header
    state_sections = re.split(r'\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\n(?=EP Services Offered|Incentive)', text)

    seen_states = set()  # Track duplicates

    for i in range(1, len(state_sections), 2):
        if i + 1 >= len(state_sections):
            break

        state_name = state_sections[i].strip()
        content = state_sections[i + 1]

        # Skip invalid state names
        if state_name not in valid_states:
            continue

        # Skip duplicates
        if state_name in seen_states:
            continue

        seen_states.add(state_name)

        state_data = {
            "state": state_name,
            "incentive": {},
            "labor": {},
            "qualified_spend": {},
            "minimums_caps": {},
            "uplifts": {},
            "requirements": {}
        }

        # Extract incentive type and percentages
        incentive_match = re.search(r'Incentive[s]?\s+(\d+)%?-?(\d+)?%?\s+(Refundable|Transferable|Non-Transferable)?\s*(Tax Credit|Rebate)', content)
        if incentive_match:
            state_data["incentive"] = {
                "min_percent": int(incentive_match.group(1)),
                "max_percent": int(incentive_match.group(2)) if incentive_match.group(2) else int(incentive_match.group(1)),
                "type": incentive_match.group(3) if incentive_match.group(3) else "Unknown",
                "mechanism": incentive_match.group(4)
            }

        # Extract labor rates
        resident_atl = re.search(r'Resident ATL\s+(\d+)%', content)
        resident_btl = re.search(r'Resident BTL\s+(\d+)%', content)
        non_resident_atl = re.search(r'Non-Resident ATL\s+(\d+)%', content)
        non_resident_btl = re.search(r'Non-Resident BTL\s+(\d+)%', content)

        if resident_atl or resident_btl or non_resident_atl or non_resident_btl:
            state_data["labor"] = {
                "resident_atl": int(resident_atl.group(1)) if resident_atl else None,
                "resident_btl": int(resident_btl.group(1)) if resident_btl else None,
                "non_resident_atl": int(non_resident_atl.group(1)) if non_resident_atl else None,
                "non_resident_btl": int(non_resident_btl.group(1)) if non_resident_btl else None
            }

        # Extract qualified spend percentage
        spend_match = re.search(r'Spend\s+(\d+)%', content)
        if spend_match:
            state_data["qualified_spend"]["percent"] = int(spend_match.group(1))

        # Extract minimums and caps
        min_spend = re.search(r'Minimum Spend\s+\$?([\d,]+)([KMB])', content)
        project_cap = re.search(r'Project Cap\s+\$?([\d,]+)([KMB])', content)
        annual_cap = re.search(r'Annual Cap\s+\$?([\d,]+)([KMB])', content)
        comp_cap = re.search(r'Compensation Cap\s+\$?([\d,]+)([KMB])', content)

        def convert_amount(value, suffix):
            num = int(value.replace(',', ''))
            multipliers = {'K': 1000, 'M': 1000000, 'B': 1000000000}
            return num * multipliers.get(suffix, 1)

        if min_spend:
            state_data["minimums_caps"]["minimum_spend"] = convert_amount(min_spend.group(1), min_spend.group(2))

        if project_cap:
            state_data["minimums_caps"]["project_cap"] = convert_amount(project_cap.group(1), project_cap.group(2))

        if annual_cap:
            state_data["minimums_caps"]["annual_cap"] = convert_amount(annual_cap.group(1), annual_cap.group(2))

        if comp_cap:
            state_data["minimums_caps"]["compensation_cap"] = convert_amount(comp_cap.group(1), comp_cap.group(2))

        # Extract uplifts
        labor_uplifts = re.findall(r'Labor Uplifts?\s+(.*?)(?:\n[A-Z]|\n\n)', content, re.DOTALL)
        spend_uplifts = re.findall(r'Spend Uplifts?\s+(.*?)(?:\n[A-Z]|\n\n)', content, re.DOTALL)

        if labor_uplifts:
            state_data["uplifts"]["labor"] = labor_uplifts[0].strip()

        if spend_uplifts:
            state_data["uplifts"]["spend"] = spend_uplifts[0].strip()

        states.append(state_data)

    return states

def main():
    """Process all chunks and extract data"""
    print("🎬 Extracting tax incentive data from PDF chunks...\n")

    all_data = {
        "source": "U.S. State Production Incentive Guide - Entertainment Partners",
        "extracted_at": "2025-11-20",
        "states": []
    }

    # Get all chunk files sorted
    chunk_files = sorted(Path(chunks_dir).glob("tax-budget-chunk-*.pdf"))

    total_states = 0
    for chunk_file in chunk_files:
        print(f"📄 Processing {chunk_file.name}...")

        try:
            text = extract_text_from_chunk(chunk_file)
            states = parse_state_data(text)

            # Add all states from this chunk
            all_data["states"].extend(states)
            total_states += len(states)

            print(f"   ✓ Extracted {len(states)} states")

        except Exception as e:
            print(f"   ✗ Error: {e}")
            import traceback
            traceback.print_exc()
            continue

    # Save to JSON
    with open(output_file, 'w') as f:
        json.dump(all_data, f, indent=2)

    print(f"\n✅ Extraction complete!")
    print(f"📁 Output: {output_file}")

    # Print summary
    print(f"\n📊 Summary:")
    print(f"   Chunks processed: {len(chunk_files)}")
    print(f"   Total states extracted: {total_states}")

    # Print first few states
    if all_data["states"]:
        print(f"\n📋 Sample states:")
        for state in all_data["states"][:5]:
            incentive = state.get("incentive", {})
            print(f"   • {state.get('state', 'Unknown')}: {incentive.get('min_percent', '?')}-{incentive.get('max_percent', '?')}% {incentive.get('type', '')} {incentive.get('mechanism', '')}")

if __name__ == "__main__":
    main()
