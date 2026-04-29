"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardInsights } from "@/components/dashboard-insights"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { menusByRole } from "@/lib/data/menus"
import type { DashboardData } from "@/lib/dashboard-data"
import { emptyDashboardData } from "@/lib/dashboard-data"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportingDash, setExpDash] = useState(false)
  const [exportingDevis, setExpDevis] = useState(false)
  const [purging, setPurging] = useState(false)
  const [purgeInfo, setPurgeInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState({
    startDate: new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    void fetchData()
  }, [range.startDate, range.endDate])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard?startDate=${range.startDate}&endDate=${range.endDate}`)
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
      setData(emptyDashboardData)
    } finally {
      setLoading(false)
    }
  }

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportDashboard = async () => {
    setExpDash(true)
    try {
      const res = await fetch("/api/dashboard/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: range.startDate, endDate: range.endDate, data, type: "dashboard" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      triggerDownload(await res.blob(), `dashboard-${range.startDate}-${range.endDate}.csv`)
    } catch (e) {
      alert(`Erreur: ${e}`)
    } finally {
      setExpDash(false)
    }
  }

  const exportDevis = async () => {
    setExpDevis(true)
    try {
      const res = await fetch("/api/dashboard/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: range.startDate, endDate: range.endDate, data, type: "devis" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      triggerDownload(await res.blob(), `liste-devis-${range.startDate}-${range.endDate}.csv`)
    } catch (e) {
      alert(`Erreur: ${e}`)
    } finally {
      setExpDevis(false)
    }
  }

  const purgeAllProductsAndDevis = async () => {
    if (purging) return

    const first = window.confirm(
      "Attention: cette action va supprimer TOUS les produits et TOUS les devis.\n\nVoulez-vous continuer ?"
    )
    if (!first) return

    const typed = window.prompt('Tapez "SUPPRIMER" pour confirmer la purge.')
    if (typed !== "SUPPRIMER") {
      setPurgeInfo("Purge annulée.")
      return
    }

    const password = window.prompt("Entrez votre mot de passe pour confirmer.")
    if (!password) {
      setPurgeInfo("Purge annulée.")
      return
    }

    setPurging(true)
    setPurgeInfo(null)

    try {
      const userId = localStorage.getItem("userId")
      if (!userId) throw new Error("Session invalide: userId manquant")

      const res = await fetch("/api/admin/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || `HTTP ${res.status}`)
      }

      setPurgeInfo(`Purge OK — ${payload.deleted?.products ?? 0} produits, ${payload.deleted?.devis ?? 0} devis supprimés.`)
      await fetchData()
    } catch (e) {
      setPurgeInfo(`Erreur purge: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPurging(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
        <AppSidebar menu={menusByRole.admin} />
        <div className="flex flex-col flex-1 min-w-0">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">Chargement...</p>
            </div>
          </div>
        </div>
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
      <AppSidebar menu={menusByRole.admin} />

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <SiteHeader />

        <DashboardInsights
          data={data}
          error={error}
          range={range}
          setRange={setRange}
          exportingDash={exportingDash}
          exportingDevis={exportingDevis}
          onExportDashboard={exportDashboard}
          onExportDevis={exportDevis}
          showPurge
          purging={purging}
          purgeInfo={purgeInfo}
          onPurge={purgeAllProductsAndDevis}
          headerSubtitle="Vue d'ensemble · Wifak"
        />
      </div>
    </SidebarProvider>
  )
}
