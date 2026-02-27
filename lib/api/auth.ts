import { apiClient } from "./axios"

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  position?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/auth/login", credentials)
    return data
  },

  signup: async (signupData: SignupData): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/auth/register", signupData)
    return data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/forgot-password", { email })
    return data
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/reset-password", { token, newPassword })
    return data
  },

  getProfile: async () => {
    const { data } = await apiClient.get("/auth/profile")
    return data
  },

  updateProfile: async (updates: Partial<SignupData>) => {
    const { data } = await apiClient.put("/auth/profile", updates)
    return data
  },
}
