import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes
  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // For protected routes, we'll handle auth checks in the page components
  // This avoids Edge Runtime issues with NextAuth
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
