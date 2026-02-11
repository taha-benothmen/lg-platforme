import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant", success: false },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        etablissementId: true,
        createdAt: true,
        updatedAt: true,
        etablissement: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            isActive: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!user) {
      console.warn(`Utilisateur non trouvé: ${id}`)
      return NextResponse.json(
        { error: "Utilisateur non trouvé", success: false },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        etablissementId: user.etablissementId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        etablissement: user.etablissement,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur lors du chargement de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone } = body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    )
  }
}