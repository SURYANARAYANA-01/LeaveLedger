import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isOnLogin = nextUrl.pathname === '/login';
  const isOnApi = nextUrl.pathname.startsWith('/api');
  const isOnPublic = nextUrl.pathname === '/';
  const isProtected = nextUrl.pathname.startsWith('/dashboard');

  // Allow API routes
  if (isOnApi) return NextResponse.next();

  // Redirect logged-in users away from login page
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Redirect root to dashboard or login
  if (isOnPublic) {
    return NextResponse.redirect(
      new URL(isLoggedIn ? '/dashboard' : '/login', nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
