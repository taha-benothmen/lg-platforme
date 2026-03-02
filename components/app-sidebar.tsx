"use client"

import { useRouter } from "next/navigation"
import { FC, ElementType, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { authUtils } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import { ChevronUp, User2, Bell, LogOut } from "lucide-react"
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
  const { setOpenMobile } = useSidebar()
  const [userName, setUserName] = useState<string>("Utilisateur")
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const userSession = localStorage.getItem("userSession")
    if (userSession) {
      try {
        const user: UserSession = JSON.parse(userSession)
        setUserId(user.id)
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
      }
    }
    setIsLoaded(true)
  }, [])

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
      const data = await response.json()
      if (data.success) setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [userId, loadUnreadCount])

  const handleLogout = () => {
    authUtils.clearSession()
    document.cookie = "lg_user_role=; path=/; max-age=0"
    localStorage.removeItem("userSession")
    router.push("/auth/login")
  }

  const handleNavigate = (route: string) => {
    router.push(route)
    // Close sidebar on mobile after navigation
    setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="offcanvas">
      {/* ── Brand ── */}
      <SidebarHeader className="border-b px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <a href="#">
                <img
                  src="/LG_symbol.svg.png"
                  alt="LG Logo"
                  width={20}
                  height={20}
                  className="rounded-sm shrink-0"
                />
                <span className="text-base font-semibold ml-2">LG</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav items ── */}
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.route}>
                <SidebarMenuButton
                  asChild
                  className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  <button onClick={() => handleNavigate(item.route)}>
                    {Icon && <Icon className="!size-5 shrink-0" />}
                    <span>{item.label}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      
    </Sidebar>
  )
}