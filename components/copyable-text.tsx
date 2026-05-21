"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"

type CopyableTextProps = {
  /** Value copied to clipboard (only this string). */
  value: string
  /** Optional label shown before value, not copied (e.g. "PID"). */
  prefix?: string
  className?: string
  valueClassName?: string
  title?: string
}

export function CopyableText({
  value,
  prefix,
  className,
  valueClassName,
  title = "Klicken zum Kopieren",
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const text = String(value ?? "").trim()
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        /* ignore */
      }
    },
    [value]
  )

  if (!value?.trim()) return null

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {prefix ? (
        <span className="text-muted-foreground">{prefix}:</span>
      ) : null}
      <button
        type="button"
        onClick={copy}
        title={title}
        className={cn(
          "font-mono text-left underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
          valueClassName
        )}
      >
        {value}
        {copied ? (
          <span className="ml-1 text-xs font-sans text-primary">kopiert</span>
        ) : null}
      </button>
    </span>
  )
}
