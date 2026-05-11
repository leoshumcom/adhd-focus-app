import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/train/:path*',
    '/homework/:path*',
    '/rewards/:path*',
    '/profile/:path*',
    '/parent/:path*',
    '/admin/:path*',
  ],
};
