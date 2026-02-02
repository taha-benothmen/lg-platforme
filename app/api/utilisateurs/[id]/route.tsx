// File: app/api/utilisateurs/[id]/route.ts
// ✅ RETOURNE L'UTILISATEUR AVEC SON ÉTABLISSEMENT COMPLET

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant", success: false },
        { status: 400 }
      )
    }

    console.log(`🔍 Fetching user data for ID: ${id}`)

    // Récupère l'utilisateur AVEC son établissement complet
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        etablissementId: true,
        createdAt: true,
        updatedAt: true,
        // ✅ RETOURNE L'ÉTABLISSEMENT COMPLET
        etablissement: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            isActive: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!user) {
      console.warn(`⚠️ Utilisateur non trouvé: ${id}`)
      return NextResponse.json(
        { error: "Utilisateur non trouvé", success: false },
        { status: 404 }
      )
    }

    console.log(`✅ Utilisateur chargé: ${user.firstName} ${user.lastName}`)
    if (user.etablissement) {
      console.log(`📦 Établissement: ${user.etablissement.name}`)
    } else {
      console.log(`⚠️ Aucun établissement assigné`)
    }

    return NextResponse.json(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        etablissementId: user.etablissementId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // ✅ L'ÉTABLISSEMENT EST ICI
        etablissement: user.etablissement,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Erreur lors du chargement de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}