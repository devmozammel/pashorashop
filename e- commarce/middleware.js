import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * PRODUCTION READY SAFE MIDDLEWARE
 * - No recursive fetch to avoid deadlocks
 * - Protects Admin routes
 * - Bypasses assets and essential paths
 */
export default withAuth(
  function middleware(req) {
    const { nextUrl, nextauth } = req;
    const { token } = nextauth;
    const isAdmin = token?.role === "ADMIN";
    
    const isAdminPage = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
    const isAuthPage = nextUrl.pathname.startsWith("/auth") || nextUrl.pathname.startsWith("/api/auth");
    
    // 1. Admin Area Protection
    if (isAdminPage && !isAdmin) {
      return NextResponse.redirect(new URL("/auth/login?error=AccessDenied", req.url));
    }

    // 2. Localhost friendly traffic
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { nextUrl } = req;
        // Don't require login for home, shop, maintenance, or auth pages
        const isPublicPage = nextUrl.pathname === "/" || 
                             nextUrl.pathname.startsWith("/shop") || 
                             nextUrl.pathname.startsWith("/product") ||
                             nextUrl.pathname === "/maintenance" ||
                             nextUrl.pathname.startsWith("/auth");
        
        return isPublicPage || !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/checkout/:path*",
    "/checkout",
    "/api/admin/:path*"
  ],
};
