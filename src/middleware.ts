import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  // A truthy req.auth only means a session cookie exists — it doesn't mean
  // the underlying user still exists in the database (see the session
  // callback in lib/auth.ts, which re-verifies this on every read). Only
  // treat the session as valid if it actually resolved to a user id.
  const hasValidSession = !!req.auth?.user?.id;
  const hadStaleSession = !!req.auth && !hasValidSession;
  const isLoggedIn = hasValidSession;
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

  // Redirect unauthenticated users to login for protected routes — with a
  // clear "session expired" message if they had a cookie that turned out
  // to no longer correspond to a real account (deleted/deactivated).
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    if (hadStaleSession) loginUrl.searchParams.set('error', 'SessionExpired');
    return NextResponse.redirect(loginUrl);
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