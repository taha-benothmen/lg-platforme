import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const isActive = searchParams.get("isActive") !== "false"

    const whereClause: any = {}

    if (role) {
      whereClause.role = role
    }

    if (isActive) {
      whereClause.isActive = true
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Server error while fetching users", success: false },
      { status: 500 }
    )
  }
}