import { AxiosError } from "axios"

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const data = error.response?.data as { message?: string; details?: Array<{ field?: string; message?: string }> } | undefined
    let message = data?.message || error.message
    if (data?.details?.length) {
      const first = data.details[0]
      message = `${message}: ${first.field ?? "field"} — ${first.message ?? ""}`
    }

    switch (status) {
      case 400:
        return { message: message || "Invalid request", status, code: "BAD_REQUEST" }
      case 401:
        return { message: "Please log in to continue", status, code: "UNAUTHORIZED" }
      case 403:
        return { message: "You don't have permission to do that", status, code: "FORBIDDEN" }
      case 404:
        return { message: "Resource not found", status, code: "NOT_FOUND" }
      case 409:
        return { message: message || "Conflict with existing data", status, code: "CONFLICT" }
      case 422:
        return { message: message || "Validation failed", status, code: "VALIDATION_ERROR" }
      case 429:
        return { message: "Too many requests. Please try again later", status, code: "RATE_LIMIT" }
      case 500:
        return { message: "Server error. Please try again", status, code: "SERVER_ERROR" }
      case 503:
        return { message: "Service temporarily unavailable", status, code: "SERVICE_UNAVAILABLE" }
      default:
        return { message: message || "An error occurred", status, code: "UNKNOWN" }
    }
  }

  if (error instanceof Error) {
    return { message: error.message, code: "UNKNOWN" }
  }

  return { message: "An unexpected error occurred", code: "UNKNOWN" }
}
