"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/hooks/use-auth"
import { authAPI } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"

type RowUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  createdAt?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [rows, setRows] = useState<RowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authAPI.listAdminUsers()
      setRows(data.users ?? [])
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(msg ?? "Zugriff oder Laden fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/dashboard")
      return
    }
    void fetchUsers()
  }, [user?.role, router, fetchUsers])

  const setRole = async (userId: string, role: "user" | "admin") => {
    setBusyId(userId)
    setError(null)
    try {
      await authAPI.setUserRole(userId, role)
      await fetchUsers()
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(msg ?? "Rollenaktualisierung fehlgeschlagen.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Administracija</h1>
            <p className="text-muted-foreground">Korisnički nalozi i uloge</p>
          </div>
          <Button variant="outline" onClick={() => void fetchUsers()} disabled={loading}>
            Osveži
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nalozi</CardTitle>
            <CardDescription>
              Samo <code className="text-xs">admin</code> može menjati ovu listu • uloge se persistuju na API‑ju.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Učitavanje…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Ime</TableHead>
                    <TableHead>Rola</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{r.email}</TableCell>
                      <TableCell>
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <Select
                          value={r.role === "admin" ? "admin" : "user"}
                          disabled={busyId === r.id}
                          onValueChange={(v) => void setRole(r.id, v as "user" | "admin")}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">user</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
