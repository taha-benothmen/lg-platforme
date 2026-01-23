"use client";

import { useState } from "react";
import quotesData from "./quotes.json";

import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { menusByRole } from "@/lib/data/menus";
import { Button } from "@/components/ui/button";

/* ================= Utils ================= */

function downloadQuote(quote: any) {
  const content = `Devis #${quote.id}

Client: ${quote.client}
Date: ${quote.date}
Total: ${quote.total} DT
État: ${quote.etat}
Produits: ${quote.produits.join(", ")}
`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `devis-${quote.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function shareQuote(quote: any) {
  const text = `Devis #${quote.id} pour ${quote.client} : ${quote.total} DT. Produits: ${quote.produits.join(
    ", "
  )}. État: ${quote.etat}.`;
  if (navigator.share) {
    navigator
      .share({
        title: `Devis #${quote.id}`,
        text,
      })
      .catch((err) => console.error("Erreur partage :", err));
  } else {
    alert("Partage non supporté sur ce navigateur !");
  }
}

function getEtatStyle(etat: string) {
  switch (etat) {
    case "attend accord client":
      return "bg-yellow-400 text-black";
    case "attend accord responsable":
      return "bg-orange-500 text-white";
    case "done":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-300 text-black";
  }
}

/* ================= Page ================= */

export default function DevisPage() {
  const [quotes] = useState(quotesData);

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
            <h1 className="text-2xl font-bold mb-6">Liste des Devis</h1>

            <div className="rounded-lg border bg-white">
              <Table>
                <TableCaption>Liste des devis clients</TableCaption>

                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {quotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.id}</TableCell>
                      <TableCell>{q.client}</TableCell>
                      <TableCell>{q.date}</TableCell>
                      <TableCell>{q.total} DT</TableCell>

                      {/* Colonne État affichée telle qu’indiquée dans le JSON */}
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded ${getEtatStyle(q.etat)}`}
                        >
                          {q.etat}
                        </span>
                      </TableCell>

                      <TableCell>{q.produits.join(", ")}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => downloadQuote(q)}>
                          Télécharger
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => shareQuote(q)}>
                          Partager
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
  );
}
