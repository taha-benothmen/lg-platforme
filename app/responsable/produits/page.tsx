"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShoppingCart, X, Plus, Minus, FileText, Info, Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ITEMS_PER_PAGE = 12

export default function ProduitsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // Load categories (once)
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        setCategories(data || [])
      } catch (error) {
        console.error('Erreur de chargement des catégories:', error)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // ✅ OPTIMIZED: Load products with pagination
  const loadProducts = async (page: number = 1) => {
    try {
      const isFirstPage = page === 1
      isFirstPage ? setIsLoading(true) : setIsLoadingMore(true)

      // Build query params
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
        setProducts(result.data || [])
        setCurrentPage(result.pagination.page)
        setTotalPages(result.pagination.totalPages)
        setTotalProducts(result.pagination.total)
      }
    } catch (error) {
      console.error('Erreur de chargement des produits:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Load products on mount
  useEffect(() => {
    loadProducts(1)
  }, [])

  // Reload products when category changes
  useEffect(() => {
    loadProducts(1)
  }, [selectedCategory])

  // Initialize cart from React state (no localStorage)
  useEffect(() => {
    setCart([])
  }, [])

  // ✅ Search is done client-side (no API call needed)
  const filteredProducts = products.filter((p) => {
    return p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  })

  const handleAddToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find((item: any) => item.id === product.id)

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const handleRemoveFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product)
    setIsDetailsOpen(true)
  }

  const handleCreateQuote = () => {
    localStorage.setItem("cart", JSON.stringify(cart))
    router.push('/responsable/devis/create')
  }

  // ✅ Page navigation
  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    loadProducts(pageNum)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold">Produits</h1>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher produits..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="w-full sm:w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cart Badge */}
                  <div className="relative">
                    <Button variant="outline" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemsCount > 0 && (
                        <Badge
                          className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-primary"
                        >
                          {cartItemsCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            {cartItemsCount} article{cartItemsCount > 1 ? 's' : ''} dans le panier
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: {cartTotal.toFixed(2)} TND
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleCreateQuote}>
                        <FileText className="h-4 w-4 mr-2" />
                        Créer un devis
                      </Button>
                    </div>

                    {/* Cart Items List */}
                    <Separator className="my-4" />
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded-md">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toFixed(2)} TND × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Chargement des produits...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                      const hasValidImage = product.image && typeof product.image === 'string' && product.image.startsWith('data:')

                      return (
                        <Card key={product.id} className="overflow-hidden flex flex-col card-interactive group">
                          {hasValidImage ? (
                            <div className="relative h-40 w-full bg-muted">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-40 w-full bg-muted flex items-center justify-center">
                              <p className="text-muted-foreground">Pas d'image</p>
                            </div>
                          )}

                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{product.name}</CardTitle>
                            <Badge variant="outline" className="w-fit">
                              {product.category?.name || "Catégorie"}
                            </Badge>
                          </CardHeader>

                          <CardContent className="flex-1 flex flex-col gap-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description || "Aucune description"}
                            </p>

                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-bold text-primary">
                                {product.price.toFixed(2)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {product.currency}
                              </span>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              Stock: <span className={product.stock > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                {product.stock}
                              </span>
                            </div>

                            <div className="flex gap-2 mt-auto">
                              <Button
                                className="flex-1"
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock === 0}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ajouter
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleViewDetails(product)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Pagination Controls */}
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
                                  key="dots-start"
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
                </div>
              )}
            </div>
          </div>
        </SidebarInset>

        {/* Product Details Sidebar */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
            {selectedProduct && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedProduct.name}</SheetTitle>
                  <SheetDescription>
                    Informations détaillées du produit
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Image */}
                  {selectedProduct.image && typeof selectedProduct.image === 'string' && selectedProduct.image.startsWith('data:') ? (
                    <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Pas d'image disponible</p>
                    </div>
                  )}

                  {/* Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Catégorie</h3>
                      <Badge variant="outline">
                        {selectedProduct.category?.name || "Non catégorisé"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.description || "Aucune description disponible"}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Prix</h3>
                        <p className="text-2xl font-bold text-primary">
                          {selectedProduct.price.toFixed(2)} {selectedProduct.currency}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Stock</h3>
                        <p className={`text-2xl font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.stock}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-semibold">Informations supplémentaires</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">ID:</span> {selectedProduct.id}</p>
                        <p><span className="text-muted-foreground">Statut:</span> {selectedProduct.isActive ? "Actif" : "Inactif"}</p>
                        <p><span className="text-muted-foreground">Date de création:</span> {new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        handleAddToCart(selectedProduct)
                        setIsDetailsOpen(false)
                      }}
                      disabled={selectedProduct.stock === 0}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ajouter au panier
                    </Button>

                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        handleAddToCart(selectedProduct)
                        handleCreateQuote()
                        setIsDetailsOpen(false)
                      }}
                      disabled={selectedProduct.stock === 0}
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Créer un devis directement
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </SidebarProvider>
  )
}