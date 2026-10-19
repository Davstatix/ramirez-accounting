import { Resend } from 'resend'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function POST(request: Request) {
 try {
  if(Number(request.headers.get('content-length') || 0)>20000) return NextResponse.json({error:'Message too long'},{status:413})
  const body=await request.json()
  if(!body || typeof body!=='object') return NextResponse.json({error:'Invalid message'},{status:400})
  if(body.website) return NextResponse.json({success:true})
  const limits:Record<string,number>={name:120,email:254,company:200,phone:40,message:5000}
  const fields:Record<string,string>={}
  for(const [key,limit] of Object.entries(limits)) {
   if(body[key]!=null && typeof body[key]!=='string') return NextResponse.json({error:'Invalid fields'},{status:400})
   fields[key]=(body[key] || '').trim()
   if(fields[key].length>limit) return NextResponse.json({error:'Field too long'},{status:400})
  }
  const {name,email,company,phone,message}=fields
  if(!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(name+email)) return NextResponse.json({error:'Please enter a name, valid email, and message'},{status:400})
  if(!process.env.RESEND_API_KEY) return NextResponse.json({error:'Email is temporarily unavailable. Please email us directly.'},{status:503})
  const resend=new Resend(process.env.RESEND_API_KEY)
  const {error}=await resend.emails.send({
   from:'Ramirez Accounting <contact@updates.ramirezaccountingny.com>',
   to:['david@ramirezaccountingny.com'],replyTo:email,
   subject:`Website inquiry from ${name}`,
   text:`Name: ${name}\nEmail: ${email}\nBusiness: ${company || 'Not provided'}\nPhone: ${phone || 'Not provided'}\n\n${message}`
  })
  if(error) return NextResponse.json({error:'Unable to send message. Please try again.'},{status:502})
  return NextResponse.json({success:true})
 } catch { return NextResponse.json({error:'Unable to process message'},{status:400}) }
}
