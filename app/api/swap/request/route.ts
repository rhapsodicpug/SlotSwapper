import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request.headers.get('authorization'))

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mySlotId, theirSlotId } = body

    if (!mySlotId || !theirSlotId) {
      return NextResponse.json(
        { error: 'mySlotId and theirSlotId are required' },
        { status: 400 }
      )
    }

    // Verify current user owns mySlotId
    const mySlot = await prisma.event.findUnique({
      where: { id: mySlotId },
    })

    if (!mySlot) {
      return NextResponse.json(
        { error: 'My slot not found' },
        { status: 404 }
      )
    }

    if (mySlot.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not own the specified slot' },
        { status: 403 }
      )
    }

    // Find their slot
    const theirSlot = await prisma.event.findUnique({
      where: { id: theirSlotId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!theirSlot) {
      return NextResponse.json(
        { error: 'Their slot not found' },
        { status: 404 }
      )
    }

    // Verify both slots are SWAPPABLE
    if (mySlot.status !== 'SWAPPABLE') {
      return NextResponse.json(
        { error: 'Your slot is not available for swapping' },
        { status: 400 }
      )
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      return NextResponse.json(
        { error: 'The requested slot is not available for swapping' },
        { status: 400 }
      )
    }

    // Get requestedUserId from theirSlot
    const requestedUserId = theirSlot.ownerId

    // Create swap request and update both events in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the swap request
      const swapRequest = await tx.swapRequest.create({
        data: {
          status: 'PENDING',
          requesterId: currentUser.id,
          requestedUserId: requestedUserId,
          mySlotId: mySlotId,
          theirSlotId: theirSlotId,
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
      })

      // Update both events to SWAP_PENDING
      await tx.event.updateMany({
        where: {
          id: {
            in: [mySlotId, theirSlotId],
          },
        },
        data: {
          status: 'SWAP_PENDING',
        },
      })

      return swapRequest
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create swap request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

