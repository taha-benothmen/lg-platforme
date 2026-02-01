"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EyeOff, Trash2, Edit, Upload, Loader2, Plus, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react"

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  currency: string
  stock: number
  image: string | null
  imageType: string | null
  isActive: boolean
  categoryId: number
  category: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface Category {
  id: number
  name: string
}

interface AlertMessage {
  type: "success" | "error"
  title: string
  message: string
}

interface ConfirmDialog {
  isOpen: boolean
  productId: number | null
}

const ITEMS_PER_PAGE = 12

export default function ProduitsPage() {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [productsList, setProductsList] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [hiddenProducts, setHiddenProducts] = useState<Set<number>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ isOpen: false, productId: null })
  
  // ✅ OPTIMIZED: API-based pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    description: "",
    price: 0,
    currency: "TND",
    categoryId: 0,
    stock: 0,
  })
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage, selectedCategory])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const showAlert = (type: "success" | "error", title: string, message: string) => {
    setAlertMessage({ type, title, message })
  }

  // ✅ OPTIMIZED: Fetch from API with pagination
  const fetchProducts = async (page: number) => {
    try {
      setIsLoadingMore(page !== 1)
      const categoryParam = selectedCategory !== "all" ? `&categoryId=${selectedCategory}` : ""
      
      console.log(`📡 Fetching page ${page}${categoryParam}`)
      
      const response = await fetch(
        `/api/products?page=${page}&limit=${ITEMS_PER_PAGE}${categoryParam}`
      )
      
      if (!response.ok) throw new Error("Erreur lors du chargement")
      
      const result = await response.json()
      console.log(`✅ Loaded page ${page}: ${result.data.length} products, Total: ${result.pagination.total}`)
      
      setProductsList(result.data)
      setTotalProducts(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
      setIsLoading(false)
    } catch (error) {
      console.error("Erreur:", error)
      showAlert("error", "Erreur", "Erreur lors du chargement des produits")
      setIsLoading(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Erreur")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const handleDelete = async (productId: number) => {
    setConfirmDialog({ isOpen: true, productId })
  }

  const confirmDelete = async () => {
    const productId = confirmDialog.productId
    if (!productId) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur de suppression")
      }
      
      setProductsList(productsList.filter((p) => p.id !== productId))
      setSelectedProduct(null)
      setConfirmDialog({ isOpen: false, productId: null })
      showAlert("success", "Succès", "Produit supprimé avec succès !")
    } catch (error) {
      console.error("Erreur:", error)
      showAlert("error", "Erreur", `Erreur lors de la suppression: ${error}`)
      setConfirmDialog({ isOpen: false, productId: null })
    }
  }

  const cancelDelete = () => {
    setConfirmDialog({ isOpen: false, productId: null })
  }

  const handleToggleVisibility = (productId: number) => {
    setHiddenProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleEdit = (productId: number) => {
    const product = productsList.find((p) => p.id === productId)
    if (product) {
      setEditForm({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        currency: product.currency,
        categoryId: product.categoryId,
        stock: product.stock,
      })
      setEditImagePreview(product.image)
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditImagePreview(null)
    setEditForm({
      id: 0,
      name: "",
      description: "",
      price: 0,
      currency: "TND",
      categoryId: 0,
      stock: 0,
    })
  }

  const handleSaveEdit = async () => {
    try {
      const form = new FormData()
      form.append("name", editForm.name)
      form.append("description", editForm.description)
      form.append("price", editForm.price.toString())
      form.append("currency", editForm.currency)
      form.append("stock", editForm.stock.toString())
      form.append("categoryId", editForm.categoryId.toString())

      const fileInput = document.getElementById("edit-image") as HTMLInputElement
      if (fileInput?.files?.[0]) {
        form.append("image", fileInput.files[0])
      }

      const response = await fetch(`/api/products/${editForm.id}`, {
        method: "PUT",
        body: form,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur de mise à jour")
      }

      const updatedProduct = await response.json()
      setProductsList(
        productsList.map((p) => (p.id === editForm.id ? updatedProduct : p))
      )
      setIsEditing(false)
      setEditImagePreview(null)
      setSelectedProduct(null)
      showAlert("success", "Succès", "Produit modifié avec succès !")
    } catch (error) {
      console.error("Erreur:", error)
      showAlert("error", "Erreur", `Erreur lors de la modification: ${error}`)
    }
  }

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditForm({
      ...editForm,
      [name]: name === "price" || name === "stock" || name === "categoryId" ? Number(value) : value,
    })
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setEditImagePreview(imageUrl)
    }
  }

  const filteredProducts = productsList.filter(
    (p) => !hiddenProducts.has(p.id)
  )

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNum)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentProduct = productsList.find((p) => p.id === selectedProduct)

  if (isLoading && currentPage === 1) {
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
          <AppSidebar menu={menusByRole.admin} />
          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Chargement des produits...</span>
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
        <AppSidebar menu={menusByRole.admin} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
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

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && cancelDelete()}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground">
                  Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={confirmDelete}
                    variant="destructive"
                    className="flex-1"
                  >
                    Supprimer
                  </Button>
                  <Button
                    onClick={cancelDelete}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Catalogue des produits</h1>
              <Button onClick={() => router.push("/admin/produits/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory("all")
                  setCurrentPage(1)
                }}
                className="whitespace-nowrap"
              >
                Tous les produits
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id.toString() ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory(cat.id.toString())
                    setCurrentPage(1)
                  }}
                  className="whitespace-nowrap"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Aucun produit disponible</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <div key={product.id}>
                      <Dialog
                        open={selectedProduct === product.id}
                        onOpenChange={(open) => {
                          setSelectedProduct(open ? product.id : null)
                          if (!open) {
                            setIsEditing(false)
                            setEditImagePreview(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-48 w-full object-cover"
                              />
                            ) : (
                              <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">Pas d'image</span>
                              </div>
                            )}
                            <CardContent className="p-4 space-y-2">
                              <h2 className="font-semibold text-lg">
                                {product.name}
                              </h2>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.description || "Pas de description"}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {product.price} {product.currency}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Stock: {product.stock}
                                </span>
                              </div>

                              <Button variant="outline" className="w-full" size="sm">
                                Voir détails
                              </Button>
                            </CardContent>
                          </Card>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {isEditing ? "Modifier le produit" : currentProduct?.name}
                            </DialogTitle>
                          </DialogHeader>

                          {!isEditing ? (
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                {currentProduct?.image ? (
                                  <img
                                    src={currentProduct.image}
                                    alt={currentProduct.name}
                                    className="object-cover rounded w-full"
                                  />
                                ) : (
                                  <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded">
                                    <span className="text-gray-400">Pas d'image</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <span className="font-semibold">Catégorie:</span>{" "}
                                    {currentProduct?.category.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {currentProduct?.description || "Pas de description"}
                                  </p>
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-2xl">
                                      {currentProduct?.price} {currentProduct?.currency}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      Stock: {currentProduct?.stock}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(currentProduct?.id || 0)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleVisibility(currentProduct?.id || 0)
                                        setSelectedProduct(null)
                                      }}
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(currentProduct?.id || 0)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <DialogClose asChild>
                                    <Button variant="ghost" className="w-full" size="sm">
                                      Fermer
                                    </Button>
                                  </DialogClose>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nom du produit</Label>
                                <Input
                                  id="edit-name"
                                  name="name"
                                  value={editForm.name}
                                  onChange={handleEditFormChange}
                                  placeholder="Nom du produit"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-category">Catégorie</Label>
                                <Select
                                  value={editForm.categoryId.toString()}
                                  onValueChange={(value) =>
                                    setEditForm({ ...editForm, categoryId: Number(value) })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  name="description"
                                  value={editForm.description}
                                  onChange={handleEditFormChange}
                                  placeholder="Description du produit"
                                  rows={3}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-price">Prix</Label>
                                  <Input
                                    id="edit-price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={handleEditFormChange}
                                    placeholder="Prix"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-stock">Stock</Label>
                                  <Input
                                    id="edit-stock"
                                    name="stock"
                                    type="number"
                                    value={editForm.stock}
                                    onChange={handleEditFormChange}
                                    placeholder="Stock"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-image">Photo du produit</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="edit-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => document.getElementById("edit-image")?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                                {editImagePreview && (
                                  <div className="mt-2 border rounded-lg overflow-hidden">
                                    <img
                                      src={editImagePreview}
                                      alt="Preview"
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={handleSaveEdit}
                                  className="flex-1"
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>

                {/* ✅ OPTIMIZED: Better pagination with API loading */}
                {totalPages > 1 && (
                  <div className="mt-8 border-t pt-6">
                    <div className="flex flex-col gap-4">
                      {/* Info line */}
                      <div className="text-sm text-muted-foreground text-center">
                        Affichage page {currentPage} sur {totalPages}
                        {isLoadingMore && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                      </div>

                      {/* Pagination controls */}
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1 || isLoadingMore}
                          className="gap-1"
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
                          className="gap-1"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Metrics */}
                      <div className="text-sm text-muted-foreground text-center">
                        Total: {totalProducts} produits • {totalPages} pages
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}