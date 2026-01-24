"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authUtils } from "@/lib/auth"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      // ✅ Sauvegarder la session complète dans localStorage
      console.log("💾 Sauvegarde des données utilisateur:", data.user)
      localStorage.setItem("userSession", JSON.stringify(data.user))

      // ✅ Sauvegarder userId spécifiquement pour les devis
      if (data.user.id) {
        localStorage.setItem("userId", data.user.id)
        console.log("✅ userId sauvegardé:", data.user.id)
      }

      // ✅ Sauvegarder le rôle et l'email
      localStorage.setItem("userRole", data.user.role || "")
      localStorage.setItem("userEmail", data.user.email || "")

      // Save session in authUtils
      authUtils.setSession({
        email: data.user.email,
        role: data.user.role,
        route: data.user.route,
      })

      console.log("✅ Redirection vers:", data.user.route)
      
      // Redirect after a short delay to ensure localStorage is set
      setTimeout(() => {
        router.push(data.user.route)
      }, 100)
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error("❌ Erreur:", err)
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Attach handleSubmit here */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Acme Inc account
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Field>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {/* Image side remains unchanged */}
          <div className="bg-muted relative hidden md:block flex items-center justify-center">
            <img
              src="/lg.png"
              alt="Image"
              className="absolute inset-0 h-50 w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}