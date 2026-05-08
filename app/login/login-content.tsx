"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { authAPI } from "@/lib/api/auth"
import { normalizeAuthUser } from "@/lib/auth/normalize-user"
import { useAuth } from "@/lib/hooks/use-auth"
import { AuthShell } from "@/components/auth-shell"

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Password has been reset. You can now sign in.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.endsWith("@ukbonn.de")) {
      setError("Email must end with @ukbonn.de")
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.login({ email, password })
      setAuth(normalizeAuthUser(response.user), response.token)
      router.push("/dashboard")
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.error || data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full rounded-2xl border-border/60 bg-card/95 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-border/50 border-b pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-base leading-snug">
            Use your institutional account to access the survey dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@ukbonn.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Only @ukbonn.de email addresses are accepted.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, one uppercase, one lowercase, a number and a special character. Example: Test123!
              </p>
            </div>
            {success && <p className="text-sm text-green-600">{success}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full font-medium shadow-sm" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </Button>
            <div className="flex flex-col gap-2.5 pt-1 text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
              <Link
                href="/signup"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Create an account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
