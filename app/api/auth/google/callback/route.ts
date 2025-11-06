import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Handles Google OAuth callback
 * Exchanges authorization code for tokens and saves them to user record
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // User ID
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent('Google OAuth cancelled')}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_parameters', request.url)
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      // If no refresh token, user might have already authorized
      // Try to get existing tokens or prompt for re-authorization
      return NextResponse.redirect(
        new URL('/dashboard?error=no_refresh_token', request.url)
      )
    }

    // Save tokens to user record
    await prisma.user.update({
      where: { id: state },
      data: {
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard?success=google_connected', request.url)
    )
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=oauth_failed', request.url)
    )
  }
}

