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
import { useI18n } from "@/lib/i18n/locale-context"

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess(t("auth.resetSuccess"))
    }
  }, [searchParams, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.endsWith("@ukbonn.de")) {
      setError(t("auth.emailDomainError"))
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.login({ email, password })
      setAuth(normalizeAuthUser(response.user), response.token)
      router.push("/dashboard")
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.error || data?.message || t("auth.loginFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full rounded-2xl border-border/60 bg-card/95 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-border/50 border-b pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">{t("auth.signIn")}</CardTitle>
          <CardDescription className="text-base leading-snug">{t("auth.signInDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@ukbonn.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{t("auth.emailHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
            </div>
            {success && <p className="text-sm text-green-600">{success}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full font-medium shadow-sm" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
            <div className="flex flex-col gap-2.5 pt-1 text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
              <Link
                href="/signup"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t("auth.noAccount")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
