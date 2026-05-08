import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { AuthShell } from "@/components/auth-shell"
import LoginContent from "./login-content"

function LoginFallback() {
  return (
    <AuthShell>
      <Card className="flex w-full justify-center rounded-2xl border-border/60 bg-card/95 py-16 shadow-xl shadow-black/[0.04] backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Card>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
