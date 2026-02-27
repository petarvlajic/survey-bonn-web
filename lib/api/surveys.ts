import { apiClient } from "./axios"

export interface Question {
  _id?: string
  type:
    | "text"
    | "textarea"
    | "radio"
    | "checkbox"
    | "select"
    | "date"
    | "number"
    | "email"
    | "tel"
    | "file"
    | "image"
    | "geolocation"
    | "signature"
  question: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
  conditionalLogic?: {
    dependsOn: string
    condition: "equals" | "notEquals" | "contains"
    value: string
  }
}

export interface Section {
  _id?: string
  title: string
  description?: string
  questions: Question[]
}

export interface Survey {
  _id?: string
  title: string
  description: string
  sections: Section[]
  createdBy?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export const surveysAPI = {
  getAll: async () => {
    const { data } = await apiClient.get("/surveys")
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/surveys/${id}`)
    return data
  },

  create: async (survey: Partial<Survey>) => {
    const { data } = await apiClient.post("/surveys", survey)
    return data
  },

  update: async (id: string, survey: Partial<Survey>) => {
    const { data } = await apiClient.put(`/surveys/${id}`, survey)
    return data
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/surveys/${id}`)
    return data
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.patch(`/surveys/${id}/toggle-active`)
    return data
  },
}
