import { apiClient } from "./axios"
import type { AnswerFilter } from "@/lib/types/answer-filters"
import { activeAnswerFilters } from "@/lib/types/answer-filters"

export interface ResponseAnswer {
  questionId: string
  question?: string
  answer?: string | string[] | number | boolean | File
  /** API returns answers with `value` instead of `answer` */
  value?: string | string[] | number | boolean
  type?: string
  imageUri?: string
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
  workflowStatus?:
    | "patient_in_progress"
    | "patient_completed"
    | "shk_in_progress"
    | "pending_shk_followup"
    | "closed"
  lockedBy?: string | { _id?: string }
  patientBoundedSubmit?: boolean
  shkFollowUp?: {
    answers?: Record<string, boolean>
    completedAt?: string
  }
  lockedAt?: string
  closedAt?: string
  changeLog?: Array<{
    changedBy: string
    changedAt: string
    source: "PATIENT" | "SHK" | "SYSTEM"
    reason?: string
    changes: Array<{
      field: string
      previousValue: string
      nextValue: string
    }>
  }>
}

function withAnswerFiltersParam(
  params: Record<string, unknown>,
  answerFilters?: AnswerFilter[]
): void {
  const active = activeAnswerFilters(answerFilters ?? [])
  if (active.length > 0) {
    params.answerFilters = JSON.stringify(active)
  }
}

export const responsesAPI = {
  getFilterFields: async () => {
    const { data } = await apiClient.get<{ fields: import("@/lib/types/answer-filters").FilterFieldMeta[] }>(
      "/responses/meta/filter-fields"
    )
    return data.fields ?? []
  },

  getAll: async (filters?: {
    status?: string
    draft?: boolean
    surveyId?: string
    pid?: string
    birthYearFrom?: number
    birthYearTo?: number
    diseases?: string[]
    riskFactors?: string[]
    startDate?: string
    endDate?: string
    completedAtFrom?: string
    completedAtTo?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: "createdAt" | "completedAt"
    sortOrder?: "asc" | "desc"
    workflowStatus?: string
    answerFilters?: AnswerFilter[]
  }) => {
    const { answerFilters, ...rest } = filters ?? {}
    const params: Record<string, unknown> = { ...rest }
    withAnswerFiltersParam(params, answerFilters)
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
    workflowStatus?: string
    pid?: string
    search?: string
    answerFilters?: AnswerFilter[]
  }) => {
    const { answerFilters, ...rest } = filters ?? {}
    const params: Record<string, unknown> = { ...rest }
    withAnswerFiltersParam(params, answerFilters)
    const { data } = await apiClient.get("/responses/export/csv", {
      params,
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

  lock: async (id: string) => {
    const { data } = await apiClient.post(`/responses/${id}/lock`)
    return data
  },

  unlock: async (id: string) => {
    const { data } = await apiClient.post(`/responses/${id}/unlock`)
    return data
  },

  close: async (id: string) => {
    const { data } = await apiClient.post(`/responses/${id}/close`)
    return data
  },

  completeFollowUp: async (id: string, answers: Record<string, boolean>) => {
    const { data } = await apiClient.post(`/responses/${id}/followup/complete`, { answers })
    return data
  },
}
