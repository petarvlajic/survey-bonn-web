import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import LoginContent from "./login-content"

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md p-12 flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
