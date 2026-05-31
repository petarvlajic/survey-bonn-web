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
  type AnswerFilterOp,
} from "@/lib/types/answer-filters"
import { useI18n } from "@/lib/i18n/locale-context"
import type { FilterFieldKind } from "@/lib/types/answer-filters"

function opsForKindI18n(
  kind: FilterFieldKind,
  t: (path: string) => string
): Array<{ v: AnswerFilterOp; l: string }> {
  if (kind === "boolean") return [{ v: "eq", l: t("filters.advanced.opIs") }]
  if (kind === "number") {
    return [
      { v: "eq", l: t("filters.advanced.opEq") },
      { v: "lte", l: t("filters.advanced.opLte") },
      { v: "gte", l: t("filters.advanced.opGte") },
      { v: "lt", l: t("filters.advanced.opLt") },
      { v: "gt", l: t("filters.advanced.opGt") },
    ]
  }
  return [
    { v: "contains", l: t("filters.advanced.opContains") },
    { v: "eq", l: t("filters.advanced.opExact") },
  ]
}

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
  const { t } = useI18n()

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
      <p className="text-sm text-muted-foreground">{t("filters.advanced.loading")}</p>
    )
  }

  return (
    <div className="space-y-3">
      {filters.map((af, index) => {
        const meta = getFieldMeta(fields, af.questionId)
        const opOptions = opsForKindI18n(meta.kind, t)

        return (
          <div
            key={`${index}-${af.questionId}`}
            className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">{t("filters.advanced.field")}</Label>
              <Select
                value={af.questionId}
                onValueChange={(q) => onQuestionChange(index, q)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.advanced.chooseQuestion")} />
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
              <Label className="text-xs">{t("filters.advanced.condition")}</Label>
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
              <Label className="text-xs">{t("filters.advanced.value")}</Label>
              {meta.kind === "boolean" ? (
                <Select
                  value={String(af.value === "no" || af.value === false ? "no" : "yes")}
                  onValueChange={(v) => updateRow(index, { value: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common.yes")}</SelectItem>
                    <SelectItem value="no">{t("common.no")}</SelectItem>
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
              title={t("filters.advanced.removeRow")}
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
