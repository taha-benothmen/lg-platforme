// app/api/dashboard/export/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper to escape CSV cell values
const cell = (v: unknown): string => {
  const s = String(v ?? "").replace(/"/g, '""')
  return `"${s}"`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, data, type = "dashboard" } = body

    const start = new Date(startDate + "T00:00:00")
    const end   = new Date(endDate   + "T23:59:59")

    // ── EXPORT 1: Dashboard summary ─────────────────────────────────────────
    if (type === "dashboard") {
      let csv = "\uFEFF" // BOM for Excel UTF-8

      csv += `RAPPORT TABLEAU DE BORD WIFAK\n`
      csv += `Période,${startDate} → ${endDate}\n`
      csv += `Généré le,${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n\n`

      // Stats généraux
      csv += "=== STATISTIQUES GÉNÉRALES ===\n"
      csv += "Métrique,Valeur\n"
      csv += `Produits actifs,${data?.stats?.products ?? 0}\n`
      csv += `Total devis,${data?.stats?.devis ?? 0}\n`
      csv += `Établissements actifs,${data?.stats?.etablissements ?? 0}\n`
      csv += `CA Total,${data?.stats?.revenue ?? "0 TND"}\n`
      csv += `Panier moyen (approuvés),${data?.avgBasket ?? "0 TND"}\n\n`

      // CA par statut
      csv += "=== CA PAR STATUT RESPONSABLE ===\n"
      csv += "Statut,CA\n"
      csv += `Approuvés,${data?.revenueByStatus?.approved ?? "0 TND"}\n`
      csv += `En attente,${data?.revenueByStatus?.pending ?? "0 TND"}\n`
      csv += `Suspendus,${data?.revenueByStatus?.suspended ?? "0 TND"}\n`
      csv += `Rejetés (responsable),${data?.revenueByStatus?.rejected ?? "0 TND"}\n`
      csv += `Livrés (admin),${data?.revenueByStatus?.delivered ?? "0 TND"}\n\n`

      // Volume de commandes
      csv += "=== VOLUME DE COMMANDES ===\n"
      csv += "Métrique,Valeur\n"
      csv += `Total commandes,${data?.orderVolume?.total ?? 0}\n`
      csv += `Approuvées,${data?.orderVolume?.approved ?? 0}\n`
      csv += `En attente,${data?.orderVolume?.pending ?? 0}\n`
      csv += `Suspendues,${data?.orderVolume?.suspended ?? 0}\n`
      csv += `Rejetées (responsable),${data?.orderVolume?.rejected ?? 0}\n`
      csv += `En cours de facturation (admin),${data?.orderVolume?.adminInvoicing ?? 0}\n`
      csv += `En cours de livraison (admin),${data?.orderVolume?.adminDelivering ?? 0}\n`
      csv += `Livrées (admin),${data?.orderVolume?.adminDelivered ?? 0}\n`
      csv += `Rejetées (admin),${data?.orderVolume?.adminRejected ?? 0}\n`
      csv += `Moyenne commandes/jour,${data?.orderVolume?.avgPerDay ?? 0}\n`
      csv += `Taux d'annulation (%),${data?.orderVolume?.cancellationRate ?? 0}\n`
      csv += `Taux d'acceptation bancaire (%),${data?.orderVolume?.bankAcceptanceRate ?? 0}\n\n`

      // TO Hebdomadaire
      csv += "=== TO HEBDOMADAIRE ===\n"
      csv += "Semaine,Commandes,CA (TND)\n"
      ;(data?.chart?.weekly ?? []).forEach((w: { week: string; count: number; revenue: number }) => {
        csv += `${w.week},${w.count},${w.revenue.toFixed(2)}\n`
      })
      csv += "\n"

      // TO Mensuel
      csv += "=== TO MENSUEL ===\n"
      csv += "Mois,Commandes,CA (TND)\n"
      ;(data?.chart?.monthly ?? []).forEach((m: { month: string; count: number; revenue: number }) => {
        csv += `${m.month},${m.count},${m.revenue.toFixed(2)}\n`
      })
      csv += "\n"

      // Top produits
      csv += "=== TOP PRODUITS ===\n"
      csv += "Produit,Quantité\n"
      ;(data?.topProducts ?? []).forEach((p: { name: string; value: number }) => {
        csv += `${cell(p.name)},${p.value}\n`
      })
      csv += "\n"

      // Top agences par devis
      csv += "=== TOP AGENCES PAR DEVIS ===\n"
      csv += "Rang,Agence,Nb Devis,CA\n"
      ;(data?.topAgenciesByDevis ?? []).forEach((a: { name: string; devisCount: number; revenue: string }, i: number) => {
        csv += `${i + 1},${cell(a.name)},${a.devisCount},${a.revenue}\n`
      })
      csv += "\n"

      // Top agences par CA
      csv += "=== TOP AGENCES PAR CA ===\n"
      csv += "Rang,Agence,Nb Devis,CA\n"
      ;(data?.topAgenciesByRevenue ?? []).forEach((a: { name: string; devisCount: number; revenue: string }, i: number) => {
        csv += `${i + 1},${cell(a.name)},${a.devisCount},${a.revenue}\n`
      })
      csv += "\n"

      // Top responsables par devis
      csv += "=== TOP RESPONSABLES PAR DEVIS ===\n"
      csv += "Rang,Responsable,Nb Devis,CA\n"
      ;(data?.topResponsablesByDevis ?? []).forEach((r: { firstName: string; lastName: string; devisCount: number; revenue: string }, i: number) => {
        csv += `${i + 1},${cell(`${r.firstName} ${r.lastName}`)},${r.devisCount},${r.revenue}\n`
      })
      csv += "\n"

      // Top responsables par CA
      csv += "=== TOP RESPONSABLES PAR CA ===\n"
      csv += "Rang,Responsable,Nb Devis,CA\n"
      ;(data?.topResponsablesByRevenue ?? []).forEach((r: { firstName: string; lastName: string; devisCount: number; revenue: string }, i: number) => {
        csv += `${i + 1},${cell(`${r.firstName} ${r.lastName}`)},${r.devisCount},${r.revenue}\n`
      })

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dashboard-resume-${startDate}-${endDate}.csv"`,
        },
      })
    }

    // ── EXPORT 2: Full devis list ────────────────────────────────────────────
    if (type === "devis") {
      const devisList = await prisma.devis.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } },
            },
          },
          createdBy:    { select: { firstName: true, lastName: true, email: true } },
          validatedBy:  { select: { firstName: true, lastName: true } },
          etablissement:{ select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      let csv = "\uFEFF" // BOM

      csv += `LISTE DES DEVIS WIFAK\n`
      csv += `Période,${startDate} → ${endDate}\n`
      csv += `Total devis,${devisList.length}\n`
      csv += `Généré le,${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n\n`

      // Header row
      csv += [
        "Date création",
        "ID Devis",
        "Établissement",
        "Créé par",
        "Validé par",
        "Client",
        "Email client",
        "Téléphone client",
        "Entreprise client",
        "Total (TND)",
        "Statut Responsable",
        "Statut Admin",
        "Nb Articles",
        "Détail articles",
      ].join(",") + "\n"

      devisList.forEach((d) => {
        const date          = new Date(d.createdAt).toLocaleDateString("fr-FR")
        const etab          = d.etablissement?.name ?? "N/A"
        const createdBy     = `${d.createdBy?.firstName ?? ""} ${d.createdBy?.lastName ?? ""}`.trim()
        const validatedBy   = d.validatedBy
          ? `${d.validatedBy.firstName ?? ""} ${d.validatedBy.lastName ?? ""}`.trim()
          : ""
        const total         = parseFloat(d.total.toString()).toFixed(2)
        const articlesDetail = d.items
          .map((it) => `${it.product.name} x${it.quantity} @ ${parseFloat(it.price.toString()).toFixed(2)} TND`)
          .join(" | ")

        csv += [
          cell(date),
          cell(d.id),
          cell(etab),
          cell(createdBy),
          cell(validatedBy),
          cell(d.clientName),
          cell(d.clientEmail),
          cell(d.clientPhone ?? ""),
          cell(d.clientEnterprise ?? ""),
          total,
          cell(d.responsableStatus),
          cell(d.adminStatus),
          d.items.length,
          cell(articlesDetail),
        ].join(",") + "\n"
      })

      // Summary at bottom
      csv += "\n=== RÉSUMÉ ===\n"
      const totalCA = devisList.reduce((s, d) => s + parseFloat(d.total.toString()), 0)
      csv += `Total CA (TND),${totalCA.toFixed(2)}\n`

      const byResponsableStatus: Record<string, number> = {}
      const byAdminStatus: Record<string, number> = {}
      devisList.forEach((d) => {
        byResponsableStatus[d.responsableStatus] = (byResponsableStatus[d.responsableStatus] ?? 0) + 1
        byAdminStatus[d.adminStatus]             = (byAdminStatus[d.adminStatus]             ?? 0) + 1
      })

      csv += "\nStatut Responsable,Nombre\n"
      Object.entries(byResponsableStatus).forEach(([k, v]) => { csv += `${cell(k)},${v}\n` })

      csv += "\nStatut Admin,Nombre\n"
      Object.entries(byAdminStatus).forEach(([k, v]) => { csv += `${cell(k)},${v}\n` })

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="liste-devis-${startDate}-${endDate}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: "Unknown export type" }, { status: 400 })

  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Export failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}