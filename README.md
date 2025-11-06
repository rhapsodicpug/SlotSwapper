# SlotSwapper Backend API

A Next.js API backend for swapping time slots between users.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma db push
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory. See `.env.example` for a template, or use:

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="<generate-a-secure-random-secret>"
```

**Important:** 
- `JWT_SECRET` is **required** - the application will not start without it
- Generate a secure secret using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Never commit your `.env` file to version control
- See `ENV_SETUP.md` for detailed instructions

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
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

#### POST `/api/auth/login`
Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
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

### Events

#### POST `/api/events`
Create a new event.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "status": "BUSY" // Optional: BUSY, SWAPPABLE, SWAP_PENDING
}
```

#### GET `/api/events`
Get all events owned by the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/events/[id]`
Update an event (must be the owner).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated Meeting",
  "status": "SWAPPABLE"
}
```

#### DELETE `/api/events/[id]`
Delete an event (must be the owner).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Swap Logic

#### GET `/api/swap/available`
Get all available swappable slots (excluding user's own slots).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### POST `/api/swap/request`
Create a swap request.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "mySlotId": "event_id_1",
  "theirSlotId": "event_id_2"
}
```

#### POST `/api/swap/respond/[id]`
Respond to a swap request (accept or reject).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "accept": true // or false
}
```

#### GET `/api/swap/requests`
Get all swap requests (sent and received).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Database Schema

### User
- `id` (String, unique)
- `email` (String, unique)
- `name` (String)
- `password` (String, hashed)
- `createdAt`, `updatedAt`

### Event
- `id` (String, unique)
- `title` (String)
- `startTime` (DateTime)
- `endTime` (DateTime)
- `status` (String: "BUSY", "SWAPPABLE", "SWAP_PENDING")
- `ownerId` (String, foreign key to User)

### SwapRequest
- `id` (String, unique)
- `status` (String: "PENDING", "ACCEPTED", "REJECTED")
- `requesterId` (String, foreign key to User)
- `requestedUserId` (String, foreign key to User)
- `mySlotId` (String, foreign key to Event, unique)
- `theirSlotId` (String, foreign key to Event, unique)
- `createdAt`, `updatedAt`

## Notes

- All endpoints except `/api/auth/signup` and `/api/auth/login` require authentication via JWT token in the `Authorization` header.
- Password hashing uses bcrypt with salt rounds of 10.
- JWT tokens expire after 7 days.
- Database uses SQLite for simplicity. For production, consider PostgreSQL by updating the `DATABASE_URL` and Prisma schema provider.

