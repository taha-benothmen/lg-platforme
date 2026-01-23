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

/* ---------- helpers ---------- */
const statusVariant = (statut: string) => {
  switch (statut) {
    case "Envoyé":
      return "default"
    case "Approuvé":
      return "secondary"
    case "Suspendu":
      return "outline"
    case "Rejeté":
      return "destructive"
    default:
      return "outline"
  }
}

export default function DevisPage() {
  const [devis, setDevis] = useState<any[]>(devisData)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDevis, setSelectedDevis] = useState<any>(null)

  const filteredDevis = devis.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      `${d.client.prenom} ${d.client.nom}`
        .toLowerCase()
        .includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || d.statut === statusFilter

    return matchesSearch && matchesStatus
  })

  const deleteDevis = (id: string) => {
    setDevis((prev) => prev.filter((d) => d.id !== id))
    setSelectedDevis(null)
  }

  const updateStatus = (id: string, statut: string) => {
    setDevis((prev) =>
      prev.map((d) => (d.id === id ? { ...d, statut } : d))
    )
    setSelectedDevis((prev: any) => ({ ...prev, statut }))
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

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">Devis</h1>

              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Envoyé">Envoyé</SelectItem>
                    <SelectItem value="Approuvé">Approuvé</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                    <SelectItem value="Rejeté">Rejeté</SelectItem>
                  </SelectContent>
                </Select>

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
            </div>

            <div className="grid gap-4">
              {filteredDevis.map((d) => (
                <Card
                  key={d.id}
                  className="hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedDevis(d)}
                >
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {d.id}
                    </CardTitle>
                    <Badge variant={statusVariant(d.statut)}>
                      {d.statut}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {d.client.prenom} {d.client.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {d.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="font-bold text-lg">{d.total} TND</p>
                      <Button size="icon" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <Badge variant={statusVariant(selectedDevis.statut)}>
                    {selectedDevis.statut}
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
                    {selectedDevis.client.prenom}{" "}
                    {selectedDevis.client.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.client.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevis.client.telephone}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Date: {selectedDevis.date}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Produits
                  </p>
                  {selectedDevis.produits.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <span className="text-sm">
                        {p.nom} <span className="text-muted-foreground">x{p.quantite}</span>
                      </span>
                      <span className="font-semibold">
                        {p.prix * p.quantite} TND
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl">{selectedDevis.total} TND</span>
                </div>
              </div>

              {/* FOOTER FIXED */}
              <div className="px-6 py-4 border-t space-y-3">
                <div className="grid grid-cols-3 gap-2 w-full">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => updateStatus(selectedDevis.id, "Approuvé")}
                  >
                    Approuver
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateStatus(selectedDevis.id, "Suspendu")}
                  >
                    Suspendre
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => updateStatus(selectedDevis.id, "Rejeté")}
                  >
                    Rejeter
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteDevis(selectedDevis.id)}
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