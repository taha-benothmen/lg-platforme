// Types pour les rôles
export type UserRole = "ADMIN" | "ETABLISSEMENT" | "RESPONSABLE"

// Interface pour les informations utilisateur
export interface UserSession {
  email: string
  role: UserRole
  route: string
}

// Clés pour localStorage
const SESSION_KEY = "lg_user_session"

// Fonctions pour gérer la session
export const authUtils = {
  // Sauvegarder la session
  setSession: (user: UserSession) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    }
  },

  // Récupérer la session
  getSession: (): UserSession | null => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem(SESSION_KEY)
      return session ? JSON.parse(session) : null
    }
    return null
  },

  // Supprimer la session (logout)
  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY)
    }
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: (): boolean => {
    return authUtils.getSession() !== null
  },

  // Obtenir le rôle de l'utilisateur
  getUserRole: (): UserRole | null => {
    const session = authUtils.getSession()
    return session?.role || null
  },

  // Vérifier si l'utilisateur a le bon rôle pour accéder à une route
  hasAccess: (pathname: string): boolean => {
    const role = authUtils.getUserRole()
    if (!role) return false

    // Mapping des rôles aux préfixes de routes autorisés
    const roleRoutes: Record<UserRole, string[]> = {
      ADMIN: ["/admin"],
      ETABLISSEMENT: ["/etablissement"],
      RESPONSABLE: ["/responsable"],
    }

    const allowedRoutes = roleRoutes[role]
    return allowedRoutes.some((route) => pathname.startsWith(route))
  },
}
