# SlotSwapper

A peer-to-peer time-slot scheduling application built with Next.js 14, TypeScript, and Prisma. Users can mark their busy calendar slots as "swappable" and request to swap them with slots from other users.

## 🎯 Features

- **User Authentication**: Secure signup/login with JWT tokens
- **Calendar Management**: Create, view, and manage your events
- **Slot Swapping**: Mark slots as swappable and request swaps with other users
- **Marketplace**: Browse available swappable slots from other users
- **Swap Requests**: Send and receive swap requests with accept/reject functionality
- **Google Calendar Integration**: (Optional) Sync with Google Calendar
- **Real-time Updates**: Dynamic state management with React Query

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rhapsodicpug/SlotSwapper.git
   cd SlotSwapper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env  # If .env.example exists
   # Or create .env manually
   ```

   Add the following to your `.env` file:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-secret-key-here"
   ```

   **Generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Copy the output and paste it as the value for `JWT_SECRET` in your `.env` file.

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Create database and run migrations
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
SlotSwapper/
├── app/                      # Next.js App Router
│   ├── (app)/               # Protected routes (require auth)
│   │   ├── calendar/       # Calendar view page
│   │   ├── marketplace/    # Marketplace page
│   │   └── requests/       # Swap requests page
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── events/         # Event CRUD endpoints
│   │   └── swap/           # Swap logic endpoints
│   └── (auth)/              # Public routes
│       ├── login/          # Login page
│       └── signup/         # Signup page
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   └── ...                 # Feature components
├── lib/                     # Utility libraries
│   ├── auth.ts             # JWT & password hashing
│   ├── prisma.ts           # Prisma client instance
│   ├── api.ts              # API client configuration
│   └── zustand.ts          # Global state management
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                  # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Day Picker** - Date picker component

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **SQLite** - Database (development) / PostgreSQL (production)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Playwright** - End-to-end testing
- **TypeScript** - Static type checking

## 🔐 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:./prisma/dev.db` (SQLite) or `postgresql://...` (PostgreSQL) |
| `JWT_SECRET` | Secret key for JWT token signing | Yes | Generated random 32-byte hex string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No | For Google Calendar integration |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No | For Google Calendar integration |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI | No | `http://localhost:3000/api/auth/google/callback` |

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema changes to database
npx prisma migrate   # Run database migrations

# Testing
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright tests with UI

# Linting
npm run lint         # Run ESLint
```

## 🗄️ Database Schema

### User
- `id` - Unique identifier
- `email` - Unique email address
- `name` - User's full name
- `password` - Hashed password
- `googleAccessToken` - Google OAuth token (optional)
- `googleRefreshToken` - Google refresh token (optional)
- `googleCalendarId` - Google Calendar ID (optional)

### Event
- `id` - Unique identifier
- `title` - Event title
- `startTime` - Event start time
- `endTime` - Event end time
- `status` - `BUSY`, `SWAPPABLE`, or `SWAP_PENDING`
- `ownerId` - Foreign key to User

### SwapRequest
- `id` - Unique identifier
- `status` - `PENDING`, `ACCEPTED`, or `REJECTED`
- `requesterId` - User requesting the swap
- `requestedUserId` - User receiving the swap request
- `mySlotId` - Requester's slot (foreign key to Event)
- `theirSlotId` - Requested user's slot (foreign key to Event)

## 🔌 API Endpoints

### Authentication

#### `POST /api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/auth/login`
Authenticate and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Events

#### `GET /api/events`
Get all events for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

#### `POST /api/events`
Create a new event.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "status": "BUSY"
}
```

#### `PUT /api/events/[id]`
Update an event.

**Headers:** `Authorization: Bearer <token>`

#### `DELETE /api/events/[id]`
Delete an event.

**Headers:** `Authorization: Bearer <token>`

### Swap Logic

#### `GET /api/swap/available`
Get all available swappable slots from other users.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `search` - Search by title
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `duration` - Filter by duration (minutes)

#### `POST /api/swap/request`
Create a swap request.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "mySlotId": "event_id_1",
  "theirSlotId": "event_id_2"
}
```

#### `POST /api/swap/respond/[id]`
Respond to a swap request (accept or reject).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "accept": true
}
```

#### `GET /api/swap/requests`
Get all swap requests (sent and received).

**Headers:** `Authorization: Bearer <token>`

## 🧪 Testing

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui
```

## 🚢 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret
4. Deploy!

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

### Database Setup for Production

For production, use PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` to your PostgreSQL connection string

3. Run migrations:
   ```bash
   npx prisma db push
   ```

See `SUPABASE_SETUP.md` or `POSTGRES_SETUP.md` for database setup guides.

## 🐛 Troubleshooting

### Issue: "JWT_SECRET environment variable is required"
**Solution:** Make sure you've created a `.env` file with `JWT_SECRET` set.

### Issue: Database connection errors
**Solution:** 
- Verify `DATABASE_URL` is correct
- Run `npx prisma generate` and `npx prisma db push`
- Check if database file exists: `ls prisma/dev.db`

### Issue: Port 3000 already in use
**Solution:** 
- Kill the process using port 3000
- Or set a different port: `PORT=3001 npm run dev`

### Issue: Prisma Client not generated
**Solution:** Run `npx prisma generate` after installing dependencies.

## 📚 Additional Documentation

- `VERCEL_DEPLOYMENT.md` - Detailed Vercel deployment guide
- `SUPABASE_SETUP.md` - Supabase PostgreSQL setup guide
- `POSTGRES_SETUP.md` - PostgreSQL setup options
- `ENV_SETUP.md` - Environment variables setup guide
- `SECURITY_AUDIT.md` - Security audit findings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Arya Manjardekar**
- GitHub: [@rhapsodicpug](https://github.com/rhapsodicpug)
- Email: arya.manjardekar@gmail.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- All the open-source contributors whose packages made this possible

---

**Happy Coding! 🎉**
