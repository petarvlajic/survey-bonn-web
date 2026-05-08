import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser } from "@/lib/auth/normalize-user"

type User = AuthUser

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("auth_token", token)
        set({ user, token, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem("auth_token")
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
