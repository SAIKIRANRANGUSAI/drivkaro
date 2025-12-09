import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

  // Allow /admin/login page
  if (req.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (isAdminPage) {
    const logged = req.cookies.get("adminLoggedIn")?.value;

    if (!logged) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
