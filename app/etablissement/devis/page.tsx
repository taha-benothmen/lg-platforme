"use client"

import { useState } from "react"
import devisData from "./quotes.json"
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

export default function DevisPage() {
  const [devis, setDevis] = useState(devisData)
  const [search, setSearch] = useState("")
  const [selectedDevis, setSelectedDevis] = useState<any>(null)

  const filteredDevis = devis.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      `${d.client.prenom} ${d.client.nom}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const deleteDevis = (id: string) => {
    setDevis((prev) => prev.filter((d) => d.id !== id))
    setSelectedDevis(null)
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

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Devis</h1>
              <div className="relative w-72">
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
            <div className="grid gap-4">
              {filteredDevis.map((d) => (
                <Card
                  key={d.id}
                  className="hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedDevis(d)}
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> {d.id}
                    </CardTitle>
                    <Badge
                      variant={
                        d.statut === "Envoyé"
                          ? "default"
                          : d.statut === "Accepté"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {d.statut}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {d.client.prenom} {d.client.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">{d.date}</p>
                    </div>
                    <p className="font-bold text-lg">{d.total} TND</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* POPUP DETAILS PRO */}
      <Dialog open={!!selectedDevis} onOpenChange={() => setSelectedDevis(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {selectedDevis && (
            <>
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex justify-between items-center">
                  <span>Devis {selectedDevis.id}</span>
                  <Badge>{selectedDevis.statut}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 space-y-6">
                {/* Client */}
                <div className="space-y-1">
                  <p className="font-semibold">Client</p>
                  <p>
                    {selectedDevis.client.prenom} {selectedDevis.client.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.client.email} • {selectedDevis.client.telephone}
                  </p>
                </div>

                <Separator />

                {/* Produits */}
                <div className="space-y-3">
                  {selectedDevis.produits.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {p.nom} x{p.quantite}
                      </span>
                      <span className="font-medium">
                        {p.prix * p.quantite} TND
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{selectedDevis.total} TND</span>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t grid grid-cols-2 gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" /> Télécharger
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" /> Envoyer
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" /> Contacter
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteDevis(selectedDevis.id)}
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
