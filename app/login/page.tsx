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
import { useAuth } from "@/lib/hooks/use-auth"

export default function LoginPage() {
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
      setAuth(response.user, response.token)
      router.push("/dashboard")
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.error || data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Enter your UK Bonn credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="flex flex-col gap-2 text-sm text-center">
              <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
              <Link href="/signup" className="text-muted-foreground hover:text-foreground">
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
