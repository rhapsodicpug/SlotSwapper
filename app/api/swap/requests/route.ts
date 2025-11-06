import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    // Find all swap requests where current user is either requester or requested user
    const swapRequests = await prisma.swapRequest.findMany({
      where: {
        OR: [
          { requesterId: currentUser.id },
          { requestedUserId: currentUser.id },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        requestedUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        mySlot: true,
        theirSlot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(swapRequests)
  } catch (error) {
    console.error('Get swap requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

