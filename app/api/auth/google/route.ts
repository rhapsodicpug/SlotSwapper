import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Initiates Google OAuth flow
 * Redirects user to Google consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request.headers.get('authorization'))

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: currentUser.id, // Pass user ID in state for security
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Google OAuth init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Google OAuth' },
      { status: 500 }
    )
  }
}

