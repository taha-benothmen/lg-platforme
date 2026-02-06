// app/api/notifications/send-to-devis-creator/route.ts
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

    console.log("📢 Creating notification for devis:", devisId.slice(0, 8))

    // Récupérer le devis et son créateur
    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        createdBy: { select: { id: true } },
      },
    })

    if (!devis || !devis.createdBy) {
      console.warn("❌ Devis or creator not found")
      return NextResponse.json(
        { error: "Devis not found", success: false },
        { status: 404 }
      )
    }

    // Créer la notification
    const notification = await prisma.notification.create({
        data: {
          userId: devis.createdBy.id,
          type: "DEVIS_STATUS_CHANGED",
          title: title,
          message: message,
          devisId: devisId,
        },
      })

    console.log("✅ Notification created:", notification.id)

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    )
  }
}