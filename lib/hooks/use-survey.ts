"use client"

import { useState, useEffect } from "react"
import { surveysAPI, type Survey } from "@/lib/api/surveys"

/** API returns { surveys: Survey[] } - same as uk-bonn-survey-api and mobile app */
function normalizeSurveysList(raw: unknown): Survey[] {
  if (Array.isArray(raw)) return raw as Survey[]
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.surveys)) return o.surveys as Survey[]
    if (Array.isArray(o.data)) return o.data as Survey[]
  }
  return []
}

export function useSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const raw = await surveysAPI.getAll()
      console.log("[useSurveys] Raw from server:", raw)
      console.log("[useSurveys] typeof raw:", typeof raw, "isArray:", Array.isArray(raw), "keys:", raw && typeof raw === "object" ? Object.keys(raw as object) : "n/a")
      const list = normalizeSurveysList(raw)
      console.log("[useSurveys] Normalized list length:", list.length, "first item:", list[0])
      setSurveys(Array.isArray(list) ? list : [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch surveys")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys()
  }, [])

  return { surveys, loading, error, refetch: fetchSurveys }
}

/** API returns { survey: Survey } for GET /surveys/:id */
function normalizeSurvey(raw: unknown): Survey | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (o.title != null && typeof (o as Survey).title === "string") return raw as Survey
  if (o.survey && typeof o.survey === "object") return o.survey as Survey
  if (o.data && typeof o.data === "object") return o.data as Survey
  return null
}

export function useSurvey(id: string) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true)
        const raw = await surveysAPI.getById(id)
        setSurvey(normalizeSurvey(raw))
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch survey")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSurvey()
    }
  }, [id])

  return { survey, loading, error }
}
