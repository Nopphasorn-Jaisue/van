import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath =
    path === '/login' ||
    path === '/auth/callback' ||
    path === '/' ||
    path === '/landing' ||
    (request.method === 'GET' && path === '/api/calendar-events') ||
    path.startsWith('/_next') ||
    path.startsWith('/static');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // If it's an API route without a token
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect to login if not authenticated for page routes
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload.role as string) || '';

    // Role-based access control for Super Admin (Pages & API)
    if (path.startsWith('/super-admin') || path.startsWith('/api/super-admin')) {
      if (role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
        }
        if (role === 'FACULTY_ADMIN') {
          return NextResponse.redirect(new URL('/faculty-admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // Role-based access control for Faculty Admin (Pages & API)
    if (path.startsWith('/faculty-admin') || path.startsWith('/api/faculty-admin')) {
      if (role !== 'FACULTY_ADMIN') {
        if (path.startsWith('/api/')) {
          if (role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Faculty Admin access required' }, { status: 403 });
          }
          return NextResponse.next();
        }
        if (role === 'SUPER_ADMIN') {
          if (path.includes('/drivers')) return NextResponse.redirect(new URL('/super-admin/drivers', request.url));
          if (path.includes('/vans')) return NextResponse.redirect(new URL('/super-admin/vans', request.url));
          return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Role-based access control for Executive (Pages & API)
    if (path.startsWith('/executive') || path.startsWith('/api/executive')) {
      if (role !== 'EXECUTIVE') {
        if (path.startsWith('/api/')) {
          if (role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Executive access required' }, { status: 403 });
          }
          return NextResponse.next();
        }
        if (role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Role-based access control for Driver (Pages & API)
    if (path.startsWith('/driver') || path.startsWith('/api/driver')) {
      if (role !== 'DRIVER') {
        if (path.startsWith('/api/')) {
          if (role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Driver access required' }, { status: 403 });
          }
          return NextResponse.next();
        }
        if (role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Token is invalid or expired
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login-background.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
