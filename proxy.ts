import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that do not require authentication
  const isPublicPath =
    path === '/' ||
    path === '/login' ||
    path === '/landing' ||
    path === '/auth/login' ||
    path === '/auth/callback' ||
    path === '/auth/confirm' ||
    path === '/auth/error' ||
    path === '/auth/forgot-password' ||
    path === '/auth/sign-up' ||
    path === '/auth/sign-up-success' ||
    path === '/auth/update-password' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path === '/icon.png' ||
    path === '/opengraph-image.png' ||
    path === '/twitter-image.png';

  // Read-only public endpoints (such as calendar read for users)
  const isPublicReadOnlyApi =
    request.method === 'GET' && (
      path === '/api/calendar-events' ||
      path === '/api/calendar-events/export' ||
      path === '/api/vans' ||
      path === '/api/drivers' ||
      path === '/api/bookings' ||
      path === '/api/me' ||
      path.startsWith('/api/bookings/')
    );

  if (isPublicPath || isPublicReadOnlyApi) {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify JWT token signature and expiry
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload.role as string) || '';

    // Super Admin Routes (Pages & APIs)
    const isSuperAdminRoute = path === '/super-admin' || path.startsWith('/super-admin/') || path === '/api/super-admin' || path.startsWith('/api/super-admin/');
    if (isSuperAdminRoute) {
      if (role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานผู้ดูแลระบบส่วนกลาง' }, { status: 403 });
        }
        if (role === 'FACULTY_ADMIN') {
          return NextResponse.redirect(new URL('/faculty-admin/dashboard', request.url));
        }
        if (role === 'DRIVER') {
          return NextResponse.redirect(new URL('/driver/dashboard', request.url));
        }
        if (role === 'EXECUTIVE') {
          return NextResponse.redirect(new URL('/executive/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // Faculty Admin Routes (Pages & APIs)
    const isFacultyAdminRoute = path === '/faculty-admin' || path.startsWith('/faculty-admin/') || path === '/api/faculty-admin' || path.startsWith('/api/faculty-admin/');
    if (isFacultyAdminRoute) {
      if (role !== 'FACULTY_ADMIN' && role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานผู้ดูแลคณะ' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Executive Routes (Pages & APIs)
    const isExecutiveRoute = path === '/executive' || path.startsWith('/executive/') || path === '/api/executive' || path.startsWith('/api/executive/');
    if (isExecutiveRoute) {
      if (role !== 'EXECUTIVE' && role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานผู้บริหาร' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Driver Routes (Pages & APIs)
    const isDriverRoute = path === '/driver' || path.startsWith('/driver/') || path === '/api/driver' || path.startsWith('/api/driver/');
    if (isDriverRoute) {
      if (role !== 'DRIVER' && role !== 'SUPER_ADMIN' && role !== 'FACULTY_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานพนักงานขับรถ' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  } catch {
    // Token invalid or expired
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login-background.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
