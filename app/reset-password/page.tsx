"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { authAPI } from "@/lib/api/auth"
import { AuthShell } from "@/components/auth-shell"

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/[0-9]/.test(password)) return "Password must contain at least one number"
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token.trim()) {
      setError("Reset token is missing. Please use the link from your email.")
      return
    }

    const passwordErr = validatePassword(newPassword)
    if (passwordErr) {
      setError(passwordErr)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      await authAPI.resetPassword(token.trim(), newPassword)
      router.push("/login?reset=success")
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.error || data?.message || "Failed to reset password. Please try again or request a new link.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full rounded-2xl border-border/60 bg-card/95 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-border/50 border-b pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">Choose a new password</CardTitle>
          <CardDescription className="text-base leading-snug">
            Pick a strong password you have not used for this dashboard before.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, one uppercase, one lowercase, a number and a special character. Example: Test123!
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full font-medium shadow-sm" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
            <div className="pt-1 text-center text-sm">
              <Link
                href="/login"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function ResetSuspenseFallback() {
  return (
    <AuthShell>
      <div className="flex justify-center rounded-2xl border border-border/60 bg-card/95 py-14 shadow-xl shadow-black/[0.04]">
        <div
          aria-hidden
          className="h-10 w-10 animate-pulse rounded-full bg-primary/20 ring-4 ring-primary/10"
        />
      </div>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetSuspenseFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
