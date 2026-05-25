export const GENDER_VALUES = [
  "male",
  "female",
  "diverse",
  "other",
  "prefer_not_to_say",
] as const

export type GenderValue = (typeof GENDER_VALUES)[number]

const LABELS: Record<GenderValue, string> = {
  male: "Männlich (Male)",
  female: "Weiblich (Female)",
  diverse: "Divers (Diverse)",
  other: "Andere (Other)",
  prefer_not_to_say: "Keine Angabe (Prefer not to say)",
}

export function formatGenderLabel(value: string | undefined | null): string {
  if (!value) return ""
  if ((GENDER_VALUES as readonly string[]).includes(value)) {
    return LABELS[value as GenderValue]
  }
  return value
}
