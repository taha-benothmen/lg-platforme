import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ OPTIMIZED: GET with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const categoryId = searchParams.get("categoryId")

    console.log(`📦 API Request: Page ${page}, Limit ${limit}, Category: ${categoryId || "all"}`)

    // Calculate skip
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (categoryId && categoryId !== "all") {
      where.categoryId = parseInt(categoryId)
    }

    // ✅ OPTIMIZED: Only fetch products for current page
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
    })

    // Get total count for pagination
    const total = await prisma.product.count({ where })

    // ✅ Convert images for the page
    const productsWithImages = products.map((product: any, index: number) => {
      let imageDataUrl = null

      if (product.image) {
        try {
          // Prisma renvoie les Bytes comme Buffer
          if (Buffer.isBuffer(product.image)) {
            const base64String = product.image.toString('base64')

            // Si imageType est null, essayer de le détecter
            let mimeType = product.imageType
            if (!mimeType && product.image.length >= 4) {
              const header = product.image.slice(0, 4).toString('hex')
              if (header.startsWith('ffd8ff')) mimeType = 'image/jpeg'
              else if (header.startsWith('89504e47')) mimeType = 'image/png'
              else if (header.startsWith('47494638')) mimeType = 'image/gif'
              else if (header.startsWith('52494646')) mimeType = 'image/webp'
              else mimeType = 'image/jpeg'
            }

            imageDataUrl = `data:${mimeType};base64,${base64String}`
          }
        } catch (e) {
          console.error(`Erreur conversion image ${product.name}:`, e)
        }
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price.toString()),
        currency: product.currency,
        stock: product.stock, // ✅ Enum: "DISPONIBLE" | "HORS_STOCK"
        image: imageDataUrl,
        imageType: product.imageType,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.category,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }
    })

    console.log(`✅ Loaded ${products.length} products (Page ${page}/${Math.ceil(total / limit)}, Total: ${total})`)

    return NextResponse.json({
      data: productsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau produit avec upload d'image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = formData.get("price") as string
    const currency = (formData.get("currency") as string) || "TND"
    const stock = formData.get("stock") as string // ✅ Enum: "DISPONIBLE" | "HORS_STOCK"
    const categoryId = formData.get("categoryId") as string
    const imageFile = formData.get("image") as File | null

    // Validation
    if (!name || !price || !stock) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
        { status: 400 }
      )
    }

    // ✅ Validation de l'enum stock
    if (stock !== "DISPONIBLE" && stock !== "HORS_STOCK") {
      return NextResponse.json(
        { error: "Stock must be DISPONIBLE or HORS_STOCK" },
        { status: 400 }
      )
    }

    let imageBuffer: Buffer | null = null
    let imageType: string | null = null

    // Convertir l'image en Buffer (Bytes)
    if (imageFile && imageFile.size > 0) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
        imageType = imageFile.type // ex: "image/png", "image/jpeg"
        console.log(`✅ Image convertie: ${imageFile.name} (${imageType}, ${imageBuffer.length} bytes)`)
      } catch (uploadError) {
        console.error("❌ Erreur lors de la conversion:", uploadError)
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 400 }
        )
      }
    }

    // Gérer la catégorie
    let finalCategoryId = categoryId ? parseInt(categoryId) : null

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
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

    // ✅ Créer le produit avec stock comme enum (PAS de parseInt)
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        currency: currency || "TND",
        stock: stock as "DISPONIBLE" | "HORS_STOCK", // ✅ Cast explicite de l'enum
        image: imageBuffer,
        imageType: imageType,
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    })

    // Convertir pour la réponse
    let imageDataUrl = null
    if (product.image && product.imageType) {
      try {
        const base64String = Buffer.isBuffer(product.image)
          ? product.image.toString('base64')
          : product.image
        imageDataUrl = `data:${product.imageType};base64,${base64String}`
      } catch (e) {
        console.error("Error converting image for response:", e)
      }
    }

    const productWithImage = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      currency: product.currency,
      stock: product.stock, // ✅ Enum
      image: imageDataUrl,
      imageType: product.imageType,
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    console.log(`✅ Produit créé: ${product.name}`)
    return NextResponse.json(productWithImage, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}