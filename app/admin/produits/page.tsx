"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import productsData from "./products.json"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { EyeOff, Trash2, Edit, Upload } from "lucide-react"

export default function ProduitsPage() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [productsList, setProductsList] = useState(productsData)
  const [hiddenProducts, setHiddenProducts] = useState<Set<number>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    description: "",
    price: 0,
    currency: "TND",
    category: "",
    stock: 0,
    image: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleDelete = (productId: number) => {
    setProductsList({
      ...productsList,
      products: productsList.products.filter((p) => p.id !== productId),
    })
    setSelectedProduct(null)
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
    const product = productsList.products.find((p) => p.id === productId)
    if (product) {
      setEditForm(product)
      setImagePreview(product.image)
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setImagePreview(null)
    setEditForm({
      id: 0,
      name: "",
      description: "",
      price: 0,
      currency: "TND",
      category: "",
      stock: 0,
      image: "",
    })
  }

  const handleSaveEdit = () => {
    setProductsList({
      ...productsList,
      products: productsList.products.map((p) =>
        p.id === editForm.id ? editForm : p
      ),
    })
    setIsEditing(false)
    setImagePreview(null)
    setSelectedProduct(null)
    alert("Produit modifié avec succès !")
  }

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditForm({
      ...editForm,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setImagePreview(imageUrl)
      setEditForm({ ...editForm, image: imageUrl })
    }
  }

  const visibleProducts = productsList.products.filter(
    (p) => !hiddenProducts.has(p.id)
  )

  const currentProduct = productsList.products.find(
    (p) => p.id === selectedProduct
  )

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
        <AppSidebar menu={menusByRole.admin} />

        {/* Contenu principal */}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {/* Header sticky */}
          <SiteHeader />

          {/* Partie scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
            <h1 className="text-2xl font-bold mb-6">Catalogue des produits</h1>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <div key={product.id}>
                  <Dialog
                    open={selectedProduct === product.id}
                    onOpenChange={(open) => {
                      setSelectedProduct(open ? product.id : null)
                      if (!open) {
                        setIsEditing(false)
                        setImagePreview(null)
                      }
                    }}
                  >
                    {/* Card triggers the dialog */}
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={400}
                          height={250}
                          className="h-48 w-full object-cover"
                        />
                        <CardContent className="p-4 space-y-2">
                          <h2 className="font-semibold text-lg">
                            {product.name}
                          </h2>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
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

                    {/* Dialog content */}
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {isEditing ? "Modifier le produit" : currentProduct?.name}
                        </DialogTitle>
                      </DialogHeader>

                      {!isEditing ? (
                        // Mode Affichage
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Image */}
                          <div>
                            <Image
                              src={currentProduct?.image || ""}
                              alt={currentProduct?.name || ""}
                              width={400}
                              height={300}
                              className="object-cover rounded w-full"
                            />
                          </div>

                          {/* Informations */}
                          <div className="flex flex-col justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-semibold">Catégorie:</span>{" "}
                                {currentProduct?.category}
                              </p>
                              <p className="text-sm text-muted-foreground mb-4">
                                {currentProduct?.description}
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

                            {/* Buttons section */}
                            <div className="space-y-2">
                              <Button className="w-full" size="sm">
                                Ajouter au panier
                              </Button>

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
                        // Mode Édition
                        <div className="space-y-4 py-2">
                          {/* Nom du produit */}
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

                          {/* Catégorie */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-category">Catégorie</Label>
                            <Select
                              value={editForm.category}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                {productsList.categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Description */}
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

                          {/* Prix et Stock */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-price">Prix</Label>
                              <Input
                                id="edit-price"
                                name="price"
                                type="number"
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

                          {/* Image Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-image">Photo du produit</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="edit-image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
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
                            {imagePreview && (
                              <div className="mt-2 border rounded-lg overflow-hidden">
                                <Image
                                  src={imagePreview}
                                  alt="Preview"
                                  width={400}
                                  height={200}
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Boutons d'action */}
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
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}