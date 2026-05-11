import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

// Extend built-in types
declare module 'next-auth' {
  interface User {
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

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || '';
          const res = await fetch(
            `${baseUrl}/api/auth/login`,
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
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.is_admin = user.is_admin;
        token.role = user.role || 'parent';
      }
      return token;
    },
    async session({ session, token }: any) {
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
    maxAge: 7 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
