import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/auth/login", "/auth/signup"]

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin"],
  ETABLISSEMENT: ["/etablissement"],
  RESPONSABLE: ["/responsable"],
}

const defaultRoutes: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  ETABLISSEMENT: "/etablissement/produits",
  RESPONSABLE: "/responsable/produits",
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Always allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const role = request.cookies.get("lg_user_role")?.value

  // ✅ No role → redirect to login
  if (!role) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // ✅ Role exists but route not allowed → redirect to their home
  const allowedRoutes = roleRoutes[role]
  const hasAccess = allowedRoutes?.some((route) => pathname.startsWith(route))

  if (!hasAccess) {
    return NextResponse.redirect(
      new URL(defaultRoutes[role] ?? "/auth/login", request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // ✅ Excludes api, static files, images — same as before
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}