import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/auth/login", "/auth/signup"]

// Mapping des rôles aux préfixes de routes autorisés
const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin"],
  ETABLISSEMENT: ["/etablissement"],
  RESPONSABLE: ["/responsable"],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Autoriser les routes publiques
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Récupérer le rôle depuis les cookies (on va utiliser les cookies pour le middleware)
  const role = request.cookies.get("lg_user_role")?.value

  // Si pas de rôle, rediriger vers login
  if (!role) {
    const loginUrl = new URL("/auth/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Vérifier si l'utilisateur a accès à cette route
  const allowedRoutes = roleRoutes[role]
  const hasAccess = allowedRoutes?.some((route) => pathname.startsWith(route))

  // Si l'utilisateur n'a pas accès, rediriger vers sa page d'accueil
  if (!hasAccess) {
    const defaultRoutes: Record<string, string> = {
      ADMIN: "/admin/dashboard",
      ETABLISSEMENT: "/etablissement/produits",
      RESPONSABLE: "/responsable/produits",
    }
    const redirectUrl = new URL(defaultRoutes[role] || "/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// Configurer les routes à protéger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
