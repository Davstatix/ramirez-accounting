import { NextRequest, NextResponse } from 'next/server'
import { sendInviteCodeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, client_name, code, expires_at } = body

    if (!email || !code || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For testing: if USE_TEST_EMAIL is enabled, send to test email but log the real email
    const recipientEmail = process.env.USE_TEST_EMAIL === 'true' 
      ? 'delivered@resend.dev' 
      : email

    if (process.env.USE_TEST_EMAIL === 'true') {
      console.log(`[TEST MODE] Invite code email would be sent to: ${email}, but sending to test email instead`)
    }

    const result = await sendInviteCodeEmail(
      recipientEmail,
      client_name || 'there',
      code,
      new Date(expires_at)
    )

    if (!result.success) {
      console.error('Email send result:', result)
      const errorMessage = result.error && typeof result.error === 'object' && 'message' in result.error 
        ? (result.error as { message: string }).message 
        : 'Failed to send email. Check Resend dashboard for details.'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: process.env.USE_TEST_EMAIL === 'true' 
        ? `Email sent to test inbox (would have gone to ${email})`
        : 'Email sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending invite code email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

