"use client"

import { useState } from "react"
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

/* ================= Utils ================= */

function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$"
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("")
}

function downloadCredentials(email: string, password: string) {
  const content = `Identifiants établissement

Email: ${email}
Mot de passe: ${password}
`
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "credentials-etablissement.txt"
  a.click()
  URL.revokeObjectURL(url)
}

/* ================= Component ================= */

type Props = {
  onCreate: (etablissement: {
    id: string
    name: string
    address: string
    email: string
    password: string
  }) => void
}

export function CreateEtablissementDialog({ onCreate }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newEtablissement = {
      id: `ETB${Date.now()}`,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      email,
      password,
    }

    onCreate(newEtablissement)
    downloadCredentials(email, password)

    setEmail("")
    setPassword("")
    setIsOpen(false) // fermer le Dialog après download
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>+ Ajouter un établissement</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouvel établissement</DialogTitle>
          <DialogDescription>
            Création de l’établissement et de son compte d’accès
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label>Nom</Label>
            <Input name="name" required />
          </div>

          <div className="grid gap-2">
            <Label>Adresse</Label>
            <Input name="address" required />
          </div>

          <div className="grid gap-2">
            <Label>Email (login)</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Mot de passe</Label>
            <div className="flex gap-2">
              <Input value={password} readOnly />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generatePassword())}
              >
                Générer
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={!email || !password}>
              Créer & Télécharger
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
