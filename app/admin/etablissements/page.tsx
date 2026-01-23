"use client"

import { useState } from "react"
import data from "./etablissements.json"

import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"

import { CreateEtablissementDialog } from "./create/page"
import { Button } from "@/components/ui/button"

/* ================= Util ================= */

function downloadEtabCredentials(email: string, password: string) {
  const content = `Identifiants établissement

Email: ${email}
Mot de passe: ${password}
`
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "credentials-etablissement.txt"
  a.click()
  URL.revokeObjectURL(url)
}

/* ================= Page ================= */

export default function EtablissementsPage() {
  const [etablissements, setEtablissements] = useState(data)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.admin} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Établissements</h1>

              {/* Dialog pour créer un établissement */}
              <CreateEtablissementDialog
                onCreate={(newEtab) =>
                  setEtablissements((prev) => [
                    ...prev,
                    {
                      ...newEtab,
                      devisCount: 0,
                      revenue: 0,
                      phone: "",
                      currency: "TND",
                      createdAt: new Date().toISOString(),
                    },
                  ])
                }
              />
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white">
              <Table>
                <TableCaption>
                  Liste des établissements et leurs performances
                </TableCaption>

                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Devis</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-center">Identifiants</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {etablissements.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell>{e.address}</TableCell>
                      <TableCell>{e.email || "-"}</TableCell>
                      <TableCell className="text-center">{e.devisCount}</TableCell>
                      <TableCell className="text-right font-semibold">{e.revenue}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadEtabCredentials(e.email!, e.email!)
                          }
                          disabled={!e.email}
                        >
                          Télécharger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
