import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // If profile doesn't exist or role is not admin, redirect to client
    if (profileError || !profile) {
      console.error('Middleware: Profile error or not found:', profileError)
      return NextResponse.redirect(new URL('/client', req.url))
    }

    const userRole = profile?.role?.toLowerCase()
    if (userRole !== 'admin') {
      console.log('Middleware: User is not admin, redirecting to /client')
      return NextResponse.redirect(new URL('/client', req.url))
    }
  }

  // Protect client routes
  if (req.nextUrl.pathname.startsWith('/client')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If user is admin, redirect them to admin dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
}

