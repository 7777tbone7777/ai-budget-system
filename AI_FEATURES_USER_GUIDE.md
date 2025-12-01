# AI Features User Guide
## AI-Powered Production Budgeting System

**Last Updated:** November 28, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Chart of Accounts (COA) System](#chart-of-accounts-coa-system)
3. [Smart Crew Builder](#smart-crew-builder)
4. [What-If Analyzer](#what-if-analyzer)
5. [Budget Guardian (Compliance & Audit)](#budget-guardian-compliance--audit)
6. [Union Agreement Management](#union-agreement-management)
7. [AI Fringe Calculator](#ai-fringe-calculator)
8. [General AI Features](#general-ai-features)
9. [API Reference](#api-reference)
10. [Use Cases & Workflows](#use-cases--workflows)

---

## Overview

The AI Budget System uses AI-powered features to automate and optimize film and TV production budgeting. The system includes five major AI-powered modules:

1. **Chart of Accounts System** - Professional account code structures compatible with industry-standard budgeting tools
2. **Smart Crew Builder** - Recommends appropriate crew sizes and positions based on production type with sequential account codes
3. **What-If Analyzer** - Compares budget scenarios across locations, shooting schedules, and configurations
4. **Budget Guardian** - Ensures union compliance and validates rates against collective bargaining agreements
5. **AI Fringe Calculator** - Automatically calculates payroll taxes and fringe benefits

All AI features are accessible via RESTful API endpoints at:
- **Production API:** `https://backend-production-8e04.up.railway.app`
- **Base Path:** `/api/ai/*` and `/api/*`

---

## Chart of Accounts (COA) System

**Purpose:** Provides industry-standard account code structures compatible with professional budgeting tools like Movie Magic, EP Budgeting, and studio-specific systems.

### Features

- **Multiple COA Templates** - Pre-configured templates for Standard Film/TV, AICP (commercials), and major studios
- **Sequential Account Codes** - Professional account numbering system with sequential codes within departments (e.g., 2001, 2002, 2003 for Production)
- **Industry Compatibility** - Account codes compatible with Movie Magic Budgeting, EP Budgeting, and other professional tools
- **Department Organization** - Structured account codes that group positions by department (20xx = Production, 22xx = Art, 33xx = Camera, etc.)
- **88+ Theatrical Crew Positions** - All theatrical crew templates include proper sequential account codes

### Available Chart of Accounts

The system currently includes four industry-standard COA templates:

1. **Standard Film/TV** (Movie Magic default)
   - 32 budget categories
   - Covers theatrical features, TV series, limited series
   - Account code ranges: 10-98 (Story & Rights through Contingency)

2. **AICP (Advertising/Commercials)**
   - 14 budget categories optimized for commercial production
   - Simplified structure for shorter production schedules
   - Account code ranges: 10-65

3. **Netflix Production**
   - Studio-specific account structure
   - Aligned with Netflix budgeting requirements
   - Enhanced categories for post-production and distribution

4. **Disney Production**
   - Studio-specific account structure
   - Aligned with Disney budgeting standards
   - Includes specific categories for family/franchise content

### How Account Codes Work

Account codes follow a hierarchical structure:

```
[Category Code][Sequential Number]

Examples:
  2001 - Unit Production Manager (Production Department)
  2002 - Line Producer (Production Department)
  2003 - First Assistant Director (Production Department)
  ...
  3301 - Director of Photography (Camera Department)
  3302 - Camera Operator (Camera Department)
  3303 - First AC (Camera Department)
```

**Benefits:**
- Easy to sort and organize budget line items
- Compatible with industry-standard tools
- Professional presentation for studio submissions
- Clear department groupings for analysis

### Account Code Categories

Standard Film/TV COA includes these major categories:

| Code | Category | Type |
|------|----------|------|
| 10xx | Story & Rights | Above the Line |
| 11xx | Producer | Above the Line |
| 12xx | Director | Above the Line |
| 13xx | Cast | Above the Line |
| 20xx | Production Staff | Below the Line |
| 21xx | Extra Talent | Below the Line |
| 22xx | Art Department | Below the Line |
| 23xx | Set Construction | Below the Line |
| 24xx | Set Operations | Below the Line |
| 25xx | Special Effects | Below the Line |
| 26xx | Set Dressing | Below the Line |
| 27xx | Property | Below the Line |
| 28xx | Picture Vehicles | Below the Line |
| 29xx | Wardrobe | Below the Line |
| 30xx | Makeup & Hair | Below the Line |
| 33xx | Camera | Below the Line |
| 34xx | Production Sound | Below the Line |
| 35xx | Transportation | Below the Line |
| 36xx | Location | Below the Line |
| 37xx | Production Film & Lab | Below the Line |
| 38xx | Travel & Living | Below the Line |
| 40xx | Editorial | Post-Production |
| 41xx | Music | Post-Production |
| 42xx | Post-Production Sound | Post-Production |
| 43xx | Post-Production Film & Lab | Post-Production |
| 44xx | Titles & Opticals | Post-Production |
| 45xx | Versioning | Post-Production |
| 50xx | Publicity | Other |
| 60xx | Insurance | Other |
| 65xx | General Expense | Other |
| 70xx | Fringe Benefits | Other |
| 80xx | Indirect Costs | Other |
| 98xx | Contingency | Other |

### API Endpoints

**Note:** Chart of Accounts management is currently handled at the database level. Future API endpoints will include:

- `GET /api/chart-of-accounts` - List all available COAs
- `GET /api/chart-of-accounts/:id` - Get specific COA structure
- `POST /api/productions/:id/set-coa` - Set COA for a production (coming soon)

### Crew Templates with Account Codes

All theatrical crew templates now include sequential account codes. When you auto-generate a budget, crew positions are assigned the following codes:

**Production (20xx):**
- 2001: Unit Production Manager
- 2002: Line Producer
- 2003: First Assistant Director
- 2004: Second Assistant Director
- 2005: Production Coordinator
- ... (15 positions total)

**Art Department (22xx):**
- 2201: Production Designer
- 2202: Art Director
- 2203: Set Designer
- 2204: Assistant Art Director
- ... (8 positions total)

**Camera (33xx):**
- 3301: Director of Photography
- 3302: Camera Operator
- 3303: First AC
- 3304: Second AC
- ... (7 positions total)

**Sound (34xx):**
- 3401: Production Sound Mixer
- 3402: Boom Operator
- 3403: Sound Utility

...and 16 more departments with sequential codes!

---

## Smart Crew Builder

**Purpose:** Automatically recommends crew composition based on production type, budget, and industry standards with professional account codes.

### Features

- **Production Type Recognition** - Supports theatrical features, multi-camera sitcoms, single-camera TV, documentaries, reality TV, and more
- **Smart Crew Recommendations** - Suggests appropriate department heads, crew sizes, and position classifications with sequential account codes
- **Union Rate Lookup** - Integrates with union rate cards (IATSE, DGA, SAG-AFTRA, WGA) - 1,911+ rate cards covering 34+ union locals
- **Cost Estimation** - Calculates total crew costs with fringes and taxes
- **Crew Optimization** - Suggests budget-saving crew configurations while maintaining sequential account numbering
- **Sequential Account Codes** - All recommended crew positions include proper account codes from the Chart of Accounts system

### API Endpoints

#### 1. Get Production Types
```
GET /api/ai/crew/production-types
```

**Description:** Returns list of supported production types (theatrical, multi_camera, single_camera, etc.)

**Response Example:**
```json
{
  "success": true,
  "production_types": [
    "theatrical",
    "multi_camera",
    "single_camera",
    "limited_series",
    "documentary",
    "reality_tv"
  ]
}
```

#### 2. Recommend Crew
```
POST /api/ai/crew/recommend
```

**Description:** Generates crew recommendations based on production parameters

**Request Body:**
```json
{
  "production_type": "multi_camera",
  "distribution_platform": "hb_svod",
  "episode_count": 13,
  "episode_length_minutes": 30,
  "shooting_location": "Los Angeles",
  "budget_target": 4000000
}
```

**Response Example:**
```json
{
  "success": true,
  "crew_recommendations": [
    {
      "department": "Camera",
      "positions": [
        {
          "classification": "Director of Photography",
          "union_local": "IATSE Local 600",
          "recommended_rate": 4500,
          "rate_type": "daily",
          "quantity": 1,
          "estimated_days": 65
        },
        {
          "classification": "Camera Operator",
          "union_local": "IATSE Local 600",
          "recommended_rate": 3200,
          "rate_type": "daily",
          "quantity": 2,
          "estimated_days": 65
        }
      ]
    }
  ],
  "total_estimated_cost": 1250000
}
```

#### 3. Parse Crew List
```
POST /api/ai/crew/parse
```

**Description:** Parses natural language or unstructured crew lists into standardized format

**Request Body:**
```json
{
  "crew_text": "We need a DP, 2 camera ops, key grip, best boy grip, gaffer, and 3 electrics"
}
```

#### 4. Optimize Crew
```
POST /api/ai/crew/optimize
```

**Description:** Suggests budget-saving crew configurations while maintaining quality

**Request Body:**
```json
{
  "production_id": "abc123",
  "target_reduction_pct": 15
}
```

**Response:** Returns optimized crew list with cost savings breakdown

#### 5. Apply Crew to Production
```
POST /api/ai/crew/apply/:productionId
```

**Description:** Applies recommended crew to a production budget

**Request Body:**
```json
{
  "crew_recommendations": [
    {
      "position_id": "uuid-1234",
      "quantity": 1,
      "rate": 4500,
      "days": 65
    }
  ]
}
```

#### 6. Get IATSE Videotape Rates
```
GET /api/ai/crew/union-rates/iatse-videotape
```

**Description:** Returns IATSE Videotape Agreement 2024-2027 rates (static JSON)

#### 7. Seed IATSE Videotape Rates
```
POST /api/ai/crew/union-rates/iatse-videotape/seed
```

**Description:** Seeds IATSE Videotape rates into the database

---

## What-If Analyzer

**Purpose:** Compare budget scenarios across different locations, shooting schedules, crew configurations, and production approaches.

### Features

- **Multi-Location Comparison** - Compare costs in Los Angeles, Georgia, New Mexico, New York, Canada, etc.
- **Tax Incentive Calculations** - Automatically calculates state tax credits and rebates
- **Schedule Variance Prediction** - Predicts cost impacts of schedule changes
- **Historical Variance Analysis** - Shows how similar productions performed
- **Scenario Comparison** - Side-by-side comparison of multiple budget approaches

### API Endpoints

#### 1. Analyze What-If Scenario
```
POST /api/ai/whatif/analyze
```

**Description:** Analyzes a single what-if scenario (location change, schedule change, crew change)

**Request Body:**
```json
{
  "production_id": "abc123",
  "scenario_type": "location_change",
  "parameters": {
    "new_location": "Atlanta, GA",
    "tax_incentive_rate": 30
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "scenario": {
    "original_cost": 4000000,
    "new_cost": 3200000,
    "savings": 800000,
    "savings_pct": 20,
    "breakdown": {
      "labor_savings": 400000,
      "tax_incentive": 400000
    }
  }
}
```

#### 2. Compare Scenarios
```
POST /api/ai/whatif/compare
```

**Description:** Compare multiple scenarios side-by-side

**Request Body:**
```json
{
  "production_id": "abc123",
  "scenarios": [
    {
      "name": "Los Angeles",
      "location": "Los Angeles, CA",
      "tax_incentive_rate": 20
    },
    {
      "name": "Atlanta",
      "location": "Atlanta, GA",
      "tax_incentive_rate": 30
    },
    {
      "name": "Albuquerque",
      "location": "Albuquerque, NM",
      "tax_incentive_rate": 35
    }
  ]
}
```

**Response:** Returns comparison table with costs, savings, and recommendations

#### 3. Predict Variance
```
POST /api/ai/whatif/predict-variance
```

**Description:** Predicts budget variance based on schedule changes

**Request Body:**
```json
{
  "production_id": "abc123",
  "schedule_change_days": 10,
  "departments_affected": ["Camera", "Grip", "Electric"]
}
```

#### 4. Parse What-If Query
```
POST /api/ai/whatif/parse
```

**Description:** Parses natural language what-if questions

**Request Body:**
```json
{
  "query": "What if we shot in Georgia instead of LA and added 2 weeks to the schedule?"
}
```

#### 5. Get Historical Variance Data
```
GET /api/ai/whatif/historical-variance
```

**Description:** Returns historical budget variance data for similar productions

**Query Parameters:**
- `production_type` - theatrical, multi_camera, etc.
- `budget_range` - low, medium, high
- `location` - shooting location

#### 6. Create What-If for Production
```
POST /api/ai/whatif/production/:productionId
```

**Description:** Creates a new what-if scenario for a production

---

## Budget Guardian (Compliance & Audit)

**Purpose:** Ensures budgets comply with union agreements, validates rates, and identifies compliance issues.

### Features

- **Union Compliance Auditing** - Checks rates against IATSE, DGA, SAG-AFTRA, WGA minimums
- **Rate Validation** - Validates that crew rates meet or exceed union minimums
- **Tax Incentive Guidance** - Recommends applicable state tax incentive programs
- **Compliance Rules Engine** - Maintains up-to-date union rules and requirements
- **Quick Audit** - Fast compliance check for productions

### API Endpoints

#### 1. Full Compliance Audit
```
POST /api/ai/guardian/audit/:productionId
```

**Description:** Runs comprehensive compliance audit on a production budget

**Response Example:**
```json
{
  "success": true,
  "audit_results": {
    "compliance_status": "PASS_WITH_WARNINGS",
    "issues_found": 3,
    "critical_issues": 0,
    "warnings": 3,
    "issues": [
      {
        "severity": "warning",
        "department": "Camera",
        "position": "2nd AC",
        "issue": "Rate is only $50 above union minimum",
        "union_minimum": 2800,
        "current_rate": 2850,
        "recommendation": "Consider increasing to $3000 to provide buffer"
      }
    ],
    "tax_incentive_eligibility": true,
    "estimated_tax_credits": 800000
  }
}
```

#### 2. Check Single Rate
```
POST /api/ai/guardian/check-rate
```

**Description:** Validates a single rate against union minimums

**Request Body:**
```json
{
  "union_local": "IATSE Local 600",
  "classification": "Director of Photography",
  "proposed_rate": 4200,
  "location": "Los Angeles - Studio",
  "production_type": "multi_camera"
}
```

**Response:**
```json
{
  "success": true,
  "is_compliant": true,
  "union_minimum": 4000,
  "proposed_rate": 4200,
  "buffer": 200,
  "buffer_pct": 5
}
```

#### 3. Get Tax Incentives
```
POST /api/ai/guardian/tax-incentives
```

**Description:** Returns applicable tax incentive programs for a production

**Request Body:**
```json
{
  "location": "Atlanta, GA",
  "production_type": "theatrical",
  "estimated_budget": 10000000
}
```

#### 4. Get Tax Programs
```
GET /api/ai/guardian/tax-programs
```

**Description:** Returns list of all state tax incentive programs

**Response Example:**
```json
{
  "success": true,
  "tax_programs": [
    {
      "state": "GA",
      "program_name": "Georgia Film Tax Credit",
      "rate": 30,
      "transferable": true,
      "minimum_spend": 500000,
      "description": "30% transferable tax credit on qualified spend"
    },
    {
      "state": "NM",
      "program_name": "New Mexico Film Production Tax Credit",
      "rate": 35,
      "refundable": true,
      "minimum_spend": 50000
    }
  ]
}
```

#### 5. Get Compliance Rules
```
GET /api/ai/guardian/compliance-rules
```

**Description:** Returns current union compliance rules

**Query Parameters:**
- `union_local` - Filter by union (e.g., "IATSE Local 600")
- `effective_date` - Get rules for specific date

#### 6. Quick Audit
```
GET /api/ai/guardian/quick-audit/:productionId
```

**Description:** Runs fast compliance check (no detailed analysis)

**Response:** Returns pass/fail and critical issues only

---

## Union Agreement Management

**Purpose:** Intelligently recommends and manages union agreements and sideletters based on production parameters.

### Features

- **Smart Agreement Recommendations** - Automatically suggests appropriate union agreements based on production type, platform, budget, and location
- **Production-Type Awareness** - Theatrical productions get theatrical agreements, TV productions get TV/Videotape agreements
- **Multi-Year Agreement Support** - Handles 3-year union agreements with annual rate increases (DGA 2023-2026, IATSE 2024-2027)
- **Date-Based Selection** - Automatically selects correct contract year based on production start date
- **Custom Sideletter Management** - Full backend API for production-specific negotiated agreements
- **Standard Sideletter Library** - Includes low-budget sideletters, Netflix agreements, SVOD agreements, and more

### How It Works

When creating a production, the system intelligently recommends union agreements based on:

1. **Production Type**
   - Theatrical features → IATSE Theatrical, SAG-AFTRA Theatrical, DGA Theatrical
   - TV productions → IATSE Videotape, SAG-AFTRA TV, DGA TV
   - Commercials → AICP agreements

2. **Distribution Platform**
   - High Budget SVOD (Netflix, Apple TV+) → Full-scale agreements
   - Network/Cable → Standard TV agreements
   - Low Budget platforms → Low-budget sideletters

3. **Production Start Date**
   - Determines which year of multi-year agreements applies
   - Example: DGA Basic Agreement 2023-2026 has different rates for Year 1 (2023), Year 2 (2024), Year 3 (2025)

4. **Budget Range**
   - Low-budget productions → Low-budget sideletters
   - High-budget productions → Full-scale agreements

### API Endpoints

#### 1. Get Agreement Recommendations
```
GET /api/agreements/recommend
```

**Description:** Returns intelligent union agreement recommendations based on production parameters

**Query Parameters:**
- `production_type` - theatrical, multi_camera, single_camera, etc.
- `distribution_platform` - hb_svod, network, cable, streaming, theatrical
- `start_date` - Production start date (determines contract year)
- `budget` - Optional budget amount for low-budget sideletter eligibility

**Response Example:**
```json
{
  "success": true,
  "recommendations": {
    "iatse": {
      "agreement_id": "iatse-videotape-2024-2027",
      "agreement_name": "IATSE Videotape Agreement 2024-2027",
      "contract_year": 2,
      "effective_dates": "08/03/2024 - 08/02/2025",
      "reason": "Multi-camera TV production"
    },
    "dga": {
      "agreement_id": "dga-basic-2023-2026",
      "agreement_name": "DGA Basic Agreement 2023-2026",
      "contract_year": 3,
      "effective_dates": "07/01/2025 - 06/30/2026",
      "reason": "Standard DGA agreement for TV"
    },
    "sag_aftra": {
      "agreement_id": "sag-aftra-tv-2023",
      "agreement_name": "SAG-AFTRA Television Agreement 2023",
      "reason": "High-budget SVOD television production"
    }
  }
}
```

#### 2. List All Agreements
```
GET /api/agreements
```

**Description:** Returns all available union agreements in the database

**Query Parameters:**
- `union` - Filter by union (IATSE, DGA, SAG-AFTRA, WGA)
- `production_type` - Filter by production type
- `is_active` - Filter active/inactive agreements

#### 3. Get Standard Sideletters
```
GET /api/sideletter-rules
```

**Description:** Returns standard sideletter templates (low-budget, Netflix, etc.)

**Query Parameters:**
- `union_local` - Filter by union
- `production_type` - Filter by production type
- `budget_threshold` - Filter by budget eligibility

### Custom Sideletter API (Backend Complete)

The system includes full backend support for production-specific custom negotiated sideletters. **UI implementation pending.**

#### 1. List Custom Sideletters for Production
```
GET /api/productions/:production_id/custom-sideletters
```

**Description:** Returns all custom sideletters for a production

#### 2. Get Custom Sideletter
```
GET /api/custom-sideletters/:id
```

**Description:** Get single custom sideletter by ID

#### 3. Create Custom Sideletter
```
POST /api/productions/:production_id/custom-sideletters
```

**Description:** Create new production-specific custom sideletter

**Request Body:**
```json
{
  "based_on_sideletter_id": "uuid-optional",
  "union_local": "IATSE Local 600",
  "sideletter_name": "101 Studios Multi-Show Agreement",
  "effective_date_start": "2025-01-01",
  "effective_date_end": "2026-12-31",
  "wage_scale_adjustment_pct": -5,
  "custom_overtime_rules": {
    "daily_ot_after": 12,
    "sixth_day_multiplier": 1.5,
    "seventh_day_multiplier": 2.0
  },
  "custom_meal_penalties": {
    "first_meal_after": 6,
    "penalty_amount": 25
  },
  "negotiated_by": "Jane Smith, Production Executive",
  "union_approved": true,
  "approval_date": "2024-12-15",
  "agreement_notes": "Multi-show deal for 3 productions"
}
```

#### 4. Clone from Standard Sideletter
```
POST /api/custom-sideletters/clone/:standard_id
```

**Description:** Creates custom sideletter by cloning a standard one

**Request Body:**
```json
{
  "production_id": "abc123",
  "modifications": {
    "wage_scale_adjustment_pct": -10
  }
}
```

#### 5. Update Custom Sideletter
```
PUT /api/custom-sideletters/:id
```

**Description:** Update existing custom sideletter

#### 6. Delete Custom Sideletter
```
DELETE /api/custom-sideletters/:id
```

**Description:** Soft delete (sets is_active = false) to preserve audit trail

#### 7. Apply Custom Sideletter to Production
```
POST /api/productions/:production_id/apply-custom-sideletter
```

**Description:** Apply custom sideletter to production budget

**Request Body:**
```json
{
  "sideletter_id": "custom-uuid-123"
}
```

### Union Rate Database

The system maintains 1,911+ union rate cards covering:

- **IATSE Locals:** 44, 52, 80, 600, 695, 700, 705, 706, 728, 729, 800, 839, 871, 892, Videotape
- **DGA:** Directors Guild of America
- **SAG-AFTRA:** Screen Actors Guild
- **WGA:** Writers Guild of America
- **Teamsters:** Local 399
- **DGC:** Directors Guild of Canada

**Rate Coverage:**
- 441 rate cards effective 2025 and later
- Multi-year agreements tracked with contract year (1, 2, or 3)
- Effective date ranges for proper rate selection

### Common Use Cases

**Use Case 1: High-Budget Netflix Series**
- Production Type: Multi-camera sitcom
- Platform: hb_svod
- Result: IATSE Videotape full-scale, DGA TV, SAG-AFTRA SVOD rates

**Use Case 2: Low-Budget Theatrical Feature**
- Production Type: Theatrical
- Budget: Under $2.5M
- Result: IATSE Low Budget Theatrical Sideletter, DGA Low Budget, SAG Ultra Low Budget

**Use Case 3: Custom Studio Deal**
- Major studio with negotiated multi-show agreement
- Clone standard sideletter → Modify wage scales → Apply to production
- Result: Custom sideletter with -5% wage adjustment, modified overtime rules

---

## AI Fringe Calculator

**Purpose:** Automatically calculates payroll taxes and fringe benefits (pension, health & welfare, vacation, holiday pay).

### Features

- **Union-Specific Fringe Rates** - Maintains current fringe rates for all major unions
- **Multi-State Support** - Handles state-specific tax rates and requirements
- **Automatic Calculation** - Calculates fringes based on gross wages
- **Fringe Auditing** - Validates fringe calculations for compliance
- **Suggested Rates** - Provides recommended fringe rates for positions

### API Endpoints

#### 1. Calculate Fringes for Production
```
POST /api/ai/fringes/calculate/:productionId
```

**Description:** Calculates all fringes for a production's crew

**Response Example:**
```json
{
  "success": true,
  "production_id": "abc123",
  "fringe_calculations": [
    {
      "position": "Director of Photography",
      "gross_wages": 292500,
      "fringes": {
        "pension": 24357,
        "health_welfare": 14625,
        "vacation": 14625,
        "payroll_taxes": 22372,
        "total_fringes": 75979
      },
      "total_cost": 368479
    }
  ],
  "summary": {
    "total_gross_wages": 1500000,
    "total_fringes": 375000,
    "total_cost": 1875000,
    "fringe_rate": 25
  }
}
```

#### 2. Apply Fringes to Production
```
POST /api/ai/fringes/apply/:productionId
```

**Description:** Applies calculated fringes to production budget line items

#### 3. Estimate Fringes
```
POST /api/ai/fringes/estimate
```

**Description:** Quick fringe estimate without full production data

**Request Body:**
```json
{
  "gross_wages": 50000,
  "union_local": "IATSE Local 600",
  "state": "CA"
}
```

#### 4. Get Fringe Rates
```
GET /api/ai/fringes/rates
```

**Description:** Returns current fringe rates for unions

**Query Parameters:**
- `union_local` - Filter by union
- `state` - Filter by state

#### 5. Audit Fringe Calculations
```
POST /api/ai/fringes/audit/:productionId
```

**Description:** Validates fringe calculations for compliance

---

## General AI Features

### AI Budget Generation
```
POST /api/ai/generate-budget
```

**Description:** Generates complete budget from production parameters

**Request Body:**
```json
{
  "production_type": "multi_camera",
  "distribution_platform": "hb_svod",
  "episode_count": 13,
  "budget_target": 4000000,
  "shooting_location": "Los Angeles"
}
```

### AI Budget Parsing
```
POST /api/ai/parse
```

**Description:** Parses existing budgets from text, PDFs, or spreadsheets

**Request Body:**
```json
{
  "budget_text": "Budget for Season 1\nCamera Department: $250,000\nGrip Department: $180,000..."
}
```

---

## API Reference

### Base URL
```
https://backend-production-8e04.up.railway.app
```

### Authentication
Currently, no authentication is required for API endpoints (development mode).

### Response Format
All endpoints return JSON with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Rate Limiting
No rate limiting currently enforced.

---

## Use Cases & Workflows

### Use Case 1: Budget a New Multi-Camera Sitcom

**Goal:** Create complete budget for 13-episode multi-camera sitcom shooting in Los Angeles

**Workflow:**

1. **Create Production**
   ```
   POST /api/productions
   Body: {
     "name": "My Sitcom Season 1",
     "production_type": "multi_camera",
     "distribution_platform": "hb_svod",
     "episode_count": 13,
     "shooting_location": "Los Angeles"
   }
   ```

2. **Get Crew Recommendations**
   ```
   POST /api/ai/crew/recommend
   Body: { production_id, production_type, episode_count, budget_target }
   ```

3. **Apply Crew to Production**
   ```
   POST /api/ai/crew/apply/:productionId
   Body: { crew_recommendations }
   ```

4. **Calculate Fringes**
   ```
   POST /api/ai/fringes/calculate/:productionId
   ```

5. **Run Compliance Audit**
   ```
   POST /api/ai/guardian/audit/:productionId
   ```

6. **Compare Location Scenarios**
   ```
   POST /api/ai/whatif/compare
   Body: {
     scenarios: [
       { name: "Los Angeles", location: "Los Angeles, CA" },
       { name: "Atlanta", location: "Atlanta, GA" }
     ]
   }
   ```

---

### Use Case 2: Validate Existing Budget for Compliance

**Goal:** Check if existing budget meets union minimums and compliance requirements

**Workflow:**

1. **Quick Audit**
   ```
   GET /api/ai/guardian/quick-audit/:productionId
   ```

2. **If issues found, run Full Audit**
   ```
   POST /api/ai/guardian/audit/:productionId
   ```

3. **Check Individual Rates**
   ```
   POST /api/ai/guardian/check-rate
   Body: { union_local, classification, proposed_rate, location }
   ```

4. **Audit Fringe Calculations**
   ```
   POST /api/ai/fringes/audit/:productionId
   ```

---

### Use Case 3: Optimize Budget to Hit Target

**Goal:** Reduce budget by 10% while maintaining quality and compliance

**Workflow:**

1. **Optimize Crew**
   ```
   POST /api/ai/crew/optimize
   Body: { production_id, target_reduction_pct: 10 }
   ```

2. **Compare Location Alternatives**
   ```
   POST /api/ai/whatif/analyze
   Body: {
     production_id,
     scenario_type: "location_change",
     parameters: { new_location: "Atlanta, GA" }
   }
   ```

3. **Run Compliance Check on Optimized Budget**
   ```
   POST /api/ai/guardian/audit/:productionId
   ```

---

### Use Case 4: Estimate Tax Incentives

**Goal:** Determine which state offers best tax incentives for theatrical feature

**Workflow:**

1. **Get All Tax Programs**
   ```
   GET /api/ai/guardian/tax-programs
   ```

2. **Get Specific Tax Incentives**
   ```
   POST /api/ai/guardian/tax-incentives
   Body: {
     location: "Atlanta, GA",
     production_type: "theatrical",
     estimated_budget: 15000000
   }
   ```

3. **Compare Scenarios with Tax Credits**
   ```
   POST /api/ai/whatif/compare
   Body: {
     scenarios: [
       { name: "Georgia", location: "Atlanta, GA", tax_incentive_rate: 30 },
       { name: "New Mexico", location: "Albuquerque, NM", tax_incentive_rate: 35 },
       { name: "New York", location: "New York, NY", tax_incentive_rate: 30 }
     ]
   }
   ```

---

## Summary

The AI Budget System provides 26 AI-powered endpoints across 4 major feature categories:

- **Smart Crew Builder**: 7 endpoints for crew recommendations and optimization
- **What-If Analyzer**: 6 endpoints for scenario comparison and variance prediction
- **Budget Guardian**: 6 endpoints for compliance auditing and rate validation
- **AI Fringe Calculator**: 5 endpoints for payroll tax and fringe calculations
- **General AI**: 2 endpoints for budget generation and parsing

All features are designed to work together to create accurate, compliant, optimized production budgets.

---

**For Technical Documentation:** See `CLAUDE.md`
**For API Server Details:** See `/backend/server.js`
**For Database Schema:** See `/database/schema.sql`
