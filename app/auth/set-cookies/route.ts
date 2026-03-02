import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, role, email } = await request.json()

    // Valider les données
    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Créer la réponse
    const response = NextResponse.json({ success: true })

    // Setter les cookies avec la clé que le middleware attend
    response.cookies.set({
      name: "lg_user_id",
      value: String(userId),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    response.cookies.set({
      name: "lg_user_role",
      value: role,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    response.cookies.set({
      name: "lg_user_email",
      value: email,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })


    return response
  } catch (error) {
    console.error("Erreur lors de la définition des cookies:", error)
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    )
  }
}