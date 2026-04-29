import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email"

type UserRole = "ADMIN" | "RESPONSABLE" | "ETABLISSEMENT"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const parentId = searchParams.get("parentId")
  const userId = searchParams.get("userId")
  
  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  if (type === "users") {
    try {
      const skip = (page - 1) * limit
      const total = await prisma.user.count()
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      })


      return NextResponse.json({
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        { error: "Erreur lors du chargement des utilisateurs" },
        { status: 500 }
      )
    }
  }

  try {
    if (parentId && parentId !== "null") {
      const etablissements = await prisma.etablissement.findMany({
        where: {
          parentId: parentId,
          isActive: true, // Ne retourner que les établissements actifs
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      return NextResponse.json(etablissements)
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementId: true },
      })

      if (!user || !user.etablissementId) {
        return NextResponse.json([])
      }

      const userEtab = await prisma.etablissement.findUnique({
        where: { id: user.etablissementId },
        select: { id: true, name: true, parentId: true },
      })

      if (!userEtab) {
        return NextResponse.json([])
      }

      if (userEtab.parentId) {
        return NextResponse.json([
          {
            id: userEtab.id,
            name: userEtab.name,
            parentId: userEtab.parentId,
          },
        ])
      }

      const childEtablissements = await prisma.etablissement.findMany({
        where: {
          parentId: userEtab.id,
          isActive: true, // Ne retourner que les établissements actifs
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(childEtablissements)
    }

    const allEtablissements = await prisma.etablissement.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
      },
      where: {
        isActive: true, // Ne retourner que les établissements actifs
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(allEtablissements)
  } catch (error) {
    console.error("Error fetching établissements:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des établissements" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "user") {
      const {
        email,
        firstName,
        lastName,
        phone,
        role,
        password,
        etablissementId,
      } = body

      if (!email || !password || !role) {
        return NextResponse.json(
          { error: "Email, password et role sont obligatoires" },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Cet email existe déjà" },
          { status: 400 }
        )
      }

      const validRoles: UserRole[] = ["ADMIN", "RESPONSABLE", "ETABLISSEMENT"]
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        )
      }
      if ((role === "RESPONSABLE" || role === "ETABLISSEMENT") && !etablissementId) {
        return NextResponse.json(
          { error: `Un établissement est obligatoire pour le rôle ${role}` },
          { status: 400 }
        )
      }

      const user = await prisma.user.create({
        data: {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          role,
          isActive: true,
          etablissementId: etablissementId || undefined,
        },
      })

      try {
        await emailService.sendCredentialsEmail(
          email,
          firstName || '',
          email,
          password,
          role
        )
        console.log(`Credentials email sent to ${email}`)
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError)
        // Ne pas bloquer la création de l'utilisateur si l'email échoue
        // Mais logger l'erreur pour le suivi
      }

      return NextResponse.json(user, { status: 201 })
    }

    const { name, address, email, phone, parentId } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: "Nom et adresse sont obligatoires" },
        { status: 400 }
      )
    }

    const etablissement = await prisma.etablissement.create({
      data: {
        name,
        address,
        email: email || undefined,
        phone: phone || undefined,
        parentId: parentId || undefined,
        isActive: true,
      },
    })

    return NextResponse.json(etablissement, { status: 201 })
  } catch (error) {
    console.error("Error creating:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const cascade = searchParams.get('cascade') === 'true'
    const deleteUsers = searchParams.get('deleteUsers') === 'true'

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'établissement requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'établissement existe
    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            users: true
          }
        },
        users: true
      }
    })

    if (!etablissement) {
      return NextResponse.json(
        { error: `Établissement non trouvé. ID: ${id}` },
        { status: 404 }
      )
    }

    let totalUsersToDelete = 0
    let totalEtablissementsToDelete = 1

    // Gérer les utilisateurs de l'établissement principal
    if (etablissement.users.length > 0) {
      if (!deleteUsers) {
        return NextResponse.json(
          { error: `Cet établissement a ${etablissement.users.length} utilisateur(s) associé(s). Utilisez ?deleteUsers=true pour supprimer également les utilisateurs` },
          { status: 400 }
        )
      }
      totalUsersToDelete += etablissement.users.length
    }

    // Gérer les sous-établissements
    if (etablissement.children.length > 0) {
      if (!cascade) {
        return NextResponse.json(
          { error: "Cet établissement a des sous-établissements. Utilisez ?cascade=true pour supprimer également les sous-établissements" },
          { status: 400 }
        )
      }

      totalEtablissementsToDelete += etablissement.children.length

      // Compter les utilisateurs dans les sous-établissements
      const allChildUsers = etablissement.children.reduce((total, child) => total + child.users.length, 0)
      
      if (allChildUsers > 0) {
        if (!deleteUsers) {
          return NextResponse.json(
            { error: `Les sous-établissements ont ${allChildUsers} utilisateur(s) associé(s). Utilisez ?deleteUsers=true pour supprimer également les utilisateurs` },
            { status: 400 }
          )
        }
        totalUsersToDelete += allChildUsers
      }

      // Supprimer les utilisateurs des sous-établissements en cascade si demandé
      if (deleteUsers) {
        const childIds = etablissement.children.map(child => child.id)
        await prisma.user.updateMany({
          where: { etablissementId: { in: childIds } },
          data: { isActive: false }
        })
      }

      // Supprimer les sous-établissements en cascade
      await prisma.etablissement.updateMany({
        where: { parentId: id },
        data: { isActive: false }
      })
    }

    // Supprimer les utilisateurs de l'établissement principal si demandé
    if (deleteUsers && etablissement.users.length > 0) {
      await prisma.user.updateMany({
        where: { etablissementId: id },
        data: { isActive: false }
      })
    }

    // Supprimer l'établissement principal (soft delete)
    await prisma.etablissement.update({
      where: { id },
      data: { isActive: false }
    })

    let message = "Établissement supprimé avec succès"
    if (cascade && deleteUsers) {
      message = `Établissement, ses sous-établissements (${etablissement.children.length}) et les utilisateurs associés (${totalUsersToDelete}) supprimés avec succès`
    } else if (cascade) {
      message = `Établissement et ses sous-établissements (${etablissement.children.length}) supprimés avec succès`
    } else if (deleteUsers) {
      message = `Établissement et ses utilisateurs (${totalUsersToDelete}) supprimés avec succès`
    }

    return NextResponse.json(
      { 
        message, 
        deletedCount: totalEtablissementsToDelete,
        deletedUsers: totalUsersToDelete
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting établissement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}