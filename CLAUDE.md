# AI Budget System - Claude Instructions

## Project Overview
AI-powered production budgeting system for film/TV with union rate calculations (IATSE, DGA, SAG-AFTRA, WGA).

## Quick Status Check
```bash
# Verify backend is running
curl -s https://backend-production-8e04.up.railway.app/api/productions | head -50

# Test AI endpoint
curl -s https://backend-production-8e04.up.railway.app/api/ai/crew/production-types | head -50
```

## Production URLs
- **Frontend:** https://ai-budget-system.vercel.app
- **Backend API:** https://backend-production-8e04.up.railway.app

## Architecture

```
/ai-budget-system/
├── backend/           # Express.js API server
│   └── server.js      # Main server (5000+ lines, AI routes at ~line 3484)
├── frontend/          # Next.js frontend
├── database/          # PostgreSQL schemas, seeds, union contracts
└── scripts/           # Utility scripts
```

## CRITICAL: Railway Deployment

**READ BEFORE ANY DEPLOYMENT ACTIONS**

Railway deploys from the **repository root**, NOT from /backend.

### Root package.json Must Have:
1. `"main": "backend/server.js"`
2. `"start": "node backend/server.js"` in scripts
3. ALL backend dependencies (express, cors, helmet, morgan, pdfkit, pg, dotenv)

### Common Errors:
- "No start command found" → Root package.json missing `start` script
- "Cannot find module 'express'" → Dependencies only in /backend/package.json, need to be in root
- "password authentication failed" → DATABASE_URL has wrong password

### Deployment Commands:
```bash
railway up --service backend          # Deploy local code
railway redeploy --service backend    # Redeploy existing
railway logs --service backend        # Check logs
railway variables --service backend   # View/set env vars
```

See `DEPLOYMENT_NOTES.md` for detailed troubleshooting.

## Database

- PostgreSQL hosted on Railway
- Connection: Use `${{Postgres.DATABASE_URL}}` reference in Railway
- Schema in `/database/schema.sql`
- **Migrations:** `/database/migrations/*.sql` (applied in numerical order)

### Schema Migration Gotcha
`CREATE TABLE IF NOT EXISTS` does NOT update existing tables with wrong schemas.
If a table exists but is missing columns, you must:
1. Check if required columns exist
2. DROP and recreate if schema is wrong
3. See `access-control.js` `ensureAccessTables()` for example pattern

### Running Migrations on Railway
When schema changes are made locally, they must be applied to Railway's database:

```bash
# Get Railway database credentials
railway variables --service backend | grep DATABASE_URL

# Run migration (example)
PGPASSWORD=<password> psql -h <host> -U <user> -d <database> -f database/migrations/001_add_4_level_hierarchy.sql
```

**CRITICAL:** Always test migrations locally first before running on production.

## Budget Hierarchy System (4-Level Structure)

**Status:** API implemented, migration created, **NOT YET DEPLOYED to Railway**

The budget system uses a 4-level hierarchy based on professional film/TV production budgeting standards:

### Architecture

```
Budget Metadata (Top Level)
  ├── Topsheet Categories (High-Level)
  │     ├── Accounts (Mid-Level Groupings)
  │     │     └── Line Items (Detailed Entries with Auto-Fringes)
```

### Database Tables

**Created by:** `/database/migrations/001_add_4_level_hierarchy.sql`

1. **`budget_metadata`** - Top-level budget information
   - Links to production
   - Tracks version, budget type (original/revised/final)
   - Stores aggregate totals and calculation timestamps
   - Fields: `id`, `production_id`, `budget_uuid`, `version_number`, `budget_type`, `total_topsheet_categories`, `total_accounts`, `total_detail_lines`

2. **`budget_topsheet`** - High-level categories (Above/Below the Line)
   - Represents major budget sections
   - Amortization support for episodic content
   - Auto-calculated rollups from accounts
   - Fields: `id`, `budget_id`, `category_number`, `category_name`, `current_subtotal`, `current_fringe`, `current_total`, `is_amortized`, `amortization_episodes`, `sort_order`

