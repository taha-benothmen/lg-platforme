"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShoppingCart } from "lucide-react"
import { getProducts } from "@/app/actions/products"
import Image from "next/image"

export default function ProduitsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      const result = await getProducts()
      if (result.success) {
        setProducts(result.products || [])
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cart.find((item: any) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ ...product, quantity: 1 })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    alert(`${product.name} ajouté au panier!`)
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

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold">Produits</h1>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher produits..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Chargement des produits...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden flex flex-col card-interactive">
                      {product.image && (
                        <div className="relative h-40 w-full bg-muted">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <Badge variant="outline" className="w-fit">
                          {product.category?.name || "Catégorie"}
                        </Badge>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-baseline justify-between mt-auto">
                          <span className="text-2xl font-bold text-primary">
                            {product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {product.currency}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Stock: {product.stock}
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter au panier
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
