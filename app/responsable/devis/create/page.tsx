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
import { menusByRole } from "@/lib/data/menus"
import { FileText, ShoppingCart, Download, Share2, ArrowLeft, Loader2 } from "lucide-react"

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

export default function CreerDevisPage() {
  const router = useRouter()
  
  const [allProducts, setAllProducts] = useState<CartItem[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [userId, setUserId] = useState<string>("")
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

  // Load user ID and data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Get userId from localStorage or your auth system
        let currentUserId = localStorage.getItem("userId")
        
        if (!currentUserId) {
          // Try to get from sessionStorage as fallback
          currentUserId = sessionStorage.getItem("userId")
        }

        if (!currentUserId) {
          alert("User ID not found. Please log in again.")
          router.push("/login")
          return
        }

        setUserId(currentUserId)

        // Load all products
        const productsResponse = await fetch('/api/products')
        const productsData = await productsResponse.json()
        setAllProducts(productsData || [])

        // Load categories
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData || [])

        // Load cart from localStorage
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
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Filter products by category
  const filteredProducts =
    selectedCategory === "Tous"
      ? allProducts
      : allProducts.filter((p) => p.category?.name === selectedCategory)

  // Handle product selection/deselection
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

  // Change product quantity
  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) return
    setSelectedProducts(prev => {
      const newMap = new Map(prev)
      newMap.set(productId, quantity)
      return newMap
    })
  }

  // Calculate total
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

  // Get total items count
  const getTotalItems = () => {
    let total = 0
    selectedProducts.forEach(quantity => {
      total += quantity
    })
    return total
  }

  // Handle client info changes
  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate form
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

  // Download PDF
  const handleDownloadPDF = () => {
    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }

    const quoteData = {
      client: clientInfo,
      products: Array.from(selectedProducts.entries()).map(([id, quantity]) => {
        const product = allProducts.find((p) => p.id === id)
        return {
          ...product,
          quantity
        }
      }),
      total: calculateTotal(),
      date: new Date().toISOString()
    }

    console.log("Quote data for PDF:", quoteData)
    alert("PDF download in progress...")
  }

  // Share quote
  const handleShareQuote = () => {
    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }

    const shareText = `Devis pour ${clientInfo.prenom} ${clientInfo.nom}\nTotal: ${calculateTotal().toFixed(2)} TND\nNombre d'articles: ${getTotalItems()}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Devis',
        text: shareText,
      }).then(() => {
        console.log('Quote shared successfully')
      }).catch((error) => {
        console.error('Error sharing quote:', error)
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert("Quote link copied to clipboard!")
    }
  }

  // Generate and save quote
  const handleGenerateQuote = async () => {
    // Check userId
    if (!userId) {
      alert("User ID not found. Please log in again.")
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      setIsSubmitting(false)
      return
    }

    const quoteData = {
      userId: userId, // ✅ Use userId from localStorage/sessionStorage
      client: clientInfo,
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
        alert(`Erreur: ${result.error || 'Erreur inconnue'}`)
        setIsSubmitting(false)
        return
      }

      // Success
      alert(`Devis créé avec succès!\nNom du client: ${result.data.clientName}\nTotal: ${result.data.total} TND`)
      localStorage.removeItem("cart")
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/responsable/devis')
      }, 1000)
    } catch (error) {
      console.error('Error creating quote:', error)
      alert('Erreur lors de la création du devis')
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {getTotalItems()} article(s) sélectionné(s)
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={!isFormValid()}
                >
                  <Download className="h-4 w-4 mr-2" />
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Sélection des produits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category filters */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                      <Button
                        variant={selectedCategory === "Tous" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("Tous")}
                      >
                        Tous
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          variant={
                            selectedCategory === cat.name ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(cat.name)}
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>

                    {/* Filtered products list */}
                    <div className="space-y-3">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => {
                          const isSelected = selectedProducts.has(product.id)
                          const quantity = selectedProducts.get(product.id) || 1

                          return (
                            <div
                              key={product.id}
                              className={`flex gap-4 p-4 border rounded-lg transition ${
                                isSelected ? "border-primary bg-primary/5" : ""
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
                            Aucun produit trouvé dans cette catégorie
                          </p>
                        </div>
                      )}
                    </div>
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
                        <Label htmlFor="ville">Ville</Label>
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
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
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