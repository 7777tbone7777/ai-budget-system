#!/usr/bin/env python3
"""
Analyze budget patterns across 33 production budgets from 10 locations.
Generates insights for AI enhancement opportunities and Phase 2 features.
"""

import csv
import statistics
from collections import defaultdict
from pathlib import Path


def load_budgets(csv_path):
    """Load budget data from CSV."""
    budgets = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert string numbers to floats
            for key in ['grand_total', 'atl_total', 'btl_total', 'other_total',
                       'production_total', 'post_total']:
                if row[key]:
                    row[key] = float(row[key])
                else:
                    row[key] = None
            budgets.append(row)
    return budgets


def analyze_by_location(budgets):
    """Group budgets by location and calculate statistics."""
    by_location = defaultdict(list)

    for budget in budgets:
        location = budget['location']
        if location != 'Unknown' and budget['grand_total']:
            by_location[location].append(budget)

    location_stats = {}
    for location, loc_budgets in by_location.items():
        totals = [b['grand_total'] for b in loc_budgets]
        atl_totals = [b['atl_total'] for b in loc_budgets if b['atl_total']]
        btl_totals = [b['btl_total'] for b in loc_budgets if b['btl_total']]

        atl_percentages = [
            (b['atl_total'] / b['grand_total'] * 100)
            for b in loc_budgets
            if b['atl_total'] and b['grand_total']
        ]

        location_stats[location] = {
            'count': len(loc_budgets),
            'avg_total': statistics.mean(totals),
            'min_total': min(totals),
            'max_total': max(totals),
            'avg_atl': statistics.mean(atl_totals) if atl_totals else None,
            'avg_btl': statistics.mean(btl_totals) if btl_totals else None,
            'avg_atl_percentage': statistics.mean(atl_percentages) if atl_percentages else None,
        }

    return location_stats


def compare_locations(location_stats):
    """Compare locations and identify cost leaders."""
    # Sort by average cost
    sorted_locations = sorted(
        location_stats.items(),
        key=lambda x: x[1]['avg_total']
    )

    return sorted_locations


def identify_patterns(budgets):
    """Identify patterns in budget structures."""
    patterns = {
        'atl_btl_ratio': [],
        'production_vs_post': [],
        'budget_size_categories': defaultdict(list),
    }

    for budget in budgets:
        if budget['grand_total'] and budget['atl_total'] and budget['btl_total']:
            # ATL to BTL ratio
            ratio = budget['atl_total'] / budget['btl_total']
            patterns['atl_btl_ratio'].append({
                'location': budget['location'],
                'ratio': ratio,
                'total': budget['grand_total']
            })

        # Budget size categories
        total = budget['grand_total']
        if total:
            if total < 3000000:
                category = 'Small (<$3M)'
            elif total < 6000000:
                category = 'Medium ($3-6M)'
            else:
                category = 'Large (>$6M)'

            patterns['budget_size_categories'][category].append(budget)

    return patterns


