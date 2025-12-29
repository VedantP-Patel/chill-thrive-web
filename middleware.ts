// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Intercept Traffic to /admin
  if (path.startsWith('/admin')) {
    
    // 2. Inspect "Authorization" Header
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // 3. Validate Credentials (Hardcoded for v1, move to ENV later)
      if (user === 'admin' && pwd === 'chillthrive2025') {
        return NextResponse.next(); // Access Granted
      }
    }

    // 4. Reject Unithorized Packets
    return new NextResponse('Auth Required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};