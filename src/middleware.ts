export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    // Protected routes
    '/train/:path*',
    '/homework/:path*',
    '/rewards/:path*',
    '/profile/:path*',
    '/parent/:path*',
    '/admin/:path*',
    // API routes that need auth
    '/api/checkin/:path*',
    '/api/games/:path*',
    '/api/homework/:path*',
    '/api/rewards/:path*',
    // Exclude login/register/auth
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
