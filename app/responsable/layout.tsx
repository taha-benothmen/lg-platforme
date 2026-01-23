import { RouteGuard } from "@/components/route-guard"

export default function ResponsableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard allowedRoles={["RESPONSABLE"]}>
      {children}
    </RouteGuard>
  )
}
