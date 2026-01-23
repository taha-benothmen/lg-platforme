"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/status-utils"
import { getDevisList } from "@/app/actions/devis"

function downloadQuote(quote: any) {
  const content = `Devis #${quote.id}

Client: ${quote.clientName}
Email: ${quote.clientEmail}
Date: ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}
Total: ${quote.total} TND
État: ${getStatusLabel(quote.status)}

Produits:
${quote.items?.map((p: any) => `- ${p.quantity}x @ ${p.price} TND = ${(p.price * p.quantity).toFixed(2)} TND`).join("\n")}
`;

  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `devis-${quote.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DevisPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDevis() {
      const result = await getDevisList("ADMIN")
      if (result.success) {
        setQuotes(result.devis || [])
      }
      setLoading(false)
    }
    loadDevis()
  }, [])

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.admin} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-6">Liste des Devis</h1>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Chargement des devis...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Aucun devis trouvé</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-white overflow-x-auto">
                <Table>
                  <TableCaption>Liste complète des devis</TableCaption>

                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {quotes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.id}</TableCell>
                        <TableCell>{q.clientName}</TableCell>
                        <TableCell className="text-sm">{q.clientEmail}</TableCell>
                        <TableCell>
                          {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>{q.total.toFixed(2)} TND</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(q.status)}>
                            {getStatusLabel(q.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQuote(q)}
                          >
                            Télécharger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
