import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDashboardData } from "@/lib/dashboard-data"
import { getAllChildEstablishmentIds } from "@/lib/etablissement-hierarchy"

/**
 * Dashboard metrics for a responsable attached to the parent (siège) establishment:
 * all devis across the organisation and its sous-établissements.
 * Responsables attached to a sous-établissement receive 403.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        etablissementId: true,
        etablissement: { select: { id: true, parentId: true } },
      },
    })

    if (!user || user.role !== "RESPONSABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (!user.etablissementId || !user.etablissement) {
      return NextResponse.json(
        { error: "Aucun établissement associé à ce compte" },
        { status: 403 }
      )
    }

    if (user.etablissement.parentId) {
      return NextResponse.json(
        {
          error: "FORBIDDEN_SOUS_ETABLISSEMENT",
          message:
            "Le tableau de bord agrégé est réservé au responsable rattaché à l'établissement siège (sans sous-établissement).",
        },
        { status: 403 }
      )
    }

    const childIds = await getAllChildEstablishmentIds(user.etablissementId)
    const etablissementIds = [user.etablissementId, ...childIds]

    const start = startDate
      ? new Date(startDate + "T00:00:00")
      : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

    const payload = await buildDashboardData(prisma, { start, end, etablissementIds })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Responsable organisation dashboard API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
