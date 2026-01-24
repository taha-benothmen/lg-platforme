// app/api/devis/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

// Helper function to validate user access
async function validateUserAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, etablissementId: true },
  })

  if (!user) {
    return { valid: false, error: "Utilisateur non trouvé" }
  }

  if (!user.etablissementId) {
    return { valid: false, error: "Aucun établissement associé" }
  }

  return { valid: true, user }
}

// Helper function to format devis response
function formatDevisResponse(devis: any) {
  return {
    id: devis.id,
    clientName: devis.clientName,
    clientEmail: devis.clientEmail,
    clientPhone: devis.clientPhone,
    clientAddr: devis.clientAddr,
    clientEnterprise: devis.clientEnterprise,
    clientNotes: devis.clientNotes,
    total: devis.total.toString(),
    status: devis.status,
    itemsCount: devis.items?.length || 0,
    createdBy: devis.createdBy
      ? {
          id: devis.createdBy.id,
          firstName: devis.createdBy.firstName,
          lastName: devis.createdBy.lastName,
          email: devis.createdBy.email,
        }
      : null,
    validatedBy: devis.validatedBy
      ? {
          id: devis.validatedBy.id,
          firstName: devis.validatedBy.firstName,
          lastName: devis.validatedBy.lastName,
        }
      : null,
    items: devis.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price.toString(),
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            price: item.product.price.toString(),
            currency: item.product.currency,
            image: item.product.image,
            category: item.product.category,
          }
        : null,
    })),
    etablissement: devis.etablissement
      ? {
          id: devis.etablissement.id,
          name: devis.etablissement.name,
          address: devis.etablissement.address,
          phone: devis.etablissement.phone,
          email: devis.etablissement.email,
        }
      : null,
    createdAt: devis.createdAt,
    updatedAt: devis.updatedAt,
  }
}

// GET - Récupérer un devis spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis", success: false },
        { status: 400 }
      )
    }

    // Validate user
    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                currency: true,
                image: true,
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        etablissement: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé", success: false },
        { status: 404 }
      )
    }

    // Verify user has access to this devis
    if (devis.createdById !== userId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: formatDevisResponse(devis),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur lors de la récupération du devis:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un devis
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, status, validatedById } = body

    if (!userId || !status) {
      return NextResponse.json(
        { error: "userId et status sont obligatoires", success: false },
        { status: 400 }
      )
    }

    // Validate user
    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    const validStatuses = [
      "BROUILLON",
      "ENVOYE",
      "APPROUVE",
      "SUSPENDU",
      "REJETE",
      "ACCEPTE",
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Statut invalide. Statuts valides: ${validStatuses.join(", ")}`,
          success: false,
        },
        { status: 400 }
      )
    }

    // Verify that the devis exists
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      select: { createdById: true, status: true },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé", success: false },
        { status: 404 }
      )
    }

    // Verify ownership
    if (devis.createdById !== userId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      BROUILLON: ["ENVOYE", "REJETE"],
      ENVOYE: ["APPROUVE", "SUSPENDU", "REJETE"],
      APPROUVE: ["ACCEPTE", "SUSPENDU"],
      SUSPENDU: ["ENVOYE", "REJETE"],
      REJETE: [],
      ACCEPTE: [],
    }

    if (!validTransitions[devis.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Transition de statut invalide: ${devis.status} → ${status}`,
          success: false,
        },
        { status: 400 }
      )
    }

    const updatedDevis = await prisma.devis.update({
      where: { id: params.id },
      data: {
        status,
        validatedById: validatedById || undefined,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                currency: true,
                image: true,
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        etablissement: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis mis à jour avec succès",
        data: formatDevisResponse(updatedDevis),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur lors de la mise à jour du devis:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un devis
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis", success: false },
        { status: 400 }
      )
    }

    // Validate user
    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      select: { status: true, createdById: true },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé", success: false },
        { status: 404 }
      )
    }

    // Verify ownership
    if (devis.createdById !== userId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }

    // Seuls les devis en brouillon peuvent être supprimés
    if (devis.status !== "BROUILLON") {
      return NextResponse.json(
        {
          error: "Seuls les devis en brouillon peuvent être supprimés",
          success: false,
        },
        { status: 400 }
      )
    }

    await prisma.devis.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis supprimé avec succès",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur lors de la suppression du devis:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}