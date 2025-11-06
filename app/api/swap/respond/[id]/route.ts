import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request.headers.get('authorization'))

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { accept } = body

    if (typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'accept field must be a boolean' },
        { status: 400 }
      )
    }

    // Find the swap request with both slots and full user data
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
      include: {
        mySlot: true,
        theirSlot: true,
        requester: true, // Include full user data for Google tokens
        requestedUser: true,
      },
    })

    if (!swapRequest) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      )
    }

    // Verify current user is the requested user
    if (swapRequest.requestedUserId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to respond to this swap request' },
        { status: 403 }
      )
    }

    if (!accept) {
      // Reject the swap request
      await prisma.$transaction(async (tx) => {
        // Update swap request status to REJECTED
        await tx.swapRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
          },
        })

        // Update both events back to SWAPPABLE
        await tx.event.updateMany({
          where: {
            id: {
              in: [swapRequest.mySlotId, swapRequest.theirSlotId],
            },
          },
          data: {
            status: 'SWAPPABLE',
          },
        })
      })

      return NextResponse.json({ message: 'Swap request rejected' })
    } else {
      // Accept the swap request - this is the key transaction!
      const result = await prisma.$transaction(async (tx) => {
        // Update swap request status to ACCEPTED
        await tx.swapRequest.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
          },
        })

        // Swap the owners:
        // mySlot (requester's slot) goes to requestedUser
        await tx.event.update({
          where: { id: swapRequest.mySlotId },
          data: {
            ownerId: swapRequest.requestedUserId,
            status: 'BUSY',
          },
        })

        // theirSlot (requested user's slot) goes to requester
        await tx.event.update({
          where: { id: swapRequest.theirSlotId },
          data: {
            ownerId: swapRequest.requesterId,
            status: 'BUSY',
          },
        })

        // Return updated swap request
        return await tx.swapRequest.findUnique({
          where: { id },
          include: {
            mySlot: true,
            theirSlot: true,
            requester: true,
            requestedUser: true,
          },
        })
      })

      // After successful swap, update Google Calendars if connected
      try {
        // Update requester's calendar (they now own theirSlot)
        if (swapRequest.requester.googleRefreshToken && swapRequest.theirSlot.id) {
          await updateCalendarEvent(
            swapRequest.requester.googleRefreshToken,
            swapRequest.theirSlot.id,
            {
              summary: swapRequest.theirSlot.title,
              start: {
                dateTime: swapRequest.theirSlot.startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: swapRequest.theirSlot.endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              description: `Swapped with ${swapRequest.requestedUser.name}`,
            },
            swapRequest.requester.googleCalendarId || 'primary'
          )
        }

        // Update requested user's calendar (they now own mySlot)
        if (swapRequest.requestedUser.googleRefreshToken && swapRequest.mySlot.id) {
          await updateCalendarEvent(
            swapRequest.requestedUser.googleRefreshToken,
            swapRequest.mySlot.id,
            {
              summary: swapRequest.mySlot.title,
              start: {
                dateTime: swapRequest.mySlot.startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: swapRequest.mySlot.endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              description: `Swapped with ${swapRequest.requester.name}`,
            },
            swapRequest.requestedUser.googleCalendarId || 'primary'
          )
        }
      } catch (calendarError) {
        // Log but don't fail the swap if calendar update fails
        console.error('Failed to update Google Calendars:', calendarError)
      }

      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Respond to swap request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

