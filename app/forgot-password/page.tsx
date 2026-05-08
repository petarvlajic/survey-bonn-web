"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { authAPI } from "@/lib/api/auth"
import { AuthShell } from "@/components/auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.endsWith("@ukbonn.de")) {
      setError("Email must end with @ukbonn.de")
      return
    }

    try {
      setLoading(true)
      await authAPI.forgotPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.error || data?.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthShell>
        <Card className="w-full rounded-2xl border-border/60 bg-card/95 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
          <CardHeader className="space-y-2 border-border/50 border-b pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight">Check your inbox</CardTitle>
            <CardDescription className="text-base leading-snug">
              Password reset instructions were sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link href="/login" className="block">
              <Button className="w-full font-medium shadow-sm">Back to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card className="w-full rounded-2xl border-border/60 bg-card/95 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-border/50 border-b pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">Reset password</CardTitle>
          <CardDescription className="text-base leading-snug">
            Enter your @ukbonn.de email. You will receive a link to choose a new password.
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full font-medium shadow-sm" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
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
