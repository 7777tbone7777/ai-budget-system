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

### Schema Migration Gotcha
`CREATE TABLE IF NOT EXISTS` does NOT update existing tables with wrong schemas.
If a table exists but is missing columns, you must:
1. Check if required columns exist
2. DROP and recreate if schema is wrong
3. See `access-control.js` `ensureAccessTables()` for example pattern

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

| Endpoint | Description |
|----------|-------------|
| `GET /api/productions` | List all productions |
| `POST /api/productions` | Create production |
| `GET /api/productions/:id/categories` | Get budget categories |
| `POST /api/productions/:id/categories` | Create category |
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

---
*Last updated: 2025-11-23*
