# Troubleshooting Internal Server Error

## Quick Fix Steps:

1. **Stop your dev server** (press `Ctrl+C` in the terminal where it's running)

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

4. **Try signing up again** at `http://localhost:3000/signup`

## Check Server Logs

When you try to sign up, check your terminal where `npm run dev` is running. You should see detailed error messages now that will help identify the issue.

## Common Issues:

- **Server started before .env file existed** → Restart the server
- **Prisma client not generated** → Run `npx prisma generate`
- **Database not initialized** → Run `npx prisma db push`

## Test Credentials:

After restarting, try:
- **Name:** Test User
- **Email:** test@example.com  
- **Password:** test123

The error messages in the console will now show more details about what's failing.

