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
import { notificationService } from "@/lib/notification.service"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ITEMS_PER_PAGE = 6

type DevisItem = {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddr?: string
  clientEnterprise?: string
  clientNotes?: string
  adminDescription?: string
  total: string
  responsableStatus: "EN_ATTENTE" | "APPROUVE" | "SUSPENDU" | "REJETE"
  adminStatus: "EN_ATTENTE" | "VALIDE" | "REJETE" | "APPROUVE"
  createdAt: string
  updatedAt: string
  itemsCount: number
  etablissementId: string
  // ✅ PDF fields
  hasInvoicePdf?: boolean
  invoicePdfName?: string
  invoicePdfUploadedAt?: string
  invoicePdfData?: string
  createdBy?: {
    id: string
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
    id: string
    name: string
  }
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

type SubEstablishment = {
  id: string
  name: string
}

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE: "Approuvé",
  SUSPENDU: "Suspendu",
  REJETE: "Rejeté",
}

const STATUS_CLASSES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-900",
  APPROUVE: "bg-green-100 text-green-900",
  SUSPENDU: "bg-orange-100 text-orange-900",
  REJETE: "bg-red-100 text-red-900",
}

export default function DevisPage() {
  const router = useRouter()
  const [devis, setDevis] = useState<DevisItem[]>([])
  const [subEstablishments, setSubEstablishments] = useState<SubEstablishment[]>([])
  const [search, setSearch] = useState("")
  const [responsableStatusFilter, setResponsableStatusFilter] = useState("ALL")
  const [etablissementFilter, setEtablissementFilter] = useState("ALL")
  const [selectedDevis, setSelectedDevis] = useState<DevisItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [alert, setAlert] = useState<AlertType>({
    show: false,
    type: "default",
    title: "",
    description: ""
  })

  const [currentPage, setCurrentPage] = useState(1)

  const showAlert = (type: "default" | "destructive" | "success", title: string, description: string) => {
    setAlert({ show: true, type, title, description })
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // Load sub-establishments
  useEffect(() => {
    const loadSubEstablishments = async () => {
      try {
        const currentUserId = localStorage.getItem("userId")
        if (!currentUserId) return

        const response = await fetch(`/api/etablissements?userId=${currentUserId}`)
        if (response.ok) {
          const data = await response.json()
          setSubEstablishments(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error loading sub-establishments:", error)
      }
    }
    loadSubEstablishments()
  }, [])

  // Load devis on mount
  useEffect(() => {
    loadDevis()
  }, [])

  // Reload when filters change
  useEffect(() => {
    if (userId) {
      setCurrentPage(1)
      loadDevis()
    }
  }, [responsableStatusFilter, etablissementFilter, search])

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

      if (responsableStatusFilter !== "ALL") {
        url.searchParams.set("responsableStatus", responsableStatusFilter)
      }

      if (etablissementFilter !== "ALL") {
        url.searchParams.set("etablissementId", etablissementFilter)
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

  const totalPages = Math.ceil(filteredDevis.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedDevis = filteredDevis.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNum)
    const devisSection = document.getElementById("devis-list-section")
    if (devisSection) {
      devisSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // ✅ Download Devis as HTML file with professional styling
  const handleDownloadDevis = (devisData: DevisItem) => {
    try {
      setDownloadingId(devisData.id)
      console.log("📥 Downloading Devis as HTML:", devisData.id)

      // Générer le contenu HTML professionnel
      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${devisData.id.slice(0, 8)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid #007bff;
    }
    
    .header-left h1 {
      font-size: 32px;
      color: #007bff;
      margin-bottom: 5px;
    }
    
    .header-left p {
      color: #666;
      font-size: 14px;
    }
    
    .header-right {
      text-align: right;
    }
    
    .header-right p {
      margin: 5px 0;
      font-size: 14px;
    }
    
    .header-right strong {
      color: #007bff;
    }
    
    .section {
      margin-bottom: 35px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #007bff;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    
    .info-label {
      font-weight: bold;
      color: #007bff;
      min-width: 150px;
      font-size: 13px;
    }
    
    .info-value {
      color: #555;
      font-size: 13px;
    }
    
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    
    .products-table th {
      background-color: #007bff;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    
    .products-table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .products-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .text-right {
      text-align: right;
    }
    
    .total-section {
      text-align: right;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 3px solid #007bff;
    }
    
    .total-row {
      font-size: 18px;
      font-weight: bold;
      color: #007bff;
      margin: 10px 0;
    }
    
    .status-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #f0f7ff;
      border-left: 4px solid #007bff;
      border-radius: 4px;
    }
    
    .status-item {
      margin-bottom: 10px;
      display: flex;
      gap: 20px;
    }
    
    .status-label {
      font-weight: bold;
      color: #007bff;
      min-width: 150px;
      font-size: 13px;
    }
    
    .status-value {
      color: #555;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 20px;
      background-color: white;
      border: 1px solid #007bff;
      display: inline-block;
    }
    
    .notes-section {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .notes-title {
      font-weight: bold;
      color: #ffc107;
      margin-bottom: 10px;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
      padding-top: 20px;
    }
    
    @media print {
      body {
        background-color: white;
      }
      .container {
        box-shadow: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="header-left">
        <h1>DEVIS</h1>
        <p>Référence: <strong>${devisData.id.slice(0, 8)}</strong></p>
      </div>
      <div class="header-right">
        <p><strong>Date de création:</strong> ${new Date(devisData.createdAt).toLocaleDateString("fr-FR")}</p>
        <p><strong>Dernière mise à jour:</strong> ${new Date(devisData.updatedAt).toLocaleDateString("fr-FR")}</p>
      </div>
    </div>

    <!-- ÉTABLISSEMENT -->
    ${devisData.etablissement ? `
    <div class="section">
      <div class="section-title">📦 Établissement</div>
      <div class="info-row">
        <span class="info-label">Nom:</span>
        <span class="info-value">${devisData.etablissement.name}</span>
      </div>
    </div>
    ` : ''}

    <!-- RESPONSABLE -->
    ${devisData.createdBy ? `
    <div class="section">
      <div class="section-title">👤 Responsable</div>
      <div class="info-row">
        <span class="info-label">Nom:</span>
        <span class="info-value">${devisData.createdBy.firstName} ${devisData.createdBy.lastName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${devisData.createdBy.email}</span>
      </div>
    </div>
    ` : ''}

    <!-- CLIENT -->
    <div class="section">
      <div class="section-title">👥 Informations du Client</div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">${devisData.clientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${devisData.clientEmail}</span>
          </div>
          ${devisData.clientPhone ? `
          <div class="info-row">
            <span class="info-label">Téléphone:</span>
            <span class="info-value">${devisData.clientPhone}</span>
          </div>
          ` : ''}
        </div>
        <div>
          ${devisData.clientEnterprise ? `
          <div class="info-row">
            <span class="info-label">Entreprise:</span>
            <span class="info-value">${devisData.clientEnterprise}</span>
          </div>
          ` : ''}
          ${devisData.clientAddr ? `
          <div class="info-row">
            <span class="info-label">Adresse:</span>
            <span class="info-value">${devisData.clientAddr}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- PRODUITS -->
    <div class="section">
      <div class="section-title">📋 Produits (${devisData.itemsCount})</div>
      ${devisData.items && devisData.items.length > 0 ? `
      <table class="products-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th style="width: 80px;">Quantité</th>
            <th style="width: 120px;">Prix Unitaire</th>
            <th class="text-right" style="width: 120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${devisData.items.map((item: any) => `
          <tr>
            <td>${item.product?.name || 'Produit'}</td>
            <td>${item.quantity}</td>
            <td class="text-right">${parseFloat(item.price).toFixed(2)} TND</td>
            <td class="text-right"><strong>${(parseFloat(item.price) * item.quantity).toFixed(2)} TND</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #999; font-style: italic;">Aucun produit</p>'}
    </div>

    <!-- TOTAL -->
    <div class="total-section">
      <div class="total-row">
        TOTAL: ${parseFloat(devisData.total).toFixed(2)} TND
      </div>
    </div>

    <!-- STATUTS -->
    <div class="status-section">
      <div class="section-title" style="border-bottom: none; margin-bottom: 15px;">🔐 Statuts</div>
      <div class="status-item">
        <span class="status-label">Responsable:</span>
        <span class="status-value">${STATUS_LABELS[devisData.responsableStatus] || devisData.responsableStatus}</span>
      </div>
      ${devisData.responsableStatus === "APPROUVE" ? `
      <div class="status-item">
        <span class="status-label">Admin:</span>
        <span class="status-value">${STATUS_LABELS[devisData.adminStatus] || devisData.adminStatus}</span>
      </div>
      ` : ''}
    </div>

    <!-- NOTES -->
    ${devisData.clientNotes ? `
    <div class="notes-section">
      <div class="notes-title">📝 Notes</div>
      <p>${devisData.clientNotes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

    <!-- FOOTER -->
    <div class="footer">
      <p>Ce devis a été généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
      <p>Document confidentiel - Réservé aux parties autorisées</p>
    </div>
  </div>
</body>
</html>`

      // Créer le blob et télécharger
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `devis-${devisData.id.slice(0, 8)}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log("✅ Devis HTML downloaded successfully")
      showAlert("success", "Téléchargement réussi", `Le devis a été téléchargé: devis-${devisData.id.slice(0, 8)}.html`)
    } catch (error) {
      console.error("❌ Download error:", error)
      showAlert("destructive", "Erreur", "Impossible de télécharger le devis")
    } finally {
      setDownloadingId(null)
    }
  }

  // ✅ Download Invoice PDF from database
  const handleDownloadInvoicePDF = async (devisData: DevisItem) => {
    if (!devisData.hasInvoicePdf) {
      showAlert("destructive", "Erreur", "Aucun PDF disponible pour ce devis")
      return
    }

    try {
      setDownloadingId(devisData.id)
      console.log("📥 Downloading Invoice PDF:", devisData.invoicePdfName)

      // Use the new download parameter
      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("devisId", devisData.id)
      url.searchParams.set("userId", userId)
      url.searchParams.set("download", "true")

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors du téléchargement")
      }

      // Get the blob from response
      const blob = await response.blob()

      // Create a URL for the blob
      const downloadUrl = window.URL.createObjectURL(blob)

      // Create a temporary link and click it
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = devisData.invoicePdfName || "facture.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL
      window.URL.revokeObjectURL(downloadUrl)

      console.log("✅ Invoice PDF downloaded successfully")
      showAlert("success", "Téléchargement réussi", `La facture a été téléchargée: ${devisData.invoicePdfName}`)
    } catch (error) {
      console.error("❌ Download error:", error)
      showAlert("destructive", "Erreur", error instanceof Error ? error.message : "Impossible de télécharger le PDF")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteDevis = async (id: string) => {
    if (!userId) {
      showAlert("destructive", "Erreur", "User ID non trouvé")
      return
    }

    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")

    if (!confirmed) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(
        `/api/devis?id=${id}&userId=${userId}`,
        {
          method: "DELETE",
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete devis")
      }

      setDevis((prev) => prev.filter((d) => d.id !== id))
      setSelectedDevis(null)
      showAlert("success", "Suppression réussie", "Le devis a été supprimé avec succès")
    } catch (error: any) {
      console.error("Error deleting devis:", error)
      showAlert("destructive", "Erreur", error.message || "Impossible de supprimer le devis")
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateStatus = async (id: string, statusType: "responsable" | "admin", newStatus: string) => {
    if (!userId) {
      showAlert("destructive", "Erreur", "User ID non trouvé")
      return
    }

    setUpdatingStatus(true)
    try {
      const updatePayload: any = {
        devisId: id,
        userId: userId,
      }

      if (statusType === "responsable") {
        updatePayload.responsableStatus = newStatus
      } else {
        updatePayload.adminStatus = newStatus
      }

      const response = await fetch("/api/devis", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update devis status")
      }

      setDevis((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
              ...d,
              responsableStatus: statusType === "responsable" ? (newStatus as any) : d.responsableStatus,
              adminStatus: statusType === "admin" ? (newStatus as any) : d.adminStatus,
              updatedAt: new Date().toISOString(),
            }
            : d
        )
      )

      if (selectedDevis && selectedDevis.id === id) {
        setSelectedDevis((prev) =>
          prev
            ? {
              ...prev,
              responsableStatus: statusType === "responsable" ? (newStatus as any) : prev.responsableStatus,
              adminStatus: statusType === "admin" ? (newStatus as any) : prev.adminStatus,
              updatedAt: new Date().toISOString(),
            }
            : null
        )
      }

      showAlert("success", "Mise à jour réussie", "Le statut a été mis à jour avec succès")
    } catch (error: any) {
      console.error("Error updating devis:", error)
      showAlert("destructive", "Erreur", error.message || "Impossible de mettre à jour le devis")
    } finally {
      setUpdatingStatus(false)
    }
    try {
      console.log("📢 Notifying admins about status change...")
    
      const adminsResponse = await fetch("/api/utilisateurs?role=ADMIN&isActive=true")
      const adminsData = await adminsResponse.json()
      const admins = adminsData.data || []
    
      console.log(`Found ${admins.length} admins to notify`)
    
      // ✅ AJOUTER UNE MAP POUR LES LABELS:
      const STATUS_LABELS_MAP: Record<string, string> = {
        EN_ATTENTE: "En attente",
        APPROUVE: "Approuvé",
        SUSPENDU: "Suspendu",
        REJETE: "Rejeté",
      }
    
      const statusLabel = STATUS_LABELS_MAP[newStatus] || newStatus
    
      for (const admin of admins) {
        try {
          await fetch("/api/notifications/send-to-all-admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              devisId: id,
              // ✅ TITRE DYNAMIQUE AVEC LE NOUVEAU STATUS:
              title: `Changement de statut devis: ${statusLabel}`,
              message: `Le devis pour ${selectedDevis?.clientName} a changé de status en "${statusLabel}"`,
            })
          })
        } catch (error) {
          console.error("Error notifying admin:", error)
        }
      }
    
      console.log(`✅ ${admins.length} admins notifiés`)
    } catch (error) {
      console.error("⚠️ Error notifying admins:", error)
    }
  }

  const handleShareDevis = async (devisData: DevisItem) => {
    try {
      const shareText = `Devis ${devisData.id.slice(0, 8)}\nClient: ${devisData.clientName}\nTotal: ${parseFloat(devisData.total).toFixed(2)} TND`

      if (navigator.share) {
        await navigator.share({
          title: `Devis ${devisData.id.slice(0, 8)}`,
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
    const currentUserId = localStorage.getItem("userId")
    if (!currentUserId) {
      showAlert("destructive", "Erreur", "ID utilisateur non trouvé")
      return
    }

    router.push("/responsable/devis/create")
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      EN_ATTENTE: "secondary",
      APPROUVE: "default",
      SUSPENDU: "outline",
      REJETE: "destructive",
      VALIDE: "default",
    }
    return variants[status] || "outline"
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
                <Select value={etablissementFilter} onValueChange={setEtablissementFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les établissements</SelectItem>
                    {subEstablishments.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={responsableStatusFilter} onValueChange={setResponsableStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Statut Responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="EN_ATTENTE">En attente</SelectItem>
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

                <Button
                  onClick={handleCreateNewDevis}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Devis
                </Button>
              </div>
            </div>

            {/* Devis List Section */}
            <div id="devis-list-section">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDevis.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground mb-4">Aucun devis trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Devis Grid */}
                  <div className="grid gap-4">
                    {paginatedDevis.map((d) => (
                      <Card
                        key={d.id}
                        className="card-interactive cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedDevis(d)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">Devis {d.id.slice(0, 8)}</span>
                            {/* ✅ Show PDF indicator */}
                            {d.hasInvoicePdf && (
                              <Badge variant="outline" className="ml-2 bg-green-50 border-green-200 text-green-700">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-muted-foreground">Responsable</span>
                              <Badge variant={getStatusBadgeVariant(d.responsableStatus)}
                                className={STATUS_CLASSES[d.responsableStatus]}>
                                {STATUS_LABELS[d.responsableStatus] || d.responsableStatus}
                              </Badge>
                            </div>
                            {d.responsableStatus === "APPROUVE" && (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-muted-foreground">Admin</span>
                                <Badge variant={getStatusBadgeVariant(d.adminStatus)}
                                  className={STATUS_CLASSES[d.adminStatus]}>
                                  {STATUS_LABELS[d.adminStatus] || d.adminStatus}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{d.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {d.clientEmail}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className="font-bold text-lg shrink-0">
                                {parseFloat(d.total).toFixed(2)} TND
                              </p>
                              {/* ✅ Download Devis button */}
                              <Button
                                size="icon"
                                variant="outline"
                                className="shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadDevis(d)
                                }}
                                disabled={downloadingId === d.id}
                                title="Télécharger le devis"
                              >
                                {downloadingId === d.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
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
                          </div>

                          <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                            {d.createdBy && (
                              <div>
                                <p className="font-semibold text-muted-foreground">Créateur</p>
                                <p className="text-gray-700">{d.createdBy.firstName} {d.createdBy.lastName}</p>
                              </div>
                            )}
                            {d.etablissement && (
                              <div>
                                <p className="font-semibold text-muted-foreground">Établissement</p>
                                <p className="text-gray-700">{d.etablissement.name}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6 border-t">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage =
                              page <= 2 ||
                              page >= totalPages - 1 ||
                              (page >= currentPage - 1 && page <= currentPage + 1)

                            return (
                              <div key={page}>
                                {showPage ? (
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className="w-10"
                                  >
                                    {page}
                                  </Button>
                                ) : page === 3 ? (
                                  <span className="px-2 text-muted-foreground">...</span>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="gap-2"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Affichage {startIndex + 1} à {Math.min(endIndex, filteredDevis.length)} sur {filteredDevis.length}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedDevis} onOpenChange={() => setSelectedDevis(null)}>
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] flex flex-col gap-0">
          {selectedDevis && (
            <>
              {/* Header */}
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-xl font-semibold">
                    Devis {selectedDevis.id.slice(0, 8)}
                  </span>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Responsable</span>
                      <Badge variant={getStatusBadgeVariant(selectedDevis.responsableStatus)}
                        className={STATUS_CLASSES[selectedDevis.responsableStatus]}>
                        {STATUS_LABELS[selectedDevis.responsableStatus] || selectedDevis.responsableStatus}
                      </Badge>
                    </div>
                    {selectedDevis.responsableStatus === "APPROUVE" && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted-foreground">Admin</span>
                        <Badge variant={getStatusBadgeVariant(selectedDevis.adminStatus)}
                          className={STATUS_CLASSES[selectedDevis.adminStatus]}>
                          {STATUS_LABELS[selectedDevis.adminStatus] || selectedDevis.adminStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* BODY SCROLLABLE */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date de création
                    </p>
                    <p className="font-medium">
                      {new Date(selectedDevis.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {selectedDevis.createdBy && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Créé par
                      </p>
                      <p className="font-medium">
                        {selectedDevis.createdBy.firstName} {selectedDevis.createdBy.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDevis.createdBy.email}
                      </p>
                    </div>
                  )}
                  {selectedDevis.etablissement && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Établissement
                      </p>
                      <p className="font-medium">
                        {selectedDevis.etablissement.name}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

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
                  {selectedDevis.clientEnterprise && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevis.clientEnterprise}
                    </p>
                  )}
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

                {/* ✅ PDF Section */}
                {selectedDevis.hasInvoicePdf && (
                  <>
                    <Separator />
                    <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-900 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Facture PDF
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{selectedDevis.invoicePdfName}</p>
                          {selectedDevis.invoicePdfUploadedAt && (
                            <p className="text-xs text-gray-500">
                              {new Date(selectedDevis.invoicePdfUploadedAt).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoicePDF(selectedDevis)}
                          disabled={downloadingId === selectedDevis.id}
                        >
                          {downloadingId === selectedDevis.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {selectedDevis.responsableStatus === "APPROUVE" && (
                  <>
                    <Separator />
                    <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">
                          📋 Réponse de l'Admin
                        </p>
                        <Badge variant={getStatusBadgeVariant(selectedDevis.adminStatus)} className="w-fit text-base py-2 px-3">
                          {STATUS_LABELS[selectedDevis.adminStatus] || selectedDevis.adminStatus}
                        </Badge>
                      </div>

                      {selectedDevis.adminDescription && (
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-2">💬 Commentaire</p>
                          <div className="bg-white p-3 rounded border border-blue-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedDevis.adminDescription}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedDevis.adminValidatedBy && (
                        <div className="pt-2 border-t border-blue-200">
                          <p className="text-xs font-semibold text-blue-900">
                            👤 Traité par: {selectedDevis.adminValidatedBy.firstName} {selectedDevis.adminValidatedBy.lastName}
                          </p>
                        </div>
                      )}

                      {!selectedDevis.adminDescription && selectedDevis.adminStatus !== "EN_ATTENTE" && (
                        <div className="text-xs text-blue-700 italic pt-2 border-t border-blue-200">
                          Aucun commentaire fourni
                        </div>
                      )}

                      {selectedDevis.adminStatus === "EN_ATTENTE" && (
                        <div className="text-xs text-blue-700 italic pt-2 border-t border-blue-200">
                          ⏳ En attente de réponse de l'administration...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* FOOTER FIXED */}
              <div className="px-6 py-4 border-t space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {/* ✅ Download Devis button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownloadDevis(selectedDevis)}
                    disabled={downloadingId === selectedDevis.id}
                    title="Télécharger le devis en tant que fichier HTML"
                  >
                    {downloadingId === selectedDevis.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    📥 Télécharger Devis
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleShareDevis(selectedDevis)}
                    disabled={updatingStatus || deletingId === selectedDevis.id}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>

                {/* ✅ Action buttons - Responsable can only modify if EN_ATTENTE */}
                {selectedDevis.responsableStatus === "EN_ATTENTE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <Button
                      className="w-full bg-green-100 hover:bg-green-200 text-green-900 border-0"
                      onClick={() =>
                        handleUpdateStatus(selectedDevis.id, "responsable", "APPROUVE")
                      }
                      disabled={updatingStatus || deletingId === selectedDevis.id}
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Approuver
                    </Button>

                    <Button
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-0"
                      onClick={() =>
                        handleUpdateStatus(selectedDevis.id, "responsable", "SUSPENDU")
                      }
                      disabled={updatingStatus || deletingId === selectedDevis.id}
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Suspendre
                    </Button>

                    <Button
                      className="w-full bg-red-100 hover:bg-red-200 text-red-900 border-0"
                      onClick={() =>
                        handleUpdateStatus(selectedDevis.id, "responsable", "REJETE")
                      }
                      disabled={updatingStatus || deletingId === selectedDevis.id}
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Rejeter
                    </Button>
                  </div>
                )}

                {selectedDevis.responsableStatus === "SUSPENDU" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <Button
                      className="w-full bg-green-100 hover:bg-green-200 text-green-900 border-0"
                      onClick={() =>
                        handleUpdateStatus(selectedDevis.id, "responsable", "APPROUVE")
                      }
                      disabled={updatingStatus || deletingId === selectedDevis.id}
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Approuver
                    </Button>

                    <Button
                      className="w-full bg-red-100 hover:bg-red-200 text-red-900 border-0"
                      onClick={() =>
                        handleUpdateStatus(selectedDevis.id, "responsable", "REJETE")
                      }
                      disabled={updatingStatus || deletingId === selectedDevis.id}
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Rejeter
                    </Button>
                  </div>
                )}

                {/* ✅ If APPROUVE = No action buttons for responsable */}
                {selectedDevis.responsableStatus === "APPROUVE" && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-semibold text-center">
                      ✅ Devis approuvé - En attente de traitement par l'admin
                    </p>
                  </div>
                )}

                {selectedDevis.responsableStatus === "REJETE" && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-semibold">
                      ❌ Ce devis est rejeté et ne peut plus être modifié
                    </p>
                  </div>
                )}

                {/* ✅ Delete button - only when EN_ATTENTE */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteDevis(selectedDevis.id)}
                  disabled={deletingId === selectedDevis.id || updatingStatus || selectedDevis.responsableStatus !== "EN_ATTENTE"}
                  title={selectedDevis.responsableStatus !== "EN_ATTENTE" ? "Seuls les devis en attente peuvent être supprimés" : "Supprimer le devis"}
                >
                  {deletingId === selectedDevis.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
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