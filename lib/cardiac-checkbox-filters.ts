import type { AnswerFilter } from "@/lib/types/answer-filters"
import { de } from "@/lib/i18n/messages/de"
import { en } from "@/lib/i18n/messages/en"
import type { Messages } from "@/lib/i18n/messages/de"
import type { Locale } from "@/lib/i18n/types"

export type CheckboxFilterKey = string

export type CheckboxFilterGroup = {
  id: string
  title: string
  items: Array<{
    key: CheckboxFilterKey
    label: string
  }>
}

function boolKey(questionId: string): CheckboxFilterKey {
  return `bool:${questionId}`
}

function optKey(questionId: string, value: string): CheckboxFilterKey {
  return `opt:${questionId}:${value}`
}

type GroupDef = {
  id: string
  titleKey: keyof Messages["filters"]["groups"]
  items: Array<{ key: CheckboxFilterKey; labelKey: keyof Messages["filters"]["items"] }>
}

const GROUP_DEFS: GroupDef[] = [
  {
    id: "chest",
    titleKey: "chest",
    items: [{ key: boolKey("hasChestComplaints"), labelKey: "hasChestComplaints" }],
  },
  {
    id: "symptoms",
    titleKey: "symptoms",
    items: [
      { key: boolKey("breathlessnessOnExertion"), labelKey: "breathlessnessOnExertion" },
      { key: boolKey("breathlessnessLying"), labelKey: "breathlessnessLying" },
      { key: boolKey("swollenLegs"), labelKey: "swollenLegs" },
      { key: boolKey("pulsingChest"), labelKey: "pulsingChest" },
      { key: boolKey("earNoise"), labelKey: "earNoise" },
      { key: boolKey("dizzinessSyncope"), labelKey: "dizzinessSyncope" },
      { key: boolKey("reducedCapacity"), labelKey: "reducedCapacity" },
      { key: boolKey("nightCough"), labelKey: "nightCough" },
      { key: boolKey("palpitations"), labelKey: "palpitations" },
      { key: boolKey("valveDisease"), labelKey: "valveDisease" },
    ],
  },
  {
    id: "heartDiseases",
    titleKey: "heartDiseases",
    items: [
      { key: optKey("heartDiseases", "Koronare Herzkrankheit"), labelKey: "koronare" },
      { key: optKey("heartDiseases", "Herzinfarkt"), labelKey: "herzinfarkt" },
      { key: optKey("heartDiseases", "Herzschwäche"), labelKey: "herzschwaeche" },
      { key: optKey("heartDiseases", "Herzklappenerkrankung"), labelKey: "herzklappe" },
      { key: optKey("heartDiseases", "Herzrhythmusstörungen"), labelKey: "rhythmus" },
    ],
  },
  {
    id: "riskFactors",
    titleKey: "riskFactors",
    items: [
      { key: optKey("riskFactors", "Bluthochdruck"), labelKey: "bluthochdruck" },
      { key: optKey("riskFactors", "Diabetes"), labelKey: "diabetes" },
      { key: optKey("riskFactors", "Fettstoffwechselstörung"), labelKey: "fettstoff" },
      { key: optKey("riskFactors", "Übergewicht"), labelKey: "uebergewicht" },
      { key: optKey("riskFactors", "Rauchen"), labelKey: "rauchen" },
      { key: optKey("riskFactors", "Bewegungsmangel"), labelKey: "bewegungsmangel" },
      { key: optKey("riskFactors", "familiäre Herzkrankheiten"), labelKey: "familiaer" },
    ],
  },
  {
    id: "valveTypes",
    titleKey: "valveTypes",
    items: [
      { key: optKey("valveTypes", "Aortenklappenstenose"), labelKey: "aortenstenose" },
      { key: optKey("valveTypes", "Aortenklappeninsuffizienz"), labelKey: "aorteninsuff" },
      { key: optKey("valveTypes", "Mitralklappenstenose"), labelKey: "mitralstenose" },
      { key: optKey("valveTypes", "Mitralklappeninsuffizienz"), labelKey: "mitralinsuff" },
      { key: optKey("valveTypes", "Trikuspidalklappeninsuffizienz"), labelKey: "trikuspid" },
    ],
  },
  {
    id: "previousExams",
    titleKey: "previousExams",
    items: [
      { key: optKey("previousExams", "EKG"), labelKey: "ekg" },
      { key: optKey("previousExams", "Belastungs-EKG"), labelKey: "belastungsEkg" },
      { key: optKey("previousExams", "Herzultraschall (Echo)"), labelKey: "echo" },
      { key: optKey("previousExams", "Herzkatheter"), labelKey: "herzkatheter" },
      { key: optKey("previousExams", "Langzeit-EKG"), labelKey: "langzeitEkg" },
      { key: optKey("previousExams", "Blutuntersuchungen"), labelKey: "blut" },
    ],
  },
]

function messagesFor(locale: Locale): Messages {
  return locale === "en" ? en : de
}

export function getCardiacCheckboxGroups(locale: Locale): CheckboxFilterGroup[] {
  const m = messagesFor(locale)
  return GROUP_DEFS.map((g) => ({
    id: g.id,
    title: m.filters.groups[g.titleKey],
    items: g.items.map((item) => ({
      key: item.key,
      label: m.filters.items[item.labelKey],
    })),
  }))
}

/** @deprecated use getCardiacCheckboxGroups(locale) */
export const CARDIAC_CHECKBOX_GROUPS = getCardiacCheckboxGroups("de")

export function checkboxKeysToAnswerFilters(keys: Iterable<CheckboxFilterKey>): AnswerFilter[] {
  const out: AnswerFilter[] = []
  for (const key of keys) {
    if (key.startsWith("bool:")) {
      const questionId = key.slice(5)
      if (questionId) out.push({ questionId, op: "eq", value: "yes" })
      continue
    }
    if (key.startsWith("opt:")) {
      const rest = key.slice(4)
      const sep = rest.indexOf(":")
      if (sep <= 0) continue
      const questionId = rest.slice(0, sep)
      const value = rest.slice(sep + 1)
      if (questionId && value) {
        out.push({ questionId, op: "contains", value })
      }
    }
  }
  return out
}

export function countActiveCheckboxFilters(keys: Set<CheckboxFilterKey>): number {
  return keys.size
}

export function countActiveInGroup(
  groupId: string,
  keys: Set<CheckboxFilterKey>,
  locale: Locale = "de"
): number {
  const group = getCardiacCheckboxGroups(locale).find((g) => g.id === groupId)
  if (!group) return 0
  return group.items.filter((i) => keys.has(i.key)).length
}

export function listCheckedFilterItems(
  keys: Set<CheckboxFilterKey>,
  locale: Locale = "de"
): Array<{ key: CheckboxFilterKey; label: string; groupTitle: string }> {
  const out: Array<{ key: CheckboxFilterKey; label: string; groupTitle: string }> = []
  for (const group of getCardiacCheckboxGroups(locale)) {
    for (const item of group.items) {
      if (keys.has(item.key)) {
        out.push({ key: item.key, label: item.label, groupTitle: group.title })
      }
    }
  }
  return out
}

export function resolveCheckboxLabel(key: CheckboxFilterKey, locale: Locale = "de"): string {
  for (const group of getCardiacCheckboxGroups(locale)) {
    const item = group.items.find((i) => i.key === key)
    if (item) return item.label
  }
  return key
}
