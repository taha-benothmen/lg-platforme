"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Download, Search, Filter, AlertCircle, CheckCircle2, X, Eye, Check, XCircle } from "lucide-react"

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
  adminStatus: "EN_ATTENTE" | "REJETE" | "APPROUVE"
  createdAt: string
  updatedAt: string
  createdBy?: {
    firstName: string
    lastName: string
    email: string
  }
  validatedBy?: {
    firstName: string
    lastName: string
  }
  adminValidatedBy?: {
    firstName: string
    lastName: string
  }
  etablissement?: {
    name: string
  }
  items?: Array<{
    id: string
    quantity: number
    price: string
    product: {
      id: number
      name: string
    }
  }>
}

type AlertMessage = {
  type: "success" | "error"
  title: string
  message: string
}

type Etablissement = {
  id: string
  name: string
  parentId?: string | null
}

// Utilitaires de statut
const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE: "Approuvé",
  SUSPENDU: "Suspendu",
  REJETE: "Rejeté",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EN_ATTENTE: "outline",
  APPROUVE: "default",
  SUSPENDU: "secondary",
  REJETE: "destructive",
}

const STATUS_CLASSES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-900",
  APPROUVE: "bg-green-100 text-green-900",
  SUSPENDU: "bg-orange-100 text-orange-900",
  REJETE: "bg-red-100 text-red-900",
}

function getStatusLabel(status: string): string {
  return statusLabels[status] || status
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  return statusVariants[status] || "outline"
}

