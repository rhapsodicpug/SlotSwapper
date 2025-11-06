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

    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const duration = searchParams.get('duration') // in minutes

    // Build dynamic where clause
    const where: any = {
      status: 'SWAPPABLE',
      ownerId: {
        not: currentUser.id,
      },
    }

    // Add search filter (search in title)
    // Note: For SQLite, we'll filter in memory after fetching
    // For PostgreSQL, you can use: where.title = { contains: search, mode: 'insensitive' }
    if (!search) {
      // Only add to where clause if not searching (we'll filter in memory for case-insensitive)
    }

    // Add date range filter
    if (startDate) {
      where.startTime = {
        ...where.startTime,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.endTime = {
        ...where.endTime,
        lte: new Date(endDate),
      }
    }

    // Add duration filter
    if (duration) {
      const durationMinutes = parseInt(duration, 10)
      if (!isNaN(durationMinutes)) {
        // Calculate duration in milliseconds
        const durationMs = durationMinutes * 60 * 1000

        where.AND = [
          {
            // Duration is calculated as endTime - startTime
            // We need to filter events where duration is approximately equal to requested duration
            // Using a range to account for slight variations
            startTime: {
              lte: {
                // This is a simplified approach - for exact duration matching,
                // we'd need to compute duration in the query
                // For now, we'll filter by a reasonable range
              },
            },
          },
        ]

        // More precise duration filtering using Prisma's raw query capability
        // For SQLite, we'll use a simpler approach: filter by approximate duration
        // Note: Prisma doesn't directly support computed fields in where clauses,
        // so we'll fetch and filter in memory for duration, or use a raw query
        // For production, consider using a database view or computed column
      }
    }

    // Get all events where status is SWAPPABLE and owner is not the current user
    let swappableSlots = await prisma.event.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Apply duration filter in memory if specified
    if (duration) {
      const durationMinutes = parseInt(duration, 10)
      if (!isNaN(durationMinutes)) {
        const durationMs = durationMinutes * 60 * 1000
        const tolerance = 5 * 60 * 1000 // 5 minute tolerance

        swappableSlots = swappableSlots.filter((slot: { startTime: Date | string; endTime: Date | string }) => {
          const slotDuration = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()
          return Math.abs(slotDuration - durationMs) <= tolerance
        })
      }
    }

    // Apply case-insensitive search filter in memory (SQLite limitation)
    if (search) {
      const searchLower = search.toLowerCase()
      swappableSlots = swappableSlots.filter((slot: { title: string }) => 
        slot.title.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(swappableSlots)
  } catch (error) {
    console.error('Get swappable slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

