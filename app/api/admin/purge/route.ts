import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

type PurgePayload = {
  userId?: string
  password?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PurgePayload
    const userId = typeof body.userId === "string" ? body.userId.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, error: "userId and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, password: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    let isValidPassword = false
    if (user.password?.startsWith("$2")) {
      isValidPassword = await bcrypt.compare(password, user.password)
    } else {
      isValidPassword = password === user.password
      console.warn("WARNING: Password not hashed for user:", user.id)
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const [devisResult, productsResult] = await prisma.$transaction([
      prisma.devis.deleteMany({}),
      prisma.product.deleteMany({}),
    ])

    return NextResponse.json({
      success: true,
      deleted: {
        devis: devisResult.count,
        products: productsResult.count,
      },
    })
  } catch (error) {
    console.error("Admin purge error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
