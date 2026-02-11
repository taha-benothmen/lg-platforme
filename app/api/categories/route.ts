import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received data:", body)
    
    const { name, description } = body

    if (!name || name.trim() === "") {
      console.log("Name is missing or empty")
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    console.log("Checking if category exists:", name)
    
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() },
    })

    if (existingCategory) {
      console.log("Category already exists:", existingCategory)
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      )
    }

    console.log("Creating category...")
    
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    console.log("Category created successfully:", category)
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const categoryId = parseInt(id, 10)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      )
    }

    console.log("Checking if category exists:", categoryId)

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (category.products.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category. It contains ${category.products.length} product(s). Please delete or reassign these products first.` 
        },
        { status: 409 }
      )
    }

    console.log("Deleting category...")

    const deletedCategory = await prisma.category.delete({
      where: { id: categoryId },
    })

    console.log("Category deleted successfully:", deletedCategory)

    return NextResponse.json(
      { message: "Category deleted successfully", category: deletedCategory },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}