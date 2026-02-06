"use client"

import { useRouter } from "next/navigation"
import { FC, ElementType, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { authUtils } from "@/lib/auth"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { IconInnerShadowTop } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import { ChevronUp, User2, Bell } from "lucide-react"
import { NotificationCenter } from "@/components/NotificationCenter"

type MenuItem = {
  label: string
  route: string
  icon?: ElementType
}

interface AppSidebarProps {
  menu: MenuItem[]
}

interface UserSession {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  route: string
}

export const AppSidebar: FC<AppSidebarProps> = ({ menu }) => {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("Utilisateur")
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    // Récupérer les données utilisateur du localStorage
    const userSession = localStorage.getItem("userSession")
    console.log("📦 userSession from localStorage:", userSession)

    if (userSession) {
      try {
        const user: UserSession = JSON.parse(userSession)
        console.log("User parsed:", user)

        setUserId(user.id)

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

        console.log("Display name set to:", displayName)
        setUserName(displayName)
      } catch (error) {
        console.error("Erreur lors de la lecture des données utilisateur:", error)
        setUserName("Utilisateur")
      }
    } else {
      console.warn("Aucune session utilisateur trouvée")
    }

    setIsLoaded(true)
  }, [])

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&unreadOnly=true`
      )
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
  }, [userId])

  // Charger les notifications au montage et en temps réel
  useEffect(() => {
    if (!userId) return

    // Charger immédiatement
    loadUnreadCount()

    // Polling chaque 30 secondes
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [userId, loadUnreadCount])

  const handleLogout = () => {
    // Supprimer la session
    authUtils.clearSession()
    // Supprimer le cookie
    document.cookie = "lg_user_role=; path=/; max-age=0"
    // Supprimer les données du localStorage
    localStorage.removeItem("userSession")
    // Rediriger vers login
    router.push("/auth/login")
  }

  return (
    <aside className="w-64 h-screen bg-gray-100 p-4 flex flex-col">
      {/* Header / Brand */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="data-[slot=sidebar-menu-button]:!p-1.5 mb-4"
        >
          <a href="#">
            <img
              src="/LG_symbol.svg.png"
              alt="LG Logo"
              width={20}
              height={20}
              className="rounded-sm"
            />
            <span className="text-base font-semibold ml-2">LG</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Menu items */}
      <ul className="flex-1 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.route}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                onClick={() => router.push(item.route)}
              >
                {Icon && <Icon className="!size-5 transition-colors duration-200" />}
                {item.label}
              </Button>
            </li>
          )
        })}
      </ul>

    

      {/*
      {unreadCount > 0 && (
        <div className="mb-3">
          <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-red-700">
              {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""} notification{unreadCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
<SidebarFooter className="px-0">
  <SidebarMenu>

    <SidebarMenuItem>
      <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="relative">
            <Bell className="size-5" />
            <span className="truncate">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-80">
          {userId && (
            <NotificationCenter
              userId={userId}
              onNotificationRead={() => {
                loadUnreadCount()
              }}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton>
            <User2 className="size-5" />
            <span className="truncate">{isLoaded ? userName : "Chargement..."}</span>
            <ChevronUp className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start">
          <DropdownMenuItem onClick={handleLogout}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

  </SidebarMenu>
</SidebarFooter>
*/}
   </aside>
  )
}