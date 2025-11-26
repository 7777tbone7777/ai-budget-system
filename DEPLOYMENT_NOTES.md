# Deployment Notes - AI Budget System

## Railway Deployment Architecture

**IMPORTANT**: Railway deploys from the **repository root**, not from subdirectories.

### Directory Structure
```
/ai-budget-system/          <- Railway deploys from HERE
├── package.json            <- ROOT package.json (Railway uses THIS)
├── backend/
│   ├── package.json        <- Backend's own package.json (NOT used by Railway directly)
│   └── server.js           <- Main server file
└── frontend/
    └── ...
```

### Root package.json Requirements

The **root** `/ai-budget-system/package.json` MUST have:

1. **`main` field** pointing to the backend server:
   ```json
   "main": "backend/server.js"
   ```

2. **`start` script** that runs the backend:
   ```json
   "scripts": {
     "start": "node backend/server.js"
   }
   ```

3. **ALL backend dependencies** merged into the root package.json:
   - `express`
   - `cors`
   - `helmet`
   - `morgan`
   - `pdfkit`
   - `pg`
   - `dotenv`
   - etc.

### Common Deployment Errors

#### "No start command was found"
**Cause**: Root package.json missing `start` script or `main` field
**Fix**: Add both to root package.json (see above)

#### "Cannot find module 'express'" (or other modules)
**Cause**: Dependencies only in `/backend/package.json`, not in root
**Fix**: Merge ALL backend dependencies into root `/package.json`

#### "password authentication failed for user"
**Cause**: DATABASE_URL has wrong password
**Fix**:
1. Verify password in Railway Postgres service variables
2. Update DATABASE_URL in backend service variables
3. Redeploy

### Deployment Commands

```bash
# Deploy from local (uploads current directory to Railway)
railway up --service backend

# Redeploy existing deployment
railway redeploy --service backend

# Check logs
railway logs --service backend

# Update environment variable
railway variables --service backend --set "KEY=value"
```

### Environment Variables (Backend)

Required in Railway backend service:
- `DATABASE_URL` - PostgreSQL connection string (use Railway's ${{Postgres.DATABASE_URL}} reference)
- `PORT` - Usually auto-set by Railway to 8080
- `NODE_ENV` - Set to `production`

### Password Rotation Checklist

When rotating PostgreSQL password:
1. Change password in PostgreSQL: `ALTER USER railway WITH PASSWORD 'newpass';`
2. Update `POSTGRES_PASSWORD` in Railway Postgres service variables
3. Update `DATABASE_URL` in Railway backend service variables
4. Redeploy backend service

---
*Last updated: 2025-11-22*
*Lessons learned from deployment troubleshooting session*
