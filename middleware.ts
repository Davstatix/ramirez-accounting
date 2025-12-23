import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }))
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Determine if we're in production (HTTPS) or development (HTTP)
            // Check the request URL protocol
            const isHttps = req.url.startsWith('https://')
            const isProduction = process.env.NODE_ENV === 'production' || isHttps
            
            // Set cookies with appropriate settings for both localhost and production
            res.cookies.set(name, value, {
              ...options,
              sameSite: 'lax' as const,
              secure: isProduction, // Only secure in production (HTTPS)
              httpOnly: options?.httpOnly ?? false,
              // Don't set domain for localhost, let it default
              // Domain will be automatically set correctly for production
            })
          })
        },
      },
    }
  )

  // Debug logging first
  if (process.env.NODE_ENV === 'development') {
    const cookieNames = req.cookies.getAll().map(c => c.name)
    const authCookie = req.cookies.get('sb-izrhlaztnmgmdfmewtpn-auth-token')
    console.error('========================================')
    console.error('MIDDLEWARE DEBUG -', new Date().toISOString())
    console.error('Request path:', req.nextUrl.pathname)
    console.error('Cookies present:', cookieNames.join(', ') || 'NONE')
    console.error('Auth cookie exists:', !!authCookie)
    if (authCookie) {
      try {
        const decoded = decodeURIComponent(authCookie.value)
        const parsed = JSON.parse(decoded)
        console.error('✅ Cookie parsed successfully!')
        console.error('Has access_token:', !!parsed.access_token)
        console.error('User ID from cookie:', parsed.user?.id || 'NONE')
        console.error('Token expires_at:', parsed.expires_at || 'NONE')
      } catch (e: any) {
        console.error('❌ Failed to parse cookie:', e.message)
        console.error('Cookie value (first 200 chars):', authCookie.value.substring(0, 200))
      }
    }
  }

  // Try to manually parse the cookie and set the session if getSession fails
  let session: any = null
  let user: any = null
  
  // First try getSession
  const {
    data: { session: getSessionResult },
    error: sessionError,
  } = await supabase.auth.getSession()
  session = getSessionResult

  if (process.env.NODE_ENV === 'development') {
    console.error('After getSession - Session exists:', !!session)
    console.error('Session error:', sessionError?.message || 'none')
  }

  // If getSession() fails, try to manually parse the cookie
  if (!session) {
    const authCookie = req.cookies.get('sb-izrhlaztnmgmdfmewtpn-auth-token')
    if (authCookie) {
      try {
        const decoded = decodeURIComponent(authCookie.value)
        const cookieData = JSON.parse(decoded)
        
        if (cookieData.access_token && cookieData.user) {
          if (process.env.NODE_ENV === 'development') {
            console.error('✅ Manually parsed cookie, setting session...')
          }
          // Set the session manually using setSession
          const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: cookieData.access_token,
            refresh_token: cookieData.refresh_token || '',
          })
          
          if (setSessionData.session) {
            session = setSessionData.session
            user = session.user
            if (process.env.NODE_ENV === 'development') {
              console.error('✅ Session set manually, user:', user?.id)
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Failed to set session:', setSessionError?.message)
            }
          }
        }
      } catch (parseError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to parse cookie for manual session:', parseError.message)
        }
      }
    }
  } else {
    user = session.user
  }

  // If still no user, try getUser() as final fallback
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Still no user, trying getUser()...')
    }
    const {
      data: { user: getUserResult },
      error: getUserError,
    } = await supabase.auth.getUser()
    user = getUserResult || undefined
    if (process.env.NODE_ENV === 'development') {
      console.error('getUser() result:', !!user)
      console.error('getUser() error:', getUserError?.message || 'none')
      console.error('User ID from getUser():', user?.id || 'NONE')
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Final user check:', !!user, user?.id || 'NONE')
    console.error('========================================')
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('No user found, redirecting to login')
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin - but don't redirect if profile check fails
    // Let the admin page handle role checking to avoid redirect loops
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role?.toLowerCase()
    
    // Only redirect if we're CERTAIN the user is not admin
    // If profile doesn't exist or there's an error, allow through and let the page handle it
    if (profile && userRole && userRole !== 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.error('User is confirmed client, redirecting to /client')
      }
      return NextResponse.redirect(new URL('/client', req.url))
    }
    
    // Allow access - either user is admin, or profile check failed (let page handle it)
    if (process.env.NODE_ENV === 'development') {
      console.error('Allowing access to /admin (user authenticated)')
    }
  }

  // Protect client routes
  if (req.nextUrl.pathname.startsWith('/client')) {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('No user found for /client, redirecting to login')
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin - only redirect if we're CERTAIN
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Only redirect if profile exists and role is definitely admin
    // If profile check fails, allow through and let the page handle it
    if (profile && profile.role === 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.error('User is confirmed admin, redirecting from /client to /admin')
      }
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    
    // Allow access to /client
    if (process.env.NODE_ENV === 'development') {
      console.error('Allowing access to /client (user authenticated)')
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
}

