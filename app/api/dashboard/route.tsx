// app/api/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Parse dates - ensure proper date range
    const start = startDate 
      ? new Date(startDate + "T00:00:00") 
      : new Date(new Date().setDate(new Date().getDate() - 30))
    
    const end = endDate 
      ? new Date(endDate + "T23:59:59") 
      : new Date()

    console.log(`📊 Dashboard query - Start: ${start.toISOString()}, End: ${end.toISOString()}`)

    // 1. Count active products
    const productsCount = await prisma.product.count({
      where: { isActive: true },
    })
    console.log(`✅ Products count: ${productsCount}`)

    // 2. Count devis in date range
    const devisCount = await prisma.devis.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    })
    console.log(`✅ Devis count in range: ${devisCount}`)

    // 3. Count active establishments
    const etablissementsCount = await prisma.etablissement.count({
      where: { isActive: true },
    })
    console.log(`✅ Establishments count: ${etablissementsCount}`)

    // 4. Calculate total revenue
    const devisWithTotal = await prisma.devis.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        total: true,
      },
    })

    const revenue = devisWithTotal.reduce((sum, d) => {
      const amount = typeof d.total === 'string' 
        ? parseFloat(d.total) 
        : typeof d.total === 'number'
        ? d.total
        : (typeof d.total === 'object' && d.total !== null && 'toNumber' in d.total && typeof d.total.toNumber === 'function')
        ? d.total.toNumber()
        : 0
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    console.log(`✅ Revenue: ${revenue}`)

    // 5. Get devis by date for chart
    const devisList = await prisma.devis.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Group by date
    const devisByDate: { [key: string]: number } = {}
    devisList.forEach(d => {
      const dateKey = new Date(d.createdAt).toLocaleDateString('fr-FR')
      devisByDate[dateKey] = (devisByDate[dateKey] || 0) + 1
    })

    const chartData = Object.entries(devisByDate).map(([date, value]) => ({
      date,
      value,
    }))
    console.log(`✅ Chart data points: ${chartData.length}`)

    // 6. Get top products by quantity sold from devis items
    const topProductsRaw = await prisma.devisItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      where: {
        devis: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    })

    console.log(`📦 Top products raw (by quantity):`, topProductsRaw)

    // Get product names for these items
    const productIds = topProductsRaw.map(p => p.productId)
    const productsMap = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })

    // Map to final format
    const topProductsData = topProductsRaw
      .map(item => {
        const product = productsMap.find(p => p.id === item.productId)
        const qty = item._sum.quantity || 0
        return {
          name: product?.name || `Product ${item.productId}`,
          value: qty,
        }
      })
      .filter(p => p.value > 0)
      .slice(0, 5)

    console.log(`✅ Top products: ${topProductsData.length}`)

    // ✨ 7. Get top agencies by DEVIS COUNT
    const topAgenciesByDevisRaw = await prisma.devis.groupBy({
      by: ["etablissementId"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    })

    console.log(`🏢 Top agencies by devis count:`, topAgenciesByDevisRaw)

    // Get agency names
    const agencyIds = topAgenciesByDevisRaw.map(a => a.etablissementId)
    const agenciesMap = await prisma.etablissement.findMany({
      where: { id: { in: agencyIds } },
      select: { id: true, name: true },
    })

    // Map to final format
    const topAgenciesByDevis = topAgenciesByDevisRaw.map(agency => {
      const agencyInfo = agenciesMap.find(a => a.id === agency.etablissementId)
      const agencyRevenue = typeof agency._sum.total === 'string'
        ? parseFloat(agency._sum.total)
        : typeof agency._sum.total === 'number'
        ? agency._sum.total
        : (typeof agency._sum.total === 'object' && agency._sum.total !== null && 'toNumber' in agency._sum.total && typeof agency._sum.total.toNumber === 'function')
        ? agency._sum.total.toNumber()
        : 0

      return {
        id: agency.etablissementId,
        name: agencyInfo?.name || `Agency ${agency.etablissementId}`,
        devisCount: agency._count.id,
        revenue: `${agencyRevenue.toFixed(2)} TND`,
      }
    })

    console.log(`✅ Top agencies by devis: ${topAgenciesByDevis.length}`)

    // ✨ 8. Get top agencies by REVENUE
    const topAgenciesByRevenueRaw = await prisma.devis.groupBy({
      by: ["etablissementId"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 5,
    })

    console.log(`💰 Top agencies by revenue:`, topAgenciesByRevenueRaw)

    // Map to final format
    const topAgenciesByRevenue = topAgenciesByRevenueRaw.map(agency => {
      const agencyInfo = agenciesMap.find(a => a.id === agency.etablissementId)
      const agencyRevenue = typeof agency._sum.total === 'string'
        ? parseFloat(agency._sum.total)
        : typeof agency._sum.total === 'number'
        ? agency._sum.total
        : (typeof agency._sum.total === 'object' && agency._sum.total !== null && 'toNumber' in agency._sum.total && typeof agency._sum.total.toNumber === 'function')
        ? agency._sum.total.toNumber()
        : 0

      return {
        id: agency.etablissementId,
        name: agencyInfo?.name || `Agency ${agency.etablissementId}`,
        devisCount: agency._count.id,
        revenue: `${agencyRevenue.toFixed(2)} TND`,
      }
    })

    console.log(`✅ Top agencies by revenue: ${topAgenciesByRevenue.length}`)

    // ✨ 9. Get top responsables by DEVIS COUNT
    const topResponsablesByDevisRaw = await prisma.devis.groupBy({
      by: ["createdById"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    })

    console.log(`👤 Top responsables by devis count:`, topResponsablesByDevisRaw)

    // Get user names
    const userIds = topResponsablesByDevisRaw.map(r => r.createdById)
    const usersMap = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    })

    // Map to final format
    const topResponsablesByDevis = topResponsablesByDevisRaw.map(responsable => {
      const userInfo = usersMap.find(u => u.id === responsable.createdById)
      const responsableRevenue = typeof responsable._sum.total === 'string'
        ? parseFloat(responsable._sum.total)
        : typeof responsable._sum.total === 'number'
        ? responsable._sum.total
        : (typeof responsable._sum.total === 'object' && responsable._sum.total !== null && 'toNumber' in responsable._sum.total && typeof responsable._sum.total.toNumber === 'function')
        ? responsable._sum.total.toNumber()
        : 0

      return {
        id: responsable.createdById,
        firstName: userInfo?.firstName || "Unknown",
        lastName: userInfo?.lastName || "User",
        devisCount: responsable._count.id,
        revenue: `${responsableRevenue.toFixed(2)} TND`,
      }
    })

    console.log(`✅ Top responsables by devis: ${topResponsablesByDevis.length}`)

    // ✨ 10. Get top responsables by REVENUE
    const topResponsablesByRevenueRaw = await prisma.devis.groupBy({
      by: ["createdById"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 5,
    })

    console.log(`💰 Top responsables by revenue:`, topResponsablesByRevenueRaw)

    // Map to final format
    const topResponsablesByRevenue = topResponsablesByRevenueRaw.map(responsable => {
      const userInfo = usersMap.find(u => u.id === responsable.createdById)
      const responsableRevenue = typeof responsable._sum.total === 'string'
        ? parseFloat(responsable._sum.total)
        : typeof responsable._sum.total === 'number'
        ? responsable._sum.total
        : (typeof responsable._sum.total === 'object' && responsable._sum.total !== null && 'toNumber' in responsable._sum.total && typeof responsable._sum.total.toNumber === 'function')
        ? responsable._sum.total.toNumber()
        : 0

      return {
        id: responsable.createdById,
        firstName: userInfo?.firstName || "Unknown",
        lastName: userInfo?.lastName || "User",
        devisCount: responsable._count.id,
        revenue: `${responsableRevenue.toFixed(2)} TND`,
      }
    })

    console.log(`✅ Top responsables by revenue: ${topResponsablesByRevenue.length}`)

    const response = {
      stats: {
        products: productsCount,
        devis: devisCount,
        etablissements: etablissementsCount,
        revenue: `${revenue.toFixed(2)} TND`,
      },
      chart: {
        devis: chartData.length > 0 ? chartData : [
          { date: new Date(start).toLocaleDateString('fr-FR'), value: 0 },
        ],
      },
      topProducts: topProductsData.length > 0 ? topProductsData : [
        { name: "Aucun produit", value: 0 },
      ],
      // ✨ NEW FIELDS - Agencies
      topAgenciesByDevis: topAgenciesByDevis,
      topAgenciesByRevenue: topAgenciesByRevenue,
      // ✨ NEW FIELDS - Responsables
      topResponsablesByDevis: topResponsablesByDevis,
      topResponsablesByRevenue: topResponsablesByRevenue,
    }

    console.log(`✅ Dashboard response:`, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}