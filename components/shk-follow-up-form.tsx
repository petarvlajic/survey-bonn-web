"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SHK_FOLLOWUP_ITEMS } from "@/lib/shk-followup-items"
import { responsesAPI } from "@/lib/api/responses"
import type { SurveyResponse } from "@/lib/api/responses"
import { Info } from "lucide-react"

type Props = {
  response: SurveyResponse
  disabled?: boolean
  onComplete?: () => void
}

/** Post SHK bounded flow: confirm all checklist items; requires response lock by current SHK user. */
export function ShkFollowUpForm({ response, disabled, onComplete }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = SHK_FOLLOWUP_ITEMS.every((item) => checks[item.id] === true)

  const handleSubmit = async () => {
    setError(null)
    if (!response._id || !allChecked) return
    setLoading(true)
    try {
      await responsesAPI.completeFollowUp(
        response._id,
        Object.fromEntries(SHK_FOLLOWUP_ITEMS.map((item) => [item.id, true])) as Record<string, boolean>,
      )
      onComplete?.()
    } catch (e: unknown) {
      const data = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { error?: string } } }).response?.data
        : undefined
      setError(data?.error ?? "Follow-up konnte nicht gespeichert werden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SHK Follow-up</CardTitle>
        <CardDescription>
          Alle Punkte müssen bestätigt werden. Die Antwort wird danach automatisch geschlossen und Benachrichtigungen versendet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {SHK_FOLLOWUP_ITEMS.map((item) => (
            <div key={item.id} className="flex gap-3 items-start">
              <label className="flex flex-1 gap-3 items-start cursor-pointer min-w-0">
                <Checkbox
                  checked={!!checks[item.id]}
                  disabled={disabled || loading}
                  onCheckedChange={(v) => setChecks((c) => ({ ...c, [item.id]: v === true }))}
                  className="mt-1 shrink-0"
                />
                <span className="text-sm leading-snug">{item.labelDe}</span>
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Hinweis"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-left">
                  {item.hintDe}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={disabled || loading || !allChecked} onClick={handleSubmit}>
          {loading ? "Speichern…" : "Follow-up abschließen"}
        </Button>
      </CardContent>
    </Card>
  )
}
