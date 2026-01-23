"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authUtils, UserRole } from "@/lib/auth"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (!authUtils.isAuthenticated()) {
      router.push("/auth/login")
      return
    }

    // Vérifier si l'utilisateur a le bon rôle
    const userRole = authUtils.getUserRole()
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Rediriger vers la page d'accueil selon le rôle
      const defaultRoutes: Record<UserRole, string> = {
        ADMIN: "/admin/dashboard",
        ETABLISSEMENT: "/etablissement/produits",
        RESPONSABLE: "/responsable/produits",
      }
      const redirectRoute = userRole ? defaultRoutes[userRole] : "/auth/login"
      router.push(redirectRoute)
      return
    }

    // Vérifier si l'utilisateur a accès à cette route spécifique
    if (!authUtils.hasAccess(pathname)) {
      const defaultRoutes: Record<UserRole, string> = {
        ADMIN: "/admin/dashboard",
        ETABLISSEMENT: "/etablissement/produits",
        RESPONSABLE: "/responsable/produits",
      }
      const redirectRoute = userRole ? defaultRoutes[userRole] : "/auth/login"
      router.push(redirectRoute)
      return
    }

    setIsAuthorized(true)
  }, [router, pathname, allowedRoles])

  // Afficher un loader pendant la vérification
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  // Si autorisé, afficher le contenu
  if (isAuthorized) {
    return <>{children}</>
  }

  // Sinon, ne rien afficher (redirection en cours)
  return null
}
