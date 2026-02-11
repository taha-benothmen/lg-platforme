"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCardsRadial } from "@/components/CardRevenueRadial"
import { ChartDevisCard } from "@/components/ChartDevisCard"
import { ChartProductsDonut } from "@/components/ChartProductsDonut"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { menusByRole } from "@/lib/data/menus"
import { useState, useEffect } from "react"
import { Download, Loader2, Building2, User } from "lucide-react"

interface DashboardData {
  stats: {
    products: number
    devis: number
    etablissements: number
    revenue: string
  }
  chart: {
    devis: Array<{ date: string; value: number }>
  }
  topProducts: Array<{
    name: string
    value: number
  }>
  topAgenciesByDevis?: Array<{
    id: string
    name: string
    devisCount: number
    revenue: string
  }>
  topAgenciesByRevenue?: Array<{
    id: string
    name: string
    devisCount: number
    revenue: string
  }>
  topResponsablesByDevis?: Array<{
    id: string
    firstName: string
    lastName: string
    devisCount: number
    revenue: string
  }>
  topResponsablesByRevenue?: Array<{
    id: string
    firstName: string
    lastName: string
    devisCount: number
    revenue: string
  }>
}

const transformTopProductsData = (topProducts: Array<{ name: string; value: number }>) => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ]

  return topProducts.map((product, index) => ({
    category: product.name,
    sales: product.value,
    fill: colors[index % colors.length],
  }))
}

