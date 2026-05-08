export type AuthUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "user" | "admin"
}

export function normalizeAuthUser(raw: unknown): AuthUser {
  if (!raw || typeof raw !== "object") {
    return { id: "", firstName: "", lastName: "", email: "", role: "user" }
  }
  const u = raw as Record<string, unknown>
  const profile = (u.profile as Record<string, unknown> | undefined) ?? {}
  const id = String(u._id ?? u.id ?? "")
  return {
    id,
    firstName: String(profile.firstName ?? u.firstName ?? ""),
    lastName: String(profile.lastName ?? u.lastName ?? ""),
    email: String(u.email ?? ""),
    role: u.role === "admin" ? "admin" : "user",
  }
}
