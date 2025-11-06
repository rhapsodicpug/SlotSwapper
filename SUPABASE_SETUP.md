# Supabase PostgreSQL Setup Guide

Complete step-by-step guide to set up Supabase PostgreSQL database for SlotSwapper.

---

## Step 1: Create Supabase Account

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click **"Start your project"** (top right)

2. **Sign Up**
   - Click **"Sign in with GitHub"** (recommended)
   - Or use email/password
   - Authorize Supabase if using GitHub

---

## Step 2: Create a New Project

1. **Create Project**
   - Click **"New Project"** button
   - You'll see a form to fill out

2. **Fill Project Details**
   - **Organization:** Select or create one (free)
   - **Name:** `SlotSwapper` (or any name you prefer)
   - **Database Password:** 
     - ⚠️ **IMPORTANT:** Create a strong password
     - Save this password securely (you'll need it!)
     - Example: `MySecurePass123!@#`
   - **Region:** Choose closest to you:
     - `West US (California)` - US West
     - `East US (North Virginia)` - US East
     - `West EU (Ireland)` - Europe
     - `Southeast Asia (Singapore)` - Asia
   - **Pricing Plan:** Select **"Free"** (or Pro if you prefer)

3. **Create Project**
   - Click **"Create new project"**
   - ⏳ Wait 2-3 minutes for database to be provisioned

---

## Step 3: Get Your Database Connection String

### Method 1: Via Settings → Database (Most Common)

1. **Navigate to Settings**
   - Click the **⚙️ Settings** icon (gear icon) in the left sidebar
   - Or click **"Project Settings"** at the bottom of the sidebar

2. **Go to Database Section**
   - In Settings, click **"Database"** in the left menu
   - Or scroll down if you're already in Settings

3. **Find Connection String**
   - Look for **"Connection string"** or **"Connection pooling"** section
   - You might see tabs: **"URI"**, **"JDBC"**, **"Golang"**, etc.
   - Click on **"URI"** tab if not already selected
   - You'll see the connection string

4. **Copy Connection String**
   - You'll see something like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
     ```
   - ⚠️ **Important:** Replace `[YOUR-PASSWORD]` with your actual database password
   - The password you created in Step 2

### Method 2: Via Project Settings → Database (Alternative)

1. **Go to Project Settings**
   - Click on your project name (top left)
   - Click **"Settings"** → **"Database"**

2. **Find Connection Info**
   - Look for **"Connection string"**, **"Connection info"**, or **"Database URL"**
   - It might be under **"Connection pooling"** section

### Method 3: Via API Settings (Alternative)

1. **Go to Settings → API**
   - Click **⚙️ Settings** → **"API"**
   - Look for **"Database URL"** or connection information
   - Sometimes connection strings are shown here

### Method 4: Build It Manually (If Still Can't Find)

If you can't find the connection string, you can build it manually:

1. **Get Project Reference**
   - Go to **Settings** → **General**
   - Find **"Reference ID"** or **"Project Ref"**
   - It looks like: `abcdefghijklmnop` (random letters/numbers)

2. **Get Database Password**
   - This is the password you set when creating the project
   - If you forgot it, go to **Settings** → **Database** → **"Reset Database Password"**

3. **Build Connection String**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   
   Replace:
   - `[YOUR-PASSWORD]` with your database password
   - `[PROJECT-REF]` with your project reference ID

   **Example:**
   ```
   postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

### Method 5: Check Project Dashboard

1. **Go to Project Dashboard**
   - Click on your project in the dashboard
   - Look for **"Database"** card or section
   - Sometimes connection info is shown there

### Still Can't Find It?

**Try these steps:**

1. **Make sure project is fully loaded**
   - Wait a few minutes after creating project
   - Refresh the page (F5)

2. **Check different sections:**
   - Settings → Database
   - Settings → API
   - Settings → General (for project reference)

3. **Look for these keywords:**
   - "Connection string"
   - "Database URL"
   - "Connection info"
   - "URI"
   - "Postgres connection"

4. **Take a screenshot** and I can help you locate it!

### Final Connection String Format

Once you have it, it should look like:
```
postgresql://postgres:YourActualPassword123@db.xxxxx.supabase.co:5432/postgres
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with your actual password
- The `db.xxxxx.supabase.co` part contains your project reference
- Port is usually `5432`
- Database name is usually `postgres`

---

## Step 4: Test Connection (Optional)

You can test the connection string locally:

1. **Create `.env` file** (if not exists)
   ```bash
   DATABASE_URL="postgresql://postgres:YourPassword@db.xxxxx.supabase.co:5432/postgres"
   JWT_SECRET="your-jwt-secret-here"
   ```

2. **Test Connection**
   ```bash
   npx prisma db push
   ```

If successful, you'll see tables created in Supabase!

---

## Step 5: Add to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your SlotSwapper project

2. **Add Environment Variable**
   - Go to **Settings** → **Environment Variables**
   - Click **"Add New"**

3. **Add DATABASE_URL**
   - **Key:** `DATABASE_URL`
   - **Value:** Your Supabase connection string (with password replaced)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Add JWT_SECRET** (if not already added)
   - **Key:** `JWT_SECRET`
   - **Value:** Generate using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - **Environment:** Select all
   - Click **"Save"**

---

## Step 6: View Your Database in Supabase

1. **Go to Table Editor**
   - In Supabase dashboard, click **"Table Editor"** (left sidebar)
   - After running migrations, you'll see:
     - `User` table
     - `Event` table
     - `SwapRequest` table

2. **SQL Editor** (Optional)
   - Click **"SQL Editor"** to run queries
   - Useful for debugging

---

## Step 7: Run Database Migrations

After deploying to Vercel, you need to run migrations:

### Option 1: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### Option 2: Via Supabase SQL Editor

1. Go to Supabase → **SQL Editor**
2. Click **"New Query"**
3. Run Prisma migrations manually (not recommended)

### Option 3: Add to Vercel Build Command

In Vercel project settings:
- Go to **Settings** → **Build & Development Settings**
- Update **Build Command** to:
  ```
  npx prisma generate && npx prisma db push && npm run build
  ```

---

## Supabase Free Tier Limits

✅ **What's Included:**
- 500 MB database storage
- 2 GB bandwidth/month
- Unlimited API requests
- Up to 2 projects
- 50,000 monthly active users

⚠️ **Limitations:**
- Database size: 500 MB max
- Bandwidth: 2 GB/month
- No custom domains on free tier

---

## Security Best Practices

1. **Never commit your connection string**
   - It contains your password
   - Already in `.gitignore`

2. **Use different databases for:**
   - Development (local)
   - Production (Vercel)

3. **Rotate password if compromised**
   - Go to Supabase → Settings → Database
   - Click "Reset Database Password"

4. **Enable Row Level Security (RLS)** (Optional)
   - Supabase has built-in RLS
   - Not needed for this app (using Prisma)

---

## Troubleshooting

### Issue: "Connection refused"
**Solution:**
- Check if project is fully provisioned (wait 2-3 minutes)
- Verify connection string is correct
- Check if password is URL-encoded (special characters)

### Issue: "Password authentication failed"
**Solution:**
- Verify password matches what you set
- Check if password has special characters (may need URL encoding)
- Reset password in Supabase if needed

### Issue: "SSL required"
**Solution:**
- Supabase requires SSL by default
- Add `?sslmode=require` to connection string:
  ```
  postgresql://postgres:password@host:5432/postgres?sslmode=require
  ```

### Issue: "Database does not exist"
**Solution:**
- Default database name is `postgres`
- Verify connection string uses correct database name

---

## Quick Reference

**Supabase Dashboard:** https://supabase.com/dashboard

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Where to find:**
- Settings → Database → Connection string → URI

**Vercel Environment Variable:**
- Key: `DATABASE_URL`
- Value: Your Supabase connection string

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Get connection string
3. ✅ Add to Vercel environment variables
4. ✅ Deploy to Vercel
5. ✅ Run database migrations
6. ✅ Test your application!

---

## Need Help?

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Supabase Discord:** https://discord.supabase.com
- **Supabase GitHub:** https://github.com/supabase/supabase

