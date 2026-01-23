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
import { FileText, Download, Send, Phone, Trash2, Search } from "lucide-react"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/status-utils"
import { deleteDevis, getDevisList } from "@/app/actions/devis"

export default function DevisPage() {
  const [devis, setDevis] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedDevis, setSelectedDevis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDevis() {
      const result = await getDevisList("ETABLISSEMENT")
      if (result.success) {
        setDevis(result.devis || [])
      }
      setLoading(false)
    }
    loadDevis()
  }, [])

  const filteredDevis = devis.filter((d) =>
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.clientName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDeleteDevis = async (id: string) => {
    const result = await deleteDevis(id)
    if (result.success) {
      setDevis((prev) => prev.filter((d) => d.id !== id))
      setSelectedDevis(null)
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
        <AppSidebar menu={menusByRole.etablissement} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold">Devis</h1>
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

            {/* Liste devis */}
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
                      <p className="font-bold text-lg">{d.total.toFixed(2)} TND</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* POPUP DETAILS */}
      <Dialog open={!!selectedDevis} onOpenChange={() => setSelectedDevis(null)}>
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] flex flex-col gap-0">
          {selectedDevis && (
            <>
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex justify-between items-center">
                  <span>Devis {selectedDevis.id}</span>
                  <Badge variant={getStatusBadgeVariant(selectedDevis.status)}>
                    {getStatusLabel(selectedDevis.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Client */}
                <div className="space-y-1">
                  <p className="font-semibold">Client</p>
                  <p>{selectedDevis.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.clientEmail}
                  </p>
                  {selectedDevis.clientPhone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevis.clientPhone}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Produits */}
                <div className="space-y-3">
                  <p className="font-semibold">Produits</p>
                  {selectedDevis.items && selectedDevis.items.length > 0 ? (
                    selectedDevis.items.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>Produit x{p.quantity}</span>
                        <span className="font-medium">
                          {(p.price * p.quantity).toFixed(2)} TND
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun produit</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{selectedDevis.total.toFixed(2)} TND</span>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Télécharger
                </Button>
                <Button size="sm" variant="outline">
                  <Send className="h-4 w-4 mr-2" /> Envoyer
                </Button>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-2" /> Contacter
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteDevis(selectedDevis.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
