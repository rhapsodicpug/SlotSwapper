# Advanced Features Implementation Guide

## Feature 1: Google Calendar Integration

### Setup Required:
1. **Google Cloud Console Setup:**
   - Create a project at https://console.cloud.google.com
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (or your production URL)

2. **Environment Variables:**
   Add to your `.env` file:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   ```

3. **Database Migration:**
   Run: `npx prisma db push` (already done)

### How It Works:
- Users click "Connect Google Calendar" → Redirected to Google OAuth
- After authorization, tokens are saved securely
- "Sync with Google" imports events from Google Calendar
- When swaps are accepted, both users' Google Calendars are updated automatically

## Feature 2: Advanced Filtering & Search

### Implementation:
- Marketplace page now includes filter UI:
  - Keyword search (searches event titles)
  - Date range (start/end dates)
  - Duration filter (30min, 1hr, 2hr, etc.)
- Backend dynamically builds Prisma queries based on filters
- Filters are reactive - results update automatically as you type

## Feature 3: E2E Testing

### Run Tests:
```bash
npm run test:e2e        # Run tests headless
npm run test:e2e:ui    # Run with Playwright UI
```

### Test Coverage:
- Full swap flow: User A requests swap → User B accepts → Database verification
- Tests create/cleanup test users and events
- Verifies database state after swap completion

### Notes:
- Tests use a separate test database (configure in `playwright.config.ts`)
- Ensure dev server is running or tests will start it automatically

