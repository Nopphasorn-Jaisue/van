import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET;
if (!secretKey && process.env.NODE_ENV === "production") {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.");
}
const JWT_SECRET = new TextEncoder().encode(
  secretKey || "local-dev-fallback-secret-key-32-chars-minimum"
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
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path === '/icon.png' ||
    path === '/opengraph-image.png' ||
    path === '/twitter-image.png' ||
    path === '/api/vans/ranking';

  // Read-only public endpoints (such as calendar read for users)
  const isPublicReadOnlyApi =
    request.method === 'GET' && (
      path === '/api/calendar-events' ||
      path === '/api/calendar-events/export' ||
      path === '/api/vans' ||
      path === '/api/drivers' ||
      path === '/api/me'
    );

  if (isPublicPath || isPublicReadOnlyApi) {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // Helper for role-based redirects
  const getRoleDashboard = (userRole?: string): string => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      case 'FACULTY_ADMIN':
        return '/faculty-admin/dashboard';
      case 'EXECUTIVE':
        return '/executive/dashboard';
      case 'DRIVER':
        return '/driver/dashboard';
      case 'USER':
      default:
        return '/user/calendar';
    }
  };

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
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
        return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
      }
    }
    
    // Faculty Admin Routes (Pages & APIs)
    const isFacultyAdminRoute = path === '/faculty-admin' || path.startsWith('/faculty-admin/') || path === '/api/faculty-admin' || path.startsWith('/api/faculty-admin/');
    if (isFacultyAdminRoute) {
      if (role !== 'FACULTY_ADMIN' && role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานผู้ดูแลคณะ' }, { status: 403 });
        }
        return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
      }
    }

    // Executive Routes (Pages & APIs)
    const isExecutiveRoute = path === '/executive' || path.startsWith('/executive/') || path === '/api/executive' || path.startsWith('/api/executive/');
    if (isExecutiveRoute) {
      if (role !== 'EXECUTIVE' && role !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานผู้บริหาร' }, { status: 403 });
        }
        return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
      }
    }

    // Driver Routes (Pages & APIs)
    const isDriverRoute = path === '/driver' || path.startsWith('/driver/') || path === '/api/driver' || path.startsWith('/api/driver/');
    if (isDriverRoute) {
      if (role !== 'DRIVER' && role !== 'SUPER_ADMIN' && role !== 'FACULTY_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนงานพนักงานขับรถ' }, { status: 403 });
        }
        return NextResponse.redirect(new URL(getRoleDashboard(role), request.url));
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
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login-background.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
