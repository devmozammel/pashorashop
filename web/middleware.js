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
    
    // 1. Define paths
    const isAdminPage = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
    const isAuthPage = nextUrl.pathname.startsWith("/auth") || nextUrl.pathname.startsWith("/api/auth");
    const isMaintenancePage = nextUrl.pathname === "/maintenance";
    const isPublicAsset = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

    // 2. Maintenance Mode Logic
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
    if (isMaintenanceMode && !isAdmin && !isAdminPage && !isAuthPage && !isMaintenancePage && !isPublicAsset) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    // 3. Admin Area Protection (no bypass exceptions)
    if (isAdminPage && !isAdmin) {
      return NextResponse.redirect(new URL("/auth/login?error=AccessDenied", req.url));
    }

    // 4. Localhost friendly traffic
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
                             nextUrl.pathname.startsWith("/auth") ||
                             nextUrl.pathname.startsWith("/checkout");
        
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
