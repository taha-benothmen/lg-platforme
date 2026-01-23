import { DevisStatus } from "@prisma/client";

export function getStatusBadgeVariant(status: DevisStatus | string): "success" | "warning" | "rose" | "secondary" | "outline" {
  const statusMap: Record<string, "success" | "warning" | "rose" | "secondary" | "outline"> = {
    APPROUVE: "success",
    ACCEPTE: "success",
    ENVOYE: "warning",
    BROUILLON: "outline",
    SUSPENDU: "secondary",
    REJETE: "rose",
  };

  return statusMap[status] || "outline";
}

export function getStatusLabel(status: DevisStatus | string): string {
  const labelMap: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    APPROUVE: "Approuvé",
    SUSPENDU: "Suspendu",
    REJETE: "Rejeté",
    ACCEPTE: "Accepté",
  };

  return labelMap[status] || status;
}
