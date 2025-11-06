import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request.headers.get('authorization'))

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        googleRefreshToken: true,
        googleCalendarId: true,
      },
    })

    return NextResponse.json({
      hasGoogleConnected: !!user?.googleRefreshToken,
      googleCalendarId: user?.googleCalendarId,
    })
  } catch (error) {
    console.error('Get user status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

