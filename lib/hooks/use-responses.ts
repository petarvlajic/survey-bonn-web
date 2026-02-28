"use client"

import { useState, useEffect } from "react"
import { responsesAPI, type SurveyResponse } from "@/lib/api/responses"

function toSurveyResponse(item: Record<string, unknown>): SurveyResponse {
  const r = item as unknown as SurveyResponse
  if (r.status) return r
  const draft = (item as { draft?: boolean }).draft
  return { ...r, status: draft ? "draft" : "completed" }
}

function normalizeResponsesList(raw: unknown): SurveyResponse[] {
  let list: Record<string, unknown>[]
  if (Array.isArray(raw)) list = raw
  else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.data)) list = o.data as Record<string, unknown>[]
    else if (Array.isArray(o.responses)) list = o.responses as Record<string, unknown>[]
    else if (Array.isArray(o.items)) list = o.items as Record<string, unknown>[]
    else return []
  } else return []
  return list.map(toSurveyResponse)
}

function normalizeResponse(raw: unknown): SurveyResponse | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (o.surveyId != null && o.intervieweeName != null) return raw as SurveyResponse
  if (o.data && typeof o.data === "object") return o.data as SurveyResponse
  if (o.response && typeof o.response === "object") return o.response as SurveyResponse
  return null
}

export interface UseResponsesResult {
  responses: SurveyResponse[]
  total: number
  page: number
  limit: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useResponses(filters?: Parameters<typeof responsesAPI.getAll>[0]): UseResponsesResult {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResponses = async () => {
    try {
      setLoading(true)
      const raw = await responsesAPI.getAll(filters)
      const list = normalizeResponsesList(raw)
      setResponses(list)
      const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
      setTotal(Number(obj.total) ?? list.length)
      setPage(Number(obj.page) ?? 1)
      setLimit(Number(obj.limit) ?? 50)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch responses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResponses()
  }, [JSON.stringify(filters)])

  return { responses, total, page, limit, loading, error, refetch: fetchResponses }
}

export function useResponse(id: string) {
  const [response, setResponse] = useState<SurveyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        setLoading(true)
        const raw = await responsesAPI.getById(id)
        setResponse(normalizeResponse(raw))
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch response")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchResponse()
    } else {
      setLoading(false)
      setResponse(null)
    }
  }, [id])

  return { response, loading, error }
}
