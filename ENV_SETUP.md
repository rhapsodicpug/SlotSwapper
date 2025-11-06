# Environment Variables Guide

## DATABASE_URL

### For SQLite (Development - Current Setup)
```bash
DATABASE_URL="file:./prisma/dev.db"
```
- This creates a local SQLite database file
- No external setup needed
- Perfect for development and testing

### For PostgreSQL (Production)
Get your connection string from your database provider:

**Railway:**
1. Go to https://railway.app
2. Create a PostgreSQL database
3. Copy the connection string from the database dashboard

**Render:**
1. Go to https://render.com
2. Create a PostgreSQL database
3. Copy the connection string from the database dashboard

**Supabase:**
1. Go to https://supabase.com
2. Create a project
3. Go to Settings → Database → Connection String
4. Copy the connection string

**Neon:**
1. Go to https://neon.tech
2. Create a database
3. Copy the connection string from the dashboard

**Format:**
```bash
DATABASE_URL="postgresql://username:password@host:5432/database_name?schema=public"
```

## JWT_SECRET

Generate a secure random secret string yourself. This is used to sign JWT tokens.

### Option 1: Using Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Using Online Generator
Visit: https://generate-secret.vercel.app/32

### Example Generated Secret:
```
6a3af1e8c78a341b27dbc16c75200e148ba26671b5be9b6068cdb99e6a9a3212
```

**Important:** 
- Keep this secret secure and private
- Never commit it to version control
- Use different secrets for development and production
- If compromised, regenerate and invalidate all existing tokens

## Complete .env File Example

### Development (SQLite)
```bash
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-generated-secret-key-here"
```

### Production (PostgreSQL)
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="your-generated-secret-key-here"
```

## Setting Up .env File

1. Create a `.env` file in the root directory
2. Add the variables above
3. Replace the placeholder values with your actual values
4. Never commit `.env` to git (it's already in `.gitignore`)

## Updating Prisma Schema for PostgreSQL

If switching to PostgreSQL, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma db push
```

