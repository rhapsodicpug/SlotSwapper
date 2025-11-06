import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { listCalendarEvents } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

/**
 * Syncs Google Calendar events to SlotSwapper
 */
export async function POST(request: NextRequest) {
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
    })

    if (!user?.googleRefreshToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }

    // Get events from Google Calendar (next 30 days)
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 30)

    const googleEvents = await listCalendarEvents(
      user.googleRefreshToken,
      user.googleCalendarId || 'primary',
      timeMin,
      timeMax
    )

    // Upsert events into SlotSwapper
    const upsertedEvents = await Promise.all(
      googleEvents.map(async (event) => {
        if (!event.start?.dateTime && !event.start?.date) {
          return null
        }

        const startTime = event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!)
        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
          ? new Date(event.end.date)
          : new Date(startTime.getTime() + 60 * 60 * 1000) // Default 1 hour

        return prisma.event.upsert({
          where: {
            id: event.id || `google-${event.iCalUID || startTime.getTime()}`,
          },
          update: {
            title: event.summary || 'Untitled Event',
            startTime,
            endTime,
            // Keep existing status, don't override
          },
          create: {
            id: event.id || `google-${event.iCalUID || startTime.getTime()}`,
            title: event.summary || 'Untitled Event',
            startTime,
            endTime,
            status: 'BUSY', // Default to BUSY for synced events
            ownerId: user.id,
          },
        })
      })
    )

    const validEvents = upsertedEvents.filter((e) => e !== null)

    return NextResponse.json({
      message: `Synced ${validEvents.length} events`,
      events: validEvents,
    })
  } catch (error: any) {
    console.error('Sync Google Calendar error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Google Calendar',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

