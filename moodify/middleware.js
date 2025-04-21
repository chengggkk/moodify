import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request (e.g. /api/endpoint)
  const path = request.nextUrl.pathname;
  
  // Log all requests to help with debugging
  console.log(`[Middleware] Processing request: ${path}`);
  
  // Special handling for API routes for debugging
  if (path.startsWith('/api/')) {
    console.log(`[Middleware] API route detected: ${path}`);
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match test page
    '/test'
  ],
};