import { apiClient } from "./axios"

export interface ResponseAnswer {
  questionId: string
  question?: string
  answer?: string | string[] | number | boolean | File
  /** API returns answers with `value` instead of `answer` */
  value?: string | string[] | number | boolean
  type?: string
}

export interface SurveyResponse {
  _id?: string
  pid?: string
  surveyId: string
  surveyTitle: string
  interviewerName: string
  intervieweeName: string
  intervieweeEmail: string
  intervieweePhone?: string
  answers: ResponseAnswer[]
  status: "draft" | "completed"
  signature?: string
  signedAt?: string
  submittedAt?: string
  createdAt?: string
  updatedAt?: string
}

export const responsesAPI = {
  getAll: async (filters?: {
    status?: string
    draft?: boolean
    surveyId?: string
    pid?: string
    birthYearFrom?: number
    birthYearTo?: number
    diseases?: string[]
    riskFactors?: string[]
    hasSignature?: boolean
    startDate?: string
    endDate?: string
    completedAtFrom?: string
    completedAtTo?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: "createdAt" | "completedAt"
    sortOrder?: "asc" | "desc"
  }) => {
    const params: Record<string, string | number | boolean | undefined> = { ...filters }
    if (params.status !== undefined) {
      params.draft = params.status === "draft"
      delete params.status
    }
    if (params.startDate !== undefined) {
      params.completedAtFrom = params.startDate as string
      delete params.startDate
    }
    if (params.endDate !== undefined) {
      params.completedAtTo = params.endDate as string
      delete params.endDate
    }
    if (params.limit === undefined) params.limit = 50
    if (params.sortBy === undefined) params.sortBy = "createdAt"
    if (params.sortOrder === undefined) params.sortOrder = "desc"
    const { data } = await apiClient.get("/responses", { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/responses/${id}`)
    return data
  },

  create: async (response: Partial<SurveyResponse>) => {
    const { data } = await apiClient.post("/responses", response)
    return data
  },

  update: async (id: string, response: Partial<SurveyResponse>) => {
    const { data } = await apiClient.put(`/responses/${id}`, response)
    return data
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/responses/${id}`)
    return data
  },

  exportCSV: async (filters?: {
    draft?: boolean
    completedAtFrom?: string
    completedAtTo?: string
  }) => {
    const { data } = await apiClient.get("/responses/export/csv", {
      params: filters,
      responseType: "blob",
    })
    return data
  },

  exportPDF: async (id: string) => {
    const { data } = await apiClient.get(`/responses/${id}/export/pdf`, {
      responseType: "blob",
    })
    return data
  },
}
