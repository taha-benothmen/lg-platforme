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
import { Label } from "@/components/ui/label"
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
import {
  Loader2,
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Check,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Truck,
  Package
} from "lucide-react"

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
  invoicePdfData?: string
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

const adminStatusLabels: Record<string, string> = {
  EN_COURS_DE_FACTURATION: "En cours de facturation",
  EN_COURS_DE_LIVRAISON: "En cours de livraison",
  LIVREE: "Livrée",
  REJETE: "Rejeté",
}

const adminStatusClasses: Record<string, string> = {
  EN_COURS_DE_FACTURATION: "bg-blue-100 text-blue-900",
  EN_COURS_DE_LIVRAISON: "bg-purple-100 text-purple-900",
  LIVREE: "bg-green-100 text-green-900",
  REJETE: "bg-red-100 text-red-900",
}

function getStatusLabel(status: string): string {
  return statusLabels[status] || status
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  return statusVariants[status] || "outline"
}

const ITEMS_PER_PAGE = 20

export default function AdminDevisPage() {
  const [devis, setDevis] = useState<DevisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDevis, setTotalDevis] = useState(0)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    setIsClient(true)

    let id = localStorage.getItem("userId")

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

    setUserId(id)
  }, [])

  const showAlert = (type: "success" | "error", title: string, message: string) => {
    setAlertMessage({ type, title, message })
    setTimeout(() => {
      setAlertMessage(null)
    }, 5000)
  }

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
    if (userId) {
      setCurrentPage(1)
      loadAllDevis(1)
    }
  }, [userId, responsableStatusFilter, adminStatusFilter, etablissementFilter])

  const loadAllDevis = async (page: number = 1) => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const isFirstPage = page === 1
      isFirstPage ? setLoading(true) : setIsLoadingMore(true)

      const url = new URL("/api/devis", window.location.origin)
      url.searchParams.set("userId", userId)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", ITEMS_PER_PAGE.toString())

      if (responsableStatusFilter !== "ALL") {
        url.searchParams.set("responsableStatus", responsableStatusFilter)
      }

      if (adminStatusFilter !== "ALL") {
        url.searchParams.set("adminStatus", adminStatusFilter)
      }

      if (etablissementFilter !== "ALL") {
        url.searchParams.set("etablissementId", etablissementFilter)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.data && Array.isArray(result.data)) {
        setDevis(result.data)
        setTotalDevis(result.pagination?.total || 0)
        setTotalPages(result.pagination?.totalPages || 1)
        setCurrentPage(page)
      } else {
        setDevis([])
        setTotalDevis(0)
        setTotalPages(1)
      }
    } catch (error) {
      showAlert(
        "error",
        "Erreur",
        error instanceof Error ? error.message : "Impossible de charger les devis"
      )
      setDevis([])
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
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
      url.searchParams.set("includePdf", "true")

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des détails")
      }

      const result = await response.json()
      setSelectedDevis(result.data)
      setIsDetailOpen(true)
    } catch (error) {
      showAlert("error", "Erreur", "Impossible de charger les détails du devis")
    }
  }

  // ✅ FONCTION AMÉLIORÉE - Download Devis as HTML file with professional styling
  const handleDownloadDevis = (devisData: DevisItem) => {
    try {
      setIsDownloading(true)
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
      align-items: center;
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
    
    .status-value.approved {
      background-color: #d4edda;
      border-color: #28a745;
      color: #155724;
    }
    
    .status-value.pending {
      background-color: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }
    
    .status-value.rejected {
      background-color: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }
    
    .status-value.delivering {
      background-color: #cfe2ff;
      border-color: #0d6efd;
      color: #084298;
    }
    
    .status-value.delivered {
      background-color: #d4edda;
      border-color: #28a745;
      color: #155724;
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
    
    .pdf-section {
      margin-top: 30px;
      padding: 15px;
      background-color: #e7f3ff;
      border-left: 4px solid #0d6efd;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .pdf-title {
      font-weight: bold;
      color: #0d6efd;
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
      <div class="section-title">📋 Produits</div>
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
        <span class="status-value ${devisData.responsableStatus === 'APPROUVE' ? 'approved' : devisData.responsableStatus === 'EN_ATTENTE' ? 'pending' : 'rejected'}">
          ${statusLabels[devisData.responsableStatus] || devisData.responsableStatus}
        </span>
      </div>
      ${devisData.responsableStatus === "APPROUVE" ? `
      <div class="status-item">
        <span class="status-label">Admin (Livraison):</span>
        <span class="status-value ${devisData.adminStatus === 'LIVREE' ? 'delivered' :
            devisData.adminStatus === 'EN_COURS_DE_LIVRAISON' ? 'delivering' :
              devisData.adminStatus === 'REJETE' ? 'rejected' : 'pending'
          }">
          ${adminStatusLabels[devisData.adminStatus] || devisData.adminStatus}
        </span>
      </div>
      ` : ''}
    </div>

    <!-- NOTES -->
    ${devisData.clientNotes ? `
    <div class="notes-section">
      <div class="notes-title">📝 Notes du Client</div>
      <p>${devisData.clientNotes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

    <!-- PDF SECTION -->
    ${devisData.hasInvoicePdf ? `
    <div class="pdf-section">
      <div class="pdf-title">📄 Facture PDF</div>
      <p><strong>Fichier:</strong> ${devisData.invoicePdfName}</p>
      ${devisData.invoicePdfUploadedAt ? `<p><strong>Uploadé le:</strong> ${new Date(devisData.invoicePdfUploadedAt).toLocaleDateString("fr-FR")}</p>` : ''}
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
      showAlert("error", "Erreur", "Impossible de télécharger le devis")
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadInvoicePdf = () => {
    if (!selectedDevis?.invoicePdfData || !selectedDevis.invoicePdfName) return
    const link = document.createElement("a")
    link.href = selectedDevis.invoicePdfData
    link.download = selectedDevis.invoicePdfName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpdateStatus = async (statusType: "responsable" | "admin", newStatus: string) => {
    if (!selectedDevis || !userId) {
      console.error("❌ Missing required data:", {
        selectedDevisExists: !!selectedDevis,
        userIdExists: !!userId
      })
      showAlert("error", "Erreur", "Données manquantes pour la mise à jour")
      return
    }

    try {
      console.log("📢 Sending notification...")

      const adminStatusLabels: Record<string, string> = {
        EN_COURS_DE_FACTURATION: "En cours de facturation",
        EN_COURS_DE_LIVRAISON: "En cours de livraison",
        LIVREE: "Livrée",
        REJETE: "Rejeté",
      }

      const statusLabel = statusType === "admin"
        ? adminStatusLabels[newStatus]
        : newStatus

      await fetch("/api/notifications/send-to-devis-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devisId: selectedDevis.id,
          title: `Changement de statut de livraison: ${statusLabel}`,
          message: `Le statut de livraison de votre devis pour ${selectedDevis.clientName} a été changé en "${statusLabel}"`,
        })
      })

      console.log("✅ Notification sent")
    } catch (error) {
      console.error("⚠️ Error sending notification:", error)
    }
    try {
      setIsUpdatingStatus(true)
      console.log("🔄 Updating devis status", {
        devisId: selectedDevis.id.slice(0, 8),
        statusType,
        newStatus,
      })

      const formData = new FormData()
      formData.append("devisId", selectedDevis.id)
      formData.append("userId", userId)

      if (statusType === "responsable") {
        formData.append("responsableStatus", newStatus)
      } else if (statusType === "admin") {
        formData.append("adminStatus", newStatus)
      }

      if (selectedPdfFile) {
        console.log("📎 Adding PDF file:", {
          name: selectedPdfFile.name,
          size: `${(selectedPdfFile.size / 1024).toFixed(2)} KB`,
          type: selectedPdfFile.type,
        })
        formData.append("invoicePdf", selectedPdfFile)
      }

      console.log("📤 Sending FormData...")

      const response = await fetch("/api/devis", {
        method: "PUT",
        body: formData,
      })

      console.log("📥 Response status:", response.status)

      const result = await response.json()
      console.log("📋 Response data:", result)

      if (!response.ok) {
        const errorMessage = result?.error || `Erreur HTTP ${response.status}`
        console.error("❌ API error:", errorMessage)
        throw new Error(errorMessage)
      }

      if (!result?.data) {
        throw new Error("Données de réponse invalides")
      }

      console.log("✅ Update successful")
      setSelectedDevis(result.data)
      setSelectedPdfFile(null)
      await loadAllDevis(currentPage)

      const statusLabel =
        statusType === "admin"
          ? adminStatusLabels[newStatus]
          : statusLabels[newStatus]

      showAlert("success", "Succès", `Statut mis à jour: ${statusLabel}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("❌ Error:", errorMessage)
      showAlert("error", "Erreur", errorMessage || "Impossible de mettre à jour le devis")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    loadAllDevis(pageNum)
  }

  const parentEtabs = etablissements.filter(e => !e.parentId)
  const getChildEtabs = (parentId: string) => etablissements.filter(e => e.parentId === parentId)

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
                    <SelectItem value="EN_COURS_DE_FACTURATION">En attente livraison</SelectItem>
                    <SelectItem value="EN_COURS_DE_LIVRAISON">En cours livraison</SelectItem>
                    <SelectItem value="LIVREE">Livrée</SelectItem>
                    <SelectItem value="REJETE">Rejeté</SelectItem>
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
              </div>
            </div>

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
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>
                        Total: {totalDevis} devis
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
                          <TableHead>Facture</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {devis.map((q) => (
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
                              {q.responsableStatus === "APPROUVE" ? (
                                <Badge className={adminStatusClasses[q.adminStatus]}>
                                  {adminStatusLabels[q.adminStatus]}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {q.hasInvoicePdf ? (
                                <div className="flex items-center justify-center gap-1">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <span className="text-xs text-green-600">PDF</span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
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
                                  onClick={() => handleDownloadDevis(q)}
                                  disabled={isDownloading}
                                  className="gap-2"
                                  title="Télécharger en HTML"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                      {isLoadingMore && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingMore}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Précédent</span>
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
                                  disabled={isLoadingMore}
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
                        disabled={currentPage === totalPages || isLoadingMore}
                        className="gap-2"
                      >
                        <span className="hidden sm:inline">Suivant</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {ITEMS_PER_PAGE} lignes/page
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Devis #{selectedDevis?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {selectedDevis && `Responsable: ${getStatusLabel(selectedDevis.responsableStatus)} | Admin: ${selectedDevis.responsableStatus === "APPROUVE" ? adminStatusLabels[selectedDevis.adminStatus] : "-"}`}
            </DialogDescription>
          </DialogHeader>

          {selectedDevis && (
            <div className="space-y-6">
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

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg">Résumé</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{parseFloat(selectedDevis.total).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">État Responsable</p>
                    <Badge className={STATUS_CLASSES[selectedDevis.responsableStatus]}>
                      {getStatusLabel(selectedDevis.responsableStatus)}
                    </Badge>
                  </div>

                  {selectedDevis.responsableStatus === "APPROUVE" && (
                    <div>
                      <p className="text-sm text-muted-foreground">État Admin</p>
                      <Badge className={adminStatusClasses[selectedDevis.adminStatus]}>
                        {adminStatusLabels[selectedDevis.adminStatus]}
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

              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Facture PDF
                </h3>

                {selectedDevis.hasInvoicePdf ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{selectedDevis.invoicePdfName}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Uploadé le: {new Date(selectedDevis.invoicePdfUploadedAt!).toLocaleString("fr-FR")}
                    </p>
                    <Button onClick={downloadInvoicePdf} variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger la facture
                    </Button>
                  </div>
                ) : selectedDevis.responsableStatus === "APPROUVE" ? (
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                    />
                    {selectedPdfFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm flex-1">{selectedPdfFile.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedPdfFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-3">
            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "EN_COURS_DE_FACTURATION" && (
                <div className="w-full space-y-3">
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => handleUpdateStatus("admin", "EN_COURS_DE_LIVRAISON")}
                      disabled={isUpdatingStatus}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1"
                    >
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                      Confirmer et envoyer
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
                  </div>
                </div>
              )}

            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "EN_COURS_DE_LIVRAISON" && (
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => handleUpdateStatus("admin", "LIVREE")}
                    disabled={isUpdatingStatus}
                    className="gap-2 bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Marquer comme livrée
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
                </div>
              )}

            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "LIVREE" && (
                <div className="w-full p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Devis terminé - Livraison effectuée</span>
                </div>
              )}

            {selectedDevis?.responsableStatus === "APPROUVE" &&
              selectedDevis?.adminStatus === "REJETE" && (
                <div className="w-full p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-3">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Devis rejeté par l'admin</span>
                </div>
              )}

            {selectedDevis?.responsableStatus !== "APPROUVE" && (
              <div className="w-full p-4 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm italic">
                En attente de l'approbation du Responsable...
              </div>
            )}

            <div className="flex justify-end w-full pt-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Fermer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}