import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const routeMap: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  ETABLISSEMENT: "/etablissement/produits",
  RESPONSABLE: "/responsable/produits",
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    let isValidPassword = false
    if (user.password.startsWith("$2")) {
      isValidPassword = await bcrypt.compare(password, user.password)
    } else {
      isValidPassword = password === user.password
      console.warn("WARNING: Password not hashed for user:", user.email)
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const userSession = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      route: routeMap[user.role] ?? "/auth/login",
    }

    const response = NextResponse.json({ success: true, user: userSession })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }

    // ✅ Set all 3 cookies in one place — no need for /api/auth/set-cookies
    response.cookies.set("lg_user_id", user.id, cookieOptions)
    response.cookies.set("lg_user_role", user.role, cookieOptions)
    response.cookies.set("lg_user_email", user.email, cookieOptions)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}