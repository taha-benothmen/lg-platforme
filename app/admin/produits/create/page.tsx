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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Trash2 } from "lucide-react"

export default function CreateProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "TND",
    stock: "DISPONIBLE",
    category: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)

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
      setImageFile(file)
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

  const handleAddNewCategory = async () => {
    if (newCategory.trim()) {
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newCategory.trim() }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create category")
        }

        const createdCategory = await response.json()
        setCategories([...categories, createdCategory])
        setForm({ ...form, category: createdCategory.name })
        setShowNewCategory(false)
        setNewCategory("")
        setSuccessMessage("Catégorie créée avec succès!")
        setError("")
        setTimeout(() => setSuccessMessage(""), 3000)
      } catch (err: any) {
        console.error("Error creating category:", err)
        setError(err.message || "Erreur lors de la création de la catégorie")
        setSuccessMessage("")
      }
    }
  }

  const handleDeleteCategory = async (e: React.MouseEvent, categoryId: number, categoryName: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}"?`)) {
      return
    }

    setDeletingCategoryId(categoryId)
    setError("")

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete category")
      }

      setCategories(categories.filter((cat) => cat.id !== categoryId))
            if (form.category === categoryName) {
        setForm({ ...form, category: "" })
      }

      setSuccessMessage("Catégorie supprimée avec succès!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      console.error("Error deleting category:", err)
      setError(err.message || "Erreur lors de la suppression de la catégorie")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")
    console.log("FormData entries:")
    for (const pair of Object.entries(form)) {
      console.log(pair[0], pair[1])
    }
    
    try {
      if (!form.name || !form.price || !form.stock || !form.category) {
        throw new Error("Veuillez remplir tous les champs obligatoires")
      }

      if (!imageFile) {
        throw new Error("Veuillez sélectionner une image")
      }
      const formData = new FormData()
      formData.append("name", form.name)
      formData.append("description", form.description)
      formData.append("price", form.price)
      formData.append("currency", form.currency)
      formData.append("stock", form.stock)
      formData.append("image", imageFile)

      const selectedCategory = categories.find((cat) => cat.name === form.category)
      if (selectedCategory) {
        formData.append("categoryId", selectedCategory.id.toString())
      } else {
        formData.append("categoryName", form.category)
      }


      const response = await fetch("/api/products", {
        method: "POST",
        body: formData, // Envoyer FormData directement
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create product")
      }

      const createdProduct = await response.json()

      setSuccessMessage("Produit créé avec succès! Redirection...")
      setError("")
      setTimeout(() => {
        router.push("/admin/produits")
      }, 2000)
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
            <div className="space-y-6 w-full max-w-2xl bg-white p-6 rounded shadow">
              <h1 className="text-2xl font-bold mb-6 text-center">Créer un produit</h1>

              {/* Success Alert */}
              {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

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
                  <Select onValueChange={handleCategoryChange} value={form.category} required>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <div key={cat.id} className="flex items-center justify-between px-2 py-1 group">
                          <SelectItem value={cat.name} className="flex-1">
                            {cat.name}
                          </SelectItem>
                          <button
                            onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                            disabled={deletingCategoryId === cat.id}
                            className="ml-2 p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 disabled:opacity-50 transition"
                            title="Supprimer cette catégorie"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <SelectItem value="new">➕ Créer une nouvelle catégorie</SelectItem>
                    </SelectContent>
                  </Select>
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
                      step="0.01"
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
                  <Label htmlFor="stock" className="mb-2 block">Stock 📦</Label>
                  <Select
                    value={form.stock}
                    onValueChange={(value) => setForm({ ...form, stock: value })}
                    required
                  >
                    <SelectTrigger className="flex">
                      <SelectValue placeholder="Sélectionner le stock" className="flex-1 rounded-r-md" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISPONIBLE">DISPONIBLE</SelectItem>
                      <SelectItem value="HORS_STOCK">HORS_STOCK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image" className="mb-2 block">Photo du produit *</Label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="mb-2 w-full rounded border border-gray-300 bg-gray-100 p-2 cursor-pointer"
                  onChange={handleFileChange}
                  required
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="max-h-64 object-contain border rounded" />
                    <p className="text-sm text-gray-600 mt-2">Image sélectionnée: {imageFile?.name}</p>
                  </div>
                )}
              </div>

              <Button onClick={handleSubmit} className="mt-4 w-full" disabled={loading}>
                {loading ? "Création en cours..." : "Créer le produit"}
              </Button>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}