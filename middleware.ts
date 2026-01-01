import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // 1. Initialize Response
  const res = NextResponse.next()
  
  // 2. Create Supabase Client
  const supabase = createMiddlewareClient({ req, res })

  // 3. Refresh Session (Security Check)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname;

  // 4. Admin Guard Protocol
  // If user is trying to access "/admin" AND has no valid session...
  if (path.startsWith('/admin') && !session) {
    // ...Intercept and redirect to Login Page
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 5. Auth Loop Prevention
  // If user is AT "/login" BUT already has a session...
  if (path.startsWith('/login') && session) {
    // ...Bounce them back to Admin (No need to login twice)
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return res
}

// 🔒 SECURITY SCOPE
// This config ensures the middleware ONLY wakes up for these paths.
// It explicitly ignores static files, images, and public pages.
export const config = {
  matcher: [
    '/admin/:path*', // Secure the Admin Folder
    '/login',        // Handle Login Logic
  ],
}