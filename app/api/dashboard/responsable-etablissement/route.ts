import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDashboardData } from "@/lib/dashboard-data"
import { getAllChildEstablishmentIds } from "@/lib/etablissement-hierarchy"

/**
 * Dashboard metrics for a responsable attached to a specific etablissement:
 * - Main etablissement data only
 * - Individual sous-établissement breakdown
 */
export async function GET(request: NextRequest) {
  try {
    console.log("=== DASHBOARD API CALLED === DEBUG TEST ===")
    console.log("Request URL:", request.url)
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
        etablissement: { 
          select: { 
            id: true, 
            parentId: true,
            name: true
          } 
        },
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

    const start = startDate
      ? new Date(startDate + "T00:00:00")
      : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date()
    
    console.log(`Date range filter: ${start.toISOString()} to ${end.toISOString()}`)
    console.log(`User ID: ${userId}, Etablissement ID: ${user.etablissementId}`)

    // Get child establishments for breakdown
    const childIds = await getAllChildEstablishmentIds(user.etablissementId)

    // Get combined data for main etablissement + all sous-établissements
    const allEtablissementIds = [user.etablissementId, ...childIds]
    console.log(`Combined etablissement IDs:`, allEtablissementIds)
    
    // Debug: Check what devis actually exist in the database
    const allDevisDebug = await prisma.devis.findMany({
      where: {
        etablissementId: { in: allEtablissementIds }
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        etablissementId: true,
        responsableStatus: true
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    // Also check ALL devis without any filtering
    const allDevisNoFilter = await prisma.devis.findMany({
      select: {
        id: true,
        total: true,
        createdAt: true,
        etablissementId: true,
        responsableStatus: true
      },
      orderBy: { createdAt: "desc" },
      take: 15
    })
    
    console.log(`All devis in database (last 10):`, allDevisDebug.map(d => ({
      id: d.id,
      total: d.total,
      createdAt: d.createdAt,
      etablissementId: d.etablissementId,
      status: d.responsableStatus,
      inDateRange: d.createdAt >= start && d.createdAt <= end
    })))
    
    console.log(`ALL devis in database (no filter, last 15):`, allDevisNoFilter.map(d => ({
      id: d.id,
      total: d.total,
      createdAt: d.createdAt,
      etablissementId: d.etablissementId,
      status: d.responsableStatus,
      inDateRange: d.createdAt >= start && d.createdAt <= end,
      belongsToUserEtablissements: allEtablissementIds.includes(d.etablissementId)
    })))
    
    const mainEtablissementData = await buildDashboardData(prisma, { 
      start, 
      end, 
      etablissementIds: allEtablissementIds 
    })

    console.log(`Combined stats:`, {
      devis: mainEtablissementData.stats.devis,
      revenue: mainEtablissementData.stats.revenue,
      products: mainEtablissementData.stats.products,
      etablissements: mainEtablissementData.stats.etablissements
    })

    // Override the etablissements count to show sous-établissements count
    mainEtablissementData.stats.etablissements = childIds.length
    console.log(`Final etablissements count (sous-établissements only):`, childIds.length)
    
    // Get data for each sous-établissement individually
    const sousEtablissementsData = []
    
    if (childIds.length > 0) {
      // Get sous-établissement info
      const sousEtablissements = await prisma.etablissement.findMany({
        where: { 
          id: { in: childIds },
          isActive: true 
        },
        select: { id: true, name: true }
      })

      // Get data for each sous-établissement
      for (const sousEtab of sousEtablissements) {
        console.log(`Processing sous-établissement: ${sousEtab.name} (${sousEtab.id})`)
        
        // Debug: Check what devis exist for this sous-établissement
        const sousDevisDebug = await prisma.devis.findMany({
          where: {
            etablissementId: sousEtab.id
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
            responsableStatus: true
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })
        
        console.log(`Devis for ${sousEtab.name}:`, sousDevisDebug.map(d => ({
          id: d.id,
          total: d.total,
          createdAt: d.createdAt,
          status: d.responsableStatus,
          inDateRange: d.createdAt >= start && d.createdAt <= end
        })))
        
        const sousData = await buildDashboardData(prisma, {
          start,
          end,
          etablissementIds: [sousEtab.id]
        })
        
        console.log(`Sous-établissement ${sousEtab.name} stats:`, {
          devis: sousData.stats.devis,
          revenue: sousData.stats.revenue,
          products: sousData.stats.products
        })
        
        sousEtablissementsData.push({
          id: sousEtab.id,
          name: sousEtab.name,
          stats: sousData.stats,
          revenueByStatus: sousData.revenueByStatus,
          orderVolume: sousData.orderVolume,
          avgBasket: sousData.avgBasket
        })
      }
    }

    // Get establishment info
    const etablissementInfo = await prisma.etablissement.findUnique({
      where: { id: user.etablissementId },
      select: { id: true, name: true }
    })

    return NextResponse.json({
      mainEtablissement: {
        id: user.etablissementId,
        name: etablissementInfo?.name || "Établissement principal",
        data: mainEtablissementData
      },
      sousEtablissements: sousEtablissementsData,
      totalStats: {
        totalSousEtablissements: childIds.length,
        hasSousEtablissements: childIds.length > 0
      }
    })
  } catch (error) {
    console.error("Responsable etablissement dashboard API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
