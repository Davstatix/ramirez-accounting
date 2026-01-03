import { NextRequest, NextResponse } from 'next/server'
import { sendInviteCodeEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase-server'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, client_name, code, expires_at, invite_code_id } = body

    if (!email || !code || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get recommended plan and engagement letter from invite code if invite_code_id is provided
    let recommendedPlan = null
    let engagementLetter: { path: string; name: string } | null = null
    if (invite_code_id) {
      try {
        const supabase = createAdminClient()
        const { data: inviteCode } = await supabase
          .from('invite_codes')
          .select('recommended_plan, engagement_letter_path')
          .eq('id', invite_code_id)
          .single()
        
        if (inviteCode?.recommended_plan && PRICING_PLANS[inviteCode.recommended_plan as PlanId]) {
          recommendedPlan = PRICING_PLANS[inviteCode.recommended_plan as PlanId]
        }
        
        if (inviteCode?.engagement_letter_path) {
          // Extract filename from path
          const fileName = inviteCode.engagement_letter_path.split('/').pop() || 'engagement-letter.pdf'
          engagementLetter = {
            path: inviteCode.engagement_letter_path,
            name: fileName,
          }
        }
      } catch (err) {
        console.warn('Could not fetch invite code details:', err)
      }
    }

    // Always send to the actual client email (no test email redirect)
    const result = await sendInviteCodeEmail(
      email,
      client_name || 'there',
      code,
      new Date(expires_at),
      recommendedPlan,
      engagementLetter
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
      message: 'Email sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending invite code email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

