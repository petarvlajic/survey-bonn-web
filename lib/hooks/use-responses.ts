"use client"

import { useState, useEffect } from "react"
import { responsesAPI, type SurveyResponse } from "@/lib/api/responses"

export function useResponses(filters?: any) {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResponses = async () => {
    try {
      setLoading(true)
      const data = await responsesAPI.getAll(filters)
      setResponses(data)
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

  return { responses, loading, error, refetch: fetchResponses }
}

export function useResponse(id: string) {
  const [response, setResponse] = useState<SurveyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        setLoading(true)
        const data = await responsesAPI.getById(id)
        setResponse(data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch response")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchResponse()
    }
  }, [id])

  return { response, loading, error }
}
