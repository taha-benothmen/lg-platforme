import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Supprimer tous les cookies d'authentification
  response.cookies.set({
    name: "lg_user_id",
    value: "",
    httpOnly: true,
    maxAge: 0, // Expire immédiatement
  })

  response.cookies.set({
    name: "lg_user_role",
    value: "",
    httpOnly: true,
    maxAge: 0,
  })

  response.cookies.set({
    name: "lg_user_email",
    value: "",
    httpOnly: true,
    maxAge: 0,
  })

  console.log("✅ Cookies de logout supprimés")

  return response
}