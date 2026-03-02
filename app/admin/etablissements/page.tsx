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
import { Trash2, CheckCircle2, AlertCircle, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

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

const ITEMS_PER_PAGE = 20

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

// ─── Mobile user card ─────────────────────────────────────────────────────────

function UserCard({
  user,
  etablissementBreadcrumb,
  onDelete,
  isDeleting,
}: {
  user: User
  etablissementBreadcrumb: string
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      {/* Top row: name + role badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Téléphone</span>
        <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Établissement</span>
        <span className="text-gray-700 truncate">{user.phone || "—"}</span>
        <span className="text-gray-600 truncate text-xs">{etablissementBreadcrumb}</span>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(user.id)}
          disabled={isDeleting}
          className="gap-1.5"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Supprimer
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    fetchEtablissements()
    fetchUsers(1)
  }, [])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const fetchEtablissements = async () => {
    try {
      const res = await fetch("/api/etablissements")
      if (!res.ok) throw new Error()
      setEtablissements(await res.json())
    } catch {
      setAlertMessage({ type: "error", title: "Erreur", message: "Erreur lors du chargement des établissements" })
    }
  }

  const fetchUsers = async (page: number = 1) => {
    try {
      page === 1 ? setIsLoading(true) : setIsLoadingMore(true)
      const res = await fetch(`/api/etablissements?type=users&page=${page}&limit=${ITEMS_PER_PAGE}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.data || [])
      setTotalUsers(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
      setAlertMessage({ type: "error", title: "Erreur", message: "Erreur lors du chargement des utilisateurs" })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const getEtablissementBreadcrumb = (etabId: string | null) => {
    if (!etabId) return "—"
    const buildPath = (id: string): string[] => {
      const etab = etablissements.find((e) => e.id === id)
      if (!etab) return []
      return etab.parentId ? [...buildPath(etab.parentId), etab.name] : [etab.name]
    }
    return buildPath(etabId).join(" > ")
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) return
    setDeletingId(userId)
    try {
      const res = await fetch(`/api/utilisateurs/${userId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur de suppression")
      }
      setAlertMessage({ type: "success", title: "Succès", message: "Utilisateur supprimé avec succès" })
      fetchUsers(currentPage)
    } catch (error) {
      setAlertMessage({ type: "error", title: "Erreur", message: error instanceof Error ? error.message : "Erreur inconnue" })
    } finally {
      setDeletingId(null)
    }
  }

  const goToPage = (page: number) => fetchUsers(Math.max(1, Math.min(page, totalPages)))

  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  if (isLoading) return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar menu={menusByRole.admin} />
      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Chargement...</span>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar menu={menusByRole.admin} />

      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* Alert */}
          {alertMessage && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2">
              <Alert
                variant={alertMessage.type === "success" ? "default" : "destructive"}
                className={alertMessage.type === "success" ? "bg-green-50 border-green-200" : ""}
              >
                {alertMessage.type === "success"
                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                  : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{alertMessage.title}</AlertTitle>
                <AlertDescription>{alertMessage.message}</AlertDescription>
                <button onClick={() => setAlertMessage(null)} className="absolute top-4 right-4">
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            </div>
          )}

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Utilisateurs</h1>
              <p className="text-gray-600 mt-1 text-sm">Gérez les utilisateurs du système</p>
            </div>
            <CreateUserDialog onUserCreated={() => fetchUsers(1)} />
          </div>

          {/* Stats — 3 cols always, compact on mobile */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
              <div className="text-xs sm:text-sm font-medium text-blue-600">Total</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-900">{totalUsers}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 sm:p-4 border border-red-200">
              <div className="text-xs sm:text-sm font-medium text-red-600">Admins</div>
              <div className="text-xl sm:text-2xl font-bold text-red-900">
                {users.filter((u) => u.role === "ADMIN").length}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-200">
              <div className="text-xs sm:text-sm font-medium text-green-600">Actifs</div>
              <div className="text-xl sm:text-2xl font-bold text-green-900">
                {users.filter((u) => u.isActive).length}
              </div>
            </div>
          </div>

          {/* Content */}
          {users.length === 0 ? (
            <div className="rounded-xl border bg-white">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun utilisateur</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── Desktop table (hidden on mobile) ── */}
              <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Total: {totalUsers} utilisateurs</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Établissement</TableHead>
                        <TableHead>Rôle</TableHead>
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
                          <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {getEtablissementBreadcrumb(user.etablissementId)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingId === user.id}
                            >
                              {deletingId === user.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* ── Mobile cards (hidden on md+) ── */}
              <div className="md:hidden space-y-3">
                <p className="text-xs text-gray-400 text-right">Total: {totalUsers} utilisateurs</p>
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    etablissementBreadcrumb={getEtablissementBreadcrumb(user.etablissementId)}
                    onDelete={handleDeleteUser}
                    isDeleting={deletingId === user.id}
                  />
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                    {isLoadingMore && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingMore}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const show =
                        page <= 2 ||
                        page >= totalPages - 1 ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      return (
                        <div key={page}>
                          {show ? (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              disabled={isLoadingMore}
                              className="w-9"
                            >
                              {page}
                            </Button>
                          ) : page === 3 ? (
                            <span className="px-1 text-muted-foreground">…</span>
                          ) : null}
                        </div>
                      )
                    })}

                    <Button
                      variant="outline" size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoadingMore}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground hidden sm:block">
                    {ITEMS_PER_PAGE} lignes/page
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}