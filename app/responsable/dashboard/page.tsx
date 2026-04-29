"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardInsights } from "@/components/dashboard-insights"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { menusByRole } from "@/lib/data/menus"
import type { DashboardData, EtablissementDashboardData } from "@/lib/dashboard-data"
import { emptyDashboardData, emptyEtablissementDashboardData } from "@/lib/dashboard-data"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ResponsableOrganisationDashboardPage() {
  const router = useRouter()
  const [accessDenied, setAccessDenied] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [data, setData] = useState<EtablissementDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportingDash, setExpDash] = useState(false)
  const [exportingDevis, setExpDevis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSousEtablissement, setSelectedSousEtablissement] = useState<string>("")
  const [range, setRange] = useState({
    startDate: new Date(Date.now() - 90 * 864e5).toISOString().split("T")[0], // 90 days back instead of 30
    endDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (!userId) {
      setCheckingAccess(false)
      setAccessDenied(true)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const u = await fetch(`/api/utilisateurs/${userId}`)
        const uj = await u.json()
        if (cancelled) return
        if (!u.ok || !uj?.success || uj.role !== "RESPONSABLE") {
          setAccessDenied(true)
          setCheckingAccess(false)
          return
        }
        if (uj.etablissement?.parentId) {
          setAccessDenied(true)
          setCheckingAccess(false)
          return
        }
        setCheckingAccess(false)
      } catch {
        if (!cancelled) {
          setAccessDenied(true)
          setCheckingAccess(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (checkingAccess || accessDenied) return

    const userId = localStorage.getItem("userId")
    if (!userId) return

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/dashboard/responsable-etablissement?userId=${encodeURIComponent(userId)}&startDate=${range.startDate}&endDate=${range.endDate}`
        )
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.status === 403 && body?.error === "FORBIDDEN_SOUS_ETABLISSEMENT") {
          setAccessDenied(true)
          setData(emptyEtablissementDashboardData)
          return
        }
        if (!res.ok) throw new Error(body.error || body.message || `HTTP ${res.status}`)
        setData(body as EtablissementDashboardData)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur inconnue")
          setData(emptyEtablissementDashboardData)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [checkingAccess, accessDenied, range.startDate, range.endDate])

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
      triggerDownload(await res.blob(), `dashboard-organisation-${range.startDate}-${range.endDate}.csv`)
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
      triggerDownload(await res.blob(), `liste-devis-organisation-${range.startDate}-${range.endDate}.csv`)
    } catch (e) {
      alert(`Erreur: ${e}`)
    } finally {
      setExpDevis(false)
    }
  }

  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
    "--sidebar-width-mobile": "calc(var(--spacing) * 72)",
  } as React.CSSProperties

  if (checkingAccess) {
    return (
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar menu={menusByRole.responsable} />
        <div className="flex flex-col flex-1 min-w-0">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">Vérification des droits...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  if (accessDenied) {
    return (
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar menu={menusByRole.responsable} />
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <SiteHeader />
          <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md bg-white border rounded-2xl p-8 shadow-sm text-center space-y-4">
              <h1 className="text-xl font-bold text-gray-900">Tableau de bord organisation</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Cette vue agrégée (tous les sous-établissements) est réservée au responsable rattaché à
                l&apos;établissement siège — sans sous-établissement parent.
              </p>
              <Button onClick={() => router.push("/responsable/produits")} className="w-full">
                Retour au catalogue
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  if (loading) {
    return (
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar menu={menusByRole.responsable} />
        <div className="flex flex-col flex-1 min-w-0">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center bg-gray-50">
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
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar menu={menusByRole.responsable} />

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <SiteHeader />

        <DashboardInsights
          data={data?.mainEtablissement.data || null}
          error={error}
          range={range}
          setRange={setRange}
          exportingDash={exportingDash}
          exportingDevis={exportingDevis}
          onExportDashboard={exportDashboard}
          onExportDevis={exportDevis}
          headerSubtitle={`${data?.mainEtablissement.name || 'Établissement principal'} · Vue détaillée`}
          sousEtablissements={data?.sousEtablissements || []}
          selectedSousEtablissement={selectedSousEtablissement}
          onSelectedSousEtablissementChange={setSelectedSousEtablissement}
        />
      </div>
    </SidebarProvider>
  )
}
