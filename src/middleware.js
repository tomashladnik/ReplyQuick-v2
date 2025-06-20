import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

// List of public routes that don't require authentication

const publicRoutes = ['/login', '/signup', '/verify-otp', '/success', '/api/auth/login', '/api/auth/register', '/api/send-otp','/api/email/webhook','/api/calls/webhook','/api/sms/webhook','/api/whatsapp/webhook', '/api/hubspot/callback', '/settings']

export async function middleware(request) {
  // Skip authentication in development mode
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get the token from cookies
  const token = request.cookies.get('auth_token')?.value

  // If no token is present, redirect to login
  if (!token) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply')
    await jwtVerify(token, secret)
    
    // Token is valid, proceed with the request
    return NextResponse.next()
  } catch (error) {
    // Token is invalid or expired, redirect to login
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 