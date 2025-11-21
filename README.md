# AI-Powered Production Budgeting System

An intelligent production budgeting platform that generates compliant, optimized film and TV budgets using collective bargaining agreements (CBAs) and AI-powered scenario generation.

## Features

- 📊 **Automated Budget Generation**: Create complete budgets in minutes vs. hours
- 🤖 **AI-Powered Scenarios**: Compare multiple locations and approaches instantly
- ✅ **CBA Compliance**: Built-in union agreement rules (IATSE, DGA, WGA, SAG-AFTRA)
- 🌎 **Multi-Location Support**: Compare LA, Georgia, New Mexico, NY, and more
- 💰 **Tax Incentive Calculator**: Automatic tax credit calculations by state
- 📈 **Smart Optimization**: AI suggests budget cuts to hit your target

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 14+
- **Deployment**: Railway
- **Frontend** (coming soon): Next.js + React

## Project Structure

```
ai-budget-system/
├── backend/              # Express API
│   ├── server.js        # Main API server
│   ├── db.js            # Database connection
│   └── package.json     # Dependencies
├── database/             # PostgreSQL schema & seed data
│   ├── schema.sql       # Database schema
│   └── seed_data.sql    # IATSE 2024 rates & rules
├── frontend/             # (Coming soon)
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Railway CLI installed: `npm i -g @railway/cli`
- Git installed

### Local Development Setup

1. **Clone and navigate to project**:
   ```bash
   cd ai-budget-system
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local PostgreSQL connection
   ```

4. **Run locally** (requires local PostgreSQL):
   ```bash
   npm run dev
   ```

## Railway Deployment (Recommended)

### Step 1: Initialize Railway Project

```bash
# Login to Railway
railway login

# Initialize new project
railway init

# Name it: ai-budget-system
```

### Step 2: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add
# Select: PostgreSQL

# Railway automatically creates:
# ✅ PostgreSQL database
# ✅ DATABASE_URL environment variable
# ✅ Connection credentials
```

### Step 3: Apply Database Schema

```bash
# Apply schema to Railway database
railway run psql < database/schema.sql

# Verify tables were created
railway connect postgres
# In psql:
\dt
# You should see 10 tables
\q
```

### Step 4: Seed Database with IATSE 2024 Rates

```bash
# Load seed data
railway run psql < database/seed_data.sql

# Verify data loaded
railway connect postgres
# In psql:
SELECT COUNT(*) FROM rate_cards;
SELECT COUNT(*) FROM sideletter_rules;
\q
```

### Step 5: Deploy Backend API

```bash
# Deploy backend to Railway
cd backend
railway up

# Railway will:
# ✅ Detect Node.js app
# ✅ Install dependencies
# ✅ Start Express server
# ✅ Provide public URL
```

### Step 6: Test Deployment

```bash
# Get your Railway URL
railway open

# Your API will be at: https://your-app.railway.app

# Test health endpoint
curl https://your-app.railway.app/health
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Rate Cards
```bash
# Get all rate cards
GET /api/rate-cards

# Filter by parameters
GET /api/rate-cards?union_local=IATSE Local 44&location=Los Angeles - Studio

# Get specific position rate
GET /api/rate-cards/position/Property Master?union_local=IATSE Local 44&location=Los Angeles - Studio&production_type=theatrical
```

### Sideletter Rules
```bash
# Determine applicable sideletter
POST /api/sideletters/determine
Body: {
  "production_type": "multi_camera",
  "distribution_platform": "hb_svod",
  "season_number": 1,
  "location": "Los Angeles"
}
```

### Crew Positions
```bash
# Get all crew positions
GET /api/crew-positions

# Filter by department
GET /api/crew-positions?department=Camera

# Filter by production type
GET /api/crew-positions?production_type=multi_camera
```

### Fringe Benefits
```bash
# Calculate total fringes
POST /api/fringes/calculate
Body: {
  "union_local": "IATSE Local 44",
  "state": "CA",
  "gross_wages": 50000
}
```

### Tax Incentives
```bash
# Get tax incentives by state
GET /api/tax-incentives?state=GA

