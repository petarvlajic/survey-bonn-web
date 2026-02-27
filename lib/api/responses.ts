import { apiClient } from "./axios"

export interface ResponseAnswer {
  questionId: string
  question: string
  answer: string | string[] | number | boolean | File
  type: string
}

export interface SurveyResponse {
  _id?: string
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
    surveyId?: string
    startDate?: string
    endDate?: string
    search?: string
  }) => {
    const { data } = await apiClient.get("/responses", { params: filters })
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

  exportCSV: async (filters?: any) => {
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
