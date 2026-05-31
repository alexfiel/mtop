import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
  const isLoginRoute = request.nextUrl.pathname === "/login";
  const isRegisterRoute = request.nextUrl.pathname === "/register";

  if (isAuthRoute) {
    return NextResponse.next();
  }

  try {
    const cookies = request.headers.get("cookie") || "";
    const hasSession = cookies.includes("better-auth.session_token");

    let isAuthenticated = false;
    let userRole = "USER";
    if (hasSession) {
      const url = new URL("/api/auth/get-session", request.url);
      const response = await fetch(url.toString(), {
        headers: { cookie: cookies },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.session) {
          isAuthenticated = true;
          userRole = data.user?.role || "USER";
        }
      }
    }

    const isPublicRoute = isLoginRoute || isRegisterRoute;

    if (!isAuthenticated && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthenticated && isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based route protection
    const isAdminRoute = 
      request.nextUrl.pathname.startsWith("/users") || 
      request.nextUrl.pathname.startsWith("/settings") ||
      request.nextUrl.pathname.startsWith("/audit-logs");
      
    if (isAuthenticated && isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    const isPublicRoute = isLoginRoute || isRegisterRoute;
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
