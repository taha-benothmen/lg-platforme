// ✅ REMPLACE complètement app/api/notifications/send-to-all-admins/route.ts PAR CECI:

import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification.service"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { devisId, devis, statusType, newStatus, changedBy } = body

    console.log("📢 [send-to-all-admins] Received request")
    console.log("   devisId:", devisId?.slice(0, 8) || "MISSING")
    console.log("   statusType:", statusType || "MISSING")
    console.log("   newStatus:", newStatus || "MISSING")

    // Validation
    if (!devisId || !statusType || !newStatus || !devis) {
      console.warn("⚠️ Missing required fields")
      return NextResponse.json(
        { 
          error: "Missing required fields: devisId, devis, statusType, newStatus", 
          success: false 
        },
        { status: 400 }
      )
    }

    console.log("✅ All required fields present")

    // Récupérer l'utilisateur qui a changé le statut (si données incomplètes)
    let changedByUser = changedBy
    if (!changedBy?.firstName || !changedBy?.lastName) {
      console.log("📋 Fetching user data for:", changedBy?.id)
      const user = await prisma.user.findUnique({
        where: { id: changedBy?.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      })
      if (user) {
        changedByUser = user
        console.log("✅ User data fetched")
      }
    }

    console.log("📢 Notifying all admins about status change...")

    // Récupérer tous les ADMIN actifs
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    })

    console.log(`✅ Found ${admins.length} admins to notify`)

    if (admins.length === 0) {
      console.warn("⚠️ No active admins found")
      return NextResponse.json(
        { success: true, count: 0, message: "No admins to notify" },
        { status: 200 }
      )
    }

    // ✅ Créer une notification pour CHAQUE admin
    const notifications = await Promise.all(
      admins.map((admin) =>
        notificationService.createNotification({
          userId: admin.id,
          type: "DEVIS_STATUS_CHANGED",
          title: `📋 Devis ${devis.id.slice(0, 8)} - Changement de statut`,
          message: `Le statut ${statusType === "responsable" ? "responsable" : "admin"} du devis pour ${devis.clientName} a été changé à: ${newStatus}`,
          devisId: devis.id,
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
      { error: error instanceof Error ? error.message : "Server error", success: false },
      { status: 500 }
    )
  }
}