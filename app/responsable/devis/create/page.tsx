"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { menusByRole } from "@/lib/data/menus"
import { notificationService } from "@/lib/notification.service"
import { generateDevisPDFContent } from "@/lib/pdf-utils"
import { FileText, ShoppingCart, Download, Share2, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Info, X, ChevronLeft, ChevronRight, Trash2, Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CartItem = {
  id: number
  name: string
  description: string
  price: number
  currency: string
  category?: { id: number; name: string }
  stock: number
  image?: string
  quantity: number
}

type ClientInfo = {
  nom: string
  prenom: string
  entreprise: string
  email: string
  telephone: string
  adresse: string
  codePostal: string
  ville: string
  notes: string
}

type AlertType = {
  show: boolean
  type: "default" | "destructive" | "success"
  title: string
  description: string
}

type UserInfo = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  etablissement?: {
    id: string
    name: string
    address?: string
    phone?: string
    email?: string
  }
}

type EtablissementInfo = {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
}

const ITEMS_PER_PAGE = 6

export default function CreerDevisPage() {
  const router = useRouter()

  const [allProducts, setAllProducts] = useState<CartItem[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [userId, setUserId] = useState<string>("")
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [etablissementInfo, setEtablissementInfo] = useState<EtablissementInfo | null>(null)
  const [alert, setAlert] = useState<AlertType>({
    show: false,
    type: "default",
    title: "",
    description: ""
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    nom: "",
    prenom: "",
    entreprise: "",
    email: "",
    telephone: "",
    adresse: "",
    codePostal: "",
    ville: "",
    notes: ""
  })

  const [paymentPeriod, setPaymentPeriod] = useState<number>(0)

  const showAlert = (type: "default" | "destructive" | "success", title: string, description: string) => {
    setAlert({ show: true, type, title, description })
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  useEffect(() => {
    async function loadData() {
      try {
        let currentUserId = localStorage.getItem("userId")

        if (!currentUserId) {
          currentUserId = sessionStorage.getItem("userId")
        }

        if (!currentUserId) {
          showAlert("destructive", "Erreur d'authentification", "ID utilisateur introuvable. Veuillez vous reconnecter.")
          setTimeout(() => router.push("/login"), 2000)
          return
        }

        setUserId(currentUserId)

        try {
          const userResponse = await fetch(`/api/utilisateurs/${currentUserId}`)
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUserInfo(userData)

            if (userData.etablissement) {
              
              setEtablissementInfo(userData.etablissement)
            } else {
              console.warn("No establishment assigned to user")
              console.warn("User has etablissementId:", userData.etablissementId)
              console.warn("But etablissement object is null")
              setEtablissementInfo(null)
            }
          } else {
            console.error("User API returned non-ok status:", userResponse.status)
          }
        } catch (error) {
          console.error("Error loading user info:", error)
        }

        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData || [])

        const cartData = localStorage.getItem("cart")
        if (cartData) {
          try {
            const cart: CartItem[] = JSON.parse(cartData)
            const productMap = new Map<number, number>()
            cart.forEach(item => {
              productMap.set(item.id, item.quantity)
            })
            setSelectedProducts(productMap)
          } catch (error) {
            console.error("Error loading cart:", error)
          }
        }

        await loadProducts(1)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [router])

  const loadProducts = async (page: number = 1) => {
    try {
      const isFirstPage = page === 1
      isFirstPage ? setLoading(true) : setIsLoadingMore(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (selectedCategory !== "all") {
        params.append("categoryId", selectedCategory)
      }

      const response = await fetch(`/api/products?${params}`)
      const result = await response.json()

      if (result.data) {
        setAllProducts(result.data || [])
        setCurrentPage(result.pagination.page)
        setTotalPages(result.pagination.totalPages)
        setTotalProducts(result.pagination.total)
      }
    } catch (error) {
      console.error('Erreur de chargement des produits:', error)
      setAllProducts([])
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadProducts(1)
  }, [selectedCategory])

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    loadProducts(pageNum)
    const productsSection = document.getElementById("products-section")
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleProductToggle = (productId: number, isChecked: boolean) => {
    setSelectedProducts(prev => {
      const newMap = new Map(prev)
      if (isChecked) {
        newMap.set(productId, 1)
      } else {
        newMap.delete(productId)
      }
      return newMap
    })
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) return
    setSelectedProducts(prev => {
      const newMap = new Map(prev)
      newMap.set(productId, quantity)
      return newMap
    })
  }

  const handleClearAll = () => {
    setSelectedProducts(new Map())
    showAlert("success", "Sélection effacée", "Tous les produits ont été désélectionnés")
  }

  const calculateTotal = () => {
    let total = 0
    selectedProducts.forEach((quantity, productId) => {
      const product = allProducts.find((p) => p.id === productId)
      if (product) {
        total += product.price * quantity
      }
    })
    return total
  }

  const getTotalItems = () => {
    let total = 0
    selectedProducts.forEach(quantity => {
      total += quantity
    })
    return total
  }

  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateMonthlyPayment = () => {
    if (paymentPeriod <= 0) return 0
    return calculateTotal() / paymentPeriod
  }

  const isFormValid = () => {
    return (
      clientInfo.nom.trim() !== "" &&
      clientInfo.prenom.trim() !== "" &&
      clientInfo.email.trim() !== "" &&
      clientInfo.telephone.trim() !== "" &&
      clientInfo.adresse.trim() !== "" &&
      clientInfo.ville.trim() !== "" &&
      selectedProducts.size > 0
    )
  }

  const handleDownloadPDF = async () => {
    if (!isFormValid()) {
      showAlert("destructive", "Formulaire incomplet", "Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }
  
    setIsDownloading(true)
  
    try {
      const devisData = {
        id: `draft-${new Date().getTime()}`,
        clientName: `${clientInfo.prenom} ${clientInfo.nom}`,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.telephone,
        clientAddr: clientInfo.adresse,
        clientEnterprise: clientInfo.entreprise,
        clientNotes: clientInfo.notes,
        total: calculateTotal(),
        paymentPeriod: paymentPeriod > 0 ? paymentPeriod : null,
        monthlyPayment: paymentPeriod > 0 ? calculateMonthlyPayment() : null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        items: Array.from(selectedProducts.entries()).map(([id, quantity]) => {
          const product = allProducts.find((p) => p.id === id)
          return {
            id: product?.id,
            quantity,
            price: product?.price?.toString() || "0",
            product: {
              id: product?.id,
              name: product?.name,
              description: product?.description,
            }
          }
        }),
        itemsCount: Array.from(selectedProducts.entries()).length,
        createdBy: userInfo ? {
          id: userInfo.id,
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          email: userInfo.email || "",
        } : null,
        etablissement: etablissementInfo ? {
          id: etablissementInfo.id,
          name: etablissementInfo.name,
          address: etablissementInfo.address,
          phone: etablissementInfo.phone,
          email: etablissementInfo.email,
        } : null,
      }
  
      const htmlContent = generateDevisPDFContent(devisData)  
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Devis_${clientInfo.nom}_${clientInfo.prenom}_${new Date().getTime()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
  
      showAlert("success", "Téléchargement réussi", "Le devis a été téléchargé avec succès!")
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showAlert("destructive", "Erreur", "Impossible de télécharger le devis")
    } finally {
      setIsDownloading(false)
    }
  }
  const handleShareQuote = () => {
    if (!isFormValid()) {
      showAlert("destructive", "Formulaire incomplet", "Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }

    const shareText = `Devis pour ${clientInfo.prenom} ${clientInfo.nom}\nTotal: ${calculateTotal().toFixed(2)} TND\nNombre d'articles: ${getTotalItems()}${paymentPeriod > 0 ? `\nPlan de paiement: ${paymentPeriod} mois à ${calculateMonthlyPayment().toFixed(2)} TND/mois` : ''}`

    if (navigator.share) {
      navigator.share({
        title: 'Devis',
        text: shareText,
      }).then(() => {
      }).catch((error) => {
        console.error('Error sharing quote:', error)
      })
    } else {
      navigator.clipboard.writeText(shareText)
      showAlert("success", "Lien copié", "Le lien du devis a été copié dans le presse-papiers!")
    }
  }

  const handleGenerateQuote = async () => {
    if (!userId) {
      showAlert("destructive", "Erreur d'authentification", "ID utilisateur introuvable. Veuillez vous reconnecter.")
      setTimeout(() => router.push("/login"), 2000)
      return
    }

    setIsSubmitting(true)

    if (!isFormValid()) {
      showAlert("destructive", "Formulaire incomplet", "Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      setIsSubmitting(false)
      return
    }

    const quoteData = {
      userId: userId,
      client: clientInfo,
      paymentPeriod: paymentPeriod > 0 ? paymentPeriod : null,
      monthlyPayment: paymentPeriod > 0 ? calculateMonthlyPayment() : null,
      products: Array.from(selectedProducts.entries()).map(([id, quantity]) => {
        const product = allProducts.find((p) => p.id === id)
        return {
          id: product?.id,
          name: product?.name,
          description: product?.description,
          price: product?.price,
          currency: product?.currency,
          stock: product?.stock,
          image: product?.image,
          category: product?.category,
          quantity
        }
      }),
      total: calculateTotal(),
    }

    try {
      console.log("Sending quote data:", quoteData)

      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API error response:", result)
        showAlert("destructive", "Erreur", result.error || 'Erreur inconnue lors de la création du devis')
        setIsSubmitting(false)
        return
      }

      showAlert("success", "Succès", `Devis créé avec succès! Nom du client: ${result.data.clientName} - Total: ${result.data.total} TND`)
      localStorage.removeItem("cart")

      setTimeout(() => {
        router.push('/responsable/devis')
      }, 2000)
    } catch (error) {
      console.error('Error creating quote:', error)
      showAlert("destructive", "Erreur", "Une erreur est survenue lors de la création du devis")
      setIsSubmitting(false)
    }
    
  }

  // Loading state
  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <div className="flex h-screen w-screen">
          <AppSidebar menu={menusByRole.responsable} />
          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.responsable} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
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
                  {alert.type === "default" && <Info className="h-4 w-4" />}
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Créer un devis</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm">
                  {getTotalItems()} article(s) sélectionné(s)
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={!isFormValid() || isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareQuote}
                  disabled={!isFormValid()}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left column - Product selection */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Sélection des produits
                    </CardTitle>
                    {selectedProducts.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAll}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Annuler la sélection</span>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category filters */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                      >
                        Tous
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          variant={
                            selectedCategory === cat.id.toString() ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id.toString())}
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>

                    {/* Products list section */}
                    <div id="products-section" className="space-y-3">
                      {allProducts.length > 0 ? (
                        allProducts.map((product) => {
                          const isSelected = selectedProducts.has(product.id)
                          const quantity = selectedProducts.get(product.id) || 1

                          return (
                            <div
                              key={product.id}
                              className={`flex gap-4 p-4 border rounded-lg transition ${isSelected ? "border-primary bg-primary/5" : ""
                                }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleProductToggle(product.id, checked as boolean)
                                }
                                className="mt-1"
                              />

                              {product.image && (
                                <div className="relative h-20 w-20 flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded"
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1">{product.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {product.description}
                                </p>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">
                                    {product.category?.name || "Catégorie"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Stock: {product.stock}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right space-y-2">
                                <p className="font-bold text-lg">
                                  {product.price.toFixed(2)} {product.currency}
                                </p>

                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        handleQuantityChange(product.id, quantity - 1)
                                      }
                                      disabled={quantity <= 1}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      value={quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          product.id,
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                      className="w-16 h-8 text-center"
                                      min="1"
                                      max={product.stock}
                                    />
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        handleQuantityChange(product.id, quantity + 1)
                                      }
                                      disabled={quantity >= product.stock}
                                    >
                                      +
                                    </Button>
                                  </div>
                                )}

                                {isSelected && (
                                  <p className="text-sm font-semibold">
                                    Total: {(product.price * quantity).toFixed(2)} {product.currency}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            Aucun produit trouvé
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ✅ Pagination Controls */}
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

                          {/* Smart page numbers */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              const showPage =
                                page <= 2 ||
                                page >= totalPages - 1 ||
                                (page >= currentPage - 1 && page <= currentPage + 1)

                              if (showPage) {
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    disabled={isLoadingMore}
                                    className="w-10"
                                  >
                                    {page}
                                  </Button>
                                )
                              }

                              if (page === 3) {
                                return (
                                  <span
                                    key="dots"
                                    className="px-2 text-muted-foreground"
                                  >
                                    ...
                                  </span>
                                )
                              }

                              return null
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
                  </CardContent>
                </Card>
              </div>

              {/* Right column - Client info and summary */}
              <div className="space-y-4">
                {/* Client information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          value={clientInfo.nom}
                          onChange={(e) => handleClientInfoChange("nom", e.target.value)}
                          placeholder="Nom"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input
                          id="prenom"
                          value={clientInfo.prenom}
                          onChange={(e) => handleClientInfoChange("prenom", e.target.value)}
                          placeholder="Prénom"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="entreprise">Entreprise</Label>
                      <Input
                        id="entreprise"
                        value={clientInfo.entreprise}
                        onChange={(e) => handleClientInfoChange("entreprise", e.target.value)}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientInfo.email}
                        onChange={(e) => handleClientInfoChange("email", e.target.value)}
                        placeholder="email@exemple.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="telephone">Téléphone *</Label>
                      <Input
                        id="telephone"
                        type="tel"
                        value={clientInfo.telephone}
                        onChange={(e) => handleClientInfoChange("telephone", e.target.value)}
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="adresse">Adresse *</Label>
                      <Input
                        id="adresse"
                        value={clientInfo.adresse}
                        onChange={(e) => handleClientInfoChange("adresse", e.target.value)}
                        placeholder="Adresse complète"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="codePostal">Code postal</Label>
                        <Input
                          id="codePostal"
                          value={clientInfo.codePostal}
                          onChange={(e) => handleClientInfoChange("codePostal", e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ville">Ville *</Label>
                        <Input
                          id="ville"
                          value={clientInfo.ville}
                          onChange={(e) => handleClientInfoChange("ville", e.target.value)}
                          placeholder="Tunis"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={clientInfo.notes}
                        onChange={(e) => handleClientInfoChange("notes", e.target.value)}
                        placeholder="Informations complémentaires..."
                        rows={3}
                      />
                    </div>

                    {/* ✅ Payment Period */}
                    <div className="pt-4 border-t">
                      <Label htmlFor="paymentPeriod" className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        Plan de paiement échelonné (optionnel)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="paymentPeriod"
                          type="number"
                          value={paymentPeriod || ""}
                          onChange={(e) => setPaymentPeriod(parseInt(e.target.value) || 0)}
                          placeholder="Ex: 12, 24, 36 mois"
                          min="0"
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground self-center">mois</span>
                      </div>
                      {paymentPeriod > 0 && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-semibold text-primary">
                            Mensualité: {calculateMonthlyPayment().toFixed(2)} TND
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total: {calculateTotal().toFixed(2)} TND sur {paymentPeriod} mois
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.from(selectedProducts.entries()).map(([productId, quantity]) => {
                        const product = allProducts.find((p) => p.id === productId)
                        if (!product) return null

                        return (
                          <div key={productId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {product.name} x{quantity}
                            </span>
                            <span className="font-medium">
                              {(product.price * quantity).toFixed(2)} TND
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {selectedProducts.size > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{calculateTotal().toFixed(2)} TND</span>
                        </div>
                        {paymentPeriod > 0 && (
                          <div className="flex justify-between font-semibold text-primary text-sm">
                            <span>Mensualité</span>
                            <span>{calculateMonthlyPayment().toFixed(2)} TND</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-3 space-y-2">
                      <Button
                        className="w-full"
                        onClick={handleGenerateQuote}
                        disabled={!isFormValid() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Générer le devis
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                      >
                        Retour aux produits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}