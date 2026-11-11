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
    const role = token?.role;
    const isAdmin = role === "ADMIN";
    const isStaff = role === "ADMIN" || role === "MODERATOR";

    // 1. Define paths
    const isAdminPage = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
    const isStaffAllowedPath =
      nextUrl.pathname.startsWith("/admin/inbox") ||
      nextUrl.pathname.startsWith("/admin/orders") ||
      nextUrl.pathname.startsWith("/api/admin/inbox") ||
      nextUrl.pathname.startsWith("/api/admin/orders") ||
      nextUrl.pathname.startsWith("/api/admin/products") ||
      nextUrl.pathname.startsWith("/api/admin/steadfast") ||
      nextUrl.pathname.startsWith("/api/admin/customers") ||
      nextUrl.pathname.startsWith("/api/admin/features");

    const isAuthPage = nextUrl.pathname.startsWith("/auth") || nextUrl.pathname.startsWith("/api/auth");
    const isMaintenancePage = nextUrl.pathname === "/maintenance";
    const isPublicAsset = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

    // 2. Maintenance Mode Logic
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
    if (isMaintenanceMode && !isStaff && !isAdminPage && !isAuthPage && !isMaintenancePage && !isPublicAsset) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    // 3. Admin & Moderator Area Protection
    if (isAdminPage) {
      if (!isStaff) {
        return NextResponse.redirect(new URL("/auth/login?error=AccessDenied", req.url));
      }
      if (!isAdmin && !isStaffAllowedPath) {
        return NextResponse.redirect(new URL("/admin/inbox?error=AdminOnly", req.url));
      }
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
