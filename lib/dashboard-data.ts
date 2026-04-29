import type { PrismaClient } from "@prisma/client"
import { DevisStatus, AdminDevisStatus } from "@prisma/client"

export function toNumber(val: unknown): number {
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

export interface ChartPoint {
  date: string
  value: number
  revenue: number
}

export type DashboardData = DashboardPayload

export interface SousEtablissementData {
  id: string
  name: string
  stats: { products: number; devis: number; etablissements: number; revenue: string }
  revenueByStatus: {
    approved: string
    pending: string
    suspended: string
    rejected: string
    delivered: string
  }
  orderVolume: {
    total: number
    approved: number
    pending: number
    suspended: number
    rejected: number
    adminInvoicing: number
    adminDelivering: number
    adminDelivered: number
    adminRejected: number
    avgPerDay: number
    cancellationRate: number
    bankAcceptanceRate: number
  }
  avgBasket: string
}

export interface EtablissementDashboardData {
  mainEtablissement: {
    id: string
    name: string
    data: DashboardPayload
  }
  sousEtablissements: SousEtablissementData[]
  totalStats: {
    totalSousEtablissements: number
    hasSousEtablissements: boolean
  }
}

export interface DashboardPayload {
  stats: { products: number; devis: number; etablissements: number; revenue: string }
  revenueByStatus: {
    approved: string
    pending: string
    suspended: string
    rejected: string
    delivered: string
  }
  orderVolume: {
    total: number
    approved: number
    pending: number
    suspended: number
    rejected: number
    adminInvoicing: number
    adminDelivering: number
    adminDelivered: number
    adminRejected: number
    avgPerDay: number
    cancellationRate: number
    bankAcceptanceRate: number
  }
  avgBasket: string
  chart: {
    devis: ChartPoint[]
    weekly: Array<{ week: string; count: number; revenue: number }>
    monthly: Array<{ month: string; count: number; revenue: number }>
  }
  topProducts: Array<{ name: string; value: number }>
  topAgenciesByDevis?: Array<{ id: string; name: string; devisCount: number; revenue: string }>
  topAgenciesByRevenue?: Array<{ id: string; name: string; devisCount: number; revenue: string }>
  topResponsablesByDevis?: Array<{
    id: string
    firstName: string
    lastName: string
    devisCount: number
    revenue: string
  }>
  topResponsablesByRevenue?: Array<{
    id: string
    firstName: string
    lastName: string
    devisCount: number
    revenue: string
  }>
}

/**
 * @param etablissementIds — When provided, all devis-derived metrics are limited to these establishments.
 *                          When omitted, behaves like the global admin dashboard.
 */
export async function buildDashboardData(
  prisma: PrismaClient,
  options: { start: Date; end: Date; etablissementIds?: string[] }
): Promise<DashboardPayload> {
  const { start, end, etablissementIds } = options
  const dateFilter = { gte: start, lte: end }

  const scopedDevis =
    etablissementIds && etablissementIds.length > 0
      ? { createdAt: dateFilter, etablissementId: { in: etablissementIds } }
      : { createdAt: dateFilter }

  const [productsCount, etablissementsCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    etablissementIds && etablissementIds.length > 0
      ? prisma.etablissement.count({ where: { id: { in: etablissementIds }, isActive: true } })
      : prisma.etablissement.count({ where: { isActive: true } }),
  ])

  const allDevis = await prisma.devis.findMany({
    where: scopedDevis,
    select: {
      id: true,
      total: true,
      responsableStatus: true,
      adminStatus: true,
      createdAt: true,
      etablissementId: true,
      createdById: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const approvedDevis = allDevis.filter((d) => d.responsableStatus === DevisStatus.APPROUVE)
  const pendingDevis = allDevis.filter((d) => d.responsableStatus === DevisStatus.EN_ATTENTE)
  const suspendedDevis = allDevis.filter((d) => d.responsableStatus === DevisStatus.SUSPENDU)
  const rejectedDevis = allDevis.filter((d) => d.responsableStatus === DevisStatus.REJETE)

  const adminDelivered = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.LIVREE)
  const adminDelivering = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.EN_COURS_DE_LIVRAISON)
  const adminInvoicing = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.EN_COURS_DE_FACTURATION)
  const adminRejected = allDevis.filter((d) => d.adminStatus === AdminDevisStatus.REJETE)

  const sumRevenue = (list: typeof allDevis) => list.reduce((s, d) => s + toNumber(d.total), 0)

  const revenueTotal = sumRevenue(allDevis)
  const revenueApproved = sumRevenue(approvedDevis)
  const revenuePending = sumRevenue(pendingDevis)
  const revenueSuspended = sumRevenue(suspendedDevis)
  const revenueRejected = sumRevenue(rejectedDevis)
  const revenueDelivered = sumRevenue(adminDelivered)

  const totalDevis = allDevis.length
  const avgBasket = approvedDevis.length > 0 ? revenueApproved / approvedDevis.length : 0

  const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const avgOrdersPerDay = totalDevis / numDays

  const cancelledCount = rejectedDevis.length + adminRejected.length
  const cancellationRate = totalDevis > 0 ? (cancelledCount / totalDevis) * 100 : 0

  const submittedToAdmin = approvedDevis.length
  const acceptedByAdmin = adminDelivered.length + adminDelivering.length
  const bankAcceptanceRate =
    submittedToAdmin > 0 ? (acceptedByAdmin / submittedToAdmin) * 100 : 0

  const devisByDate: Record<string, { count: number; revenue: number }> = {}
  allDevis.forEach((d) => {
    const key = new Date(d.createdAt).toLocaleDateString("fr-FR")
    if (!devisByDate[key]) devisByDate[key] = { count: 0, revenue: 0 }
    devisByDate[key].count += 1
    devisByDate[key].revenue += toNumber(d.total)
  })
  const chartData = Object.entries(devisByDate).map(([date, v]) => ({
    date,
    value: v.count,
    revenue: v.revenue,
  }))

  const getWeekKey = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - d.getDay())
    return d.toLocaleDateString("fr-FR")
  }
  const weeklyMap: Record<string, { count: number; revenue: number }> = {}
  allDevis.forEach((d) => {
    const key = getWeekKey(new Date(d.createdAt))
    if (!weeklyMap[key]) weeklyMap[key] = { count: 0, revenue: 0 }
    weeklyMap[key].count += 1
    weeklyMap[key].revenue += toNumber(d.total)
  })
  const weeklyData = Object.entries(weeklyMap).map(([week, v]) => ({
    week,
    count: v.count,
    revenue: v.revenue,
  }))

  const monthlyMap: Record<string, { count: number; revenue: number }> = {}
  allDevis.forEach((d) => {
    const dt = new Date(d.createdAt)
    const key = `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
    if (!monthlyMap[key]) monthlyMap[key] = { count: 0, revenue: 0 }
    monthlyMap[key].count += 1
    monthlyMap[key].revenue += toNumber(d.total)
  })
  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    count: v.count,
    revenue: v.revenue,
  }))

  const devisItemWhere =
    etablissementIds && etablissementIds.length > 0
      ? {
          devis: {
            createdAt: dateFilter,
            etablissementId: { in: etablissementIds },
          },
        }
      : { devis: { createdAt: dateFilter } }

  const topProductsRaw = await prisma.devisItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: devisItemWhere,
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  })

  const productIds = topProductsRaw.map((p) => p.productId)
  const productsMap =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : []

  const topProductsData = topProductsRaw
    .map((item) => ({
      name: productsMap.find((p) => p.id === item.productId)?.name ?? `Produit #${item.productId}`,
      value: item._sum.quantity ?? 0,
    }))
    .filter((p) => p.value > 0)
    .slice(0, 5)

  const agencyDevisMap: Record<string, { count: number; revenue: number }> = {}
  allDevis.forEach((d) => {
    if (!agencyDevisMap[d.etablissementId]) agencyDevisMap[d.etablissementId] = { count: 0, revenue: 0 }
    agencyDevisMap[d.etablissementId].count += 1
    agencyDevisMap[d.etablissementId].revenue += toNumber(d.total)
  })

  const allAgencyIds = Object.keys(agencyDevisMap)
  const agenciesInfo =
    allAgencyIds.length > 0
      ? await prisma.etablissement.findMany({
          where: { id: { in: allAgencyIds } },
          select: { id: true, name: true },
        })
      : []

  const agencyList = allAgencyIds.map((id) => ({
    id,
    name: agenciesInfo.find((a) => a.id === id)?.name ?? `Agence #${id}`,
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

  const userDevisMap: Record<string, { count: number; revenue: number }> = {}
  allDevis.forEach((d) => {
    if (!userDevisMap[d.createdById]) userDevisMap[d.createdById] = { count: 0, revenue: 0 }
    userDevisMap[d.createdById].count += 1
    userDevisMap[d.createdById].revenue += toNumber(d.total)
  })

  const allUserIds = Object.keys(userDevisMap)
  const usersInfo =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []

  const userList = allUserIds.map((id) => ({
    id,
    firstName: usersInfo.find((u) => u.id === id)?.firstName ?? "Unknown",
    lastName: usersInfo.find((u) => u.id === id)?.lastName ?? "User",
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

  return {
    stats: {
      products: productsCount,
      devis: totalDevis,
      etablissements: etablissementsCount,
      revenue: `${revenueTotal.toFixed(2)} TND`,
    },
    revenueByStatus: {
      approved: `${revenueApproved.toFixed(2)} TND`,
      pending: `${revenuePending.toFixed(2)} TND`,
      suspended: `${revenueSuspended.toFixed(2)} TND`,
      rejected: `${revenueRejected.toFixed(2)} TND`,
      delivered: `${revenueDelivered.toFixed(2)} TND`,
    },
    orderVolume: {
      total: totalDevis,
      approved: approvedDevis.length,
      pending: pendingDevis.length,
      suspended: suspendedDevis.length,
      rejected: rejectedDevis.length,
      adminInvoicing: adminInvoicing.length,
      adminDelivering: adminDelivering.length,
      adminDelivered: adminDelivered.length,
      adminRejected: adminRejected.length,
      avgPerDay: parseFloat(avgOrdersPerDay.toFixed(2)),
      cancellationRate: parseFloat(cancellationRate.toFixed(2)),
      bankAcceptanceRate: parseFloat(bankAcceptanceRate.toFixed(2)),
    },
    avgBasket: `${avgBasket.toFixed(2)} TND`,
    chart: {
      devis:
        chartData.length > 0
          ? chartData
          : [{ date: start.toLocaleDateString("fr-FR"), value: 0, revenue: 0 }],
      weekly: weeklyData,
      monthly: monthlyData,
    },
    topProducts: topProductsData.length > 0 ? topProductsData : [{ name: "Aucun produit", value: 0 }],
    topAgenciesByDevis,
    topAgenciesByRevenue,
    topResponsablesByDevis,
    topResponsablesByRevenue,
  }
}

export const emptyDashboardData: DashboardData = {
  stats: { products: 0, devis: 0, etablissements: 0, revenue: "0 TND" },
  revenueByStatus: {
    approved: "0 TND",
    pending: "0 TND",
    suspended: "0 TND",
    rejected: "0 TND",
    delivered: "0 TND",
  },
  orderVolume: {
    total: 0,
    approved: 0,
    pending: 0,
    suspended: 0,
    rejected: 0,
    adminInvoicing: 0,
    adminDelivering: 0,
    adminDelivered: 0,
    adminRejected: 0,
    avgPerDay: 0,
    cancellationRate: 0,
    bankAcceptanceRate: 0,
  },
  avgBasket: "0 TND",
  chart: { devis: [], weekly: [], monthly: [] },
  topProducts: [],
  topAgenciesByDevis: [],
  topAgenciesByRevenue: [],
  topResponsablesByDevis: [],
  topResponsablesByRevenue: [],
}

export const emptyEtablissementDashboardData: EtablissementDashboardData = {
  mainEtablissement: {
    id: "",
    name: "Établissement principal",
    data: emptyDashboardData
  },
  sousEtablissements: [],
  totalStats: {
    totalSousEtablissements: 0,
    hasSousEtablissements: false
  }
}
