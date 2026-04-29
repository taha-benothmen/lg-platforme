import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Plus, AlertCircle, CheckCircle2, Download, Trash2 } from "lucide-react"

type UserRole = "ADMIN" | "RESPONSABLE" | "ETABLISSEMENT"

interface Etablissement {
  id: string
  name: string
  parentId?: string | null
  email?: string
  address?: string
  phone?: string
}

interface CreatedUser {
  email: string
  password: string
  role: UserRole
  firstName?: string
  lastName?: string
}

function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$"
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("")
}

function downloadUserFile(user: CreatedUser) {
  const content = `Email: ${user.email}\nMot de passe: ${user.password}\nRôle: ${user.role}\n${user.firstName ? `Prénom: ${user.firstName}\n` : ""}${user.lastName ? `Nom: ${user.lastName}\n` : ""}`
  const element = document.createElement("a")
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content))
  element.setAttribute("download", `user_${user.email}.txt`)
  element.style.display = "none"
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

export function CreateUserDialog({ onUserCreated }: { onUserCreated: () => void }) {
  const [role, setRole] = useState<UserRole>("RESPONSABLE")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null)

  const [allEtablissements, setAllEtablissements] = useState<Etablissement[]>([])
  const [childEtablissements, setChildEtablissements] = useState<Etablissement[]>([])

  const [selectedParentId, setSelectedParentId] = useState<string>("")
  const [selectedEtablissementId, setSelectedEtablissementId] = useState<string>("")

  const [showNewParentForm, setShowNewParentForm] = useState(false)
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  
  const [newEtabName, setNewEtabName] = useState("")
  const [newEtabEmail, setNewEtabEmail] = useState("")
  const [newEtabAddress, setNewEtabAddress] = useState("")
  const [newEtabPhone, setNewEtabPhone] = useState("")

  const [newChildName, setNewChildName] = useState("")
  const [newChildEmail, setNewChildEmail] = useState("")
  const [newChildAddress, setNewChildAddress] = useState("")
  const [newChildPhone, setNewChildPhone] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (isOpen && (role === "RESPONSABLE" || role === "ETABLISSEMENT")) {
      fetchEtablissements()
    }
  }, [isOpen, role])

  const fetchEtablissements = async () => {
    try {
      const response = await fetch("/api/etablissements")
      if (response.ok) {
        const data = await response.json()
        setAllEtablissements(data)
      }
    } catch (err) {
      console.error("Error fetching établissements:", err)
    }
  }

  const fetchChildEtablissements = async (parentId: string) => {
    try {
      const response = await fetch(`/api/etablissements?parentId=${parentId}`)
      if (response.ok) {
        const data = await response.json()
        setChildEtablissements(data)
      }
    } catch (err) {
      console.error("Error fetching child établissements:", err)
      setChildEtablissements([])
    }
  }

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setSelectedParentId("")
    setSelectedEtablissementId("")
    setShowNewParentForm(false)
    setShowNewChildForm(false)
    setChildEtablissements([])
  }

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId)
    setSelectedEtablissementId("")
    setShowNewChildForm(false)
    if (parentId) {
      fetchChildEtablissements(parentId)
    } else {
      setChildEtablissements([])
    }
  }

  const deleteEtablissement = async (etablissementId: string, etablissementName: string, isParent = false) => {
    try {
      // Nettoyer l'ID pour s'assurer qu'il ne contient pas de paramètres
      const cleanId = etablissementId.split('?')[0]
      
      // Pour les établissements principaux (isParent=true), on utilise toujours cascade=true
      // pour éviter les problèmes de détection d'enfants qui pourraient être inactifs
      const hasChildren = isParent
      
      const confirmMessage = hasChildren 
        ? `Êtes-vous sûr de vouloir supprimer l'établissement "${etablissementName}" et tous ses sous-établissements ?\n\n⚠️ Tous les utilisateurs associés seront également supprimés.`
        : `Êtes-vous sûr de vouloir supprimer l'établissement "${etablissementName}" ?\n\n⚠️ Tous les utilisateurs associés seront également supprimés.`

      if (!confirm(confirmMessage)) {
        return
      }
      
      const cascadeParam = hasChildren ? "&cascade=true&deleteUsers=true" : "&deleteUsers=true"
      const url = `/api/etablissements?id=${cleanId}${cascadeParam}`
      
      const response = await fetch(url, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        
        // Essayer d'extraire un message d'erreur plus détaillé
        let errorMessage = "Erreur lors de la suppression"
        if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        } else if (response.statusText) {
          errorMessage = `Erreur HTTP: ${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Rafraîchir les listes
      fetchEtablissements()
      if (selectedParentId === etablissementId) {
        setSelectedParentId("")
        setSelectedEtablissementId("")
        setChildEtablissements([])
      } else if (selectedEtablissementId === etablissementId) {
        setSelectedEtablissementId("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setPhone("")
    setRole("RESPONSABLE")
    setSelectedParentId("")
    setSelectedEtablissementId("")
    setShowNewParentForm(false)
    setShowNewChildForm(false)
    setNewEtabName("")
    setNewEtabEmail("")
    setNewEtabAddress("")
    setNewEtabPhone("")
    setNewChildName("")
    setNewChildEmail("")
    setNewChildAddress("")
    setNewChildPhone("")
    setChildEtablissements([])
  }

  const isFormValid = () => {
    if (!email || !password) return false
    if (role === "ADMIN") return true
    if (role === "RESPONSABLE" || role === "ETABLISSEMENT") {
      if (showNewParentForm) {
        return newEtabName && newEtabAddress
      }
      return selectedParentId
    }
    return false
  }

  const createNewParent = async () => {
    if (!newEtabName || !newEtabAddress) {
      setError("Nom et adresse sont obligatoires")
      return
    }

    try {
      const response = await fetch("/api/etablissements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "etablissement",
          name: newEtabName,
          email: newEtabEmail || null,
          address: newEtabAddress,
          phone: newEtabPhone || null,
          parentId: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      const newEtab = await response.json()
      setSelectedParentId(newEtab.id)
      setAllEtablissements([...allEtablissements, newEtab])
      setShowNewParentForm(false)
      setNewEtabName("")
      setNewEtabEmail("")
      setNewEtabAddress("")
      setNewEtabPhone("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    }
  }

  const createNewChild = async () => {
    if (!newChildName || !newChildAddress) {
      setError("Nom et adresse du sous-établissement sont obligatoires")
      return
    }

    try {
      const response = await fetch("/api/etablissements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "etablissement",
          name: newChildName,
          email: newChildEmail || null,
          address: newChildAddress,
          phone: newChildPhone || null,
          parentId: selectedParentId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      const newChild = await response.json()
      setSelectedEtablissementId(newChild.id)
      setChildEtablissements([...childEtablissements, newChild])
      setShowNewChildForm(false)
      setNewChildName("")
      setNewChildEmail("")
      setNewChildAddress("")
      setNewChildPhone("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let etablissementId = selectedEtablissementId || selectedParentId

      if ((role === "RESPONSABLE" || role === "ETABLISSEMENT") && !etablissementId) {
        throw new Error("Veuillez sélectionner ou créer un établissement")
      }

      const response = await fetch("/api/etablissements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          email,
          password,
          role,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          etablissementId: etablissementId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      setCreatedUser({
        email,
        password,
        role,
        firstName,
        lastName,
      })
      setShowExportModal(true)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Création d'un compte utilisateur avec rôle
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="RESPONSABLE">Responsable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilisateur@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    value={password}
                    readOnly
                    className="font-mono text-sm"
                    placeholder="Générer un mot de passe"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPassword(generatePassword())}
                  >
                    Générer
                  </Button>
                </div>
              </div>
            </div>

            {role === "ADMIN" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Compte admin créé avec email et mot de passe uniquement
              </div>
            )}

            {(role === "RESPONSABLE" || role === "ETABLISSEMENT") && (
              <div className="space-y-4 pt-2 border-t">
                <Label className="font-semibold text-base">Établissement</Label>

                {!showNewParentForm ? (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="parent" className="text-sm">
                        Établissement Principal
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={selectedParentId}
                          onValueChange={handleParentChange}
                        >
                          <SelectTrigger id="parent" className="flex-1">
                            <SelectValue placeholder="Sélectionner un établissement" />
                          </SelectTrigger>
                          <SelectContent>
                            {allEtablissements
                              .filter((e) => !e.parentId)
                              .map((etab) => (
                                <SelectItem key={etab.id} value={etab.id}>
                                  {etab.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewParentForm(true)}
                          title="Créer un établissement"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {selectedParentId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => deleteEtablissement(selectedParentId, allEtablissements.find(e => e.id === selectedParentId)?.name || '', true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Supprimer cet établissement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedParentId && (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium">Sous-établissements</Label>

                        {childEtablissements.length > 0 ? (
                          <div className="flex gap-2">
                            <Select
                              value={selectedEtablissementId}
                              onValueChange={setSelectedEtablissementId}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Sélectionner un sous-établissement" />
                              </SelectTrigger>
                              <SelectContent>
                                {childEtablissements.map((etab) => (
                                  <SelectItem key={etab.id} value={etab.id}>
                                    {etab.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowNewChildForm(!showNewChildForm)}
                              title="Créer un sous-établissement"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {selectedEtablissementId && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => deleteEtablissement(selectedEtablissementId, childEtablissements.find(e => e.id === selectedEtablissementId)?.name || '')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Supprimer ce sous-établissement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <p className="text-sm text-gray-500 flex-1">
                              Aucun sous-établissement
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowNewChildForm(true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {showNewChildForm && (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <Input
                              value={newChildName}
                              onChange={(e) => setNewChildName(e.target.value)}
                              placeholder="Nom du sous-établissement"
                            />
                            <Input
                              value={newChildAddress}
                              onChange={(e) => setNewChildAddress(e.target.value)}
                              placeholder="Adresse"
                            />
                            <Input
                              type="email"
                              value={newChildEmail}
                              onChange={(e) => setNewChildEmail(e.target.value)}
                              placeholder="Email"
                            />
                            <Input
                              type="tel"
                              value={newChildPhone}
                              onChange={(e) => setNewChildPhone(e.target.value)}
                              placeholder="Téléphone"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={createNewChild}
                                className="flex-1"
                              >
                                Créer
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowNewChildForm(false)
                                  setNewChildName("")
                                  setNewChildEmail("")
                                  setNewChildAddress("")
                                  setNewChildPhone("")
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="font-medium">Nouvel établissement</Label>
                    <Input
                      value={newEtabName}
                      onChange={(e) => setNewEtabName(e.target.value)}
                      placeholder="Nom"
                    />
                    <Input
                      value={newEtabAddress}
                      onChange={(e) => setNewEtabAddress(e.target.value)}
                      placeholder="Adresse"
                    />
                    <Input
                      type="email"
                      value={newEtabEmail}
                      onChange={(e) => setNewEtabEmail(e.target.value)}
                      placeholder="Email"
                    />
                    <Input
                      type="tel"
                      value={newEtabPhone}
                      onChange={(e) => setNewEtabPhone(e.target.value)}
                      placeholder="Téléphone"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={createNewParent}
                        className="flex-1"
                      >
                        Créer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewParentForm(false)
                          setNewEtabName("")
                          setNewEtabEmail("")
                          setNewEtabAddress("")
                          setNewEtabPhone("")
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(role === "RESPONSABLE" || role === "ETABLISSEMENT") && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="font-semibold text-base">
                  Détails du {role === "RESPONSABLE" ? "Responsable" : "Représentant"}
                </Label>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                  />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                  />
                </div>

                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Téléphone"
                />
              </div>
            )}

            <DialogFooter className="pt-4 border-t gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={!isFormValid() || isLoading}>
                {isLoading ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* EXPORT MODAL */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Utilisateur créé avec succès</DialogTitle>
            <DialogDescription>
              Comment voulez-vous partager les identifiants ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Succès</AlertTitle>
              <AlertDescription className="text-green-800">
                L'utilisateur <strong>{createdUser?.email}</strong> a été créé
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Identifiants:</p>
              <div className="bg-gray-100 p-3 rounded text-sm space-y-1 font-mono">
                <div>Email: <strong>{createdUser?.email}</strong></div>
                <div>Mot de passe: <strong>{createdUser?.password}</strong></div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:flex-col">
            <Button
              onClick={() => downloadUserFile(createdUser!)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button
              onClick={() => {
                setShowExportModal(false)
                setIsOpen(false)
                onUserCreated()
              }}
              variant="ghost"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
