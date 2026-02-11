import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { devisId, title, message } = body

    if (!devisId || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 }
      )
    }


    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        createdBy: { select: { id: true } },
      },
    })

    if (!devis || !devis.createdBy) {
      console.warn("Devis or creator not found")
      return NextResponse.json(
        { error: "Devis not found", success: false },
        { status: 404 }
      )
    }

    const notification = await prisma.notification.create({
        data: {
          userId: devis.createdBy.id,
          type: "DEVIS_STATUS_CHANGED",
          title: title,
          message: message,
          devisId: devisId,
        },
      })


    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    )
  }
}