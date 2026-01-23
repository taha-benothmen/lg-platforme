"use client"

import { useState, useEffect } from "react"
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
import productsData from "../../produits/products.json"
import { FileText, ShoppingCart, Download, Share2, ArrowLeft } from "lucide-react"

type CartItem = {
  id: number
  name: string
  description: string
  price: number
  currency: string
  category: string
  stock: number
  image: string
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
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
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

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
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
        console.error("Erreur lors du chargement du panier:", error)
      }
    }
  }, [])

  // Filtrer les produits par catégorie
  const filteredProducts =
    selectedCategory === "Tous"
      ? productsData.products
      : productsData.products.filter((p: any) => p.category === selectedCategory)

  // Gérer la sélection/désélection d'un produit
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

  // Modifier la quantité d'un produit
  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) return
    setSelectedProducts(prev => {
      const newMap = new Map(prev)
      newMap.set(productId, quantity)
      return newMap
    })
  }

  // Calculer le total
  const calculateTotal = () => {
    let total = 0
    selectedProducts.forEach((quantity, productId) => {
      const product = productsData.products.find((p: any) => p.id === productId)
      if (product) {
        total += product.price * quantity
      }
    })
    return total
  }

  // Calculer le nombre total d'articles
  const getTotalItems = () => {
    let total = 0
    selectedProducts.forEach(quantity => {
      total += quantity
    })
    return total
  }

  // Gérer les changements dans les informations client
  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Valider le formulaire
  const isFormValid = () => {
    return (
      clientInfo.nom.trim() !== "" &&
      clientInfo.prenom.trim() !== "" &&
      clientInfo.email.trim() !== "" &&
      clientInfo.telephone.trim() !== "" &&
      clientInfo.adresse.trim() !== "" &&
      selectedProducts.size > 0
    )
  }

  // Générer le devis PDF (simulation)
  const handleDownloadPDF = () => {
    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }

    const quoteData = {
      client: clientInfo,
      products: Array.from(selectedProducts.entries()).map(([id, quantity]) => {
        const product = productsData.products.find((p: any) => p.id === id)
        return {
          ...product,
          quantity
        }
      }),
      total: calculateTotal(),
      date: new Date().toISOString()
    }

    console.log("Devis généré:", quoteData)
    alert("Téléchargement du PDF en cours...")
    
    // Ici vous pouvez intégrer une bibliothèque comme jsPDF ou pdfmake
    // pour générer un vrai PDF
  }

  // Partager le devis
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
        console.log('Devis partagé avec succès')
      }).catch((error) => {
        console.error('Erreur lors du partage:', error)
      })
    } else {
      // Fallback: copier dans le presse-papier
      navigator.clipboard.writeText(shareText)
      alert("Lien du devis copié dans le presse-papier!")
    }
  }

  // Générer le devis et sauvegarder
  const handleGenerateQuote = () => {
    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner au moins un produit")
      return
    }

    const quoteData = {
      client: clientInfo,
      products: Array.from(selectedProducts.entries()).map(([id, quantity]) => {
        const product = productsData.products.find((p: any) => p.id === id)
        return {
          ...product,
          quantity
        }
      }),
      total: calculateTotal(),
      date: new Date().toISOString()
    }

    console.log("Devis généré:", quoteData)
    alert("Devis créé avec succès!")
    localStorage.removeItem("cart")
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
        <AppSidebar menu={menusByRole.etablissement} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.history.back()}
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
              {/* Colonne gauche - Sélection des produits */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Sélection des produits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtres par catégorie */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                      <Button
                        variant={selectedCategory === "Tous" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("Tous")}
                      >
                        Tous
                      </Button>
                      {productsData.categories.map((cat: any) => (
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

                    {/* Liste des produits filtrés */}
                    <div className="space-y-3">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product: any) => {
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
                              
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={80}
                                height={80}
                                className="object-cover rounded"
                              />

                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1">{product.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {product.description}
                                </p>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">{product.category}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Stock: {product.stock}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right space-y-2">
                                <p className="font-bold text-lg">
                                  {product.price} {product.currency}
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

              {/* Colonne droite - Informations client et récapitulatif */}
              <div className="space-y-4">
                {/* Informations client */}
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

                {/* Récapitulatif */}
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {Array.from(selectedProducts.entries()).map(([productId, quantity]) => {
                        const product = productsData.products.find((p: any) => p.id === productId)
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
                        disabled={!isFormValid()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Générer le devis
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.history.back()}
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