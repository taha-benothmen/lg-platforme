// app/admin/utilisateurs/page.tsx

"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { menusByRole } from "@/lib/data/menus"

import { CreateUserDialog } from "./create/page"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Trash2, CheckCircle2, AlertCircle, X, Loader2, Edit2, ChevronLeft, ChevronRight } from "lucide-react"

/* ================= Types ================= */

type UserRole = "ADMIN" | "RESPONSABLE" | "ETABLISSEMENT"

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  etablissementId: string | null
}

interface Etablissement {
  id: string
  name: string
  parentId?: string | null
}

interface AlertMessage {
  type: "success" | "error"
  title: string
  message: string
}

/* ================= Constants ================= */

const ITEMS_PER_PAGE = 20

/* ================= Utils ================= */

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Admin",
    RESPONSABLE: "Responsable",
    ETABLISSEMENT: "Établissement",
  }
  return labels[role]
}

function getRoleColor(role: UserRole) {
  const colors: Record<UserRole, string> = {
    ADMIN: "bg-red-100 text-red-800",
    RESPONSABLE: "bg-blue-100 text-blue-800",
    ETABLISSEMENT: "bg-green-100 text-green-800",
  }
  return colors[role]
}

/* ================= Page ================= */

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    // ✅ OPTIMIZED: Load établissements ONCE on mount
    fetchEtablissements()
    // Load first page of users
    fetchUsers(1)
  }, [])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  // ✅ OPTIMIZED: Separate function to fetch établissements (only once)
  const fetchEtablissements = async () => {
    try {
      const etabResponse = await fetch("/api/etablissements")
      if (!etabResponse.ok) throw new Error("Erreur lors du chargement des établissements")
      const etabData = await etabResponse.json()
      setEtablissements(etabData)
      console.log("✅ Établissements loaded once")
    } catch (error) {
      console.error("Erreur:", error)
      setAlertMessage({
        type: "error",
        title: "Erreur",
        message: "Erreur lors du chargement des établissements",
      })
    }
  }

  // ✅ OPTIMIZED: Separate function to fetch users (with pagination)
  const fetchUsers = async (page: number = 1) => {
    try {
      const isFirstPage = page === 1
      isFirstPage ? setIsLoading(true) : setIsLoadingMore(true)
      
      // ✅ Fetch ONLY users with pagination
      const usersResponse = await fetch(
        `/api/etablissements?type=users&page=${page}&limit=${ITEMS_PER_PAGE}`
      )
      if (!usersResponse.ok) throw new Error("Erreur lors du chargement des utilisateurs")
      const usersData = await usersResponse.json()
      
      console.log(`📊 Users: Page ${page}`, usersData)
      
      setUsers(usersData.data || [])
      setTotalUsers(usersData.pagination?.total || 0)
      setTotalPages(usersData.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch (error) {
      console.error("Erreur:", error)
      setAlertMessage({
        type: "error",
        title: "Erreur",
        message: "Erreur lors du chargement des utilisateurs",
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const getEtablissementName = (etabId: string | null) => {
    if (!etabId) return "-"
    const etab = etablissements.find((e) => e.id === etabId)
    return etab?.name || "Unknown"
  }

  const getEtablissementBreadcrumb = (etabId: string | null) => {
    if (!etabId) return "-"

    const buildPath = (id: string): string[] => {
      const etab = etablissements.find((e) => e.id === id)
      if (!etab) return []

      if (etab.parentId) {
        return [...buildPath(etab.parentId), etab.name]
      }
      return [etab.name]
    }

    const path = buildPath(etabId)
    return path.join(" > ")
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) {
      return
    }

    setDeletingId(userId)
    try {
      const response = await fetch(`/api/utilisateurs/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur de suppression")
      }

      setUsers(users.filter((u) => u.id !== userId))
      setAlertMessage({
        type: "success",
        title: "Succès",
        message: "Utilisateur supprimé avec succès",
      })
      // Refresh data to update counts
      fetchUsers(currentPage)
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Erreur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // ✅ Page navigation
  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    fetchUsers(pageNum)
  }

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <div className="flex h-screen w-screen">
          <AppSidebar menu={menusByRole.admin} />
          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Chargement...</span>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-screen">
        <AppSidebar menu={menusByRole.admin} />

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />

          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
            {/* Alert */}
            {alertMessage && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                <Alert
                  variant={alertMessage.type === "success" ? "default" : "destructive"}
                  className={
                    alertMessage.type === "success" ? "bg-green-50 border-green-200" : ""
                  }
                >
                  {alertMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{alertMessage.title}</AlertTitle>
                  <AlertDescription>{alertMessage.message}</AlertDescription>
                  <button
                    onClick={() => setAlertMessage(null)}
                    className="absolute top-4 right-4"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Alert>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Utilisateurs</h1>
                <p className="text-gray-600 mt-1">
                  Gérez les utilisateurs du système
                </p>
              </div>

              {/* Dialog pour créer un utilisateur */}
              <CreateUserDialog onUserCreated={() => fetchUsers(1)} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm font-medium text-blue-600">Total</div>
                <div className="text-2xl font-bold text-blue-900">{totalUsers}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm font-medium text-red-600">Admins</div>
                <div className="text-2xl font-bold text-red-900">
                  {users.filter((u) => u.role === "ADMIN").length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm font-medium text-green-600">Actifs</div>
                <div className="text-2xl font-bold text-green-900">
                  {users.filter((u) => u.isActive).length}
                </div>
              </div>
            </div>

            {/* Table */}
            {users.length === 0 ? (
              <div className="rounded-lg border bg-white overflow-hidden">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Aucun utilisateur</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>
                        Total: {totalUsers} utilisateurs
                      </TableCaption>

                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Établissement</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell className="text-sm">{user.phone || "-"}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-gray-600">
                                {getEtablissementBreadcrumb(user.etablissementId)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                                  user.role
                                )}`}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.isActive ? "Actif" : "Inactif"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deletingId === user.id}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deletingId === user.id}
                                >
                                  {deletingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                      {isLoadingMore && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingMore}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Précédent</span>
                      </Button>

                      {/* Smart page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          const showPage =
                            page <= 2 ||
                            page >= totalPages - 1 ||
                            (page >= currentPage - 1 && page <= currentPage + 1)

                          return (
                            <div key={page}>
                              {showPage ? (
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => goToPage(page)}
                                  disabled={isLoadingMore}
                                  className="w-10"
                                >
                                  {page}
                                </Button>
                              ) : page === 3 ? (
                                <span className="px-2 text-muted-foreground">...</span>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoadingMore}
                        className="gap-2"
                      >
                        <span className="hidden sm:inline">Suivant</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {ITEMS_PER_PAGE} lignes/page
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}