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

    console.log("📢 Creating notifications for all admins for devis:", devisId.slice(0, 8))

    // Récupérer TOUS les ADMIN
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    })

    console.log(`Found ${admins.length} admins to notify`)

    if (admins.length === 0) {
      console.warn("⚠️ No admins found")
      return NextResponse.json(
        { success: true, message: "No admins to notify", count: 0 },
        { status: 200 }
      )
    }

    // Créer une notification pour CHAQUE ADMIN
    const notifications = await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: "DEVIS_STATUS_CHANGED",
            title: title,
            message: message,
            devisId: devisId,
          },
        })
      )
    )

    console.log(`✅ ${notifications.length} notifications créées`)

    return NextResponse.json(
      { success: true, count: notifications.length },
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