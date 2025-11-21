# Railway Deployment Steps

Run these commands in your terminal (you're already logged in):

## Step 1: Navigate to project
```bash
cd /Users/anthonyvazquez/ai-budget-system
```

## Step 2: Initialize Railway project
```bash
railway init
```
- When prompted, choose: **"Create new project"**
- Name it: **ai-budget-system**

## Step 3: Add PostgreSQL database
```bash
railway add
```
- Select: **PostgreSQL**
- Wait ~10 seconds for database to provision

## Step 4: Apply database schema
```bash
railway run psql < database/schema.sql
```

## Step 5: Load IATSE 2024 data
```bash
railway run psql < database/seed_data.sql
```

## Step 6: Install backend dependencies
```bash
cd backend
npm install
cd ..
```

## Step 7: Deploy backend
```bash
cd backend
railway up
```

## Step 8: Get your URL and test
```bash
railway status
railway open
```

Then test: `curl https://your-app.railway.app/health`

---

**Paste the output of each command here so I can help debug any issues!**