# Response includes 30% Georgia Film Tax Credit
```

### Productions
```bash
# Create new production
POST /api/productions
Body: {
  "name": "My Sitcom S1",
  "production_type": "multi_camera",
  "distribution_platform": "hb_svod",
  "shooting_location": "Los Angeles",
  "state": "CA",
  "budget_target": 3900000,
  "episode_count": 12,
  "episode_length_minutes": 30,
  "season_number": 1,
  "principal_photography_start": "2024-09-01"
}

# Get all productions
GET /api/productions

# Get single production
GET /api/productions/:id
```

## Database Schema

The system includes 10 main tables:

1. **productions** - Project details
2. **union_agreements** - CBA documents and rules
3. **rate_cards** - Union minimum wages
4. **sideletter_rules** - Production-specific rate adjustments
5. **crew_positions** - Job classifications
6. **fringe_benefits** - Pension, health, taxes
7. **crew_templates** - Typical crew by show type
8. **budget_line_items** - Individual budget entries
9. **tax_incentives** - State tax credits
10. **budget_scenarios** - Saved budget comparisons

## Included Data

### IATSE 2024 Rates (Year 1 with 7% increase)

- **Local 44** (Property): Property Master, Assistant Property Master
- **Local 80** (Grips): Key Grip, Best Boy Grip, Dolly Grip
- **Local 600** (Camera): DP, Camera Operator, 1st AC, 2nd AC
- **Local 700** (Editors): Editor, Assistant Editor
- **Local 706** (Makeup/Hair): Department Heads
- **Local 728** (Electric): Gaffer, Best Boy Electric

### Sideletter Rules

- Multi-Camera (Network TV, HB SVOD, HB AVOD, HB FAST)
- Single-Camera (Seasons 1, 2, 3+)
- Low Budget SVOD/AVOD/FAST
- Long-Form/MOW
- Mini-Series

### Tax Incentives

- **Georgia**: 30% transferable credit
- **New Mexico**: 35% refundable credit
- **New York**: 30% refundable credit
- **California**: 20-25% transferable credit

## CLI Commands

```bash
# Database management
railway run psql                    # Connect to database
railway run psql < file.sql         # Run SQL file
railway variables                   # View environment variables

# Deployment
railway up                          # Deploy current directory
railway logs                        # View logs
railway open                        # Open in browser

# Development
cd backend && npm run dev           # Run locally with nodemon
cd backend && npm run db:reset      # Reset local database
```

## Example Use Case

**Budget a $4M multi-camera sitcom:**

1. Call `POST /api/productions` with show details
2. Call `POST /api/sideletters/determine` → Returns "Multi-Camera HB SVOD - Full Rates"
3. Call `GET /api/crew-positions?production_type=multi_camera` → Returns typical crew
4. For each position, call `GET /api/rate-cards/position/:classification` → Get union minimum
5. Call `POST /api/fringes/calculate` for each position → Add pension, health, taxes
6. Compare locations: Repeat for GA, NM, NY using `GET /api/tax-incentives`

## Next Steps

- [ ] Build frontend with Next.js
- [ ] Add AI integration (OpenAI/Claude)
- [ ] Implement budget generation engine
- [ ] Add scenario comparison feature
- [ ] Create PDF export functionality
- [ ] Add DGA, WGA, SAG-AFTRA agreements

## Database Access

```bash
# Connect to Railway PostgreSQL
railway connect postgres

# Useful queries:
SELECT * FROM current_rate_cards WHERE union_local = 'IATSE Local 44';
SELECT * FROM sideletter_rules WHERE production_type = 'multi_camera';
SELECT * FROM production_budget_summary;
```

## Environment Variables

Required environment variables (automatically set by Railway):

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Railway)
- `PORT` - API server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Support

For issues or questions:
- Check Railway logs: `railway logs`
- Test database connection: `curl https://your-app.railway.app/health`
- Connect to database: `railway connect postgres`

## License

MIT
