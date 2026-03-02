import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DevisStatus, AdminDevisStatus } from "@prisma/client"

// ─── Helper: safely convert Prisma Decimal / string / number → JS number ──────
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) ? 0 : val
  if (typeof val === "string") return parseFloat(val) || 0
  if (
    typeof val === "object" &&
    "toNumber" in val &&
    typeof (val as { toNumber: () => number }).toNumber === "function"
  ) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return 0
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const start = startDate
      ? new Date(startDate + "T00:00:00")
      : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

    const dateFilter = { gte: start, lte: end }

    // ─── Static counts ────────────────────────────────────────────────────────
    const [productsCount, etablissementsCount] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.etablissement.count({ where: { isActive: true } }),
    ])

    // ─── Single query — derive everything in JS (no N+1, no groupBy mismatches)
    const allDevis = await prisma.devis.findMany({
      where: { createdAt: dateFilter },
      select: {
        id:               true,
        total:            true,
        responsableStatus: true,  // DevisStatus enum
        adminStatus:       true,  // AdminDevisStatus enum
        createdAt:        true,
        etablissementId:  true,
        createdById:      true,
      },
      orderBy: { createdAt: "asc" },
    })

    // ─── Partition by responsableStatus ──────────────────────────────────────
    // DevisStatus: EN_ATTENTE | APPROUVE | SUSPENDU | REJETE
    const approvedDevis  = allDevis.filter((d) => d.responsableStatus === DevisStatus.APPROUVE)
    const pendingDevis   = allDevis.filter((d) => d.responsableStatus === DevisStatus.EN_ATTENTE)
    const suspendedDevis = allDevis.filter((d) => d.responsableStatus === DevisStatus.SUSPENDU)
    const rejectedDevis  = allDevis.filter((d) => d.responsableStatus === DevisStatus.REJETE)

    // ─── Partition by adminStatus ─────────────────────────────────────────────
    // AdminDevisStatus: EN_COURS_DE_FACTURATION | EN_COURS_DE_LIVRAISON | LIVREE | REJETE
    const adminDelivered  = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.LIVREE)
    const adminDelivering = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.EN_COURS_DE_LIVRAISON)
    const adminInvoicing  = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.EN_COURS_DE_FACTURATION)
    const adminRejected   = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.REJETE)

    // ─── Revenue ──────────────────────────────────────────────────────────────
    const sumRevenue = (list: typeof allDevis) =>
      list.reduce((s, d) => s + toNumber(d.total), 0)

    const revenueTotal     = sumRevenue(allDevis)
    const revenueApproved  = sumRevenue(approvedDevis)
    const revenuePending   = sumRevenue(pendingDevis)
    const revenueSuspended = sumRevenue(suspendedDevis)
    const revenueRejected  = sumRevenue(rejectedDevis)
    const revenueDelivered = sumRevenue(adminDelivered)

    // ─── Computed KPIs ────────────────────────────────────────────────────────
    const totalDevis    = allDevis.length
    const avgBasket     = approvedDevis.length > 0 ? revenueApproved / approvedDevis.length : 0

    const numDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    )
    const avgOrdersPerDay = totalDevis / numDays

    // Cancellation rate = (REJETE by responsable + REJETE by admin) / total
    const cancelledCount   = rejectedDevis.length + adminRejected.length
    const cancellationRate = totalDevis > 0 ? (cancelledCount / totalDevis) * 100 : 0

    // Bank acceptance = devis that moved past invoicing (delivered or delivering)
    // out of all submitted to admin (= APPROUVE by responsable)
    const submittedToAdmin   = approvedDevis.length
    const acceptedByAdmin    = adminDelivered.length + adminDelivering.length
    const bankAcceptanceRate = submittedToAdmin > 0
      ? (acceptedByAdmin / submittedToAdmin) * 100
      : 0

    // ─── Daily chart ──────────────────────────────────────────────────────────
    const devisByDate: Record<string, { count: number; revenue: number }> = {}
    allDevis.forEach((d) => {
      const key = new Date(d.createdAt).toLocaleDateString("fr-FR")
      if (!devisByDate[key]) devisByDate[key] = { count: 0, revenue: 0 }
      devisByDate[key].count   += 1
      devisByDate[key].revenue += toNumber(d.total)
    })
    const chartData = Object.entries(devisByDate).map(([date, v]) => ({
      date,
      value: v.count,
      revenue: v.revenue,
    }))

    // ─── Weekly chart ─────────────────────────────────────────────────────────
    const getWeekKey = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - d.getDay()) // Sunday = start of week
      return d.toLocaleDateString("fr-FR")
    }
    const weeklyMap: Record<string, { count: number; revenue: number }> = {}
    allDevis.forEach((d) => {
      const key = getWeekKey(new Date(d.createdAt))
      if (!weeklyMap[key]) weeklyMap[key] = { count: 0, revenue: 0 }
      weeklyMap[key].count   += 1
      weeklyMap[key].revenue += toNumber(d.total)
    })
    const weeklyData = Object.entries(weeklyMap).map(([week, v]) => ({
      week,
      count: v.count,
      revenue: v.revenue,
    }))

    // ─── Monthly chart ────────────────────────────────────────────────────────
    const monthlyMap: Record<string, { count: number; revenue: number }> = {}
    allDevis.forEach((d) => {
      const dt  = new Date(d.createdAt)
      const key = `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
      if (!monthlyMap[key]) monthlyMap[key] = { count: 0, revenue: 0 }
      monthlyMap[key].count   += 1
      monthlyMap[key].revenue += toNumber(d.total)
    })
    const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({
      month,
      count: v.count,
      revenue: v.revenue,
    }))

    // ─── Top products ─────────────────────────────────────────────────────────
    // DevisItem schema: devisId (String) → Devis, productId (Int) → Product
    // Relation field to Devis on DevisItem is named "devis" (@@map devis_items)
    const topProductsRaw = await prisma.devisItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },          // quantity is Int ✅
      where: {
        devis: {                          // relation field name on DevisItem model ✅
          createdAt: dateFilter,
        },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    })

    // Guard: skip DB call if no results to avoid empty IN() crash on some MySQL versions
    const productIds = topProductsRaw.map((p) => p.productId)
    const productsMap = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : []

    const topProductsData = topProductsRaw
      .map((item) => ({
        name:  productsMap.find((p) => p.id === item.productId)?.name ?? `Produit #${item.productId}`,
        value: item._sum.quantity ?? 0,
      }))
      .filter((p) => p.value > 0)
      .slice(0, 5)

    // ─── Top agencies — derived from allDevis (no extra DB query for grouping) ─
    const agencyDevisMap: Record<string, { count: number; revenue: number }> = {}
    allDevis.forEach((d) => {
      if (!agencyDevisMap[d.etablissementId])
        agencyDevisMap[d.etablissementId] = { count: 0, revenue: 0 }
      agencyDevisMap[d.etablissementId].count   += 1
      agencyDevisMap[d.etablissementId].revenue += toNumber(d.total)
    })

    const allAgencyIds = Object.keys(agencyDevisMap)
    const agenciesInfo = allAgencyIds.length > 0
      ? await prisma.etablissement.findMany({
          where: { id: { in: allAgencyIds } },
          select: { id: true, name: true },
        })
      : []

    const agencyList = allAgencyIds.map((id) => ({
      id,
      name:       agenciesInfo.find((a) => a.id === id)?.name ?? `Agence #${id}`,
      devisCount: agencyDevisMap[id].count,
      revenueRaw: agencyDevisMap[id].revenue,
    }))

    const topAgenciesByDevis = [...agencyList]
      .sort((a, b) => b.devisCount - a.devisCount)
      .slice(0, 5)
      .map(({ revenueRaw, ...a }) => ({ ...a, revenue: `${revenueRaw.toFixed(2)} TND` }))

    const topAgenciesByRevenue = [...agencyList]
      .sort((a, b) => b.revenueRaw - a.revenueRaw)
      .slice(0, 5)
      .map(({ revenueRaw, ...a }) => ({ ...a, revenue: `${revenueRaw.toFixed(2)} TND` }))

    // ─── Top responsables — same pattern ──────────────────────────────────────
    const userDevisMap: Record<string, { count: number; revenue: number }> = {}
    allDevis.forEach((d) => {
      if (!userDevisMap[d.createdById])
        userDevisMap[d.createdById] = { count: 0, revenue: 0 }
      userDevisMap[d.createdById].count   += 1
      userDevisMap[d.createdById].revenue += toNumber(d.total)
    })

    const allUserIds = Object.keys(userDevisMap)
    const usersInfo  = allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []

    const userList = allUserIds.map((id) => ({
      id,
      firstName:  usersInfo.find((u) => u.id === id)?.firstName ?? "Unknown",
      lastName:   usersInfo.find((u) => u.id === id)?.lastName  ?? "User",
      devisCount: userDevisMap[id].count,
      revenueRaw: userDevisMap[id].revenue,
    }))

    const topResponsablesByDevis = [...userList]
      .sort((a, b) => b.devisCount - a.devisCount)
      .slice(0, 5)
      .map(({ revenueRaw, ...u }) => ({ ...u, revenue: `${revenueRaw.toFixed(2)} TND` }))

    const topResponsablesByRevenue = [...userList]
      .sort((a, b) => b.revenueRaw - a.revenueRaw)
      .slice(0, 5)
      .map(({ revenueRaw, ...u }) => ({ ...u, revenue: `${revenueRaw.toFixed(2)} TND` }))

    // ─── Response ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      stats: {
        products:       productsCount,
        devis:          totalDevis,
        etablissements: etablissementsCount,
        revenue:        `${revenueTotal.toFixed(2)} TND`,
      },

      // CA by responsableStatus + admin delivered
      revenueByStatus: {
        approved:  `${revenueApproved.toFixed(2)} TND`,   // APPROUVE
        pending:   `${revenuePending.toFixed(2)} TND`,    // EN_ATTENTE
        suspended: `${revenueSuspended.toFixed(2)} TND`,  // SUSPENDU
        rejected:  `${revenueRejected.toFixed(2)} TND`,   // REJETE (responsable)
        delivered: `${revenueDelivered.toFixed(2)} TND`,  // adminStatus = LIVREE
      },

      // Full order volume breakdown
      orderVolume: {
        total:           totalDevis,
        // By responsableStatus
        approved:        approvedDevis.length,
        pending:         pendingDevis.length,
        suspended:       suspendedDevis.length,
        rejected:        rejectedDevis.length,
        // By adminStatus
        adminInvoicing:  adminInvoicing.length,
        adminDelivering: adminDelivering.length,
        adminDelivered:  adminDelivered.length,
        adminRejected:   adminRejected.length,
        // Computed
        avgPerDay:          parseFloat(avgOrdersPerDay.toFixed(2)),
        cancellationRate:   parseFloat(cancellationRate.toFixed(2)),
        bankAcceptanceRate: parseFloat(bankAcceptanceRate.toFixed(2)),
      },

      avgBasket: `${avgBasket.toFixed(2)} TND`,

      chart: {
        devis: chartData.length > 0
          ? chartData
          : [{ date: start.toLocaleDateString("fr-FR"), value: 0, revenue: 0 }],
        weekly:  weeklyData,
        monthly: monthlyData,
      },

      topProducts: topProductsData.length > 0
        ? topProductsData
        : [{ name: "Aucun produit", value: 0 }],

      topAgenciesByDevis,
      topAgenciesByRevenue,
      topResponsablesByDevis,
      topResponsablesByRevenue,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      {
        error:   "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}