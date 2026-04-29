import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { getAllChildEstablishmentIds } from "@/lib/etablissement-hierarchy"

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

function formatDevisResponse(devis: any, includePdf: boolean = false) {
  const response: any = {
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
    hasInvoicePdf: !!devis.invoicePdf,
    invoicePdfName: devis.invoicePdfName,
    invoicePdfUploadedAt: devis.invoicePdfUploadedAt,
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
  }

  if (devis.items && devis.items.length > 0) {
    response.items = devis.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price.toString(),
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
      } : null,
    }))
  } else {
    response.items = []
  }

  if (includePdf && devis.invoicePdf && devis.invoicePdfType) {
    const base64String = Buffer.isBuffer(devis.invoicePdf)
      ? devis.invoicePdf.toString('base64')
      : devis.invoicePdf
    response.invoicePdfData = `data:${devis.invoicePdfType};base64,${base64String}`
  }

  return response
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responsableStatus = searchParams.get("responsableStatus")
    const adminStatus = searchParams.get("adminStatus")
    const devisId = searchParams.get("id")
    const userId = searchParams.get("userId")
    const etablissementFilter = searchParams.get("etablissementId")
    const includePdf = searchParams.get("includePdf") === "true"
    const downloadPdf = searchParams.get("download") === "true"
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", success: false },
        { status: 400 }
      )
    }

    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json(
        { error: userValidation.error, success: false },
      )
    }

    const { user, isAdmin } = userValidation as any

    if (downloadPdf && devisId) {

      const devis = await prisma.devis.findUnique({
        where: { id: devisId },
        select: {
          id: true,
          invoicePdf: true,
          invoicePdfName: true,
          invoicePdfType: true,
          createdById: true,
        }
      })

      if (!devis) {
        console.warn(`Devis not found: ${devisId}`)
        return NextResponse.json(
          { error: "Devis non trouvé", success: false },
          { status: 404 }
        )
      }

      if (!isAdmin && devis.createdById !== userId) {
        console.warn(`Unauthorized PDF access for devis ${devisId}`)
        return NextResponse.json(
          { error: "Non autorisé", success: false },
          { status: 403 }
        )
      }

      if (!devis.invoicePdf || !devis.invoicePdfName || !devis.invoicePdfType) {
        console.warn(`PDF not available for devis ${devisId}`)
        return NextResponse.json(
          { error: "Facture PDF non disponible", success: false },
          { status: 404 }
        )
      }


      let pdfBuffer: Buffer

      if (Buffer.isBuffer(devis.invoicePdf)) {
        pdfBuffer = devis.invoicePdf
      } else if (typeof devis.invoicePdf === 'string') {
        const pdfStr: string = devis.invoicePdf as string
        if (pdfStr.startsWith("data:")) {
          const base64Data = pdfStr.split(",")[1]
          pdfBuffer = Buffer.from(base64Data, "base64")
        } else {
          pdfBuffer = Buffer.from(pdfStr, "base64")
        }
      } else {
        throw new Error("Invalid PDF data format")
      }


      return new NextResponse(pdfBuffer.toString('base64'), {
        status: 200,
        headers: {
          "Content-Type": devis.invoicePdfType || "application/pdf",
          "Content-Disposition": `attachment; filename="${devis.invoicePdfName}"`,
          "Content-Length": pdfBuffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      })
    }

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
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          validatedBy: { select: { id: true, firstName: true, lastName: true } },
          adminValidatedBy: { select: { id: true, firstName: true, lastName: true } },
          etablissement: { select: { id: true, name: true, address: true, phone: true, email: true } },
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
          data: formatDevisResponse(devis, includePdf),
        },
        { status: 200 }
      )
    }

    const whereClause: any = {}

    if (!isAdmin && etablissementIds.length > 0) {
      whereClause.etablissementId = { in: etablissementIds }
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

    const skip = (page - 1) * limit
    const total = await prisma.devis.count({ where: whereClause })

    const devis = await prisma.devis.findMany({
      where: whereClause,
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true, description: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        validatedBy: { select: { id: true, firstName: true, lastName: true } },
        adminValidatedBy: { select: { id: true, firstName: true, lastName: true } },
        etablissement: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })


    return NextResponse.json(
      {
        success: true,
        data: devis.map((d) => formatDevisResponse(d)),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error retrieving devis:", error)
    return NextResponse.json(
      { error: "Server error while retrieving devis", success: false },
      { status: 500 }
    )
  }
}

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
        { error: "Invalid data - client and products are required", success: false },
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
    if (!body.client.nom?.trim()) clientErrors.push("Client last name is required")
    if (!body.client.prenom?.trim()) clientErrors.push("Client first name is required")
    if (!body.client.email?.trim()) clientErrors.push("Client email is required")
    if (!body.client.telephone?.trim()) clientErrors.push("Client phone is required")

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
        { error: `Products not found: ${missingIds.join(", ")}`, success: false },
        { status: 400 }
      )
    }

    const stockErrors = []
    for (const product of body.products) {
      const dbProduct = dbProducts.find((p) => p.id === product.id)
      if (dbProduct && dbProduct.stock === "HORS_STOCK" ) {
        stockErrors.push(`Produit ${dbProduct.name} est hors stock`)
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
        adminStatus : "EN_COURS_DE_FACTURATION",
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
        items: { include: { product: { select: { id: true, name: true, price: true, description: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        etablissement: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Devis created successfully",
        data: formatDevisResponse(devis),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating devis:", error)
    return NextResponse.json(
      { error: "Server error while creating devis", success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  let body: any = null
  
  try {
    const contentType = request.headers.get("content-type") || ""
    let isFormData = false

    if (contentType.includes("multipart/form-data")) {
      try {
        isFormData = true
        const formData = await request.formData()
        
        const devisId = formData.get("devisId")
        const userId = formData.get("userId")
        const responsableStatus = formData.get("responsableStatus")
        const adminStatus = formData.get("adminStatus")
        const invoicePdf = formData.get("invoicePdf")

        if (!devisId || !userId) {
          return NextResponse.json(
            { error: "devisId and userId are required in FormData", success: false },
            { status: 400 }
          )
        }

        body = {
          devisId: devisId as string,
          userId: userId as string,
          responsableStatus: responsableStatus as string | null,
          adminStatus: adminStatus as string | null,
          invoicePdf: invoicePdf as File | null,
        }

      } catch (parseError) {
        console.error("Error parsing FormData:", parseError)
        return NextResponse.json(
          { error: "Invalid FormData format", success: false },
          { status: 400 }
        )
      }
    } else {
      body = await request.json()
    }

    const { devisId, userId, responsableStatus, adminStatus, invoicePdf } = body

    if (!devisId || !userId) {
      return NextResponse.json(
        { error: "devisId and userId are required", success: false },
        { status: 400 }
      )
    }

    if (!responsableStatus && !adminStatus && !invoicePdf) {
      return NextResponse.json(
        { 
          error: "At least one field to update is required (responsableStatus, adminStatus, or invoicePdf)", 
          success: false 
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

    const validResponsableStatuses = ["EN_ATTENTE", "APPROUVE", "SUSPENDU", "REJETE"]
    const validAdminStatuses = [
      "EN_COURS_DE_FACTURATION",
      "EN_COURS_DE_LIVRAISON",
      "LIVREE",
      "REJETE",
    ]

    if (responsableStatus && !validResponsableStatuses.includes(responsableStatus)) {
      return NextResponse.json(
        { 
          error: `Invalid responsable status. Valid: ${validResponsableStatuses.join(", ")}`,
          success: false 
        },
        { status: 400 }
      )
    }

    if (adminStatus && !validAdminStatuses.includes(adminStatus)) {
      return NextResponse.json(
        { 
          error: `Invalid admin status. Valid: ${validAdminStatuses.join(", ")}`,
          success: false 
        },
        { status: 400 }
      )
    }

    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      select: { 
        createdById: true, 
        responsableStatus: true, 
        adminStatus: true, 
        etablissementId: true 
      },
    })

    if (!devis) {
      console.warn(`Devis not found: ${devisId}`)
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
      EN_COURS_DE_FACTURATION: ["EN_COURS_DE_LIVRAISON", "REJETE"],
      EN_COURS_DE_LIVRAISON: ["LIVREE", "REJETE"],
      LIVREE: [],
      REJETE: [],
    }

    if (responsableStatus && !validResponsableTransitions[devis.responsableStatus]?.includes(responsableStatus)) {
      return NextResponse.json(
        {
          error: `Invalid responsable transition: ${devis.responsableStatus} → ${responsableStatus}`,
          success: false,
        },
        { status: 400 }
      )
    }

    if (adminStatus && !validAdminTransitions[devis.adminStatus]?.includes(adminStatus)) {
      return NextResponse.json(
        {
          error: `Invalid admin transition: ${devis.adminStatus} → ${adminStatus}`,
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
      if (adminStatus === "LIVREE" || adminStatus === "REJETE") {
        updateData.adminValidatedById = userId
      }
    }

    if (invoicePdf && invoicePdf instanceof File && invoicePdf.size > 0) {
      try {
        const arrayBuffer = await invoicePdf.arrayBuffer()
        updateData.invoicePdf = Buffer.from(arrayBuffer)
        updateData.invoicePdfName = invoicePdf.name
        updateData.invoicePdfType = invoicePdf.type
        updateData.invoicePdfUploadedAt = new Date()
        
      } catch (uploadError) {
        console.error("Error processing PDF:", uploadError)
        return NextResponse.json(
          { error: "Failed to process PDF file", success: false },
          { status: 400 }
        )
      }
    }

    const updatedDevis = await prisma.devis.update({
      where: { id: devisId },
      data: updateData,
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true, description: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        validatedBy: { select: { id: true, firstName: true, lastName: true } },
        adminValidatedBy: { select: { id: true, firstName: true, lastName: true } },
        etablissement: { select: { id: true, name: true } },
      },
    })

    console.log("Devis updated successfully:", {
      devisId: updatedDevis.id,
      newResponsableStatus: updatedDevis.responsableStatus,
      newAdminStatus: updatedDevis.adminStatus,
    })

    // Envoyer une notification à l'établissement si le statut admin a changé
    if (adminStatus && updatedDevis.createdById) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })

        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send-to-etablissement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            devisId: updatedDevis.id,
            devis: {
              id: updatedDevis.id,
              clientName: updatedDevis.clientName || "Client",
              createdById: updatedDevis.createdById,
            },
            statusType: 'admin',
            newStatus: adminStatus,
            changedBy: user,
          }),
        })
      } catch (notificationError) {
        console.error("Error sending notification to etablissement:", notificationError)
        // Ne pas échouer la requête principale si la notification échoue
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Devis updated successfully",
        data: formatDevisResponse(updatedDevis),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating devis:", {
      devisId: body?.devisId,
      userId: body?.userId,
      requestedChanges: {
        responsableStatus: body?.responsableStatus,
        adminStatus: body?.adminStatus,
        hasPdf: !!body?.invoicePdf,
      },
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { 
        error: "Server error while updating devis",
        success: false,
      },
      { status: 500 }
    )
  }
}

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
        { error: "Only draft devis can be deleted", success: false },
        { status: 400 }
      )
    }

    await prisma.devis.delete({ where: { id: devisId } })

    return NextResponse.json(
      { success: true, message: "Devis deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting devis:", error)
    return NextResponse.json(
      { error: "Server error while deleting devis", success: false },
      { status: 500 }
    )
  }
}