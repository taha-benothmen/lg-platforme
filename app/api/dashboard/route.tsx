import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDashboardData } from "@/lib/dashboard-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const start = startDate
      ? new Date(startDate + "T00:00:00")
      : new Date(new Date().setDate(new Date().getDate() - 30))
    const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

    const payload = await buildDashboardData(prisma, { start, end })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
