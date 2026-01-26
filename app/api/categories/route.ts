import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Récupérer toutes les catégories
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

// POST - Créer une nouvelle catégorie
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
    
    // Vérifier si la catégorie existe déjà
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