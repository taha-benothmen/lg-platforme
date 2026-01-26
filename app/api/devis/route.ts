import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

type DevisPayload = {
  userId: string
  client: {
    nom: string
    prenom: string
    entreprise?: string
    email: string
    telephone: string
    adresse: string
    codePostal: string
    ville: string
    notes?: string
  }
  products: Array<{
    id: number
    name: string
    description: string
    price: number
    currency: string
    quantity: number
    stock: number
  }>
  total: number
}

// Validate user access with admin support
async function validateUserAccess(userId: string) {
  if (!userId || userId.trim() === "") {
    return { valid: false, error: "userId is required" }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, etablissementId: true },
  })

  if (!user) {
    return { valid: false, error: "User not found" }
  }

  if (user.role === "ADMIN") {
    return { valid: true, user, isAdmin: true }
  }

  if (!user.etablissementId) {
    return { valid: false, error: "No establishment associated with this user" }
  }

  return { valid: true, user, isAdmin: false }
}

// Get all child establishment IDs recursively
async function getAllChildEstablishmentIds(parentId: string): Promise<string[]> {
  const children = await prisma.etablissement.findMany({
    where: { parentId: parentId },
    select: { id: true },
  })

  let allIds = children.map(c => c.id)

  for (const child of children) {
    const grandchildren = await getAllChildEstablishmentIds(child.id)
    allIds = [...allIds, ...grandchildren]
  }

  return allIds
}

// Format devis response
function formatDevisResponse(devis: any, includeItems: boolean = false) {
  return {
    id: devis.id,
    clientName: devis.clientName,
    clientEmail: devis.clientEmail,
    clientPhone: devis.clientPhone,
    clientAddr: devis.clientAddr,
    clientEnterprise: devis.clientEnterprise,
    clientNotes: devis.clientNotes,
    total: devis.total.toString(),
    responsableStatus: devis.responsableStatus,
    adminStatus: devis.adminStatus,
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
    adminValidatedBy: devis.adminValidatedBy
      ? {
          id: devis.adminValidatedBy.id,
          firstName: devis.adminValidatedBy.firstName,
          lastName: devis.adminValidatedBy.lastName,
        }
      : null,
    etablissement: devis.etablissement
      ? {
          id: devis.etablissement.id,
          name: devis.etablissement.name,
        }
      : null,
    createdAt: devis.createdAt,
    updatedAt: devis.updatedAt,
    ...(includeItems && { items: devis.items }),
  }
}

