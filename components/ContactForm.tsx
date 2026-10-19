'use client'
import { useState, type FormEvent } from 'react'
export default function ContactForm() {
 const [status,setStatus]=useState<'idle'|'sending'|'success'|'error'>('idle')
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault(); if(status==='sending') return
  const form=event.currentTarget; const data=Object.fromEntries(new FormData(form)); setStatus('sending')
  try { const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!response.ok) throw new Error(); form.reset(); setStatus('success') } catch { setStatus('error') }
 }
 return <form onSubmit={submit} className="contact-form">
 <div className="form-row"><label htmlFor="name">Your name<input id="name" name="name" autoComplete="name" required maxLength={120}/></label><label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/></label></div>
 <div className="form-row"><label htmlFor="company">Business name <span>(optional)</span><input id="company" name="company" autoComplete="organization" maxLength={200}/></label><label htmlFor="phone">Phone <span>(optional)</span><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40}/></label></div>
 <label htmlFor="message">How can we help?<textarea id="message" name="message" required rows={5} maxLength={5000} placeholder="A little about your business and your bookkeeping needs…"/></label>
 <div className="form-trap" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <button className="button" disabled={status==='sending'} type="submit">{status==='sending'?'Sending…':'Send your message'} <span aria-hidden="true">↗</span></button>
 <p className="form-status" role="status" aria-live="polite">{status==='success'?'Thank you. Your message has been sent. We’ll follow up by email.':status==='error'?<>Your message couldn’t be sent. Please try again or <a href="mailto:david@ramirezaccountingny.com">email us directly</a>.</> : <>For how we handle your message, read our <a href="/privacy">privacy policy</a>.</>}</p>
 </form>
}
