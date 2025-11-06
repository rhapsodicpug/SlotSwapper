import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Type assertion to ensure JWT_SECRET is always a string after the check
const JWT_SECRET_KEY: string = JWT_SECRET

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function createJWT(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET_KEY, { expiresIn: '7d' })
}

export function verifyJWT(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(authHeader: string | null): Promise<{ id: string; email: string; name: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyJWT(token)

  if (!decoded) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true },
  })

  return user
}

