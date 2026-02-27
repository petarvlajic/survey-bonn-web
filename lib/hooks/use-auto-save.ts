"use client"

import { useEffect, useRef } from "react"

interface UseAutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutoSave({ data, onSave, delay = 3000, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const previousDataRef = useRef(data)

  useEffect(() => {
    if (!enabled) return

    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current)

    if (dataChanged) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        console.log("[v0] Auto-saving data...")
        onSave(data).catch((error) => {
          console.error("[v0] Auto-save failed:", error)
        })
        previousDataRef.current = data
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, delay, enabled])
}
