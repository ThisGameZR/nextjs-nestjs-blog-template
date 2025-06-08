import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Centralized route configuration
const PUBLIC_ROUTES = ["/", "/login", "/home"];
const PUBLIC_ROUTE_PATTERNS = [
  /^\/posts\/[^\/]+$/, // Matches /posts/:id
];

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || 
         PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    
    // Redirect authenticated users away from login page
    if (req.nextauth.token && pathname === "/login") {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    
    // Allow all requests to continue (authorization is handled in the callback)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow access to public routes without authentication
        if (isPublicRoute(pathname)) {
          return true;
        }
        
        // For protected routes, require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all routes except API routes, static files, and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
