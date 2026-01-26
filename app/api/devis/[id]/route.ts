import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"



async function validateUserAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, etablissementId: true, role: true },
  })

  if (!user) {
    return { valid: false, error: "Utilisateur non trouvé" }
  }

  if (!user.etablissementId) {
    return { valid: false, error: "Aucun établissement associé" }
  }

  return { valid: true, user }
}

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

/* ================= GET ================= */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID du devis manquant", success: false },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis", success: false },
        { status: 400 }
      )
    }

    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id },
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

    /*if (devis.etablissementId !== userValidation.user.etablissementId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }*/

    return NextResponse.json(
      { success: true, data: formatDevisResponse(devis) },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching devis:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID du devis manquant", success: false },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { userId, status } = body

    if (!userId || !status) {
      return NextResponse.json(
        { error: "userId et status obligatoires", success: false },
        { status: 400 }
      )
    }

    // Validate user exists and has an establishment
    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    // Validate status
    const validStatuses = [
      "EN_ATTENTE",
      "ENVOYE",
      "APPROUVE",
      "SUSPENDU",
      "REJETE",
      "ACCEPTE",
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide", success: false },
        { status: 400 }
      )
    }

    // Fetch devis with all necessary data
    const devis = await prisma.devis.findUnique({
      where: { id },
      select: {
        id: true,
        etablissementId: true,
        //status: true,
      },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé", success: false },
        { status: 404 }
      )
    }

    // Check if user has access to this devis (same establishment)
    /*if (devis.etablissementId !== userValidation.user.etablissementId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }*/

    // Update the devis
    const updatedDevis = await prisma.devis.update({
      where: { id },
      data: {
        responsableStatus: status,
        validatedById: userId,
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
  } catch (error: any) {
    console.error("Error updating devis:", error)
    return NextResponse.json(
      { error: error.message || "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}

/* ================= DELETE ================= */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID du devis manquant", success: false },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis", success: false },
        { status: 400 }
      )
    }

    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        { status: 404 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id },
      select: {
        responsableStatus: true,
        etablissementId: true,
      },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé", success: false },
        { status: 404 }
      )
    }

    /*if (devis.etablissementId !== userValidation.user.etablissementId) {
      return NextResponse.json(
        { error: "Accès non autorisé", success: false },
        { status: 403 }
      )
    }*/

    if (devis.responsableStatus !== "EN_ATTENTE") {
      return NextResponse.json(
        {
          error: "Seuls les devis en EN_ATTENTE peuvent être supprimés",
          success: false,
        },
        { status: 400 }
      )
    }

    await prisma.devis.delete({
      where: { id },
    })

    return NextResponse.json(
      { success: true, message: "Devis supprimé avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting devis:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}