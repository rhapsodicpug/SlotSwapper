import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Creates an authenticated OAuth2 client from a user's stored refresh token
 */
export async function getAuthenticatedClient(refreshToken: string): Promise<OAuth2Client> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  // Refresh the access token if needed
  const { credentials } = await oauth2Client.refreshAccessToken()
  oauth2Client.setCredentials(credentials)

  return oauth2Client
}

/**
 * Lists calendar events for a user
 */
export async function listCalendarEvents(
  refreshToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date
) {
  const auth = await getAuthenticatedClient(refreshToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  return response.data.items || []
}

/**
 * Updates a calendar event
 */
export async function updateCalendarEvent(
  refreshToken: string,
  eventId: string,
  updates: {
    summary?: string
    start?: { dateTime: string; timeZone?: string }
    end?: { dateTime: string; timeZone?: string }
    description?: string
  },
  calendarId: string = 'primary'
) {
  const auth = await getAuthenticatedClient(refreshToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: updates,
  })

  return response.data
}

/**
 * Creates a calendar event
 */
export async function createCalendarEvent(
  refreshToken: string,
  event: {
    summary: string
    start: { dateTime: string; timeZone?: string }
    end: { dateTime: string; timeZone?: string }
    description?: string
  },
  calendarId: string = 'primary'
) {
  const auth = await getAuthenticatedClient(refreshToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  })

  return response.data
}

