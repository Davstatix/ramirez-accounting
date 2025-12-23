import { NextRequest, NextResponse } from 'next/server'
import { sendAdminCalendarBookingEmail } from '@/lib/email'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Calendly webhook format
    if (body.event === 'invitee.created' || body.event === 'invitee.canceled') {
      const invitee = body.payload?.invitee
      const event = body.payload?.event_type
      
      if (body.event === 'invitee.created') {
        // Extract booking details
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

        // Send notification email to admin
        await sendAdminCalendarBookingEmail(
          invitee?.name || 'Unknown',
          invitee?.email || '',
          bookingDetails
        )

        return NextResponse.json({ success: true, message: 'Booking notification sent' })
      }
    }

    // Handle Cal.com webhook format
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

    // Generic webhook handler (for other calendar services)
    // You can extend this to handle other formats
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

