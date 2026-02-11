import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

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

    return NextResponse.json(productWithImage)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const formData = await request.formData()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = formData.get("price") as string
    const currency = formData.get("currency") as string
    const stock = formData.get("stock") as string
    const categoryId = formData.get("categoryId") as string
    const imageFile = formData.get("image") as File | null

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (price) updateData.price = parseFloat(price)
    if (currency) updateData.currency = currency
    if (stock !== undefined) updateData.stock = parseInt(stock)
    if (categoryId) {
      const catId = parseInt(categoryId)
      const categoryExists = await prisma.category.findUnique({
        where: { id: catId },
      })
      if (!categoryExists) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        )
      }
      updateData.categoryId = catId
    }

    if (imageFile && imageFile.size > 0) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)
        updateData.image = imageBuffer
        updateData.imageType = imageFile.type
      } catch (uploadError) {
        console.error("Erreur lors de la conversion:", uploadError)
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    })

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

    return NextResponse.json(productWithImage)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }
    await prisma.product.delete({
      where: { id: productId },
    })
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}