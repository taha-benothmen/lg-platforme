"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Send,
  Trash2,
  Search,
  Filter,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/status-utils"
import { updateDevisStatus, deleteDevis, getDevisList } from "@/app/actions/devis"

export default function DevisPage() {
  const [devis, setDevis] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDevis, setSelectedDevis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDevis() {
      const result = await getDevisList("RESPONSABLE")
      if (result.success) {
        setDevis(result.devis || [])
      }
      setLoading(false)
    }
    loadDevis()
  }, [])

  const filteredDevis = devis.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || d.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDeleteDevis = async (id: string) => {
    const result = await deleteDevis(id)
    if (result.success) {
      setDevis((prev) => prev.filter((d) => d.id !== id))
      setSelectedDevis(null)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const result = await updateDevisStatus(id, status)
    if (result.success) {
      setDevis((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      )
      setSelectedDevis((prev: any) => ({ ...prev, status }))
    }
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold">Devis</h1>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="ENVOYE">Envoyé</SelectItem>
                    <SelectItem value="APPROUVE">Approuvé</SelectItem>
                    <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                    <SelectItem value="REJETE">Rejeté</SelectItem>
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
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Chargement des devis...</p>
              </div>
            ) : filteredDevis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground">Aucun devis trouvé</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDevis.map((d) => (
                  <Card
                    key={d.id}
                    className="card-interactive"
                    onClick={() => setSelectedDevis(d)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="truncate">{d.id}</span>
                      </CardTitle>
                      <Badge variant={getStatusBadgeVariant(d.status)}>
                        {getStatusLabel(d.status)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {d.clientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-bold text-lg shrink-0">{d.total.toFixed(2)} TND</p>
                        <Button size="icon" variant="outline" className="shrink-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="shrink-0">
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
                  <Badge variant={getStatusBadgeVariant(selectedDevis.status)}>
                    {getStatusLabel(selectedDevis.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {/* BODY SCROLLABLE */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Client
                  </p>
                  <p className="font-semibold text-base">{selectedDevis.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.clientEmail}
                  </p>
                  {selectedDevis.clientPhone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevis.clientPhone}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Date: {new Date(selectedDevis.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Produits
                  </p>
                  {selectedDevis.items && selectedDevis.items.length > 0 ? (
                    selectedDevis.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2">
                        <span className="text-sm">
                          Produit x{item.quantity}
                          <span className="text-muted-foreground ml-1">
                            ({item.price} TND/u)
                          </span>
                        </span>
                        <span className="font-semibold">
                          {(item.price * item.quantity).toFixed(2)} TND
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun produit</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl">{selectedDevis.total.toFixed(2)} TND</span>
                </div>
              </div>

              {/* FOOTER FIXED */}
              <div className="px-6 py-4 border-t space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedDevis.id, "APPROUVE")}
                  >
                    Approuver
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedDevis.id, "SUSPENDU")}
                  >
                    Suspendre
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedDevis.id, "REJETE")}
                  >
                    Rejeter
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteDevis(selectedDevis.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer le devis
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
