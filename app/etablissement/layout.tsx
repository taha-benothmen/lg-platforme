import { RouteGuard } from "@/components/route-guard"

export default function EtablissementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["ETABLISSEMENT"]}>
      {children}
    </RouteGuard>
  )
}