// GET - Retrieve quotes with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responsableStatus = searchParams.get("responsableStatus")
    const adminStatus = searchParams.get("adminStatus")
    const devisId = searchParams.get("id")
    const userId = searchParams.get("userId")
    const etablissementFilter = searchParams.get("etablissementId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", success: false },
        { status: 400 }
      )
    }

    // Validate user
    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
        
      )
    }

    const { user, isAdmin } = userValidation as any

    // Determine establishment filter
    let etablissementIds: string[] = []

    if (isAdmin) {
      etablissementIds = []
    } else {
      const userEtab = await prisma.etablissement.findUnique({
        where: { id: user.etablissementId },
        select: { id: true, parentId: true },
      })

      if (!userEtab) {
        return NextResponse.json(
          { error: "Establishment not found", success: false },
          { status: 404 }
        )
      }

      if (userEtab.parentId) {
        etablissementIds = [user.etablissementId]
      } else {
        etablissementIds = [user.etablissementId]
        const childIds = await getAllChildEstablishmentIds(user.etablissementId)
        etablissementIds = [...etablissementIds, ...childIds]
      }
    }

    // Get specific devis if ID provided
    if (devisId) {
      const devis = await prisma.devis.findUnique({
        where: { id: devisId },
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
          adminValidatedBy: {
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
          { error: "Devis not found", success: false },
          { status: 404 }
        )
      }

      if (!isAdmin && !etablissementIds.includes(devis.etablissementId)) {
        return NextResponse.json(
          { error: "Unauthorized access", success: false },
          { status: 403 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: formatDevisResponse(devis, true),
        },
        { status: 200 }
      )
    }

    // Get all devis with filters
    const whereClause: any = {}

    if (!isAdmin && etablissementIds.length > 0) {
      whereClause.etablissementId = {
        in: etablissementIds,
      }
    }

    if (responsableStatus && responsableStatus !== "ALL") {
      whereClause.responsableStatus = responsableStatus
    }

    if (adminStatus && adminStatus !== "ALL") {
      whereClause.adminStatus = adminStatus
    }

    if (etablissementFilter && etablissementFilter !== "ALL" && !isAdmin) {
      whereClause.etablissementId = etablissementFilter
    }

    const devis = await prisma.devis.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
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
        adminValidatedBy: {
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: devis.map((d) => formatDevisResponse(d)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error retrieving devis:", error)
    return NextResponse.json(
      {
        error: "Server error while retrieving devis",
        success: false,
      },
      { status: 500 }
    )
  }
}

// POST - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const body: DevisPayload = await request.json()

    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required", success: false },
        { status: 400 }
      )
    }

    if (!body.client || !body.products || body.products.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid data - client and products are required",
          success: false,
        },
        { status: 400 }
      )
    }

    const userValidation = await validateUserAccess(body.userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
      )
    }

    const { user } = userValidation as any

    let totalAmount: Decimal
    try {
      totalAmount = new Decimal(body.total.toString())
      if (totalAmount.lessThan(0)) {
        return NextResponse.json(
          { error: "Total cannot be negative", success: false },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid total amount", success: false },
        { status: 400 }
      )
    }

    const clientErrors = []
    if (!body.client.nom?.trim())
      clientErrors.push("Client last name is required")
    if (!body.client.prenom?.trim())
      clientErrors.push("Client first name is required")
    if (!body.client.email?.trim())
      clientErrors.push("Client email is required")
    if (!body.client.telephone?.trim())
      clientErrors.push("Client phone is required")

    if (clientErrors.length > 0) {
      return NextResponse.json(
        { error: clientErrors.join(", "), success: false },
        { status: 400 }
      )
    }

    const productIds = body.products.map((p) => p.id)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, price: true },
    })

    if (dbProducts.length !== body.products.length) {
      const foundIds = dbProducts.map((p) => p.id)
      const missingIds = productIds.filter((id) => !foundIds.includes(id))
      return NextResponse.json(
        {
          error: `Products not found: ${missingIds.join(", ")}`,
          success: false,
        },
        { status: 400 }
      )
    }

    const stockErrors = []
    for (const product of body.products) {
      const dbProduct = dbProducts.find((p) => p.id === product.id)
      if (dbProduct && dbProduct.stock < product.quantity) {
        stockErrors.push(
          `Insufficient stock for ${dbProduct.name} (available: ${dbProduct.stock}, requested: ${product.quantity})`
        )
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        { error: stockErrors.join(" | "), success: false },
        { status: 400 }
      )
    }

    const devis = await prisma.devis.create({
      data: {
        clientName: `${body.client.prenom.trim()} ${body.client.nom.trim()}`,
        clientEmail: body.client.email.trim(),
        clientPhone: body.client.telephone.trim(),
        clientAddr: `${body.client.adresse}, ${body.client.codePostal} ${body.client.ville}`,
        clientEnterprise: body.client.entreprise?.trim() || null,
        clientNotes: body.client.notes?.trim() || null,
        total: totalAmount,
        responsableStatus: "EN_ATTENTE",
        adminStatus: "EN_ATTENTE",
        createdById: body.userId,
        etablissementId: user.etablissementId,
        items: {
          create: body.products.map((product) => {
            const dbProduct = dbProducts.find((p) => p.id === product.id)
            return {
              productId: product.id,
              quantity: product.quantity,
              price: new Decimal(dbProduct?.price.toString() || product.price.toString()),
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        etablissement: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis created successfully",
        data: formatDevisResponse(devis, true),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating devis:", error)
    return NextResponse.json(
      {
        error: "Server error while creating devis",
        success: false,
      },
      { status: 500 }
    )
  }
}

// PUT - Update devis status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { devisId, userId, responsableStatus, adminStatus } = body

    if (!devisId || !userId || (!responsableStatus && !adminStatus)) {
      return NextResponse.json(
        {
          error: "devisId, userId, and either responsableStatus or adminStatus are required",
          success: false,
        },
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

    const { isAdmin } = userValidation as any

    const validResponsableStatuses = [
      "EN_ATTENTE",
      "APPROUVE",
      "SUSPENDU",
      "REJETE",
    ]

    const validAdminStatuses = [
      "EN_ATTENTE",
      "REJETE",
      "APPROUVE",
    ]

    if (responsableStatus && !validResponsableStatuses.includes(responsableStatus)) {
      return NextResponse.json(
        {
          error: `Invalid responsable status. Valid statuses: ${validResponsableStatuses.join(", ")}`,
          success: false,
        },
        { status: 400 }
      )
    }

    if (adminStatus && !validAdminStatuses.includes(adminStatus)) {
      return NextResponse.json(
        {
          error: `Invalid admin status. Valid statuses: ${validAdminStatuses.join(", ")}`,
          success: false,
        },
        { status: 400 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      select: { createdById: true, responsableStatus: true, adminStatus: true, etablissementId: true },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis not found", success: false },
        { status: 404 }
      )
    }

    if (!isAdmin && devis.createdById !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access", success: false },
        { status: 403 }
      )
    }

    const validResponsableTransitions: Record<string, string[]> = {
      EN_ATTENTE: ["APPROUVE", "SUSPENDU", "REJETE"], 
      APPROUVE: ["SUSPENDU", "REJETE"],
      SUSPENDU: ["APPROUVE", "REJETE"],
      REJETE: [],
    }

    const validAdminTransitions: Record<string, string[]> = {
      EN_ATTENTE: ["APPROUVE", "REJETE"],
      VALIDE: ["APPROUVE", "REJETE"],
      REJETE: [],
      APPROUVE: [],
    }

    if (responsableStatus && !validResponsableTransitions[devis.responsableStatus]?.includes(responsableStatus)) {
      return NextResponse.json(
        {
          error: `Invalid responsable status transition: ${devis.responsableStatus} → ${responsableStatus}`,
          success: false,
        },
        { status: 400 }
      )
    }

    if (adminStatus && !validAdminTransitions[devis.adminStatus]?.includes(adminStatus)) {
      return NextResponse.json(
        {
          error: `Invalid admin status transition: ${devis.adminStatus} → ${adminStatus}`,
          success: false,
        },
        { status: 400 }
      )
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (responsableStatus) {
      updateData.responsableStatus = responsableStatus
      if (responsableStatus === "APPROUVE") {
        updateData.validatedById = userId
      }
    }

    if (adminStatus) {
      updateData.adminStatus = adminStatus
      if (adminStatus === "VALIDE") {
        updateData.adminValidatedById = userId
      }
    }

    const updatedDevis = await prisma.devis.update({
      where: { id: devisId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        validatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        adminValidatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        etablissement: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis updated successfully",
        data: formatDevisResponse(updatedDevis, true),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating devis:", error)
    return NextResponse.json(
      {
        error: "Server error while updating devis",
        success: false,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a devis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devisId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!devisId || !userId) {
      return NextResponse.json(
        { error: "Devis ID and userId are required", success: false },
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

    const { isAdmin } = userValidation as any

    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      select: { responsableStatus: true, createdById: true },
    })

    if (!devis) {
      return NextResponse.json(
        { error: "Devis not found", success: false },
        { status: 404 }
      )
    }

    if (!isAdmin && devis.createdById !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access", success: false },
        { status: 403 }
      )
    }

    if (devis.responsableStatus !== "EN_ATTENTE") {
      return NextResponse.json(
        {
          error: "Only draft devis can be deleted",
          success: false,
        },
        { status: 400 }
      )
    }

    await prisma.devis.delete({
      where: { id: devisId },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting devis:", error)
    return NextResponse.json(
      {
        error: "Server error while deleting devis",
        success: false,
      },
      { status: 500 }
    )
  }
}