const RankingCard = ({
  rank,
  name,
  subtitle,
  revenue,
  bgColor,
  badgeColor,
}: {
  rank: number
  name: string
  subtitle: string
  revenue: string
  bgColor: string
  badgeColor: string
}) => (
  <div className={`flex items-center justify-between p-3 ${bgColor} rounded-lg border`}>
    <div className="flex items-center gap-3 flex-1">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${badgeColor} text-white text-sm font-bold`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{name}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
    <div className="text-right ml-4">
      <p className={`font-semibold ${badgeColor.replace('bg-', 'text-')}`}>{revenue}</p>
    </div>
  </div>
)

export default function Page() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `/api/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`API Error:`, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      console.error(`Error:`, errorMsg)
      setError(errorMsg)
      
      setDashboardData({
        stats: { products: 0, devis: 0, etablissements: 0, revenue: "0 TND" },
        chart: { devis: [] },
        topProducts: [],
        topAgenciesByDevis: [],
        topAgenciesByRevenue: [],
        topResponsablesByDevis: [],
        topResponsablesByRevenue: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadXLS = async () => {
    try {
      setExporting(true)
      
      const response = await fetch("/api/dashboard/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          data: dashboardData,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error("Export error:", text)
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dashboard-${dateRange.startDate}-${dateRange.endDate}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error(`Export error:`, error)
      alert(`Erreur lors du téléchargement: ${error}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
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
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
        "--sidebar-width-mobile": "calc(var(--spacing) * 72)",
      } as React.CSSProperties}
    >
      {/* ✅ Sidebar fixe à gauche */}
      <div className="flex h-screen w-full">
        <div className="flex-shrink-0 h-full">
          <AppSidebar menu={menusByRole.admin} />
        </div>

        {/* ✅ Contenu scrollable à droite */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header fixe en haut du contenu */}
          <div className="flex-shrink-0">
            <SiteHeader />
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 lg:px-6 py-6">
              <div className="max-w-7xl mx-auto space-y-6">

                {/* Error Alert */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold">Erreur</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                )}

                {/* Header with Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">Tableau de bord</h1>
                    <p className="text-muted-foreground mt-1">Vue d'ensemble des statistiques</p>
                  </div>

                  {/* Date Range + Export */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-muted-foreground mb-1">Début</label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-muted-foreground mb-1">Fin</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={downloadXLS}
                        disabled={exporting || !dashboardData}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {exporting ? "Export..." : "CSV"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                {dashboardData && (
                  <SectionCardsRadial
                    cards={[
                      { title: "Produits", value: dashboardData.stats.products },
                      { title: "Devis", value: dashboardData.stats.devis },
                      { title: "Établissements", value: dashboardData.stats.etablissements },
                      { title: "Chiffre d'affaires", value: dashboardData.stats.revenue, isRevenue: true },
                    ]}
                  />
                )}

                {/* Charts Grid - 3 Columns */}
                {dashboardData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Evolution des devis */}
                    <div className="lg:col-span-1 border rounded-lg p-4 bg-white">
                      <h2 className="text-lg font-semibold mb-4">Évolution des devis</h2>
                      <div className="h-80">
                        {dashboardData.chart.devis.length > 0 ? (
                          <ChartDevisCard data={dashboardData.chart.devis} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chiffre d'affaires */}
                    <div className="lg:col-span-1 border rounded-lg p-4 bg-white">
                      <h2 className="text-lg font-semibold mb-4">Chiffre d'affaire</h2>
                      <div className="h-80">
                        {dashboardData.chart.devis.length > 0 ? (
                          <ChartDevisCard data={dashboardData.chart.devis} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Produits */}
                    <div className="lg:col-span-1 border rounded-lg p-4 bg-white">
                      <h2 className="text-lg font-semibold mb-4">Top Produits</h2>
                      <div className="h-80">
                        {dashboardData.topProducts.length > 0 && dashboardData.topProducts[0].name !== "Aucun produit" ? (
                          <ChartProductsDonut
                            data={transformTopProductsData(dashboardData.topProducts)}
                            label="Quantité"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* TOP AGENCIES SECTION - 2 columns */}
                {dashboardData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Top Agencies by Devis Count */}
                    <div className="border rounded-lg p-6 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold">Top Agences (par Devis)</h2>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.topAgenciesByDevis && dashboardData.topAgenciesByDevis.length > 0 ? (
                          dashboardData.topAgenciesByDevis.map((agency, index) => (
                            <RankingCard
                              key={agency.id}
                              rank={index + 1}
                              name={agency.name}
                              subtitle={`${agency.devisCount} devis`}
                              revenue={agency.revenue}
                              bgColor="bg-blue-50 border-blue-200"
                              badgeColor="bg-blue-600"
                            />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Agencies by Revenue */}
                    <div className="border rounded-lg p-6 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-semibold">Top Agences (par Chiffre d'affaires)</h2>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.topAgenciesByRevenue && dashboardData.topAgenciesByRevenue.length > 0 ? (
                          dashboardData.topAgenciesByRevenue.map((agency, index) => (
                            <RankingCard
                              key={agency.id}
                              rank={index + 1}
                              name={agency.name}
                              subtitle={`${agency.devisCount} devis`}
                              revenue={agency.revenue}
                              bgColor="bg-amber-50 border-amber-200"
                              badgeColor="bg-amber-600"
                            />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* TOP RESPONSABLES SECTION - 2 columns */}
                {dashboardData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Top Responsables by Devis Count */}
                    <div className="border rounded-lg p-6 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-green-600" />
                        <h2 className="text-lg font-semibold">Top Responsables (par Devis)</h2>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.topResponsablesByDevis && dashboardData.topResponsablesByDevis.length > 0 ? (
                          dashboardData.topResponsablesByDevis.map((responsable, index) => (
                            <RankingCard
                              key={responsable.id}
                              rank={index + 1}
                              name={`${responsable.firstName} ${responsable.lastName}`}
                              subtitle={`${responsable.devisCount} devis`}
                              revenue={responsable.revenue}
                              bgColor="bg-green-50 border-green-200"
                              badgeColor="bg-green-600"
                            />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Responsables by Revenue */}
                    <div className="border rounded-lg p-6 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold">Top Responsables (par Chiffre d'affaires)</h2>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.topResponsablesByRevenue && dashboardData.topResponsablesByRevenue.length > 0 ? (
                          dashboardData.topResponsablesByRevenue.map((responsable, index) => (
                            <RankingCard
                              key={responsable.id}
                              rank={index + 1}
                              name={`${responsable.firstName} ${responsable.lastName}`}
                              subtitle={`${responsable.devisCount} devis`}
                              revenue={responsable.revenue}
                              bgColor="bg-emerald-50 border-emerald-200"
                              badgeColor="bg-emerald-600"
                            />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                            Pas de données
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                <div className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}