3. **`budget_accounts`** - Mid-level groupings
   - Groups related line items (e.g., "Camera Department", "Grip Department")
   - Auto-calculated rollups from line items
   - Fields: `id`, `topsheet_category_id`, `budget_id`, `account_code`, `account_name`, `current_subtotal`, `current_fringe`, `current_total`, `is_amortized`, `amortization_episodes`, `sort_order`

4. **`budget_line_items`** - Detailed budget entries
   - Individual positions, equipment, services
   - **Auto-calculated fringes** using union rates
   - Formula support for complex calculations
   - Fields: `id`, `account_id`, `budget_id`, `production_id`, `line_number`, `description`, `quantity`, `unit_type`, `rate`, `rate_type`, `multiplier`, `formula`, `current_subtotal`, `total_fringe_rate`, `current_fringe`, `current_total`, `union_local`, `position_id`, `fringe_breakdown` (JSONB), `is_amortized`, `amortization_episodes`, `per_episode_cost`, `is_corporate_deal`, `sort_order`

5. **`fringe_calculation_rules`** - Fringe benefit rate lookup
   - Union-specific fringe rates (pension, health, welfare, vacation, etc.)
   - State-specific rules
   - Effective date tracking
   - Fields: `id`, `union_local`, `state`, `position_classification`, `total_fringe_rate`, `fringe_breakdown` (JSONB), `effective_date_start`, `effective_date_end`

### Auto-Calculation Features

**Database Triggers** (created by migration):

1. **`trigger_calculate_line_item_totals`** - Calculates on INSERT/UPDATE of line items:
   - `current_subtotal = quantity × rate × multiplier`
   - `current_fringe = current_subtotal × total_fringe_rate`
   - `current_total = current_subtotal + current_fringe`
   - `per_episode_cost = current_total / amortization_episodes` (if amortized)

2. **`trigger_rollup_to_accounts`** - Aggregates line items → accounts:
   - Sums all line item subtotals, fringes, totals for each account
   - Triggered after line item INSERT/UPDATE/DELETE

3. **`trigger_rollup_to_topsheet`** - Aggregates accounts → topsheet:
   - Sums all account subtotals, fringes, totals for each category
   - Triggered after account rollup completes

4. **`trigger_update_metadata_counts`** - Updates budget metadata:
   - Counts total topsheet categories, accounts, and line items
   - Updates `last_calculation_date` timestamp
   - Triggered after any budget structure change

### API Endpoints

