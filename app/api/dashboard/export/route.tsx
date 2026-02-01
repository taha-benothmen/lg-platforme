// app/api/dashboard/export/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json()

    // Parse dates
    const start = new Date(startDate + "T00:00:00")
    const end = new Date(endDate + "T23:59:59")

    // Fetch detailed data for export
    const devis = await prisma.devis.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, price: true },
            },
          },
        },
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        etablissement: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get statistics
    const stats = {
      totalDevis: devis.length,
      totalRevenue: devis.reduce((sum, d) => sum + parseFloat(d.total.toString()), 0),
      averageValue: devis.length > 0 
        ? devis.reduce((sum, d) => sum + parseFloat(d.total.toString()), 0) / devis.length 
        : 0,
    }

    // Create CSV content
    let csvContent = ""
    
    // BOM for Excel UTF-8 compatibility
    csvContent += "\uFEFF"
    
    // Header section
    csvContent += "RAPPORT TABLEAU DE BORD\n"
    csvContent += `Période: ${startDate} à ${endDate}\n`
    csvContent += `Date de génération: ${new Date().toLocaleDateString('fr-FR')}\n\n`
    
    // Statistics section
    csvContent += "=== STATISTIQUES ===\n"
    csvContent += "Métrique,Valeur\n"
    csvContent += `Total Devis,${stats.totalDevis}\n`
    csvContent += `Chiffre d'affaires (TND),${stats.totalRevenue.toFixed(2)}\n`
    csvContent += `Valeur moyenne par devis (TND),${stats.averageValue.toFixed(2)}\n\n`

    // Devis detail section
    csvContent += "=== DÉTAIL DES DEVIS ===\n"
    csvContent += "Date,ID Devis,Client,Email,Établissement,Créé par,Total (TND),Statut Responsable,Statut Admin,Nombre d'articles\n"
    
    devis.forEach(d => {
      const date = new Date(d.createdAt).toLocaleDateString('fr-FR')
      const clientName = d.clientName.replace(/"/g, '""') // Escape quotes
      const email = d.clientEmail.replace(/"/g, '""')
      const etab = (d.etablissement?.name || 'N/A').replace(/"/g, '""')
      const createdBy = `${d.createdBy?.firstName || ''} ${d.createdBy?.lastName || ''}`.trim().replace(/"/g, '""')
      const total = parseFloat(d.total.toString()).toFixed(2)
      const itemsCount = d.items?.length || 0
      
      csvContent += `${date},"${d.id}","${clientName}","${email}","${etab}","${createdBy}",${total},${d.responsableStatus},${d.adminStatus},${itemsCount}\n`
      
      // Add items detail
      if (d.items && d.items.length > 0) {
        d.items.forEach(item => {
          const productName = item.product.name.replace(/"/g, '""')
          const price = parseFloat(item.price.toString()).toFixed(2)
          csvContent += `,,,"Article: ${productName}","Quantité: ${item.quantity}","Prix unitaire: ${price} TND",,,\n`
        })
      }
    })

    csvContent += "\n"

    // Top products section
    csvContent += "=== PRODUITS LES PLUS VENDUS ===\n"
    csvContent += "Produit,Quantité\n"
    
    // Calculate top products
    const productSales: { [key: number]: { name: string; quantity: number } } = {}
    devis.forEach(d => {
      d.items.forEach(item => {
        const productId = item.productId
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
          }
        }
        productSales[productId].quantity += item.quantity
      })
    })

    Object.entries(productSales)
      .map(([_, data]) => ({
        name: data.name,
        value: data.quantity,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .forEach(product => {
        const name = product.name.replace(/"/g, '""')
        csvContent += `"${name}",${product.value}\n`
      })

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dashboard-${startDate}-${endDate}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export dashboard", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}