def generate_report(budgets, location_stats, patterns):
    """Generate comprehensive analysis report."""

    print("="*80)
    print("AI BUDGET SYSTEM: PRODUCTION BUDGET ANALYSIS")
    print("33 Budgets Across 10 Locations (2021 Data)")
    print("="*80)

    # Overall statistics
    all_totals = [b['grand_total'] for b in budgets if b['grand_total']]
    print(f"\n📊 OVERALL STATISTICS")
    print(f"{'─'*80}")
    print(f"Total Budgets Analyzed: {len(all_totals)}")
    print(f"Average Budget: ${statistics.mean(all_totals):,.2f}")
    print(f"Median Budget: ${statistics.median(all_totals):,.2f}")
    print(f"Range: ${min(all_totals):,.2f} - ${max(all_totals):,.2f}")
    print(f"Standard Deviation: ${statistics.stdev(all_totals):,.2f}")

    # Location comparison
    print(f"\n🌍 LOCATION COST COMPARISON (Ranked by Average Budget)")
    print(f"{'─'*80}")
    print(f"{'Location':<25} {'Budgets':>8} {'Avg Cost':>15} {'ATL%':>8} {'BTL%':>8}")
    print(f"{'─'*80}")

    sorted_locs = compare_locations(location_stats)
    for location, stats in sorted_locs:
        atl_pct = stats['avg_atl_percentage'] if stats['avg_atl_percentage'] else 0
        btl_pct = 100 - atl_pct if atl_pct else 0

        print(f"{location:<25} {stats['count']:>8} ${stats['avg_total']:>14,.0f} "
              f"{atl_pct:>7.1f}% {btl_pct:>7.1f}%")

    # Cost savings analysis
    print(f"\n💰 COST SAVINGS OPPORTUNITIES")
    print(f"{'─'*80}")

    if len(sorted_locs) >= 2:
        cheapest = sorted_locs[0]
        most_expensive = sorted_locs[-1]

        savings = most_expensive[1]['avg_total'] - cheapest[1]['avg_total']
        savings_pct = (savings / most_expensive[1]['avg_total']) * 100

        print(f"Least Expensive: {cheapest[0]} (${cheapest[1]['avg_total']:,.0f})")
        print(f"Most Expensive: {most_expensive[0]} (${most_expensive[1]['avg_total']:,.0f})")
        print(f"")
        print(f"💡 INSIGHT: Shooting in {cheapest[0]} vs {most_expensive[0]} saves:")
        print(f"   ${savings:,.0f} ({savings_pct:.1f}% reduction)")

    # ATL/BTL patterns
    print(f"\n🎬 ATL/BTL RATIO ANALYSIS")
    print(f"{'─'*80}")

    if patterns['atl_btl_ratio']:
        ratios = [p['ratio'] for p in patterns['atl_btl_ratio']]
        avg_ratio = statistics.mean(ratios)

        print(f"Average ATL/BTL Ratio: {avg_ratio:.3f} (1:{1/avg_ratio:.2f})")
        print(f"This means for every $1 spent on ATL, ${1/avg_ratio:.2f} is spent on BTL")
        print(f"")
        print(f"💡 INSIGHT: Professional budgets typically allocate:")
        print(f"   ~{avg_ratio/(1+avg_ratio)*100:.1f}% to Above-the-Line (talent/creatives)")
        print(f"   ~{(1/(1+avg_ratio))*100:.1f}% to Below-the-Line (crew/production)")

    # Budget size categories
    print(f"\n📈 BUDGET SIZE DISTRIBUTION")
    print(f"{'─'*80}")

    for category, cat_budgets in sorted(patterns['budget_size_categories'].items()):
        count = len(cat_budgets)
        avg = statistics.mean([b['grand_total'] for b in cat_budgets if b['grand_total']])
        print(f"{category:<20} {count:>3} budgets (avg: ${avg:,.0f})")

    # Key insights for AI features
    print(f"\n🤖 AI ENHANCEMENT OPPORTUNITIES")
    print(f"{'─'*80}")

    print(f"""
1. LOCATION COMPARISON INTELLIGENCE
   - We have {len(sorted_locs)} locations with cost data
   - Can build AI that recommends optimal shooting location
   - Example: "Your $6M pilot could save ${savings:,.0f} by shooting in {cheapest[0]}"

2. BUDGET TEMPLATE MATCHING
   - {len(all_totals)} real budgets to train on
   - Can suggest line items based on location + production type
   - Example: "Similar pilots in {most_expensive[0]} averaged ${most_expensive[1]['avg_total']:,.0f}"

3. ATL/BTL VALIDATION
   - Average ratio: {avg_ratio:.3f} provides benchmark
   - Can flag unusual ATL/BTL splits
   - Example: "Your ATL is 30%, typical is ~{avg_ratio/(1+avg_ratio)*100:.0f}%"

4. COST PREDICTION
   - Standard deviation: ${statistics.stdev(all_totals):,.0f}
   - Can predict budget ranges by location
   - Example: "One-hour pilots in Boston typically cost $7.0M-$7.5M"
""")

    # Specific recommendations
    print(f"\n✅ PHASE 2 IMPLEMENTATION PRIORITIES")
    print(f"{'─'*80}")
    print(f"""
Based on this analysis of {len(all_totals)} real budgets:

1. **Multi-Period Time Tracking** [HIGH PRIORITY]
   - All professional budgets break down by prep/shoot/wrap
   - Enables accurate cost modeling by production phase

2. **Location Comparison Tool** [HIGH PRIORITY]
   - {len(sorted_locs)} locations with cost data ready
   - Can save productions ${savings:,.0f}+ by choosing right location
   - Build comparison matrix with tax incentives

3. **Budget Templates by Location** [MEDIUM PRIORITY]
   - Atlanta: {location_stats.get('Atlanta', {}).get('count', 0)} budgets
   - Los Angeles: {location_stats.get('Los Angeles', {}).get('count', 0)} budgets
   - Chicago: {location_stats.get('Chicago', {}).get('count', 0)} budgets
   - Can pre-populate budgets based on historical data

4. **ATL/BTL Validation Alerts** [MEDIUM PRIORITY]
   - Warn when ATL% deviates from {avg_ratio/(1+avg_ratio)*100:.0f}% average
   - Suggest adjustments to match industry standards

5. **AI Chat Interface** [LOW PRIORITY - After Phase 2]
   - "Compare Atlanta vs Vancouver for my $6M pilot"
   - "Why is my budget higher than similar pilots?"
   - Can answer using this analysis data
""")

    print("="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)


def main():
    csv_path = '/Users/anthonyvazquez/ai-budget-system/database/budget_summaries.csv'

    budgets = load_budgets(csv_path)
    location_stats = analyze_by_location(budgets)
    patterns = identify_patterns(budgets)

    generate_report(budgets, location_stats, patterns)


if __name__ == '__main__':
    main()
