# PostgreSQL Database Setup Guide

This guide shows you how to get a PostgreSQL database URL from various providers. Choose the one that works best for you.

---

## Option 1: Vercel Postgres (Recommended for Vercel Deployment) ⭐

**Best for:** Deploying on Vercel (easiest integration)

### Steps:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Sign in or create an account

2. **Create a New Project** (or use existing)
   - Click **"Add New"** → **"Project"**
   - Import your GitHub repository `rhapsodicpug/SlotSwapper`

3. **Add Postgres Database**
   - In your project dashboard, go to **"Storage"** tab
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Choose a name (e.g., `slotswapper-db`)
   - Select a region (choose closest to you)
   - Click **"Create"**

4. **Get Connection String**
   - Vercel automatically adds environment variables:
     - `POSTGRES_URL` - Direct connection
     - `POSTGRES_PRISMA_URL` - **Use this one for Prisma!**
   - Copy `POSTGRES_PRISMA_URL` value
   - Format: `postgres://default:password@host:5432/verceldb?sslmode=require`

5. **Use in Vercel**
   - Go to **Settings** → **Environment Variables**
   - Add: `DATABASE_URL` = `POSTGRES_PRISMA_URL` value
   - Or Vercel may auto-populate it

**Pros:** 
- ✅ Seamless integration with Vercel
- ✅ Automatic SSL
- ✅ Free tier available
- ✅ No separate account needed

**Cons:**
- ❌ Only works with Vercel projects

---

## Option 2: Supabase (Free Tier Available) 🆓

**Best for:** Free PostgreSQL with generous limits

### Steps:

1. **Sign Up**
   - Go to https://supabase.com
   - Click **"Start your project"**
   - Sign up with GitHub (easiest)

2. **Create New Project**
   - Click **"New Project"**
   - Fill in:
     - **Name:** SlotSwapper (or any name)
     - **Database Password:** Create a strong password (save it!)
     - **Region:** Choose closest to you
     - **Pricing Plan:** Free (or paid)
   - Click **"Create new project"**
   - Wait 2-3 minutes for setup

3. **Get Connection String**
   - Go to **Settings** (gear icon) → **Database**
   - Scroll to **"Connection string"** section
   - Copy the **"URI"** connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual password

4. **Example:**
   ```
   postgresql://postgres:yourpassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

**Pros:**
- ✅ Generous free tier (500MB database, 2GB bandwidth)
- ✅ Great dashboard and tools
- ✅ Works with any hosting provider
- ✅ Built-in authentication (bonus feature)

**Cons:**
- ❌ Requires separate account

**Free Tier Limits:**
- 500 MB database storage
- 2 GB bandwidth/month
- Unlimited API requests

---

## Option 3: Neon (Serverless PostgreSQL) ⚡

**Best for:** Serverless, auto-scaling PostgreSQL

### Steps:

1. **Sign Up**
   - Go to https://neon.tech
   - Click **"Sign Up"**
   - Sign up with GitHub

2. **Create Project**
   - Click **"Create Project"**
   - Fill in:
     - **Name:** SlotSwapper
     - **Region:** Choose closest
     - **PostgreSQL Version:** 15 (default)
   - Click **"Create Project"**

3. **Get Connection String**
   - After project creation, you'll see **"Connection Details"**
   - Copy the **"Connection string"**
   - Format: `postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Password is auto-generated (copy it!)

4. **Alternative Method:**
   - Go to **Dashboard** → Your project
   - Click **"Connection Details"**
   - Copy the connection string

**Pros:**
- ✅ Serverless (scales automatically)
- ✅ Free tier available
- ✅ Branching (create database branches)
- ✅ Fast setup

**Cons:**
- ❌ Newer service (less established)

**Free Tier Limits:**
- 0.5 GB storage
- Unlimited projects
- Auto-suspend after inactivity

---

## Option 4: Railway 🚂

**Best for:** Simple setup, good free tier

### Steps:

1. **Sign Up**
   - Go to https://railway.app
   - Click **"Start a New Project"**
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click **"New Project"**
   - Select **"Provision PostgreSQL"**
   - Wait for database to be created

3. **Get Connection String**
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - Find **"DATABASE_URL"** variable
   - Copy the value
   - Format: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

**Pros:**
- ✅ Very simple setup
- ✅ Good free tier ($5 credit/month)
- ✅ Easy to use dashboard

**Cons:**
- ❌ Free tier limited

---

## Option 5: Render 🎨

**Best for:** Simple PostgreSQL hosting

### Steps:

1. **Sign Up**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click **"New +"** → **"PostgreSQL"**
   - Fill in:
     - **Name:** slotswapper-db
     - **Database:** slotswapper (or default)
     - **User:** slotswapper (or default)
     - **Region:** Choose closest
     - **PostgreSQL Version:** 15
     - **Plan:** Free (or paid)
   - Click **"Create Database"**

3. **Get Connection String**
   - Wait for database to be created
   - Go to database dashboard
   - Find **"Internal Database URL"** or **"External Database URL"**
   - Copy the connection string
   - Format: `postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/dbname`

**Pros:**
- ✅ Free tier available
- ✅ Simple interface

**Cons:**
- ❌ Free tier pauses after inactivity
- ❌ Slower cold starts

---

## Quick Comparison Table

| Provider | Free Tier | Best For | Setup Time |
|----------|-----------|----------|------------|
| **Vercel Postgres** | ✅ Yes | Vercel deployments | ⚡ Instant |
| **Supabase** | ✅ Yes (500MB) | General use | 🕐 2-3 min |
| **Neon** | ✅ Yes (0.5GB) | Serverless | 🕐 1-2 min |
| **Railway** | ✅ Yes ($5 credit) | Simple setup | 🕐 1 min |
| **Render** | ✅ Yes | Simple hosting | 🕐 2-3 min |

---

## Recommended: Vercel Postgres for Vercel Deployment

If you're deploying to Vercel, **use Vercel Postgres** - it's the easiest option:

1. No separate account needed
2. Automatic environment variable setup
3. Seamless integration
4. Free tier available

---

## After Getting Your Database URL

1. **Copy the connection string** (it looks like):
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

2. **Add to Vercel Environment Variables:**
   - Go to Vercel project → **Settings** → **Environment Variables**
   - Add new variable:
     - **Key:** `DATABASE_URL`
     - **Value:** Your connection string
     - **Environment:** Production, Preview, Development (select all)

3. **For Local Development:**
   - Create `.env` file in project root
   - Add: `DATABASE_URL="your-connection-string-here"`

4. **Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

## Security Notes

- ✅ Never commit your database URL to Git
- ✅ Use different databases for development and production
- ✅ Keep your database password secure
- ✅ Use SSL connections (`?sslmode=require`)

---

## Troubleshooting

### Connection Refused
- Check if database is running (some free tiers pause after inactivity)
- Verify connection string is correct
- Check firewall/network settings

### SSL Required
- Add `?sslmode=require` to connection string
- Some providers require SSL by default

### Authentication Failed
- Verify username and password are correct
- Check if special characters in password are URL-encoded

---

## Need Help?

- **Vercel Postgres Docs:** https://vercel.com/docs/storage/vercel-postgres
- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Neon Docs:** https://neon.tech/docs
- **Railway Docs:** https://docs.railway.app/databases/postgresql
- **Render Docs:** https://render.com/docs/databases

