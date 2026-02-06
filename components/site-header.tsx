"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, User2, ChevronUp } from "lucide-react"
import { NotificationCenter } from "@/components/NotificationCenter"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { authUtils } from "@/lib/auth"

interface UserSession {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export function SiteHeader() {
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("Utilisateur")
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  // Charger le userId et les données utilisateur au montage
  useEffect(() => {
    const userSession = localStorage.getItem("userSession")
    const id = localStorage.getItem("userId")
    
    setUserId(id)

    if (userSession) {
      try {
        const user: UserSession = JSON.parse(userSession)

        // Construire le nom d'affichage
        let displayName = "Utilisateur"

        if (user.firstName && user.lastName) {
          displayName = `${user.firstName} ${user.lastName}`
        } else if (user.firstName) {
          displayName = user.firstName
        } else if (user.lastName) {
          displayName = user.lastName
        } else if (user.email) {
          displayName = user.email.split("@")[0]
        }

        setUserName(displayName)
      } catch (error) {
        console.error("Erreur lors de la lecture des données utilisateur:", error)
        setUserName("Utilisateur")
      }
    }

    setIsLoaded(true)
  }, [])

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    // Charger immédiatement
    loadUnreadCount()

    // Puis rafraîchir toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [userId, loadUnreadCount])

  const handleRefreshUnreadCount = () => {
    loadUnreadCount()
  }

  const handleLogout = () => {
    // Supprimer la session
    authUtils.clearSession()
    // Supprimer le cookie
    document.cookie = "lg_user_role=; path=/; max-age=0"
    // Supprimer les données du localStorage
    localStorage.removeItem("userSession")
    localStorage.removeItem("userId")
    // Rediriger vers login
    router.push("/auth/login")
  }

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) px-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* Right side - Notifications & User & Logout */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications Dropdown */}
          {userId && (
            <>
              <DropdownMenu open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-gray-100"
                    title="Ouvrir les notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-600">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end" className="w-80 p-0">
                  <NotificationCenter
                    userId={userId}
                    onNotificationRead={handleRefreshUnreadCount}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-4" />
            </>
          )}

          {/* User Profile Dropdown */}
          {isLoaded && userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-gray-100">
                  <User2 className="h-5 w-5" />
                  <span className="text-sm">{userName}</span>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </>
  )
}