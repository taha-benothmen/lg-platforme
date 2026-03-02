"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import {
  Table, TableBody, TableCell, TableCaption,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2, Download, Filter, AlertCircle, CheckCircle2, X,
  Eye, XCircle, ChevronLeft, ChevronRight, Upload, FileText, Truck, Package,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type DevisItem = {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddr?: string
  clientEnterprise?: string
  clientNotes?: string
  total: string
  responsableStatus: "EN_ATTENTE" | "APPROUVE" | "SUSPENDU" | "REJETE"
  adminStatus: "EN_COURS_DE_FACTURATION" | "EN_COURS_DE_LIVRAISON" | "LIVREE" | "REJETE"
  hasInvoicePdf: boolean
  invoicePdfName?: string
  invoicePdfUploadedAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: { firstName: string; lastName: string; email: string }
  validatedBy?: { firstName: string; lastName: string }
  adminValidatedBy?: { firstName: string; lastName: string }
  etablissement?: { name: string }
  items?: Array<{
    id: string; quantity: number; price: string
    product: { id: number; name: string }
  }>
  invoicePdfData?: string
}

type AlertMessage = { type: "success" | "error"; title: string; message: string }
type Etablissement = { id: string; name: string; parentId?: string | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente", APPROUVE: "Approuvé",
  SUSPENDU: "Suspendu", REJETE: "Rejeté",
}
const STATUS_CLASSES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-900",
  APPROUVE: "bg-green-100 text-green-900",
  SUSPENDU: "bg-orange-100 text-orange-900",
  REJETE: "bg-red-100 text-red-900",
}
const adminStatusLabels: Record<string, string> = {
  EN_COURS_DE_FACTURATION: "En facturation",
  EN_COURS_DE_LIVRAISON: "En livraison",
  LIVREE: "Livrée", REJETE: "Rejeté",
}
const adminStatusClasses: Record<string, string> = {
  EN_COURS_DE_FACTURATION: "bg-blue-100 text-blue-900",
  EN_COURS_DE_LIVRAISON: "bg-purple-100 text-purple-900",
  LIVREE: "bg-green-100 text-green-900",
  REJETE: "bg-red-100 text-red-900",
}
const ITEMS_PER_PAGE = 20

// ─── Mobile card ──────────────────────────────────────────────────────────────

