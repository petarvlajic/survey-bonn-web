export type AnswerFilterOp = "eq" | "ne" | "contains" | "gte" | "lte" | "gt" | "lt"

export type FilterFieldKind = "boolean" | "number" | "text"

export interface FilterFieldMeta {
  questionId: string
  label: string
  kind: FilterFieldKind
}

export interface AnswerFilter {
  questionId: string
  op: AnswerFilterOp
  value: string | number | boolean
}

export function activeAnswerFilters(filters: AnswerFilter[]): AnswerFilter[] {
  return filters.filter(
    (f) =>
      f.questionId &&
      f.op &&
      f.value !== "" &&
      f.value !== undefined &&
      f.value !== null
  )
}

export function defaultOpForKind(kind: FilterFieldKind): AnswerFilterOp {
  if (kind === "number") return "lte"
  if (kind === "boolean") return "eq"
  return "contains"
}

export function defaultValueForKind(kind: FilterFieldKind): string | number {
  if (kind === "boolean") return "yes"
  return ""
}

export function opsForKind(kind: FilterFieldKind): Array<{ v: AnswerFilterOp; l: string }> {
  if (kind === "boolean") return [{ v: "eq", l: "ist" }]
  if (kind === "number") {
    return [
      { v: "eq", l: "=" },
      { v: "lte", l: "≤" },
      { v: "gte", l: "≥" },
      { v: "lt", l: "<" },
      { v: "gt", l: ">" },
    ]
  }
  return [
    { v: "contains", l: "enthält" },
    { v: "eq", l: "ist genau" },
  ]
}
