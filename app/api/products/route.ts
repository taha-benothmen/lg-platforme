import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const categoryId = searchParams.get("categoryId")
    const skip = (page - 1) * limit
    const where: any = {}
    if (categoryId && categoryId !== "all") {
      where.categoryId = parseInt(categoryId)
    }

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

    const total = await prisma.product.count({ where })

    const productsWithImages = products.map((product: any, index: number) => {
      let imageDataUrl = null

      if (product.image) {
        try {
          if (Buffer.isBuffer(product.image)) {
            const base64String = product.image.toString('base64')
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
        stock: product.stock, 
        image: imageDataUrl,
        imageType: product.imageType,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.category,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }
    })
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
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

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

    if (!name || !price || !stock) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
        { status: 400 }
      )
    }

    if (stock !== "DISPONIBLE" && stock !== "HORS_STOCK") {
      return NextResponse.json(
        { error: "Stock must be DISPONIBLE or HORS_STOCK" },
        { status: 400 }
      )
    }

    let imageBuffer: Buffer | null = null
    let imageType: string | null = null

    if (imageFile && imageFile.size > 0) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
        imageType = imageFile.type 
      } catch (uploadError) {
        console.error("Erreur lors de la conversion:", uploadError)
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 400 }
        )
      }
    }

    let finalCategoryId = categoryId ? parseInt(categoryId) : null

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: finalCategoryId },
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        currency: currency || "TND",
        stock: stock as "DISPONIBLE" | "HORS_STOCK", 
        image: imageBuffer,
        imageType: imageType,
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    })
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
      stock: product.stock, 
      image: imageDataUrl,
      imageType: product.imageType,
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    return NextResponse.json(productWithImage, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}