#!/bin/bash

# AI Budget System - Railway Deployment Script

echo "🚀 AI Budget System - Railway Deployment"
echo "========================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI found"
echo ""

# Login to Railway
echo "📝 Logging into Railway..."
railway login

echo ""
echo "🎯 Step 1: Initialize Railway project"
railway init

echo ""
echo "🗄️  Step 2: Adding PostgreSQL database..."
railway add

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

echo ""
echo "📊 Step 3: Applying database schema..."
railway run psql < database/schema.sql

echo ""
echo "🌱 Step 4: Seeding database with IATSE 2024 rates..."
railway run psql < database/seed_data.sql

echo ""
echo "🚢 Step 5: Deploying backend API..."
cd backend
railway up
cd ..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run 'railway open' to view your app"
echo "2. Test health endpoint: curl https://your-app.railway.app/health"
echo "3. View logs: railway logs"
echo ""
