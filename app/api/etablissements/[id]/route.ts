import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params  

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      )
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
    })

    if (!etablissement) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(etablissement)
  } catch (error) {
    console.error("Error fetching etablissement:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params  

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, address, email, phone, parentId } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: "Nom et adresse sont obligatoires" },
        { status: 400 }
      )
    }

    const existingEtab = await prisma.etablissement.findUnique({
      where: { id },
    })

    if (!existingEtab) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      )
    }

    const etablissement = await prisma.etablissement.update({
      where: { id },
      data: {
        name,
        address,
        email: email || null,
        phone: phone || null,
        parentId: parentId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        parentId: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(etablissement)
  } catch (error) {
    console.error("Error updating etablissement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params  

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      )
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
    })

    if (!etablissement) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      )
    }

    await prisma.etablissement.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting etablissement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}