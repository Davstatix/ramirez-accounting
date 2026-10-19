import { NextResponse, type NextRequest } from 'next/server'
export function middleware(request: NextRequest) {
 if(request.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({error:'This service is no longer available'},{status:410})
 return NextResponse.redirect(new URL('/#contact',request.url))
}
export const config = { matcher: ['/login/:path*','/signup/:path*','/reset-password/:path*','/demo/:path*','/client/:path*','/admin/:path*','/api/stripe/:path*','/api/calendar/:path*','/api/clients/:path*','/api/invite-codes/:path*','/api/email/:path*'] }
