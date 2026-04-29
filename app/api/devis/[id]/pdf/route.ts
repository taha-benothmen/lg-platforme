import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateDevisPDFContent } from "@/lib/pdf-utils"
import { chromium } from "playwright"

async function validateUserAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, etablissementId: true, role: true },
  })

  if (!user) return { valid: false, error: "Utilisateur non trouvé" }
  // Admin can generate PDFs even without an assigned establishment.
  if (!user.etablissementId && user.role !== "ADMIN") {
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
    itemsCount: devis.items?.length || 0,
    paymentPeriod: devis.paymentPeriod || null,
    monthlyPayment: devis.monthlyPayment ? Number(devis.monthlyPayment) : null,
    createdBy: devis.createdBy
      ? {
          id: devis.createdBy.id,
          firstName: devis.createdBy.firstName,
          lastName: devis.createdBy.lastName,
          email: devis.createdBy.email,
        }
      : null,
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
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!id) {
      return NextResponse.json({ error: "ID du devis manquant", success: false }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: "userId requis", success: false }, { status: 400 })
    }

    const userValidation = await validateUserAccess(userId)
    if (!userValidation.valid) {
      return NextResponse.json({ error: userValidation.error, success: false }, { status: 404 })
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
      return NextResponse.json({ error: "Devis non trouvé", success: false }, { status: 404 })
    }

    const devisData = formatDevisResponse(devis)
    const html = generateDevisPDFContent(devisData)

    browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    })

    const filename = `devis-${devisData.id.slice(0, 8)}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating devis PDF:", error)
    return NextResponse.json({ error: "Erreur serveur", success: false }, { status: 500 })
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {}
    }
  }
}

