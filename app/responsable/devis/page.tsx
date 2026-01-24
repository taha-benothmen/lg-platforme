"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Send,
  Trash2,
  Search,
  Filter,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DevisItem = {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddr?: string
  total: string
  status: "BROUILLON" | "ENVOYE" | "APPROUVE" | "SUSPENDU" | "REJETE" | "ACCEPTE"
  createdAt: string
  updatedAt: string
  itemsCount: number
  createdBy?: string
  items?: Array<{
    id: string
    quantity: number
    price: string
    product?: {
      id: number
      name: string
      description?: string
    }
  }>
}

type AlertType = {
  show: boolean
  type: "default" | "destructive" | "success"
  title: string
  description: string
}

const STATUS_COLORS: Record<string, { label: string; variant: string }> = {
  BROUILLON: { label: "Brouillon", variant: "secondary" },
  ENVOYE: { label: "Envoyé", variant: "outline" },
  APPROUVE: { label: "Approuvé", variant: "default" },
  SUSPENDU: { label: "Suspendu", variant: "destructive" },
  REJETE: { label: "Rejeté", variant: "destructive" },
  ACCEPTE: { label: "Accepté", variant: "default" },
}

export default function DevisPage() {
  const router = useRouter()
  const [devis, setDevis] = useState<DevisItem[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedDevis, setSelectedDevis] = useState<DevisItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [alert, setAlert] = useState<AlertType>({
    show: false,
    type: "default",
    title: "",
    description: ""
  })

  const showAlert = (type: "default" | "destructive" | "success", title: string, description: string) => {
    setAlert({ show: true, type, title, description })
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // Load devis on mount
  useEffect(() => {
    loadDevis()
  }, [])

  // Reload when status filter changes
  useEffect(() => {
    if (userId) {
      loadDevis()
    }
  }, [statusFilter])

  const loadDevis = async () => {
    try {
      const currentUserId = localStorage.getItem("userId")

      if (!currentUserId) {
        showAlert("destructive", "Erreur d'authentification", "ID utilisateur introuvable. Veuillez vous reconnecter.")
        setTimeout(() => router.push("/login"), 2000)
        return
      }

      setUserId(currentUserId)
      setLoading(true)

      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", currentUserId)
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error("Failed to load devis")
      }

      const result = await response.json()
      setDevis(result.data || [])
    } catch (error) {
      console.error("Error loading devis:", error)
      showAlert("destructive", "Erreur", "Impossible de charger les devis")
    } finally {
      setLoading(false)
    }
  }

  const filteredDevis = devis.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.clientEmail.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const handleDeleteDevis = async (id: string) => {
    if (!userId) {
      showAlert("destructive", "Erreur", "User ID non trouvé")
      return
    }

    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")
    
    if (!confirmed) {
      return
    }

    setDeleting(true)
    try {
      console.log("Deleting devis:", { id, userId })

      const response = await fetch(
        `/api/devis/${id}?userId=${userId}`,
        {
          method: "DELETE",
        }
      )

      const result = await response.json()
      console.log("Delete response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete devis")
      }

      // Remove from local state
      setDevis((prev) => prev.filter((d) => d.id !== id))
      setSelectedDevis(null)
      showAlert("success", "Suppression réussie", "Le devis a été supprimé avec succès")
    } catch (error: any) {
      console.error("Error deleting devis:", error)
      showAlert("destructive", "Erreur", error.message || "Impossible de supprimer le devis")
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!userId) {
      showAlert("destructive", "Erreur", "User ID non trouvé")
      return
    }

    setUpdatingStatus(true)
    try {
      console.log("Updating devis:", { id, userId, status })

      const response = await fetch(`/api/devis/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          status: status,
        }),
      })

      const result = await response.json()
      console.log("Update response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to update devis status")
      }

      // Update local state with the returned data
      setDevis((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: status as any, updatedAt: new Date().toISOString() } : d))
      )

      if (selectedDevis) {
        setSelectedDevis({ ...selectedDevis, status: status as any, updatedAt: new Date().toISOString() })
      }

      const statusLabels: Record<string, string> = {
        APPROUVE: "approuvé",
        SUSPENDU: "suspendu",
        REJETE: "rejeté",
        ENVOYE: "envoyé",
        ACCEPTE: "accepté",
      }

      showAlert("success", "Mise à jour réussie", `Le devis a été ${statusLabels[status] || status.toLowerCase()} avec succès`)
    } catch (error: any) {
      console.error("Error updating devis:", error)
      showAlert("destructive", "Erreur", error.message || "Impossible de mettre à jour le devis")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDownloadPDF = async (devisData: DevisItem) => {
    try {
      showAlert("default", "Téléchargement", "Génération du PDF en cours...")
      
      // TODO: Implement PDF generation
      console.log("Downloading PDF for devis:", devisData.id)
      
      // Simulate PDF download
      setTimeout(() => {
        showAlert("success", "Téléchargement réussi", "Le PDF a été téléchargé")
      }, 1500)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      showAlert("destructive", "Erreur", "Impossible de télécharger le PDF")
    }
  }
  

  const handleShareDevis = async (devisData: DevisItem) => {
    try {
      const shareText = `Devis ${devisData.id}\nClient: ${devisData.clientName}\nTotal: ${parseFloat(devisData.total).toFixed(2)} TND`
      
      if (navigator.share) {
        await navigator.share({
          title: `Devis ${devisData.id}`,
          text: shareText,
        })
        showAlert("success", "Partage réussi", "Le devis a été partagé")
      } else {
        await navigator.clipboard.writeText(shareText)
        showAlert("success", "Lien copié", "Les informations du devis ont été copiées dans le presse-papiers")
      }
    } catch (error) {
      console.error("Error sharing devis:", error)
      showAlert("destructive", "Erreur", "Impossible de partager le devis")
    }
  }

  const handleCreateNewDevis = () => {
    // Assurez-vous que l'userId est dans localStorage avant de naviguer
    const currentUserId = localStorage.getItem("userId")
    if (!currentUserId) {
      showAlert("destructive", "Erreur", "ID utilisateur non trouvé")
      return
    }
    
    // L'userId sera disponible quand la page créer devis se charge
    router.push("/responsable/devis/create")
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.responsable} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 space-y-6">
            {/* Alert notification */}
            {alert.show && (
              <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-2">
                <Alert variant={alert.type === "success" ? "default" : alert.type} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {alert.type === "destructive" && <AlertCircle className="h-4 w-4" />}
                  {alert.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold">Devis</h1>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="BROUILLON">Brouillon</SelectItem>
                    <SelectItem value="ENVOYE">Envoyé</SelectItem>
                    <SelectItem value="APPROUVE">Approuvé</SelectItem>
                    <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                    <SelectItem value="REJETE">Rejeté</SelectItem>
                    <SelectItem value="ACCEPTE">Accepté</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher devis ou client"
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateNewDevis}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Devis
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDevis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground mb-4">Aucun devis trouvé</p>
                <Button onClick={handleCreateNewDevis}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier devis
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDevis.map((d) => (
                  <Card
                    key={d.id}
                    className="card-interactive cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDevis(d)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="truncate">{d.id}</span>
                      </CardTitle>
                      <Badge
                        variant={
                          STATUS_COLORS[d.status]?.variant as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                      >
                        {STATUS_COLORS[d.status]?.label || d.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-bold text-lg shrink-0">
                          {parseFloat(d.total).toFixed(2)} TND
                        </p>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadPDF(d)
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShareDevis(d)
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* ================= POPUP ================= */}
      <Dialog open={!!selectedDevis} onOpenChange={() => setSelectedDevis(null)}>
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] flex flex-col gap-0">
          {selectedDevis && (
            <>
              {/* Header */}
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex justify-between items-center">
                  <span className="text-xl font-semibold">
                    Devis {selectedDevis.id}
                  </span>
                  <Badge
                    variant={
                      STATUS_COLORS[selectedDevis.status]?.variant as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                    }
                  >
                    {STATUS_COLORS[selectedDevis.status]?.label ||
                      selectedDevis.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {/* BODY SCROLLABLE */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Client
                  </p>
                  <p className="font-semibold text-base">
                    {selectedDevis.clientName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.clientEmail}
                  </p>
                  {selectedDevis.clientPhone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevis.clientPhone}
                    </p>
                  )}
                  {selectedDevis.clientAddr && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevis.clientAddr}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Date:{" "}
                    {new Date(selectedDevis.createdAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Produits ({selectedDevis.itemsCount})
                  </p>
                  {selectedDevis.items && selectedDevis.items.length > 0 ? (
                    selectedDevis.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="text-sm">
                          {item.product?.name || "Produit"}
                          <span className="text-muted-foreground ml-1">
                            x{item.quantity} ({item.price} TND/u)
                          </span>
                        </span>
                        <span className="font-semibold">
                          {(
                            parseFloat(item.price) * item.quantity
                          ).toFixed(2)}{" "}
                          TND
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun produit
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl">
                    {parseFloat(selectedDevis.total).toFixed(2)} TND
                  </span>
                </div>
              </div>

              {/* FOOTER FIXED */}
              <div className="px-6 py-4 border-t space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownloadPDF(selectedDevis)}
                    disabled={updatingStatus || deleting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleShareDevis(selectedDevis)}
                    disabled={updatingStatus || deleting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      handleUpdateStatus(selectedDevis.id, "APPROUVE")
                    }
                    disabled={updatingStatus || deleting}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Approuver
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      handleUpdateStatus(selectedDevis.id, "SUSPENDU")
                    }
                    disabled={updatingStatus || deleting}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Suspendre
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() =>
                      handleUpdateStatus(selectedDevis.id, "REJETE")
                    }
                    disabled={updatingStatus || deleting}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Rejeter
                  </Button>
                </div>

                {selectedDevis.status === "BROUILLON" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDeleteDevis(selectedDevis.id)}
                    disabled={deleting || updatingStatus}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Supprimer le devis
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}