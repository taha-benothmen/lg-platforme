"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Import the JSON file with 3 accounts
import accounts from "@/app/auth/accounts.json"
import { authUtils } from "@/lib/auth"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if entered credentials match an account
    const account = accounts.find(
      (acc) => acc.email === email && acc.password === password
    )

    if (account) {
      setError("")
      
      // Sauvegarder la session dans localStorage
      authUtils.setSession({
        email: account.email,
        role: account.role as "ADMIN" | "ETABLISSEMENT" | "RESPONSABLE",
        route: account.route,
      })

      // Sauvegarder le rôle dans un cookie pour le middleware
      document.cookie = `lg_user_role=${account.role}; path=/; max-age=86400` // 24 heures

      router.push(account.route) // redirect to the account's dashboard
    } else {
      setError("Invalid email or password")
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
                />
              </Field>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Field>
                <Button type="submit">Login</Button>
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
