import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type UserRole = "ADMIN" | "RESPONSABLE" | "ETABLISSEMENT"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const parentId = searchParams.get("parentId")
  const userId = searchParams.get("userId")
  
  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  // ✅ OPTIMIZED: If type=users, return ONLY users with pagination (no count aggregations)
  if (type === "users") {
    try {
      const skip = (page - 1) * limit
      
      // ✅ Single count query for total
      const total = await prisma.user.count()

      // ✅ Single fetch query with LIMIT/OFFSET
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      })

      console.log(`📊 Users API: Page ${page}/${Math.ceil(total / limit)}, Total: ${total}, Loaded: ${users.length}`)

      return NextResponse.json({
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        { error: "Erreur lors du chargement des utilisateurs" },
        { status: 500 }
      )
    }
  }

  // ✅ HIERARCHICAL LOGIC FOR ÉTABLISSEMENTS (WITHOUT COUNTS!)
  try {
    // If parentId is provided, return children of this parent
    if (parentId && parentId !== "null") {
      const etablissements = await prisma.etablissement.findMany({
        where: {
          parentId: parentId,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`📊 Établissements API (children): Loaded ${etablissements.length} for parent ${parentId}`)

      return NextResponse.json(etablissements)
    }

    // If userId is provided, get user's établissement logic
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementId: true },
      })

      if (!user || !user.etablissementId) {
        return NextResponse.json([])
      }

      const userEtab = await prisma.etablissement.findUnique({
        where: { id: user.etablissementId },
        select: { id: true, name: true, parentId: true },
      })

      if (!userEtab) {
        return NextResponse.json([])
      }

      // If user's établissement has a parentId (it's a child), return only it
      if (userEtab.parentId) {
        return NextResponse.json([
          {
            id: userEtab.id,
            name: userEtab.name,
            parentId: userEtab.parentId,
          },
        ])
      }

      // If user's établissement has no parentId (it's a parent), return all children
      const childEtablissements = await prisma.etablissement.findMany({
        where: {
          parentId: userEtab.id,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`📊 Établissements API (user): Loaded ${childEtablissements.length}`)

      return NextResponse.json(childEtablissements)
    }

    // ✅ DEFAULT: Return all établissements (WITHOUT expensive counts!)
    // This is called ONCE on page load
    const allEtablissements = await prisma.etablissement.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`📊 Établissements API: Loaded ${allEtablissements.length} établissements (NO counts)`)

    return NextResponse.json(allEtablissements)
  } catch (error) {
    console.error("Error fetching établissements:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des établissements" },
      { status: 500 }
    )
  }
}

// POST - Create user or établissement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    // If type=user, create a user
    if (type === "user") {
      const {
        email,
        firstName,
        lastName,
        phone,
        role,
        password,
        etablissementId,
      } = body

      if (!email || !password || !role) {
        return NextResponse.json(
          { error: "Email, password et role sont obligatoires" },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Cet email existe déjà" },
          { status: 400 }
        )
      }

      const validRoles: UserRole[] = ["ADMIN", "RESPONSABLE", "ETABLISSEMENT"]
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        )
      }

      // For RESPONSABLE and ETABLISSEMENT, etablissementId is required
      if ((role === "RESPONSABLE" || role === "ETABLISSEMENT") && !etablissementId) {
        return NextResponse.json(
          { error: `Un établissement est obligatoire pour le rôle ${role}` },
          { status: 400 }
        )
      }

      const user = await prisma.user.create({
        data: {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          role,
          isActive: true,
          etablissementId: etablissementId || undefined,
        },
      })

      return NextResponse.json(user, { status: 201 })
    }

    // Otherwise create an établissement
    const { name, address, email, phone, parentId } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: "Nom et adresse sont obligatoires" },
        { status: 400 }
      )
    }

    const etablissement = await prisma.etablissement.create({
      data: {
        name,
        address,
        email: email || undefined,
        phone: phone || undefined,
        parentId: parentId || undefined,
        isActive: true,
      },
    })

    return NextResponse.json(etablissement, { status: 201 })
  } catch (error) {
    console.error("Error creating:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    )
  }
}