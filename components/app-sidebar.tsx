"use client"

import { useRouter } from "next/navigation"
import { FC, ElementType } from "react"
import { Button } from "@/components/ui/button"
import { authUtils } from "@/lib/auth"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { IconInnerShadowTop } from "@tabler/icons-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { ChevronUp, User2 } from "lucide-react"

type MenuItem = {
  label: string
  route: string
  icon?: ElementType
}

interface AppSidebarProps {
  menu: MenuItem[]
}

export const AppSidebar: FC<AppSidebarProps> = ({ menu }) => {
  const router = useRouter()

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

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 className="size-5" />
                  <span>Username</span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem
                  onClick={() => {
                    // Supprimer la session
                    authUtils.clearSession()
                    // Supprimer le cookie
                    document.cookie = "lg_user_role=; path=/; max-age=0"
                    // Rediriger vers login
                    router.push("/auth/login")
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </aside>
  )
}
