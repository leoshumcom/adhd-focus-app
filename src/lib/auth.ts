import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

// Extend built-in types
declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    is_admin?: number;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      is_admin?: number;
      role?: string;
    };
  }
}

// In production, these are passed via env bindings
export const config = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // TODO: Implement actual DB lookup via fetch to /api/auth/login
        // This runs on the edge, so we make an internal request
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) return null;
          const user = await res.json();
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.is_admin = user.is_admin;
        token.role = user.role || 'parent';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.is_admin = token.is_admin as number | undefined;
        session.user.role = (token.role as string) || 'parent';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
