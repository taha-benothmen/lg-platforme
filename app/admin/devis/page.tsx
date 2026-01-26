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
import { Loader2, Download, Search, Filter, AlertCircle, CheckCircle2, X } from "lucide-react"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/status-utils"

type DevisItem = {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  total: string
  status: "BROUILLON" | "ENVOYE" | "APPROUVE" | "SUSPENDU" | "REJETE" | "ACCEPTE"
  createdAt: string
  updatedAt: string
  createdBy?: {
    firstName: string
    lastName: string
  }
  etablissement?: {
    name: string
  }
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
  _count?: {
    users: number
    children: number
  }
}

function downloadQuote(quote: DevisItem) {
  const content = `Devis #${quote.id}

Client: ${quote.clientName}
Email: ${quote.clientEmail}
Téléphone: ${quote.clientPhone || "N/A"}
Date: ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}
Total: ${parseFloat(quote.total).toFixed(2)} TND
État: ${getStatusLabel(quote.status)}

Créé par: ${quote.createdBy?.firstName} ${quote.createdBy?.lastName}
Établissement: ${quote.etablissement?.name || "N/A"}
`;

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
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [etablissementFilter, setEtablissementFilter] = useState("ALL")
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [devisId, setDevisId] = useState("")
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [loadingEtabs, setLoadingEtabs] = useState(false)

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

  useEffect(() => {
    loadAllDevis()
  }, [statusFilter, etablissementFilter])

  const loadAllDevis = async () => {
    try {
      setLoading(true)

      const url = new URL("/api/devis", window.location.origin)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        showAlert("error", "Erreur", "ID utilisateur introuvable")
        setLoading(false)
        return
      }

      url.searchParams.set("userId", userId)
      if (devisId && devisId.trim() !== "") {
        url.searchParams.set("id", devisId)
      }
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter)
      }
      if (etablissementFilter !== "ALL") {
        url.searchParams.set("etablissementId", etablissementFilter)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des devis")
      }

      const result = await response.json()
      if (result.data.id) {
        setDevis([result.data])
      } else {
        setDevis(result.data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
      showAlert("error", "Erreur", "Impossible de charger les devis")
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-bold">Liste de tous les Devis</h1>
            </div>

            <div className="space-y-3">
              {/* Row 1: Status and Establishment filters + Search */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
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

                <Select value={etablissementFilter} onValueChange={setEtablissementFilter} disabled={loadingEtabs}>
                  <SelectTrigger className="w-full lg:w-64">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par établissement" />
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
                    placeholder="Rechercher par ID, client ou email..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>


            </div>

            {loading ? (
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
                      {statusFilter !== "ALL" && ` (Filtrés: ${statusFilter})`}
                      {etablissementFilter !== "ALL" && ` | Établissement filtrée`}
                    </TableCaption>

                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Établissement</TableHead>
                        <TableHead>État</TableHead>
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
                            <Badge variant={getStatusBadgeVariant(q.status)}>
                              {getStatusLabel(q.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadQuote(q)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline">Télécharger</span>
                            </Button>
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
    </SidebarProvider>
  )
}