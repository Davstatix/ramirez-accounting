import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendInviteCodeEmail } from '@/lib/email'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'
import crypto from 'crypto'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function generateCode(): string {
  // Generate a readable 8-character code like "ABCD-1234"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  code += '-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, client_name, notes, expires_days = 7, created_by, recommended_plan } = body

    // Create Supabase client at runtime
    const supabase = createAdminClient()

    // Generate unique code
    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .single()
      
      if (!existing) break
      code = generateCode()
      attempts++
    }

    // Calculate expiration date
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + expires_days)

    // Create invite code
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        email: email || null,
        client_name: client_name || null,
        notes: notes || null,
        recommended_plan: recommended_plan || null,
        expires_at: expires_at.toISOString(),
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) throw error

    // Automatically send email if email address is provided
    let emailSent = false
    let emailError = null
    
    if (email) {
      try {
        // Always send to the actual client email (no test email redirect)
        const recommendedPlan = recommended_plan && PRICING_PLANS[recommended_plan as PlanId]
          ? PRICING_PLANS[recommended_plan as PlanId]
          : null
        
        const emailResult = await sendInviteCodeEmail(
          email,
          client_name || email.split('@')[0] || 'there',
          code,
          expires_at,
          recommendedPlan
        )
        
        if (emailResult.success) {
          emailSent = true
          console.log(`✅ Invite code email sent successfully to ${email}`)
        } else {
          emailError = emailResult.error
          console.error('❌ Failed to send invite code email:', emailResult.error)
        }
      } catch (emailError: any) {
        // Log error but don't fail the invite code creation
        console.error('❌ Error sending invite code email:', emailError)
        emailError = emailError.message || 'Unknown error'
      }
    }

    return NextResponse.json({ 
      success: true, 
      invite_code: data,
      email_sent: emailSent,
      email_error: emailError ? (typeof emailError === 'string' ? emailError : JSON.stringify(emailError)) : null
    })
  } catch (error: any) {
    console.error('Error creating invite code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invite code' },
      { status: 500 }
    )
  }
}

