"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnswerFilter, FilterFieldMeta } from "@/lib/types/answer-filters"
import {
  defaultOpForKind,
  defaultValueForKind,
  opsForKind,
} from "@/lib/types/answer-filters"

type Props = {
  fields: FilterFieldMeta[]
  filters: AnswerFilter[]
  onChange: (filters: AnswerFilter[]) => void
}

function getFieldMeta(fields: FilterFieldMeta[], questionId: string): FilterFieldMeta {
  return (
    fields.find((f) => f.questionId === questionId) ?? {
      questionId,
      label: questionId,
      kind: "text" as const,
    }
  )
}

export function AnswerFilterRows({ fields, filters, onChange }: Props) {
  const updateRow = (index: number, patch: Partial<AnswerFilter>) => {
    const next = [...filters]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const onQuestionChange = (index: number, questionId: string) => {
    const meta = getFieldMeta(fields, questionId)
    updateRow(index, {
      questionId,
      op: defaultOpForKind(meta.kind),
      value: defaultValueForKind(meta.kind),
    })
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Antwort-Filter werden geladen…
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {filters.map((af, index) => {
        const meta = getFieldMeta(fields, af.questionId)
        const opOptions = opsForKind(meta.kind)

        return (
          <div
            key={`${index}-${af.questionId}`}
            className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Feld</Label>
              <Select
                value={af.questionId}
                onValueChange={(q) => onQuestionChange(index, q)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Frage wählen" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(24rem,70vh)]">
                  {fields.map((f) => (
                    <SelectItem key={f.questionId} value={f.questionId}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bedingung</Label>
              <Select
                value={af.op}
                onValueChange={(op) =>
                  updateRow(index, { op: op as AnswerFilter["op"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opOptions.map((o) => (
                    <SelectItem key={o.v} value={o.v}>
                      {o.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Wert</Label>
              {meta.kind === "boolean" ? (
                <Select
                  value={String(af.value === "no" || af.value === false ? "no" : "yes")}
                  onValueChange={(v) => updateRow(index, { value: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ja</SelectItem>
                    <SelectItem value="no">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : meta.kind === "number" ? (
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  placeholder="0–10"
                  value={af.value === "" ? "" : String(af.value)}
                  onChange={(e) =>
                    updateRow(index, {
                      value: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              ) : (
                <Input
                  type="text"
                  placeholder="Wert…"
                  value={String(af.value ?? "")}
                  onChange={(e) => updateRow(index, { value: e.target.value })}
                />
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="shrink-0"
              title="Entfernen"
              onClick={() => onChange(filters.filter((_, i) => i !== index))}
            >
              ✕
            </Button>
          </div>
        )
      })}
    </div>
  )
}