function DevisCard({
  q, onView, onDownload, isDownloading,
}: {
  q: DevisItem
  onView: (id: string) => void
  onDownload: (d: DevisItem) => void
  isDownloading: boolean
}) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{q.clientName}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">#{q.id.slice(0, 8)}</p>
        </div>
        <p className="font-bold text-gray-900 shrink-0 text-sm">
          {parseFloat(q.total).toFixed(2)} TND
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[q.responsableStatus]}`}>
          {statusLabels[q.responsableStatus]}
        </span>
        {q.responsableStatus === "APPROUVE" && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${adminStatusClasses[q.adminStatus]}`}>
            {adminStatusLabels[q.adminStatus]}
          </span>
        )}
        {q.hasInvoicePdf && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <FileText className="h-3 w-3" /> PDF
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-gray-400 uppercase tracking-wide font-medium">Créé par</span>
        <span className="text-gray-400 uppercase tracking-wide font-medium">Établissement</span>
        <span className="text-gray-700 truncate">
          {q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : "—"}
        </span>
        <span className="text-gray-600 truncate">{q.etablissement?.name || "—"}</span>

        <span className="text-gray-400 uppercase tracking-wide font-medium">Date</span>
        <span />
        <span className="text-gray-700">
          {new Date(q.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => onView(q.id)} className="flex-1 gap-1.5">
          <Eye className="h-4 w-4" /> Détails
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDownload(q)} disabled={isDownloading} className="flex-1 gap-1.5">
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Télécharger
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDevisPage() {
  const [devis, setDevis] = useState<DevisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [responsableStatusFilter, setResponsableStatusFilter] = useState("ALL")
  const [adminStatusFilter, setAdminStatusFilter] = useState("ALL")
  const [etablissementFilter, setEtablissementFilter] = useState("ALL")
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [loadingEtabs, setLoadingEtabs] = useState(false)
  const [selectedDevis, setSelectedDevis] = useState<DevisItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDevis, setTotalDevis] = useState(0)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    setIsClient(true)
    let id = localStorage.getItem("userId")
    if (!id) {
      try {
        const s = localStorage.getItem("userSession")
        if (s) id = JSON.parse(s).id
      } catch {}
    }
    setUserId(id)
  }, [])

  const showAlert = (type: "success" | "error", title: string, message: string) => {
    setAlertMessage({ type, title, message })
    setTimeout(() => setAlertMessage(null), 5000)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEtabs(true)
        const res = await fetch("/api/etablissements")
        if (res.ok) setEtablissements(await res.json())
      } catch {} finally { setLoadingEtabs(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (userId) { setCurrentPage(1); loadAllDevis(1) }
  }, [userId, responsableStatusFilter, adminStatusFilter, etablissementFilter])

  const loadAllDevis = async (page: number = 1) => {
    if (!userId) { setLoading(false); return }
    try {
      page === 1 ? setLoading(true) : setIsLoadingMore(true)
      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", userId)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", ITEMS_PER_PAGE.toString())
      if (responsableStatusFilter !== "ALL") url.searchParams.set("responsableStatus", responsableStatusFilter)
      if (adminStatusFilter !== "ALL") url.searchParams.set("adminStatus", adminStatusFilter)
      if (etablissementFilter !== "ALL") url.searchParams.set("etablissementId", etablissementFilter)

      const res = await fetch(url.toString())
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || `HTTP ${res.status}`) }
      const result = await res.json()

      if (result.data && Array.isArray(result.data)) {
        setDevis(result.data)
        setTotalDevis(result.pagination?.total || 0)
        setTotalPages(result.pagination?.totalPages || 1)
        setCurrentPage(page)
      } else {
        setDevis([]); setTotalDevis(0); setTotalPages(1)
      }
    } catch (error) {
      showAlert("error", "Erreur", error instanceof Error ? error.message : "Impossible de charger les devis")
      setDevis([])
    } finally { setLoading(false); setIsLoadingMore(false) }
  }

  const handleViewDetails = async (devisId: string) => {
    if (!userId) { showAlert("error", "Erreur", "ID utilisateur introuvable"); return }
    try {
      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", userId)
      url.searchParams.set("id", devisId)
      url.searchParams.set("includePdf", "true")
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error()
      const result = await res.json()
      setSelectedDevis(result.data)
      setIsDetailOpen(true)
    } catch { showAlert("error", "Erreur", "Impossible de charger les détails du devis") }
  }

  const handleDownloadDevis = (devisData: DevisItem) => {
    try {
      setIsDownloading(true)
      const htmlContent = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Devis ${devisData.id.slice(0, 8)}</title></head><body><h1>Devis #${devisData.id.slice(0, 8)}</h1><p>Client: ${devisData.clientName}</p><p>Total: ${parseFloat(devisData.total).toFixed(2)} TND</p></body></html>`
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `devis-${devisData.id.slice(0, 8)}.html`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); window.URL.revokeObjectURL(url)
      showAlert("success", "Téléchargement réussi", `devis-${devisData.id.slice(0, 8)}.html`)
    } catch { showAlert("error", "Erreur", "Impossible de télécharger le devis") }
    finally { setIsDownloading(false) }
  }

  const downloadInvoicePdf = () => {
    if (!selectedDevis?.invoicePdfData || !selectedDevis.invoicePdfName) return
    const a = document.createElement("a")
    a.href = selectedDevis.invoicePdfData; a.download = selectedDevis.invoicePdfName
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const handleUpdateStatus = async (statusType: "responsable" | "admin", newStatus: string) => {
    if (!selectedDevis || !userId) { showAlert("error", "Erreur", "Données manquantes"); return }
    try {
      setIsUpdatingStatus(true)
      const formData = new FormData()
      formData.append("devisId", selectedDevis.id)
      formData.append("userId", userId)
      if (statusType === "responsable") formData.append("responsableStatus", newStatus)
      else formData.append("adminStatus", newStatus)
      if (selectedPdfFile) formData.append("invoicePdf", selectedPdfFile)

      const res = await fetch("/api/devis", { method: "PUT", body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`)
      setSelectedDevis(result.data)
      setSelectedPdfFile(null)
      await loadAllDevis(currentPage)
      const label = statusType === "admin" ? adminStatusLabels[newStatus] : statusLabels[newStatus]
      showAlert("success", "Succès", `Statut mis à jour: ${label}`)
    } catch (error) {
      showAlert("error", "Erreur", error instanceof Error ? error.message : "Erreur de mise à jour")
    } finally { setIsUpdatingStatus(false) }
  }

  const goToPage = (page: number) => loadAllDevis(Math.max(1, Math.min(page, totalPages)))
  const parentEtabs = etablissements.filter(e => !e.parentId)
  const getChildEtabs = (parentId: string) => etablissements.filter(e => e.parentId === parentId)

  if (!isClient) return null

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar menu={menusByRole.admin} />

      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

          {/* Alert */}
          {alertMessage && (
            <Alert
              variant={alertMessage.type === "success" ? "default" : "destructive"}
              className={alertMessage.type === "success" ? "bg-green-50 border-green-200" : ""}
            >
              {alertMessage.type === "success"
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{alertMessage.title}</AlertTitle>
              <AlertDescription>{alertMessage.message}</AlertDescription>
              <button onClick={() => setAlertMessage(null)} className="absolute top-4 right-4">
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          {/* Header */}
          <h1 className="text-2xl font-bold">Liste de tous les Devis (Admin)</h1>

          {/* Filters — stack on mobile, row on lg */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Select value={responsableStatusFilter} onValueChange={setResponsableStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Filtre Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="APPROUVE">Approuvé</SelectItem>
                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                <SelectItem value="REJETE">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Filtre Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="EN_COURS_DE_FACTURATION">En attente livraison</SelectItem>
                <SelectItem value="EN_COURS_DE_LIVRAISON">En cours livraison</SelectItem>
                <SelectItem value="LIVREE">Livrée</SelectItem>
                <SelectItem value="REJETE">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={etablissementFilter} onValueChange={setEtablissementFilter} disabled={loadingEtabs}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Filtre établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les établissements</SelectItem>
                {parentEtabs.map((parent) => (
                  <div key={parent.id}>
                    <SelectItem value={parent.id} className="font-semibold">{parent.name}</SelectItem>
                    {getChildEtabs(parent.id).map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        <span className="pl-4">└─ {child.name}</span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* States */}
          {!userId ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Authentification en cours...</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-40 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span>Chargement des devis...</span>
            </div>
          ) : devis.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Aucun devis trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── Desktop table ── */}
              <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Total: {totalDevis} devis</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Établissement</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Facture</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devis.map((q) => (
                        <TableRow key={q.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-sm font-mono">{q.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">{q.clientName}</TableCell>
                          <TableCell className="text-sm">{new Date(q.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell className="font-bold">{parseFloat(q.total).toFixed(2)} TND</TableCell>
                          <TableCell className="text-sm">{q.createdBy?.firstName} {q.createdBy?.lastName}</TableCell>
                          <TableCell className="text-sm">{q.etablissement?.name || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[q.responsableStatus]}`}>
                              {statusLabels[q.responsableStatus]}
                            </span>
                          </TableCell>
                          <TableCell>
                            {q.responsableStatus === "APPROUVE" ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${adminStatusClasses[q.adminStatus]}`}>
                                {adminStatusLabels[q.adminStatus]}
                              </span>
                            ) : <span className="text-sm text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {q.hasInvoicePdf
                              ? <span className="flex items-center justify-center gap-1 text-xs text-green-600"><FileText className="h-4 w-4" />PDF</span>
                              : <span className="text-gray-300 text-xs">-</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="outline" onClick={() => handleViewDetails(q.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownloadDevis(q)} disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden space-y-3">
                <p className="text-xs text-gray-400 text-right">Total: {totalDevis} devis</p>
                {devis.map((q) => (
                  <DevisCard
                    key={q.id} q={q}
                    onView={handleViewDetails}
                    onDownload={handleDownloadDevis}
                    isDownloading={isDownloading}
                  />
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                    {isLoadingMore && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingMore} className="gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const show = page <= 2 || page >= totalPages - 1 ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      return (
                        <div key={page}>
                          {show ? (
                            <Button variant={currentPage === page ? "default" : "outline"}
                              size="sm" onClick={() => goToPage(page)}
                              disabled={isLoadingMore} className="w-9">{page}</Button>
                          ) : page === 3 ? (
                            <span className="px-1 text-muted-foreground">…</span>
                          ) : null}
                        </div>
                      )
                    })}

                    <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoadingMore} className="gap-1">
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground hidden sm:block">{ITEMS_PER_PAGE} lignes/page</div>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* ── Detail Dialog ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis #{selectedDevis?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {selectedDevis && `Responsable: ${statusLabels[selectedDevis.responsableStatus]} | Admin: ${selectedDevis.responsableStatus === "APPROUVE" ? adminStatusLabels[selectedDevis.adminStatus] : "-"}`}
            </DialogDescription>
          </DialogHeader>

          {selectedDevis && (
            <div className="space-y-6">
              {/* Client info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base">Informations Client</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["Nom", selectedDevis.clientName],
                    ["Email", selectedDevis.clientEmail],
                    ["Téléphone", selectedDevis.clientPhone || "N/A"],
                    ["Entreprise", selectedDevis.clientEnterprise || "N/A"],
                    ["Adresse", selectedDevis.clientAddr || "N/A", true],
                    ...(selectedDevis.clientNotes ? [["Notes", selectedDevis.clientNotes, true]] : []),
                  ].map(([label, value, full]) => (
                    <div key={label as string} className={full ? "col-span-1 sm:col-span-2" : ""}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              {selectedDevis.items && selectedDevis.items.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Articles</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm min-w-[320px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3">Produit</th>
                          <th className="text-center p-3">Qté</th>
                          <th className="text-right p-3">P.U</th>
                          <th className="text-right p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevis.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3">{item.product.name}</td>
                            <td className="text-center p-3">{item.quantity}</td>
                            <td className="text-right p-3">{parseFloat(item.price).toFixed(2)} TND</td>
                            <td className="text-right p-3 font-bold">
                              {(parseFloat(item.price) * item.quantity).toFixed(2)} TND
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-base">Résumé</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{parseFloat(selectedDevis.total).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">État Responsable</p>
                    <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[selectedDevis.responsableStatus]}`}>
                      {statusLabels[selectedDevis.responsableStatus]}
                    </span>
                  </div>
                  {selectedDevis.responsableStatus === "APPROUVE" && (
                    <div>
                      <p className="text-xs text-muted-foreground">État Admin</p>
                      <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${adminStatusClasses[selectedDevis.adminStatus]}`}>
                        {adminStatusLabels[selectedDevis.adminStatus]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Créé par</p>
                    <p className="font-medium text-sm">{selectedDevis.createdBy?.firstName} {selectedDevis.createdBy?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Établissement</p>
                    <p className="font-medium text-sm">{selectedDevis.etablissement?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date de création</p>
                    <p className="font-medium text-sm">{new Date(selectedDevis.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>

              {/* PDF */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Facture PDF
                </h3>
                {selectedDevis.hasInvoicePdf ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <FileText className="h-5 w-5 shrink-0" />
                      <span className="font-medium text-sm truncate">{selectedDevis.invoicePdfName}</span>
                    </div>
                    {selectedDevis.invoicePdfUploadedAt && (
                      <p className="text-xs text-gray-500">
                        Uploadé le: {new Date(selectedDevis.invoicePdfUploadedAt).toLocaleString("fr-FR")}
                      </p>
                    )}
                    <Button onClick={downloadInvoicePdf} variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" /> Télécharger la facture
                    </Button>
                  </div>
                ) : selectedDevis.responsableStatus === "APPROUVE" ? (
                  <div className="space-y-3">
                    <Input type="file" accept=".pdf"
                      onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)} />
                    {selectedPdfFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <FileText className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm flex-1 truncate">{selectedPdfFile.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPdfFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-3 pt-2">
            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "EN_COURS_DE_FACTURATION" && (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button onClick={() => handleUpdateStatus("admin", "EN_COURS_DE_LIVRAISON")}
                    disabled={isUpdatingStatus}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1">
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Confirmer et envoyer
                  </Button>
                  <Button onClick={() => handleUpdateStatus("admin", "REJETE")}
                    disabled={isUpdatingStatus} variant="destructive" className="gap-2">
                    <XCircle className="h-4 w-4" /> Rejeter
                  </Button>
                </div>
              )}

            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "EN_COURS_DE_LIVRAISON" && (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button onClick={() => handleUpdateStatus("admin", "LIVREE")}
                    disabled={isUpdatingStatus}
                    className="gap-2 bg-green-600 hover:bg-green-700 flex-1">
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Marquer comme livrée
                  </Button>
                  <Button onClick={() => handleUpdateStatus("admin", "REJETE")}
                    disabled={isUpdatingStatus} variant="destructive" className="gap-2">
                    <XCircle className="h-4 w-4" /> Rejeter
                  </Button>
                </div>
              )}

            {selectedDevis?.responsableStatus === "APPROUVE" && selectedDevis?.adminStatus === "LIVREE" && (
              <div className="w-full p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-medium text-sm">Devis terminé - Livraison effectuée</span>
              </div>
            )}

            {selectedDevis?.responsableStatus === "APPROUVE" && selectedDevis?.adminStatus === "REJETE" && (
              <div className="w-full p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-3">
                <XCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium text-sm">Devis rejeté par l'admin</span>
              </div>
            )}

            {selectedDevis?.responsableStatus !== "APPROUVE" && (
              <div className="w-full p-3 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm italic">
                En attente de l'approbation du Responsable...
              </div>
            )}

            <div className="flex justify-end w-full">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fermer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}