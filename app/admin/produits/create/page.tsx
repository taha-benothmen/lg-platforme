"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CreateProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "TND",
    stock: "",
    image: "",
    category: "",
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Charger les catégories depuis l'API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm({ ...form, image: file.name })
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setShowNewCategory(true)
      setForm({ ...form, category: "" })
    } else {
      setShowNewCategory(false)
      setForm({ ...form, category: value })
    }
  }

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      setForm({ ...form, category: newCategory })
      setShowNewCategory(false)
      setNewCategory("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Préparer les données
      const productData: any = {
        name: form.name,
        description: form.description,
        price: form.price,
        currency: form.currency,
        stock: form.stock,
        image: form.image,
      }

      // Si c'est une nouvelle catégorie, utiliser categoryName, sinon categoryId
      if (showNewCategory && newCategory) {
        productData.categoryName = newCategory
      } else if (form.category) {
        // Trouver l'ID de la catégorie sélectionnée
        const selectedCategory = categories.find((cat) => cat.name === form.category)
        if (selectedCategory) {
          productData.categoryId = selectedCategory.id
        } else {
          // Si la catégorie n'est pas trouvée, utiliser le nom
          productData.categoryName = form.category
        }
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create product")
      }

      const createdProduct = await response.json()
      console.log("Product created:", createdProduct)
      
      // Rediriger vers la liste des produits
      router.push("/admin/produits")
    } catch (err: any) {
      console.error("Error creating product:", err)
      setError(err.message || "Erreur lors de la création du produit")
    } finally {
      setLoading(false)
    }
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
          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 flex justify-center items-start">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 w-full max-w-2xl bg-white p-6 rounded shadow"
            >
              <h1 className="text-2xl font-bold mb-6 text-center">Créer un produit</h1>

              {/* Product Name */}
              <div>
                <Label htmlFor="name" className="mb-2 block">Nom du produit</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-100 text-gray-700">
                    📦
                  </span>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nom du produit"
                    className="rounded-none rounded-r-md flex-1"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="mb-2 block">Catégorie</Label>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <Select onValueChange={handleCategoryChange} value={form.category} required>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">➕ Créer une nouvelle catégorie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nom de la nouvelle catégorie"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddNewCategory} size="sm">
                      Ajouter
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewCategory(false)}
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="mb-2 block">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description du produit"
                  className="mt-1"
                  required
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="mb-2 block">Prix</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-100 text-gray-700">
                      💲
                    </span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Prix"
                      className="rounded-none flex-1"
                      required
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-gray-100 text-gray-700">
                      {form.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock" className="mb-2 block">Stock</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-100 text-gray-700">
                      📦
                    </span>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="Stock disponible"
                      className="rounded-r-md flex-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image" className="mb-2 block">Photo du produit</Label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mb-2 w-full rounded border border-gray-300 bg-gray-100 p-2 cursor-pointer"
                  required
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-64 object-contain border rounded" />
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Création en cours..." : "Créer le produit"}
              </Button>
            </form>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}