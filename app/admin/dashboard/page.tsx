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
      <AppSidebar menu={menusByRole.admin} />

      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 py-6">

            {/* ===== KPI CARDS ===== */}
            <SectionCardsRadial
              cards={[
                { title: "Produits", value: dashboard.stats.products },
                { title: "Devis", value: dashboard.stats.devis },
                { title: "Établissements", value: dashboard.stats.etablissements },
                { title: "Chiffre d’affaires", value: dashboard.stats.revenue, isRevenue: true },
              ]}
            />

            {/* ===== CHARTS ===== */}
            <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-3 lg:px-6">

              {/* Evolution des devis */}
              <div className="flex flex-col gap-2 min-h-[350px]">
                <h2 className="text-lg font-semibold">Évolution des devis</h2>
                <div className="flex-1">
                  <ChartDevisCard
                    data={dashboard.chart.devis.map(d => ({ date: d.date, value: d.value }))}
                  />
                </div>
              </div>

          

              {/* Top produits (donut chart) */}
              <div className="flex flex-col gap-2 min-h-[350px]">
                <h2 className="text-lg font-semibold">Top produits</h2>
                <div className="flex-1">
                  <ChartProductsDonut
                    data={dashboard.topProducts}
                    label="Ventes"
                  />
                </div>
              </div>

               {/* Evolution des devis */}
               <div className="flex flex-col gap-2 min-h-[350px]">
                <h2 className="text-lg font-semibold">Évolution des Chiffre d'affaire</h2>
                <div className="flex-1">
                  <ChartDevisCard
                    data={dashboard.chart.devis.map(d => ({ date: d.date, value: d.value }))}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
