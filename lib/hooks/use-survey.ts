"use client"

import { useState, useEffect } from "react"
import { surveysAPI, type Survey } from "@/lib/api/surveys"

export function useSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const data = await surveysAPI.getAll()
      setSurveys(data)
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

export function useSurvey(id: string) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true)
        const data = await surveysAPI.getById(id)
        setSurvey(data)
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
