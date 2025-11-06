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
    const { title, startTime, endTime, status } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'BUSY',
        ownerId: currentUser.id,
      },
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

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request.headers.get('authorization'))

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const events = await prisma.event.findMany({
      where: {
        ownerId: currentUser.id,
      },
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

    return NextResponse.json(events)
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

