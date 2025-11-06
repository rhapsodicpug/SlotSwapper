# Vercel Deployment Guide for SlotSwapper

## Prerequisites

Before deploying to Vercel, you need:
1. A GitHub account (your code is already pushed)
2. A Vercel account (sign up at https://vercel.com)
3. A PostgreSQL database (SQLite won't work on Vercel)

---

## Step 1: Set Up PostgreSQL Database

Vercel doesn't support SQLite, so you need a PostgreSQL database. Recommended providers:

### Option 1: Vercel Postgres (Recommended - Easiest Integration)
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new database
4. Vercel will automatically add `POSTGRES_URL` and `POSTGRES_PRISMA_URL` environment variables

### Option 2: Supabase (Free Tier Available)
1. Go to https://supabase.com
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)
5. Use this as your `DATABASE_URL`

### Option 3: Neon (Free Tier Available)
1. Go to https://neon.tech
2. Create a new database
3. Copy the connection string from the dashboard
4. Use this as your `DATABASE_URL`

### Option 4: Railway (Simple Setup)
1. Go to https://railway.app
2. Create a PostgreSQL database
3. Copy the connection string
4. Use this as your `DATABASE_URL`

---

## Step 2: Update Prisma Schema for PostgreSQL

**Important:** You need to update your Prisma schema before deploying.

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then commit and push this change:
```bash
git add prisma/schema.prisma
git commit -m "Update Prisma schema for PostgreSQL"
git push
```

---

## Step 3: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Import Your Repository**
   - Go to https://vercel.com/new
   - Click **Import Git Repository**
   - Select `rhapsodicpug/SlotSwapper`
   - Click **Import**

2. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

3. **Set Environment Variables**
   Click **Environment Variables** and add:

   #### Required Variables:

   **DATABASE_URL**
   - If using Vercel Postgres: Use `POSTGRES_PRISMA_URL` (automatically added)
   - If using external database: Your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/database?schema=public`
   - Example: `postgresql://user:pass@db.abc123.supabase.co:5432/postgres?schema=public`

   **JWT_SECRET**
   - Generate a secure random secret:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Or use: https://generate-secret.vercel.app/32
   - Example: `6a3af1e8c78a341b27dbc16c75200e148ba26671b5be9b6068cdb99e6a9a3212`
   - **Important:** Use a different secret than your local development

   #### Optional Variables (For Google Calendar Integration):

   **GOOGLE_CLIENT_ID**
   - Get from: https://console.cloud.google.com/apis/credentials
   - Only needed if you want Google Calendar sync feature

   **GOOGLE_CLIENT_SECRET**
   - Get from: https://console.cloud.google.com/apis/credentials
   - Only needed if you want Google Calendar sync feature

   **GOOGLE_REDIRECT_URI**
   - Format: `https://your-app.vercel.app/api/auth/google/callback`
   - Replace `your-app` with your actual Vercel domain
   - Example: `https://slotswapper.vercel.app/api/auth/google/callback`
   - **Important:** Add this URL to your Google OAuth credentials as an authorized redirect URI

4. **Deploy**
   - Click **Deploy**
   - Wait for the build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GOOGLE_CLIENT_ID  # Optional
vercel env add GOOGLE_CLIENT_SECRET  # Optional
vercel env add GOOGLE_REDIRECT_URI  # Optional
```

---

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations:

### Option 1: Via Vercel CLI (Recommended)
```bash
vercel env pull .env.local  # Pull environment variables
npx prisma db push
```

### Option 2: Via Vercel Dashboard
1. Go to your project → **Settings** → **Functions**
2. Add a build command that includes migrations:
   ```
   npx prisma generate && npx prisma db push && npm run build
   ```

### Option 3: Manual Migration Script
Create a script to run migrations after deployment (see below).

---

## Step 5: Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Test signup/login functionality
- [ ] Test creating events
- [ ] Test swap functionality
- [ ] If using Google Calendar: Test OAuth flow
- [ ] Update Google OAuth redirect URI to production URL

---

## Environment Variables Summary

### Required (Minimum for Basic Functionality)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Secret for signing JWT tokens | `6a3af1e8c78a341b27dbc16c75200e148ba26671b5be9b6068cdb99e6a9a3212` |

### Optional (For Google Calendar Integration)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-abc123def456` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `https://your-app.vercel.app/api/auth/google/callback` |

---

## Troubleshooting

### Issue: Build fails with "JWT_SECRET is required"
**Solution:** Make sure `JWT_SECRET` is set in Vercel environment variables.

### Issue: Database connection errors
**Solution:** 
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check if SSL is required (add `?sslmode=require` to connection string)

### Issue: Prisma schema errors
**Solution:** 
- Make sure `prisma/schema.prisma` uses `provider = "postgresql"`
- Run `npx prisma generate` locally before deploying

### Issue: Google OAuth not working
**Solution:**
- Verify redirect URI matches exactly in Google Console
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure redirect URI uses HTTPS (Vercel provides HTTPS automatically)

---

## Quick Reference: Vercel Environment Variables Setup

1. Go to: `https://vercel.com/your-username/your-project/settings/environment-variables`
2. Add each variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Your PostgreSQL connection string
   - **Environment:** Production, Preview, Development (select all)
   
   Repeat for:
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)
   - `GOOGLE_REDIRECT_URI` (optional)

---

## Additional Notes

- Vercel automatically detects Next.js and configures build settings
- Environment variables are encrypted and secure
- You can set different values for Production, Preview, and Development environments
- After adding environment variables, redeploy your application for changes to take effect
- Vercel provides free SSL certificates automatically
- Database migrations should be run after each deployment if schema changes

---

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Prisma with Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- Next.js Deployment: https://nextjs.org/docs/deployment

