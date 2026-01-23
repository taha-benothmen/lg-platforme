import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function HomePage() {
  // Récupérer le rôle depuis les cookies
  const cookieStore = await cookies()
  const role = cookieStore.get("lg_user_role")?.value

  // Rediriger selon le rôle
  if (role === "ADMIN") redirect("/admin/dashboard")
  if (role === "ETABLISSEMENT") redirect("/etablissement/produits")
  if (role === "RESPONSABLE") redirect("/responsable/produits")

  // Si pas de rôle, rediriger vers login
  redirect("/auth/login")
}