**Base path:** `/api/budgets` (registered in `server.js:75-77`, implemented in `/backend/api/budgets.js`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/budgets` | POST | Create new budget for production |
| `/api/budgets/:budget_id` | GET | Get budget metadata with production info |
| `/api/budgets/:budget_id/topsheet` | GET | Get topsheet summary with grand total |
| `/api/budgets/:budget_id/topsheet` | POST | Create topsheet category |
| `/api/budgets/:budget_id/accounts` | GET | Get all accounts (optionally filter by category_id) |
| `/api/budgets/:budget_id/accounts` | POST | Create account |
| `/api/budgets/:budget_id/line-items` | GET | Get line items (paginated, optionally filter by account_id) |
| `/api/budgets/:budget_id/line-items` | POST | Create line item (auto-calculates fringes!) |
| `/api/budgets/:budget_id/hierarchy` | GET | Get complete budget hierarchy view |
| `/api/fringe-rules` | GET | Get fringe calculation rules (filter by union, state, position) |
| `/api/fringe-rules/lookup` | GET | Smart lookup for applicable fringe rule |

### Testing

**Test script:** `/database/migrations/view_test_results.js`

Demonstrates the system by creating a sample multi-camera sitcom budget and displaying:
- Line item calculations (subtotal, fringe, total, per-episode)
- Account rollups
- Topsheet rollups
- Metadata counts

Run with:
```bash
cd /Users/anthonyvazquez/ai-budget-system/database/migrations
DATABASE_URL=<railway-db-url> node view_test_results.js
```

### Current Status & Known Issues

**CRITICAL ISSUE (2025-11-27):**

The budget hierarchy system was built and tested locally but **migrations have NOT been run on Railway's PostgreSQL database**. This causes errors when users try to view budgets:

**Error:** `"column bli.account_code does not exist"`

**Root Cause:**
- Backend code (server.js, /backend/api/budgets.js) references new budget hierarchy tables
- Frontend (/frontend/app/productions/[id]/budget/page.tsx) calls `/api/productions/${id}/line-items`
- This endpoint queries `budget_line_items` table which doesn't exist on Railway yet
- Migration `001_add_4_level_hierarchy.sql` needs to be applied to Railway database

**Fix Required:**
1. Apply migration `001_add_4_level_hierarchy.sql` to Railway PostgreSQL
2. Optionally apply `002_seed_fringe_rules.sql` for fringe calculation data
3. Test with `003_test_sample_budget.sql` or via API

**To Deploy Migration:**
```bash
# Get Railway DB credentials
railway variables --service backend | grep DATABASE_URL

# Parse DATABASE_URL to get connection details
# postgres://user:password@host:port/database

# Run migration
PGPASSWORD=<password> psql -h <host> -U <user> -d <database> -f database/migrations/001_add_4_level_hierarchy.sql
```

## AI Features (in server.js)

1. **Smart Crew Builder** - `/api/ai/crew/*`
2. **What-If Analyzer** - `/api/ai/whatif/*`
3. **Budget Guardian** - `/api/ai/guardian/*`

## Key Files

- `/backend/server.js` - Main API server
- `/backend/access-control.js` - User access management
- `/package.json` - ROOT package.json (Railway uses this)
- `/backend/package.json` - Backend's own package.json

## Union Contracts & Rate Cards

**GOAL: Comprehensive Rate Database**
The goal is to have ALL union agreements and rates in the database so users can easily create accurate budgets for ANY type of production. This includes:
- IATSE (all locals - 44, 80, 600, 667, 700, 706, 728, 873, Videotape, etc.)
- DGA (Directors Guild)
- SAG-AFTRA (Screen Actors Guild)
- WGA (Writers Guild)
- DGC (Directors Guild of Canada)

Rates should be kept current and updated as new agreements are ratified.

### IMPORTANT: Source of Truth
**The official union contracts/agreements are the source of truth for rates, NOT the EP Paymaster.**
- EP Paymaster is a compilation/reference guide - useful for cross-checking but not authoritative
- Always trace rates back to the actual union agreement documents
- Store the agreement reference (agreement_id) with each rate card

### Multi-Year Agreements
Most union agreements span 3 years with annual rate increases. The app must be smart about which rates apply:

| Agreement | Effective Dates | Current Year |
|-----------|-----------------|--------------|
| DGA Basic Agreement 2023-2026 | Y1: 07/01/2023, Y2: 07/01/2024, Y3: 07/01/2025 | Year 3 |
| IATSE Basic Agreement 2024-2027 | Y1: 08/03/2024, Y2: 08/03/2025, Y3: 08/03/2026 | Year 2 |

**Logic for rate selection:**
1. Check production's `principal_photography_start` date
2. Find the agreement that covers that date range
3. Select the rate with `effective_date` <= production start date
4. The `contract_year` field (1, 2, or 3) indicates which year of the agreement

**Current Status (as of 2025-11-23):**
- **1,911 rate cards** in production database (441 with 2025+ effective dates)
- Covers 34+ union locals including: IATSE (Locals 44, 52, 80, 600, 695, 700, 705, 706, 728, 729, 800, 839, 871, 892, Videotape), DGA, SAG-AFTRA, WGA, DGC, Teamsters 399
- 2025 rates imported from EP Paymaster 2025-2026 (November Edition)
- PDF contracts stored in `/database/union_contracts/`
- Extracted JSON data in `/database/union_contracts/extracted/`
- SQL seed files in `/database/guild_agreements/` (23 files - most already executed)

### Rate Card API Tools

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rate-cards` | GET | Get all rate cards with optional filters (union_local, location, production_type, agreement_id) |
| `/api/rate-cards/position/:classification` | GET | Get rates for a specific job classification |
| `/api/rate-cards/smart-lookup` | GET | Smart lookup with fuzzy matching and alias support |
| `/api/rate-cards/aliases` | GET | Get position name aliases (e.g., "DP" → "Director of Photography") |
| `/api/rate-cards/compare` | GET | Compare rates across different parameters |
| `/api/fringes/suggested` | GET | Get suggested fringe rates for a union (pension, health, etc.) |
| `/api/fringes/calculate` | POST | Calculate actual fringe amounts for gross wages |
| `/api/ai/crew/union-rates/iatse-videotape` | GET | Get IATSE Videotape 2024-27 rates (static JSON) |
| `/api/ai/crew/union-rates/iatse-videotape/seed` | POST | Seed IATSE Videotape rates into database |
| `/api/ai/guardian/check-rate` | POST | Check if a rate meets union minimums |

### To Add New Rates:

1. **Via API Seed Endpoint** (preferred):
   - Create endpoint like `/api/ai/crew/union-rates/{union}/seed`
   - Pattern: DELETE existing rates for that union, then INSERT new ones
   - See `server.js:3737` for IATSE Videotape example

2. **Via SQL Files**:
   - Add SQL to `/database/guild_agreements/`
   - Execute directly against Railway PostgreSQL
   - Use `ON CONFLICT DO NOTHING` to avoid duplicates

3. **Via Extracted JSON**:
   - Store extracted JSON in `/database/union_contracts/extracted/`
   - Create seed endpoint that reads JSON and inserts into `rate_cards`

## SECURITY - READ FIRST

**NEVER expose passwords or secrets in command output:**

1. When generating passwords, write to a temp file with restricted permissions:
   ```bash
   NEW_PW=$(openssl rand -base64 32 | tr -dc "a-zA-Z0-9" | head -c 32)
   echo "$NEW_PW" > /tmp/.newpw && chmod 600 /tmp/.newpw
   ```

2. When setting DATABASE_URL or other secrets, read from file:
   ```bash
   railway variables --service backend --set "DATABASE_URL=$(cat /tmp/.new_db_url)"
   ```

3. **NEVER** echo passwords directly to terminal
4. **NEVER** include passwords in inline command strings that will be logged
5. After use, clean up temp files: `rm /tmp/.newpw /tmp/.new_db_url`

## Testing Resources

- **Full Testing Plan:** `~/Downloads/AI_Budget_System_Testing_Plan.html`
- **Budget Templates:** `/database/budget_templates/` (extracted from sample PDFs)
- **Union Contracts:** `/database/union_contracts/extracted/`

## API Endpoints Quick Reference

### Production Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/productions` | List all productions |
| `POST /api/productions` | Create production |
| `GET /api/productions/:id` | Get production details |
| `GET /api/productions/:id/line-items` | Get line items (OLD - uses old schema) |

### Budget Hierarchy Endpoints (NEW)
| Endpoint | Description |
|----------|-------------|
| `POST /api/budgets` | Create new budget |
| `GET /api/budgets/:budget_id` | Get budget metadata |
| `GET /api/budgets/:budget_id/topsheet` | Get topsheet categories |
| `POST /api/budgets/:budget_id/topsheet` | Create topsheet category |
| `GET /api/budgets/:budget_id/accounts` | Get accounts |
| `POST /api/budgets/:budget_id/accounts` | Create account |
| `GET /api/budgets/:budget_id/line-items` | Get line items (paginated) |
| `POST /api/budgets/:budget_id/line-items` | Create line item with auto-fringe calc |
| `GET /api/budgets/:budget_id/hierarchy` | Get complete budget hierarchy |
| `GET /api/fringe-rules` | Get fringe calculation rules |
| `GET /api/fringe-rules/lookup` | Smart fringe rule lookup |

### AI & Analysis Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/ai/crew/production-types` | Get production types |
| `POST /api/ai/crew/recommend` | Get crew recommendations |
| `GET /api/ai/guardian/tax-programs` | Get tax incentive programs |
| `POST /api/ai/guardian/audit/:id` | Run compliance audit |
| `GET /api/ai/whatif/historical-variance` | Get variance data |

## Permissions (for Claude Code)

Pre-approved commands (no confirmation needed):
- `railway` CLI commands (service, logs, variables, up, redeploy)
- PostgreSQL via psql with the current password
- Reading files in /backend, /database, /tmp

## Lessons Learned (Pain Points from Development)

### 1. Password Exposure Incident
We accidentally echoed a database password to terminal, triggering GitGuardian.
**Always** use the secure password pattern in the SECURITY section above.

### 2. Railway Deployment Debugging Loop
Spent significant time with "cannot find module" errors because:
- Assumed Railway would use /backend/package.json (it doesn't)
- Didn't realize Railway deploys from repo root
**Before any deployment**: Re-read the CRITICAL: Railway Deployment section above.

### 3. Schema Migration Silent Failures
`CREATE TABLE IF NOT EXISTS` silently does nothing if table exists with wrong schema.
Error manifested as "column user_email does not exist" even though we "created" the table.
**Always** check if columns exist, not just if tables exist.

### 4. Long-Running Background Processes
PDF extraction scripts and `railway logs` commands accumulate in background.
After ~30 processes, session slows significantly.
**Clean up periodically**: `pkill -f "railway logs"; pkill -f "sleep [0-9]"`

### 5. Union Contract PDF Extraction
The PDFs in `/database/union_contracts/` are complex and extraction is imperfect.
Extracted JSON is in `/database/union_contracts/extracted/` but may need manual review.
Don't expect 100% accuracy from automated extraction.

### 6. Context Window Management
Sessions slow down as context grows. If responses feel slow:
- Use `/compact` to compress conversation
- Or start fresh (CLAUDE.md auto-loads context)

### 8. Vercel Authentication Gotcha
Vercel Pro accounts default to requiring authentication (401 errors).
**When deploying to Vercel, always use `--public` flag:**
```bash
vercel --prod --yes --public
```

### 7. User Has Dashboard Access
The user has direct access to Railway, Vercel, and other service dashboards.
**If debugging deployment/logs issues:**
1. First, ask the user to grab a screenshot from the dashboard (often faster)
2. If they decline, then use CLI commands to fetch logs
3. Screenshots can be read directly - just ask for the file path

### 9. Budget Hierarchy Migration Gap (2025-11-27)
Created comprehensive 4-level budget hierarchy system with:
- 5 new database tables (`budget_metadata`, `budget_topsheet`, `budget_accounts`, `budget_line_items`, `fringe_calculation_rules`)
- 4 database triggers for auto-calculations and rollups
- Complete API implementation in `/backend/api/budgets.js`
- Migration file `001_add_4_level_hierarchy.sql`

**The Problem:** Built and tested everything locally but forgot to run the migration on Railway's PostgreSQL database. When users clicked "View Budget", got error: `"column bli.account_code does not exist"`.

**Root Cause:** Frontend calls old `/api/productions/${id}/line-items` endpoint, which queries `budget_line_items` table that only exists locally.

**Lesson:** **Always deploy database migrations to production immediately after creating them**, or at minimum, add a clear "TODO: Deploy to Railway" comment in the migration file and CLAUDE.md. Don't assume schema changes will "just work" - they must be explicitly deployed.

**Prevention:**
- Create a migrations checklist in CLAUDE.md
- Add Railway migration deployment as a standard step in the development workflow
- Consider creating a `/database/migrations/README.md` with deployment instructions

### 10. Production Form UX & Union Agreement Intelligence (2025-11-27)

**User Feedback:** When selecting "Theatrical Feature" as production type, TV-specific fields like "Series Details", "Season Number", "Episode Count" should disappear.

**User Question:** Are union agreements auto-selected based on production parameters (type, platform, budget, location, start date)?

**Changes Made:**

1. **Frontend - Conditional Rendering** (`/frontend/app/productions/new/page.tsx`):
   - Added conditional logic to hide TV-specific fields when `production_type === 'theatrical'`
   - Hidden fields: Series Details section, Season Number, Episode Count, Episode Length
   - Form submission now only sends TV fields for non-theatrical productions
   - Improves UX by showing only relevant fields for each production type

2. **Backend - Smart Agreement Recommendations** (`/backend/server.js:5965`):
   - Enhanced `/api/agreements/recommend` endpoint with production-type-aware logic
   - For **Theatrical:** Prioritizes Theatrical/Motion Picture agreements (IATSE Theatrical, SAG-AFTRA Theatrical)
   - For **TV:** Prioritizes Television/Videotape agreements (IATSE Videotape, SAG-AFTRA TV)
   - Separate queries per union for more precise matching
   - Considers: production_type, distribution_platform, start_date (for multi-year agreements)
   - Foundation for budget-aware sideletter recommendations

**Lesson:** Union agreement selection is complex and context-dependent. The entertainment industry uses different agreements for theatrical vs. TV, and even within TV there are variations (network vs. cable vs. streaming). Building intelligent defaults requires understanding:
- Agreement types vary by union and production type
- Distribution platform affects sideletter eligibility
- Budget thresholds determine low-budget vs. full-scale rates
- Multi-year agreements require date-based selection
- Many productions negotiate custom sideletters (addressed in migration 004)

**Key Insight:** High Budget SVOD (Netflix, Apple TV+) is a significant consideration when selecting union agreements and sideletters. It determines:
- Whether low-budget sideletters apply (they typically don't for high-budget SVOD)
- Which wage scales and fringe rates are used
- Overtime rules and meal penalty calculations

### 11. Custom Sideletter Support (2025-11-27 - IN PROGRESS)

**Business Reality:** While standard sideletters exist, **custom negotiated sideletters are very common** in the entertainment industry, especially for:
- Major studios and prolific producers (101 Studios, Blumhouse, etc.)
- Multi-show deals with specific unions
- Productions with unique circumstances (remote locations, extended schedules)
- Budget-constrained shows needing customized wage scales

**Solution:** Migration `004_add_custom_sideletters.sql` created to support production-specific custom agreements.

**Database Schema:**
- New table: `custom_sideletters` with fields for:
  - Custom wage adjustments, holiday pay, vacation pay, pension, health & welfare
  - Flexible JSONB fields for overtime rules, meal penalties, turnaround, location provisions
  - Approval tracking (negotiated_by, union_approved, approval_date, union_contact)
  - Documentation (agreement_notes, document_url for signed PDFs)
  - Audit trail (created_by, created_at, updated_at, is_active)
- Updated `productions` table with:
  - `custom_sideletters` JSONB array to track applied custom agreements
  - `has_custom_agreements` boolean flag for reporting/audit purposes

**Status:** Database migration created, API endpoints pending, UI pending.

**Next Steps:**
- Complete backend API endpoints for CRUD operations on custom sideletters
- Build frontend UI for creating/editing custom sideletters
- Add "Clone from Standard" feature to use standard sideletters as templates
- Implement custom sideletter application to productions

---
*Last updated: 2025-11-27*
