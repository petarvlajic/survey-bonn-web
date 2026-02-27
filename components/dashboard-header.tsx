"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, FileText, ClipboardList } from "lucide-react"
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
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-border bg-background flex-shrink-0 ring-2 ring-muted/20">
              <Image
                src="/logo.jpg"
                alt="Cardio Check Bonn"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-semibold text-lg">Cardio Check Bonn</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                Responses
              </Button>
            </Link>
            <Link href="/dashboard/surveys">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Surveys
              </Button>
            </Link>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
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
