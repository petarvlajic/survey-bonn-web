"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, FileText, ClipboardList, Shield } from "lucide-react"
import { BrandLockup } from "@/components/brand-lockup"
import { useAuth } from "@/lib/hooks/use-auth"
import Link from "next/link"

export function DashboardHeader() {
  const router = useRouter()
  const { user, clearAuth } = useAuth()

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-[4.25rem] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-8">
          <Link href="/dashboard" className="shrink-0 rounded-lg outline-offset-4 focus-visible:ring-2 focus-visible:ring-ring">
            <BrandLockup size="sm" layout="inline" className="-ml-1" />
          </Link>
          <nav className="hidden md:flex md:items-center md:gap-0.5" aria-label="Main">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground">
                <ClipboardList className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Responses
              </Button>
            </Link>
            <Link href="/dashboard/surveys">
              <Button variant="ghost" size="sm" className="gap-2 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground">
                <FileText className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Surveys
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm" className="gap-2 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground">
                  <Shield className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  Admin
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-lg border-border/70 shadow-none">
              <User className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
