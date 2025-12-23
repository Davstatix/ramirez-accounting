import { NextRequest, NextResponse } from 'next/server'
import { sendAdminCalendarBookingEmail } from '@/lib/email'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Google Calendar API push notification
    // Google Calendar sends notifications when events are created/updated
    if (body.type === 'sync' || body.syncToken) {
      // This is a Google Calendar push notification
      // You'll need to fetch the actual event details using Google Calendar API
      // For now, we'll log it - you can extend this to fetch event details
      console.log('Google Calendar push notification received')
      
      // Note: To fully implement this, you'd need to:
      // 1. Set up Google Calendar API OAuth
      // 2. Use the sync token to fetch new events
      // 3. Parse event details and send notification
      
      return NextResponse.json({ success: true, message: 'Google Calendar notification received' })
    }

    // Handle Calendly webhook format (if you want to keep support)
    if (body.event === 'invitee.created' || body.event === 'invitee.canceled') {
      const invitee = body.payload?.invitee
      const event = body.payload?.event_type
      
      if (body.event === 'invitee.created') {
        const bookingDetails = {
          eventType: event?.name || 'Discovery Call',
          startTime: body.payload?.scheduled_event?.start_time 
            ? new Date(body.payload.scheduled_event.start_time).toLocaleString()
            : undefined,
          endTime: body.payload?.scheduled_event?.end_time
            ? new Date(body.payload.scheduled_event.end_time).toLocaleString()
            : undefined,
          timezone: body.payload?.scheduled_event?.timezone || 'America/New_York',
          meetingUrl: body.payload?.scheduled_event?.location?.location || 
                     body.payload?.scheduled_event?.location?.join_url || 
                     undefined,
        }

        await sendAdminCalendarBookingEmail(
          invitee?.name || 'Unknown',
          invitee?.email || '',
          bookingDetails
        )

        return NextResponse.json({ success: true, message: 'Booking notification sent' })
      }
    }

    // Handle Cal.com webhook format (if you want to keep support)
    if (body.triggerEvent === 'BOOKING_CREATED' || body.triggerEvent === 'BOOKING_CANCELLED') {
      const booking = body.data?.booking
      
      if (body.triggerEvent === 'BOOKING_CREATED' && booking) {
        const bookingDetails = {
          eventType: booking.eventType?.title || 'Discovery Call',
          startTime: booking.startTime 
            ? new Date(booking.startTime).toLocaleString()
            : undefined,
          endTime: booking.endTime
            ? new Date(booking.endTime).toLocaleString()
            : undefined,
          timezone: booking.timeZone || 'America/New_York',
          meetingUrl: booking.location || booking.videoCallData?.url || undefined,
        }

        await sendAdminCalendarBookingEmail(
          booking.attendees?.[0]?.name || booking.user?.name || 'Unknown',
          booking.attendees?.[0]?.email || booking.user?.email || '',
          bookingDetails
        )

        return NextResponse.json({ success: true, message: 'Booking notification sent' })
      }
    }

    // Generic webhook handler
    console.log('Received calendar webhook:', JSON.stringify(body, null, 2))

    return NextResponse.json({ success: true, message: 'Webhook received' })
  } catch (error: any) {
    console.error('Calendar webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Calendar webhook endpoint is active' })
}

