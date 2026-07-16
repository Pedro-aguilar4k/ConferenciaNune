"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PackageCheck, Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await authClient.signIn.username({
      username: username.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setError("Usuário ou senha inválidos.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-brand text-primary-foreground">
            <PackageCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground">Conferência de NF-e</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">Acesse com seu usuário e senha</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                placeholder="seu.usuario"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/50">
          Sistema interno · acesso restrito a usuários autorizados
        </p>
      </div>
    </main>
  )
}