function downloadQuote(quote: DevisItem) {
  const content = `Devis #${quote.id}

Client: ${quote.clientName}
Email: ${quote.clientEmail}
Téléphone: ${quote.clientPhone || "N/A"}
Date: ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}
Total: ${parseFloat(quote.total).toFixed(2)} TND
État Responsable: ${getStatusLabel(quote.responsableStatus)}
État Admin: ${getStatusLabel(quote.adminStatus)}

Créé par: ${quote.createdBy?.firstName} ${quote.createdBy?.lastName}
Établissement: ${quote.etablissement?.name || "N/A"}
`

  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `devis-${quote.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminDevisPage() {
  const [devis, setDevis] = useState<DevisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
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

  // ✅ FIX 1: Initialize client-side only and extract userId from localStorage
  useEffect(() => {
    setIsClient(true)
    
    // Try multiple ways to get userId
    let id = localStorage.getItem("userId")
    
    // If not found, try to get it from userSession
    if (!id) {
      const userSessionStr = localStorage.getItem("userSession")
      if (userSessionStr) {
        try {
          const userSession = JSON.parse(userSessionStr)
          id = userSession.id
        } catch (e) {
          console.error("Failed to parse userSession:", e)
        }
      }
    }
    
    console.log("userId initialized from localStorage:", id)
    setUserId(id)
  }, [])

  const showAlert = (type: "success" | "error", title: string, message: string) => {
    setAlertMessage({ type, title, message })
    setTimeout(() => {
      setAlertMessage(null)
    }, 5000)
  }

  // Load establishments
  useEffect(() => {
    const loadEtablissements = async () => {
      try {
        setLoadingEtabs(true)
        const response = await fetch("/api/etablissements")
        if (response.ok) {
          const data = await response.json()
          setEtablissements(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des établissements:", error)
      } finally {
        setLoadingEtabs(false)
      }
    }

    loadEtablissements()
  }, [])

  // ✅ FIX 2: Only load devis when userId is available
  useEffect(() => {
    if (userId) {
      loadAllDevis()
    }
  }, [userId, responsableStatusFilter, adminStatusFilter, etablissementFilter])

  const loadAllDevis = async () => {
    if (!userId) {
      console.warn("userId not available, skipping loadAllDevis")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", userId)

      if (responsableStatusFilter !== "ALL") {
        url.searchParams.set("responsableStatus", responsableStatusFilter)
      }

      if (adminStatusFilter !== "ALL") {
        url.searchParams.set("adminStatus", adminStatusFilter)
      }

      if (etablissementFilter !== "ALL") {
        url.searchParams.set("etablissementId", etablissementFilter)
      }

      console.log("Fetching devis with URL:", url.toString())
      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: Erreur lors du chargement des devis`)
      }

      const result = await response.json()
      console.log("Devis loaded successfully:", result)

      // ✅ FIX 3: Proper response handling
      if (Array.isArray(result.data)) {
        setDevis(result.data)
      } else if (result.data) {
        setDevis([result.data])
      } else {
        setDevis([])
      }
    } catch (error) {
      console.error("Erreur:", error)
      showAlert(
        "error",
        "Erreur",
        error instanceof Error ? error.message : "Impossible de charger les devis"
      )
      setDevis([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (devisId: string) => {
    if (!userId) {
      showAlert("error", "Erreur", "ID utilisateur introuvable")
      return
    }

    try {
      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", userId)
      url.searchParams.set("id", devisId)

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des détails")
      }

      const result = await response.json()
      setSelectedDevis(result.data)
      setIsDetailOpen(true)
    } catch (error) {
      console.error("Erreur:", error)
      showAlert("error", "Erreur", "Impossible de charger les détails du devis")
    }
  }

  const handleUpdateStatus = async (statusType: "responsable" | "admin", newStatus: string) => {
    if (!selectedDevis || !userId) return

    try {
      setIsUpdatingStatus(true)

      const updatePayload: any = {
        devisId: selectedDevis.id,
        userId: userId,
      }

      if (statusType === "responsable") {
        updatePayload.responsableStatus = newStatus
      } else {
        updatePayload.adminStatus = newStatus
      }

      const response = await fetch("/api/devis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      const result = await response.json()
      setSelectedDevis(result.data)

      // Reload devis list
      await loadAllDevis()
      showAlert("success", "Succès", `Statut admin mis à jour`)
    } catch (error) {
      showAlert("error", "Erreur", error instanceof Error ? error.message : "Impossible de mettre à jour le devis")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const filteredDevis = devis.filter((d) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      d.id.toLowerCase().includes(searchLower) ||
      d.clientName.toLowerCase().includes(searchLower) ||
      d.clientEmail.toLowerCase().includes(searchLower) ||
      d.clientPhone?.toLowerCase().includes(searchLower) ||
      (d.createdBy?.firstName + " " + d.createdBy?.lastName).toLowerCase().includes(searchLower) ||
      d.etablissement?.name.toLowerCase().includes(searchLower) ||
      new Date(d.createdAt).toLocaleDateString("fr-FR").includes(searchLower) ||
      parseFloat(d.total).toFixed(2).includes(searchLower)

    return matchesSearch
  })

  // Group establishments by parent
  const parentEtabs = etablissements.filter(e => !e.parentId)
  const getChildEtabs = (parentId: string) => etablissements.filter(e => e.parentId === parentId)

  // ✅ FIX 4: Don't render until client is ready
  if (!isClient) {
    return null
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.admin} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 space-y-6">
            {alertMessage && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                <Alert
                  variant={alertMessage.type === "success" ? "default" : "destructive"}
                  className={alertMessage.type === "success" ? "bg-green-50 border-green-200" : ""}
                >
                  {alertMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{alertMessage.title}</AlertTitle>
                  <AlertDescription>{alertMessage.message}</AlertDescription>
                  <button
                    onClick={() => setAlertMessage(null)}
                    className="absolute top-4 right-4"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Alert>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold">Liste de tous les Devis (Admin)</h1>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                <Select value={responsableStatusFilter} onValueChange={setResponsableStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <Filter className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-full lg:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtre Admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                    <SelectItem value="REJETE">Rejeté</SelectItem>
                    <SelectItem value="APPROUVE">Approuvé</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={etablissementFilter} onValueChange={setEtablissementFilter} disabled={loadingEtabs}>
                  <SelectTrigger className="w-full lg:w-64">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtre établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les établissements</SelectItem>
                    {parentEtabs.map((parent) => (
                      <div key={parent.id}>
                        <SelectItem value={parent.id} className="font-semibold">
                          {parent.name}
                        </SelectItem>
                        {getChildEtabs(parent.id).map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            <span className="pl-4">└─ {child.name}</span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full lg:flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {!userId ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Authentification en cours...</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDevis.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Aucun devis trouvé</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>
                      Total: {filteredDevis.length} devis
                    </TableCaption>

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
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredDevis.map((q) => (
                        <TableRow key={q.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-sm">{q.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">{q.clientName}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="font-bold">
                            {parseFloat(q.total).toFixed(2)} TND
                          </TableCell>
                          <TableCell className="text-sm">
                            {q.createdBy?.firstName} {q.createdBy?.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {q.etablissement?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(q.responsableStatus)}
                              className={STATUS_CLASSES[q.responsableStatus]}
                            >
                              {getStatusLabel(q.responsableStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {/* ✅ ADMIN: Afficher le badge admin SEULEMENT si responsable est APPROUVE */}
                            {q.responsableStatus === "APPROUVE" ? (
                              <Badge
                                variant={getStatusVariant(q.adminStatus)}
                                className={STATUS_CLASSES[q.adminStatus]}
                              >
                                {getStatusLabel(q.adminStatus)}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(q.id)}
                                className="gap-2"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQuote(q)}
                                className="gap-2"
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Devis #{selectedDevis?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {selectedDevis && `Responsable: ${getStatusLabel(selectedDevis.responsableStatus)} | Admin: ${selectedDevis.responsableStatus === "APPROUVE" ? getStatusLabel(selectedDevis.adminStatus) : "-"}`}
            </DialogDescription>
          </DialogHeader>

          {selectedDevis && (
            <div className="space-y-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations Client</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{selectedDevis.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDevis.clientEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedDevis.clientPhone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedDevis.clientEnterprise || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedDevis.clientAddr || "N/A"}</p>
                  </div>
                  {selectedDevis.clientNotes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{selectedDevis.clientNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              {selectedDevis.items && selectedDevis.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Articles</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3">Produit</th>
                          <th className="text-center p-3">Quantité</th>
                          <th className="text-right p-3">Prix Unitaire</th>
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
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg">Résumé</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{parseFloat(selectedDevis.total).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">État Responsable</p>
                    <Badge
                      variant={getStatusVariant(selectedDevis.responsableStatus)}
                      className={STATUS_CLASSES[selectedDevis.responsableStatus]}
                    >
                      {getStatusLabel(selectedDevis.responsableStatus)}
                    </Badge>
                  </div>
                  
                  {/* ✅ ADMIN: Afficher le badge admin SEULEMENT si responsable est APPROUVE */}
                  {selectedDevis.responsableStatus === "APPROUVE" && (
                    <div>
                      <p className="text-sm text-muted-foreground">État Admin</p>
                      <Badge
                        variant={getStatusVariant(selectedDevis.adminStatus)}
                        className={STATUS_CLASSES[selectedDevis.adminStatus]}
                      >
                        {getStatusLabel(selectedDevis.adminStatus)}
                      </Badge>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Créé par</p>
                    <p className="font-medium">
                      {selectedDevis.createdBy?.firstName} {selectedDevis.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Établissement</p>
                    <p className="font-medium">{selectedDevis.etablissement?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="font-medium">{new Date(selectedDevis.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  {selectedDevis.validatedBy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Approuvé par Responsable</p>
                      <p className="font-medium">
                        {selectedDevis.validatedBy.firstName} {selectedDevis.validatedBy.lastName}
                      </p>
                    </div>
                  )}
                  {selectedDevis.adminValidatedBy && selectedDevis.responsableStatus === "APPROUVE" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Validé par Admin</p>
                      <p className="font-medium">
                        {selectedDevis.adminValidatedBy.firstName} {selectedDevis.adminValidatedBy.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 flex-wrap">
            {/* ✅ ADMIN SEULEMENT: Boutons pour approuver/rejeter le statut ADMIN */}
            {/* Afficher SEULEMENT si: responsable APPROUVE ET admin EN_ATTENTE */}
            {selectedDevis?.responsableStatus === "APPROUVE" && selectedDevis?.adminStatus === "EN_ATTENTE" && (
              <>
                <Button
                  onClick={() => handleUpdateStatus("admin", "APPROUVE")}
                  disabled={isUpdatingStatus}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Valider 
                </Button>
                <Button
                  onClick={() => handleUpdateStatus("admin", "REJETE")}
                  disabled={isUpdatingStatus}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter 
                </Button>
              </>
            )}

            {/* Message informatif si pas d'action possible */}
            {selectedDevis?.responsableStatus !== "APPROUVE" && selectedDevis?.responsableStatus !== "REJETE" && (
              <div className="w-full text-sm text-muted-foreground italic">
                En attente de l'approbation du Responsable...
              </div>
            )}
            {selectedDevis?.responsableStatus === "REJETE" && (
              <div className="w-full text-sm text-muted-foreground italic">
                Le responsable a rejeté le devis...
              </div>
            )}
            {selectedDevis?.responsableStatus === "APPROUVE" && selectedDevis?.adminStatus !== "EN_ATTENTE" && (
              <div className="w-full text-sm text-muted-foreground italic">
                Devis déjà traité par l'Admin
              </div>
            )}

            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}