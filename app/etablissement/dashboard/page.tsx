"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCardsRadial } from "@/components/CardRevenueRadial"
import { ChartDevisCard } from "@/components/ChartDevisCard"
import { BarChartSimple } from "@/components/bar-chart-simple"
import { ChartProductsDonut } from "@/components/ChartProductsDonut"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import dashboard from "./data.json"
import { menusByRole } from "@/lib/data/menus"

export default function Page() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar menu={menusByRole.etablissement} />

      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 py-6">

            {/* ===== KPI CARDS ===== */}
           
            

            {/* ===== CHARTS ===== */}
            <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-3 lg:px-6">

              

               

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
