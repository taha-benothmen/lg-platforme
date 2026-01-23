// app/api/products/route.ts

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
        id: "desc",
      },
    })

    console.log(`📦 Total produits: ${products.length}`)
    
    // Convertir Bytes (Buffer) en data URLs
    const productsWithImages = products.map((product: any, index: number) => {
      let imageDataUrl = null
      
      console.log(`[${index}] ${product.name}:`)
      console.log(`  - image exists: ${!!product.image}`)
      console.log(`  - imageType: ${product.imageType}`)
      
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
              else mimeType = 'image/jpeg' // Par défaut
              
              console.log(`  ⚠️  imageType NULL - Détecté: ${mimeType}`)
            }
            
            imageDataUrl = `data:${mimeType};base64,${base64String}`
            console.log(`  ✅ Buffer converti en Base64`)
          }
        } catch (e) {
          console.error(`  ❌ Erreur conversion: ${e}`)
        }
      } else {
        console.log(`  ❌ Pas d'image`)
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price.toString()), // Convertir Decimal en number
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

    console.log(`✅ ${products.length} produits chargés avec images`)
    return NextResponse.json(productsWithImages)
  } catch (error) {
    console.error("Error fetching products:", error)
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
    const stock = formData.get("stock") as string
    const categoryId = formData.get("categoryId") as string
    const imageFile = formData.get("image") as File | null

    // Validation
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
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

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        currency: currency || "TND",
        stock: parseInt(stock),
        image: imageBuffer ? imageBuffer.toString('base64') : null, // Stocker directement le Buffer
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    })

    // Convertir pour la réponse
    const productWithImage = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      currency: product.currency,
      stock: product.stock,
      image: product.image && product.imageType
        ? `data:${product.imageType};base64,${product.image.toString('base64')}`
        : null,
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