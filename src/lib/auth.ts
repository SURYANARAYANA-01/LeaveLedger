import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      departmentId: string | null;
      companyId: string;
    } & DefaultSession['user'];
  }
  interface User {
    role: UserRole;
    departmentId: string | null;
    companyId: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    departmentId: string | null;
    companyId: string;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const secret = process.env.AUTH_SECRET;

// Short-lived, signed handoff token used only for the "brand-new Google
// sign-in with no matching account yet" case — proves to /register/google
// that this email genuinely completed a real Google OAuth round-trip,
// rather than trusting a raw, spoofable query parameter.
export async function signGoogleHandoffToken(email: string, name: string) {
  return new SignJWT({ email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(new TextEncoder().encode(secret));
}

export async function verifyGoogleHandoffToken(token: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload as { email: string; name: string };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            departmentId: true,
            companyId: true,
            isActive: true,
          },
        });

        // No account, deactivated, not yet activated via invite, or a
        // Google-only account with no password set — all reject here.
        if (!user || !user.isActive || !user.password) return null;

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          companyId: user.companyId,
        };
      },
    }),
    // Two instances of the same Google client, registered under different
    // provider ids, purely so the signIn callback below can tell whether
    // the click came from the Login page (existing accounts only) or the
    // Register page (also allowed to start a brand-new company).
    Google({
      id: 'google-login',
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Google({
      id: 'google-register',
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const isGoogleLogin = account?.provider === 'google-login';
      const isGoogleRegister = account?.provider === 'google-register';
      if (!isGoogleLogin && !isGoogleRegister) return true;
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email } });

      if (existing) {
        // Matches an existing account (created via invite, via /register,
        // or a previous Google sign-in) — deactivated accounts still can't
        // sign in even via Google. Works from either button.
        return existing.isActive;
      }

      if (isGoogleLogin) {
        // Login page's Google button must never silently create a new
        // company. Returning `false` (rather than a custom redirect
        // string) is the standard, guaranteed Auth.js pattern here — it
        // reliably redirects to the configured sign-in page with
        // ?error=AccessDenied appended, without depending on exactly how
        // a custom relative-URL string gets resolved internally.
        return false;
      }

      // Register page's Google button: no account with this email yet, so
      // this is someone starting a brand new company. We can't create the
      // Company + CEO here (we still need a company name), so hand off to
      // a short form instead of silently auto-creating an account.
      const token = await signGoogleHandoffToken(user.email, user.name ?? '');
      return `/register/google?token=${encodeURIComponent(token)}`;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google-login' || account?.provider === 'google-register') {
          // The `user` object from Google doesn't carry our custom fields —
          // look up the real row we just matched in the signIn callback.
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.departmentId = dbUser.departmentId;
            token.companyId = dbUser.companyId;
          }
        } else {
          token.id = user.id as string;
          token.role = user.role;
          token.departmentId = user.departmentId;
          token.companyId = user.companyId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Re-check the database on every session read (not just at sign-in) —
      // this is what catches a user being deleted or deactivated outside
      // the app (e.g. directly in Prisma Studio). Without this, a deleted
      // user's signed JWT cookie stays valid and they'd remain "logged in"
      // until it naturally expires, since JWT sessions are otherwise
      // stateless and never re-checked against the database.
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { isActive: true },
      });

      if (!dbUser || !dbUser.isActive) {
        // Deliberately leave session.user without an id — middleware and
        // any auth() caller treats a missing user id as "not authenticated"
        // and redirects to login with a clear explanation, rather than
        // silently keeping a dead session alive.
        return session;
      }

      session.user.id = token.id;
      session.user.role = token.role;
      session.user.departmentId = token.departmentId;
      session.user.companyId = token.companyId;
      return session;
    },
  },
});
export default auth;