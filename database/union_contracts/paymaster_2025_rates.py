#!/usr/bin/env python3
"""
Paymaster 2025-2026 Rate Import Script
Source: EP Paymaster November 2025 Edition
Underlying Agreements: DGA Basic Agreement 2023-2026, IATSE Basic Agreement 2024-2027

This script inserts the current (2025) rates extracted from the Paymaster into the database.
"""

import requests
import json
from datetime import date

API_BASE = "https://backend-production-8e04.up.railway.app"

# =============================================================================
# DGA BASIC AGREEMENT - Effective 07/01/2025 (Year 3)
# =============================================================================
DGA_RATES_2025 = [
    # Directors - Theatrical Motion Pictures
    {"union_local": "DGA", "job_classification": "Director - Theatrical Low Budget (to $500,000)", "rate_type": "weekly", "base_rate": 15457, "location": "National", "production_type": "theatrical_low_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Theatrical Medium Budget ($500K-$1.5M)", "rate_type": "weekly", "base_rate": 17568, "location": "National", "production_type": "theatrical_medium_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Theatrical High Budget ($1.5M+)", "rate_type": "weekly", "base_rate": 24599, "location": "National", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Term Contract", "rate_type": "weekly", "base_rate": 15457, "location": "National", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Trailers/Talent Tests/Promos", "rate_type": "weekly", "base_rate": 17568, "location": "National", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Shorts & Documentaries", "rate_type": "weekly", "base_rate": 17568, "location": "National", "production_type": "documentary", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Holiday/7th Day Worked", "rate_type": "daily", "base_rate": 4413, "location": "National", "production_type": "theatrical", "effective_date": "2025-07-01"},

    # Directors - Free Television Network Prime Time
    {"union_local": "DGA", "job_classification": "Director - Network Prime Time (½ Hour)", "rate_type": "program", "base_rate": 33784, "location": "National", "production_type": "network_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Network Prime Time (1 Hour)", "rate_type": "program", "base_rate": 57374, "location": "National", "production_type": "network_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Network Prime Time (1½ Hours)", "rate_type": "program", "base_rate": 95627, "location": "National", "production_type": "network_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Network Prime Time (2 Hours)", "rate_type": "program", "base_rate": 160645, "location": "National", "production_type": "network_tv", "effective_date": "2025-07-01"},

    # Directors - Non-Network/Non-Prime Time High Budget
    {"union_local": "DGA", "job_classification": "Director - Non-Network High Budget (0-15 min)", "rate_type": "program", "base_rate": 7588, "location": "National", "production_type": "cable_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network High Budget (16-30 min)", "rate_type": "program", "base_rate": 14442, "location": "National", "production_type": "cable_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network High Budget (31-60 min)", "rate_type": "program", "base_rate": 26551, "location": "National", "production_type": "cable_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network High Budget (61-90 min)", "rate_type": "program", "base_rate": 42435, "location": "National", "production_type": "cable_tv", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network High Budget (91-120 min)", "rate_type": "program", "base_rate": 51067, "location": "National", "production_type": "cable_tv", "effective_date": "2025-07-01"},

    # Directors - Non-Network Low Budget
    {"union_local": "DGA", "job_classification": "Director - Non-Network Low Budget (0-15 min)", "rate_type": "program", "base_rate": 3777, "location": "National", "production_type": "low_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network Low Budget (16-30 min)", "rate_type": "program", "base_rate": 6490, "location": "National", "production_type": "low_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network Low Budget (31-60 min)", "rate_type": "program", "base_rate": 7525, "location": "National", "production_type": "low_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network Low Budget (61-90 min)", "rate_type": "program", "base_rate": 9565, "location": "National", "production_type": "low_budget", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Non-Network Low Budget (91-120 min)", "rate_type": "program", "base_rate": 11500, "location": "National", "production_type": "low_budget", "effective_date": "2025-07-01"},

    # Directors - Basic Cable
    {"union_local": "DGA", "job_classification": "Director - Basic Cable ½ Hour (1st Season)", "rate_type": "program", "base_rate": 15179, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable ½ Hour (2nd+ Season $1.61M-$2.12M)", "rate_type": "program", "base_rate": 19145, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable ½ Hour (2nd+ Season $2.12M+)", "rate_type": "program", "base_rate": 22352, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable 1 Hour ($1.2M-$3M)", "rate_type": "program", "base_rate": 30347, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable 1 Hour (1st Season $3M+)", "rate_type": "program", "base_rate": 31235, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable 1 Hour (2nd+ Season $3M+)", "rate_type": "program", "base_rate": 43399, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable 1½ Hour ($2.75M+)", "rate_type": "program", "base_rate": 45534, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Basic Cable 2 Hour", "rate_type": "program", "base_rate": 108815, "location": "National", "production_type": "basic_cable", "effective_date": "2025-07-01"},

    # Directors - Pilots Network Prime Time
    {"union_local": "DGA", "job_classification": "Director - Pilot Network Prime Time (½ Hour)", "rate_type": "program", "base_rate": 95627, "location": "National", "production_type": "pilot", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Pilot Network Prime Time (1 Hour)", "rate_type": "program", "base_rate": 127496, "location": "National", "production_type": "pilot", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Pilot Network Prime Time (1½ Hours)", "rate_type": "program", "base_rate": 159359, "location": "National", "production_type": "pilot", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Director - Pilot Network Prime Time (2 Hours)", "rate_type": "program", "base_rate": 223117, "location": "National", "production_type": "pilot", "effective_date": "2025-07-01"},

    # UPM and Assistant Directors - Studio 5-Day Workweek
    {"union_local": "DGA", "job_classification": "Unit Production Manager", "rate_type": "weekly", "base_rate": 7021, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Unit Production Manager - Production Fee", "rate_type": "weekly", "base_rate": 1522, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "First Assistant Director", "rate_type": "weekly", "base_rate": 6676, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "First Assistant Director - Production Fee", "rate_type": "weekly", "base_rate": 1239, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Key Second Assistant Director", "rate_type": "weekly", "base_rate": 4473, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Key Second Assistant Director - Production Fee", "rate_type": "weekly", "base_rate": 943, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Second Second Assistant Director", "rate_type": "weekly", "base_rate": 4223, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Additional Second Assistant Director", "rate_type": "weekly", "base_rate": 2571, "location": "Studio", "production_type": "theatrical", "effective_date": "2025-07-01"},

    # UPM and Assistant Directors - 7-Day Distant Location Workweek
    {"union_local": "DGA", "job_classification": "Unit Production Manager", "rate_type": "weekly", "base_rate": 9830, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Unit Production Manager - Production Fee", "rate_type": "weekly", "base_rate": 1812, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "First Assistant Director", "rate_type": "weekly", "base_rate": 9338, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "First Assistant Director - Production Fee", "rate_type": "weekly", "base_rate": 1522, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Key Second Assistant Director", "rate_type": "weekly", "base_rate": 6251, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Key Second Assistant Director - Production Fee", "rate_type": "weekly", "base_rate": 1239, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Second Second Assistant Director", "rate_type": "weekly", "base_rate": 5905, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
    {"union_local": "DGA", "job_classification": "Additional Second Assistant Director", "rate_type": "weekly", "base_rate": 3606, "location": "Distant", "production_type": "theatrical", "effective_date": "2025-07-01"},
]

# =============================================================================
# IATSE BASIC AGREEMENT - Effective 08/03/2025 (Year 2)
# =============================================================================
IATSE_LOCAL_44_RATES_2025 = [
    # Property Craftspersons - Studio
    {"union_local": "IATSE Local 44", "job_classification": "Property Master", "rate_type": "hourly", "base_rate": 63.01, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Property Master", "rate_type": "weekly", "base_rate": 3793.59, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Assistant Property Master", "rate_type": "hourly", "base_rate": 55.94, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Assistant Property Master", "rate_type": "weekly", "base_rate": 3361.71, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Set Decorator", "rate_type": "daily", "base_rate": 997.58, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Set Decorator", "rate_type": "weekly", "base_rate": 4156.58, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Prop Maker Foreperson", "rate_type": "hourly", "base_rate": 63.91, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Prop Maker Foreperson", "rate_type": "weekly", "base_rate": 3414.76, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Prop Maker Gang Boss", "rate_type": "hourly", "base_rate": 59.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Prop Maker Journeyperson", "rate_type": "hourly", "base_rate": 55.95, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Special Effects Foreperson", "rate_type": "hourly", "base_rate": 63.91, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Special Effects Foreperson", "rate_type": "weekly", "base_rate": 3414.76, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Special Effects Gang Boss", "rate_type": "hourly", "base_rate": 59.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Special Effects Journeyperson", "rate_type": "hourly", "base_rate": 55.95, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Licensed Powder Person", "rate_type": "hourly", "base_rate": 64.17, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Property Person", "rate_type": "hourly", "base_rate": 52.36, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Leadperson", "rate_type": "hourly", "base_rate": 54.79, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Leadperson", "rate_type": "weekly", "base_rate": 3293.39, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Construction Coordinator", "rate_type": "daily", "base_rate": 971.62, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Construction Coordinator", "rate_type": "weekly", "base_rate": 4048.35, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},

    # Property Craftspersons - Distant
    {"union_local": "IATSE Local 44", "job_classification": "Property Master", "rate_type": "weekly", "base_rate": 4353.30, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Assistant Property Master", "rate_type": "weekly", "base_rate": 3857.70, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 44", "job_classification": "Leadperson", "rate_type": "weekly", "base_rate": 3779.30, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
]

IATSE_LOCAL_80_RATES_2025 = [
    # Grips - Studio
    {"union_local": "IATSE Local 80", "job_classification": "Key Grip", "rate_type": "hourly", "base_rate": 63.01, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Key Grip", "rate_type": "weekly", "base_rate": 3793.59, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Best Boy Grip", "rate_type": "hourly", "base_rate": 57.20, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Best Boy Grip", "rate_type": "weekly", "base_rate": 3428.81, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Grip", "rate_type": "hourly", "base_rate": 54.78, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Grip Gang Boss", "rate_type": "hourly", "base_rate": 58.14, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Grip Sub-Foreperson", "rate_type": "hourly", "base_rate": 61.03, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Grip Foreperson", "rate_type": "weekly", "base_rate": 3414.76, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Head Grip Foreperson", "rate_type": "weekly", "base_rate": 3688.80, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Head Camera Crane Operator", "rate_type": "hourly", "base_rate": 59.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Camera Crane Electric Control Operator", "rate_type": "hourly", "base_rate": 59.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Crab Dolly Operator", "rate_type": "hourly", "base_rate": 59.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},

    # Grips - Distant
    {"union_local": "IATSE Local 80", "job_classification": "Key Grip", "rate_type": "weekly", "base_rate": 4353.30, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Best Boy Grip", "rate_type": "weekly", "base_rate": 3934.70, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},

    # Crafts Service
    {"union_local": "IATSE Local 80", "job_classification": "Crafts Service Foreperson", "rate_type": "hourly", "base_rate": 52.35, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Crafts Service Foreperson", "rate_type": "weekly", "base_rate": 2753.23, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Crafts Service Gang Boss", "rate_type": "hourly", "base_rate": 48.89, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Crafts Service Person", "rate_type": "hourly", "base_rate": 46.71, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},

    # First Aid
    {"union_local": "IATSE Local 80", "job_classification": "Supervisor Nurse", "rate_type": "hourly", "base_rate": 52.78, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Supervisor Nurse", "rate_type": "weekly", "base_rate": 2321.98, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Registered Nurse", "rate_type": "hourly", "base_rate": 50.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Registered Nurse", "rate_type": "weekly", "base_rate": 2208.64, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "First Aid Person", "rate_type": "hourly", "base_rate": 50.19, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "First Aid Person", "rate_type": "weekly", "base_rate": 2208.64, "location": "Los Angeles - Studio", "production_type": "theatrical", "effective_date": "2025-08-03"},

    # First Aid - Distant
    {"union_local": "IATSE Local 80", "job_classification": "Supervisor Nurse", "rate_type": "weekly", "base_rate": 3394.87, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "Registered Nurse", "rate_type": "weekly", "base_rate": 3229.15, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
    {"union_local": "IATSE Local 80", "job_classification": "First Aid Person", "rate_type": "weekly", "base_rate": 3229.15, "location": "Los Angeles - Distant", "production_type": "theatrical", "effective_date": "2025-08-03"},
]

# =============================================================================
# IATSE FRINGE RATES - Effective 08/03/2025
# =============================================================================
IATSE_FRINGE_RATES_2025 = [
    # $15 Million Contributors
    {"benefit_type": "health_welfare", "union_local": "IATSE", "rate_type": "flat_amount", "rate_value": 10.5975, "effective_date": "2025-08-03", "notes": "$15M Contributors - includes $0.63 CSATF"},
    {"benefit_type": "pension_iap", "union_local": "IATSE", "rate_type": "percentage", "rate_value": 6.0, "effective_date": "2025-08-03", "notes": "$15M Contributors - 6% of scale"},
    {"benefit_type": "vacation", "union_local": "IATSE", "rate_type": "percentage", "rate_value": 4.0, "effective_date": "2025-08-03", "notes": "$15M Contributors"},
    {"benefit_type": "holiday", "union_local": "IATSE", "rate_type": "percentage", "rate_value": 4.583, "effective_date": "2025-08-03", "notes": "$15M Contributors"},

    # Non-$15 Million Contributors
    {"benefit_type": "health_welfare", "union_local": "IATSE", "rate_type": "flat_amount", "rate_value": 15.5175, "effective_date": "2025-08-03", "notes": "Non-$15M Contributors"},
]

def insert_rate_cards(rates, source_name):
    """Insert rate cards via the API"""
    inserted = 0
    errors = []

    for rate in rates:
        try:
            # The API endpoint for inserting rates would need to be implemented
            # For now, we'll just print what would be inserted
            print(f"  {rate['union_local']} - {rate['job_classification']}: ${rate['base_rate']} ({rate['rate_type']}) - {rate['location']}")
            inserted += 1
        except Exception as e:
            errors.append(f"{rate['job_classification']}: {str(e)}")

    return inserted, errors

def main():
    print("=" * 70)
    print("PAYMASTER 2025-2026 RATE IMPORT")
    print("Source: EP Paymaster November 2025 Edition")
    print("=" * 70)

    all_rates = []

    print(f"\n### DGA Basic Agreement 2023-2026 (Year 3 - Effective 07/01/2025)")
    print(f"    {len(DGA_RATES_2025)} rates to insert")
    all_rates.extend(DGA_RATES_2025)

    print(f"\n### IATSE Local 44 Property (Effective 08/03/2025)")
    print(f"    {len(IATSE_LOCAL_44_RATES_2025)} rates to insert")
    all_rates.extend(IATSE_LOCAL_44_RATES_2025)

    print(f"\n### IATSE Local 80 Grips/Crafts Service/First Aid (Effective 08/03/2025)")
    print(f"    {len(IATSE_LOCAL_80_RATES_2025)} rates to insert")
    all_rates.extend(IATSE_LOCAL_80_RATES_2025)

    print(f"\n{'=' * 70}")
    print(f"TOTAL: {len(all_rates)} rate cards ready to insert")
    print(f"{'=' * 70}")

    # Output as JSON for database insertion
    output_file = "/Users/anthonyvazquez/ai-budget-system/database/union_contracts/extracted/paymaster_2025_rates.json"
    with open(output_file, 'w') as f:
        json.dump({
            "source": "EP Paymaster 2025-2026 (November 2025 Edition)",
            "extracted_date": str(date.today()),
            "rates": all_rates,
            "fringe_rates": IATSE_FRINGE_RATES_2025
        }, f, indent=2)

    print(f"\nRates exported to: {output_file}")
    print("\nTo insert into database, run the SQL or use the API endpoint.")

if __name__ == "__main__":
    main()
