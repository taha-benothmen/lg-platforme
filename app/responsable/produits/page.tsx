"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import productsData from "./products.json"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { menusByRole } from "@/lib/data/menus"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, Trash2, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"

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

export default function ProduitsPage() {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Filtrer les produits par catégorie
  const filteredProducts =
    selectedCategory === "Tous"
      ? productsData.products
      : productsData.products.filter((p) => p.category === selectedCategory)

  // Produit actuellement sélectionné
  const currentProduct = productsData.products.find(
    (p) => p.id === selectedProduct
  )

  // Ajouter au panier
  const addToCart = (product: typeof productsData.products[0]) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  // Augmenter la quantité
  const increaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  // Diminuer la quantité
  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Supprimer du panier
  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  // Calculer le total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Nombre total d'articles
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Créer un devis
  const handleCreateQuote = () => {
    // Sauvegarder le panier dans localStorage pour le récupérer dans la page devis
    localStorage.setItem("cart", JSON.stringify(cart))
    router.push("/etablissement/devis/create")
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
        {/* Sidebar fixe */}
        <AppSidebar menu={menusByRole.responsable} />

        {/* Contenu principal */}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {/* Header sticky */}
          <SiteHeader />

          {/* Partie scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Catalogue des produits</h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {filteredProducts.length} produit(s)
                </Badge>

                {/* Bouton Panier */}
                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="relative">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Panier
                      {getTotalItems() > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {getTotalItems()}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
                    <SheetHeader className="px-6 py-4 border-b">
                      <SheetTitle>Panier ({getTotalItems()} article(s))</SheetTitle>
                      <SheetDescription>
                        Gérez vos produits avant de créer un devis
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Votre panier est vide
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3 p-3 border rounded-lg"
                            >
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={70}
                                height={70}
                                className="object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.price} {item.currency}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => decreaseQuantity(item.id)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => increaseQuantity(item.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 ml-auto"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">
                                  {(item.price * item.quantity).toFixed(2)}{" "}
                                  {item.currency}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {cart.length > 0 && (
                      <>
                        <Separator />
                        <div className="px-6 py-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Sous-total
                              </span>
                              <span className="font-medium">
                                {calculateTotal().toFixed(2)} TND
                              </span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total</span>
                              <span>{calculateTotal().toFixed(2)} TND</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <SheetFooter className="px-6 py-4 border-t">
                      <div className="w-full space-y-2">
                        <Button
                          className="w-full"
                          disabled={cart.length === 0}
                          onClick={handleCreateQuote}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Créer un devis
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsCartOpen(false)}
                        >
                          Continuer mes achats
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "Tous" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("Tous")}
              >
                Tous
              </Button>
              {productsData.categories.map((cat) => (
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

            {/* Grille de produits */}
            {filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div key={product.id}>
                    <Dialog
                      open={selectedProduct === product.id}
                      onOpenChange={(open) =>
                        setSelectedProduct(open ? product.id : null)
                      }
                    >
                      {/* Card triggers the dialog */}
                      <DialogTrigger asChild>
                        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition">
                          <div className="relative">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={400}
                              height={250}
                              className="h-48 w-full object-cover"
                            />
                            <Badge className="absolute top-2 right-2">
                              {product.category}
                            </Badge>
                          </div>
                          <CardContent className="p-4 space-y-2">
                            <h2 className="font-semibold text-lg line-clamp-1">
                              {product.name}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>

                            <div className="flex items-center justify-between pt-2">
                              <span className="font-bold text-lg">
                                {product.price} {product.currency}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Stock: {product.stock}
                              </span>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              Voir détails
                            </Button>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      {/* Dialog content */}
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {currentProduct?.name}
                            <Badge variant="secondary">
                              {currentProduct?.category}
                            </Badge>
                          </DialogTitle>
                        </DialogHeader>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Image */}
                          <div>
                            <Image
                              src={currentProduct?.image || ""}
                              alt={currentProduct?.name || ""}
                              width={600}
                              height={400}
                              className="object-cover rounded w-full"
                            />
                          </div>

                          {/* Informations détaillées */}
                          <div className="flex flex-col justify-between">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                  Description
                                </h3>
                                <p className="text-sm">
                                  {currentProduct?.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                    Prix
                                  </h3>
                                  <p className="font-bold text-2xl">
                                    {currentProduct?.price}{" "}
                                    {currentProduct?.currency}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                    Disponibilité
                                  </h3>
                                  <p className="text-lg">
                                    {currentProduct?.stock}{" "}
                                    <span className="text-sm text-muted-foreground">
                                      en stock
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                  Catégorie
                                </h3>
                                <Badge>{currentProduct?.category}</Badge>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 mt-6">
                              <Button
                                className="w-full"
                                onClick={() => {
                                  if (currentProduct) {
                                    addToCart(currentProduct)
                                    setSelectedProduct(null)
                                    setIsCartOpen(true)
                                  }
                                }}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ajouter au panier
                              </Button>
                              <DialogClose asChild>
                                <Button variant="outline" className="w-full">
                                  Fermer
                                </Button>
                              </DialogClose>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucun produit trouvé dans cette catégorie
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}