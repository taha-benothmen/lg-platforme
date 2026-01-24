// app/api/etablissements/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type UserRole = "ADMIN" | "RESPONSABLE" | "ETABLISSEMENT"

// GET - Récupérer tous les utilisateurs ou établissements
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const parentId = searchParams.get("parentId")

  // Si type=users, retourner les utilisateurs
  if (type === "users") {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        { error: "Erreur lors du chargement des utilisateurs" },
        { status: 500 }
      )
    }
  }

  // Retourner les établissements (avec filtrage optionnel par parent)
  try {
    const whereClause: any = {}
    if (parentId) {
      whereClause.parentId = parentId
    }
    
    const etablissements = await prisma.etablissement.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Ajouter les comptages séparément
    const etablissementsWithData = await Promise.all(
      etablissements.map(async (etab) => {
        const usersCount = await prisma.user.count({
          where: { etablissementId: etab.id },
        })
        const childrenCount = await prisma.etablissement.count({
          where: { parentId: etab.id },
        })
        
        return {
          ...etab,
          _count: {
            users: usersCount,
            children: childrenCount,
          },
        }
      })
    )

    return NextResponse.json(etablissementsWithData)
  } catch (error) {
    console.error("Error fetching etablissements:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des établissements" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur ou établissement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    // Si type=user, créer un utilisateur
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

    // Sinon créer un établissement
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