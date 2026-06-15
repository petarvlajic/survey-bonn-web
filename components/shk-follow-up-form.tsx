"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { responsesAPI } from "@/lib/api/responses"
import type { SurveyResponse } from "@/lib/api/responses"
import {
  ECHO_MAIN_ROW_IDS,
  ECHO_MAIN_ROWS,
  ECHO_OPTIONAL_ITEMS,
  ECHO_OVERALL,
  getEchoRowOptions,
  type EchoMainRowId,
  type EchoMainValues,
  type EchoOptionalId,
  type EchoOverall,
  type EchoScreeningPayload,
} from "@/lib/shk-echo-screening"

type Props = {
  response: SurveyResponse
  disabled?: boolean
  onComplete?: () => void
}

function emptyOptional(): Record<EchoOptionalId, boolean> {
  return {
    pericardial_effusion: false,
    rv_enlargement: false,
    atrial_enlargement: false,
  }
}

export function ShkFollowUpForm({ response, disabled, onComplete }: Props) {
  const [main, setMain] = useState<Partial<EchoMainValues>>({})
  const [optional, setOptional] = useState(emptyOptional)
  const [overall, setOverall] = useState<EchoOverall | "">("")
  const [comment, setComment] = useState("")
  const [pathologicalFindingReport, setPathologicalFindingReport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = response.shkFollowUp?.echoScreening
    if (!stored?.main) return
    setMain(stored.main)
    setOptional({ ...emptyOptional(), ...stored.optional })
    setOverall(stored.overall ?? "")
    setComment(stored.comment ?? "")
    setPathologicalFindingReport(Boolean(response.pathologicalFindingReport))
  }, [response._id, response.shkFollowUp, response.pathologicalFindingReport])

  const mainComplete = ECHO_MAIN_ROW_IDS.every((id) => {
    const v = main[id]
    return typeof v === "string" && v.length > 0
  })
  const overallComplete = overall === "unremarkable" || overall === "needs_followup"
  const canSubmit = mainComplete && overallComplete

  const handleSubmit = async () => {
    setError(null)
    if (!response._id || !canSubmit) return
    setLoading(true)
    try {
      const echoScreening: EchoScreeningPayload = {
        main: main as EchoMainValues,
        optional,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        overall: overall as EchoOverall,
      }
      await responsesAPI.completeFollowUp(response._id, {
        echoScreening,
        ...(pathologicalFindingReport ? { pathologicalFindingReport: true } : {}),
      })
      onComplete?.()
    } catch (e: unknown) {
      const data =
        e && typeof e === "object" && "response" in e
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
        <CardTitle>Echo-Screening (SHK)</CardTitle>
        <CardDescription>
          Pro Kategorie genau eine Auswahl, optional Kurzcheck, Freitext und Gesamtbeurteilung. Danach werden
          Benachrichtigungen an die Patient/in ausgelöst.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {ECHO_MAIN_ROWS.map((row) => {
          const options = getEchoRowOptions(row.id)
          return (
            <div key={row.id} className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">{row.categoryDe}</p>
              <RadioGroup
                value={main[row.id] ?? ""}
                onValueChange={(v) =>
                  setMain((prev) => ({
                    ...prev,
                    [row.id]: v as EchoMainValues[typeof row.id],
                  }))
                }
              >
                {options.map((opt) => (
                  <div key={opt.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={opt.value} id={`${row.id}-${opt.value}`} className="mt-1" />
                    <Label htmlFor={`${row.id}-${opt.value}`} className="font-normal leading-snug">
                      {opt.labelDe}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )
        })}

        <div className="space-y-3 rounded-lg border p-4">
          <p className="font-medium">Optional (Kurzcheck)</p>
          {ECHO_OPTIONAL_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={`opt-${item.id}`}
                checked={optional[item.id]}
                disabled={disabled || loading}
                onCheckedChange={(v) =>
                  setOptional((prev) => ({ ...prev, [item.id]: v === true }))
                }
              />
              <Label htmlFor={`opt-${item.id}`}>{item.labelDe}</Label>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="echo-comment">Freitext / Kommentar</Label>
          <Textarea
            id="echo-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional — Befund, Hinweise für Nachverfolgung …"
            rows={3}
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="font-medium">Gesamtbeurteilung</p>
          <RadioGroup value={overall} onValueChange={(v) => setOverall(v as EchoOverall)}>
            {ECHO_OVERALL.map((o) => (
              <div key={o.id} className="flex items-center space-x-2">
                <RadioGroupItem value={o.id} id={`overall-${o.id}`} />
                <Label htmlFor={`overall-${o.id}`}>{o.labelDe}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-start space-x-2 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
          <Checkbox
            id="pathological-finding"
            checked={pathologicalFindingReport}
            disabled={disabled || loading}
            onCheckedChange={(v) => setPathologicalFindingReport(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="pathological-finding">Nachverfolgung triggern / initiieren</Label>
            <p className="text-sm text-muted-foreground">
              Sendet den vollständigen PDF-Befund an herzcheck.nachverfolgung@ukbonn.de.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={disabled || loading || !canSubmit} onClick={handleSubmit}>
          {loading ? "Speichern…" : "Follow-up abschließen"}
        </Button>
      </CardContent>
    </Card>
  )
}
