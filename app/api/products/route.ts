import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Récupérer tous les produits
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau produit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, currency, stock, image, categoryId, categoryName } = body

    // Validation
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
        { status: 400 }
      )
    }

    let finalCategoryId = categoryId

    // Si categoryName est fourni mais pas categoryId, créer ou trouver la catégorie
    if (categoryName && !categoryId) {
      let category = await prisma.category.findUnique({
        where: { name: categoryName },
      })

      if (!category) {
        // Créer la catégorie si elle n'existe pas
        category = await prisma.category.create({
          data: {
            name: categoryName,
          },
        })
      }

      finalCategoryId = category.id
    }

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: "Category ID or Category name is required" },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie existe
    const categoryExists = await prisma.category.findUnique({
      where: { id: finalCategoryId },
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        currency: currency || "TND",
        stock: parseInt(stock),
        image: image || null,
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
