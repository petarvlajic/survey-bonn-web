/**
 * SHK Echo-Screening — keep in sync with uk-bonn-survey-api `src/utils/shkEchoScreening.ts`.
 */

export const ECHO_MAIN_ROW_IDS = [
  "lv_function",
  "wall_motion",
  "aortic_valve",
  "mitral_valve",
  "tricuspid_valve",
  "ascending_aorta",
] as const

export type EchoMainRowId = (typeof ECHO_MAIN_ROW_IDS)[number]

export type EchoBinaryValue = "unauffaellig" | "auffaellig"
export type EchoValveValue = "unauffaellig" | "stenose" | "insuffizienz" | "auffaellig"
export type EchoTricuspidValue = "unauffaellig" | "insuffizienz" | "auffaellig"
export type EchoAortaValue = "unauffaellig" | "dilatiert"

export type EchoMainValues = {
  lv_function: EchoBinaryValue
  wall_motion: EchoBinaryValue
  aortic_valve: EchoValveValue
  mitral_valve: EchoValveValue
  tricuspid_valve: EchoTricuspidValue
  ascending_aorta: EchoAortaValue
}

export const ECHO_BINARY_LABELS: Record<
  "lv_function" | "wall_motion",
  { unauffaellig: string; auffaellig: string }
> = {
  lv_function: {
    unauffaellig: "normale systolische Funktion",
    auffaellig: "reduziert",
  },
  wall_motion: {
    unauffaellig: "normokinetisch",
    auffaellig: "Wandbewegungsstörung",
  },
}

export const ECHO_VALVE_OPTIONS: readonly { value: EchoValveValue; labelDe: string }[] = [
  { value: "unauffaellig", labelDe: "unauffällig — keine relevante Stenose/Insuffizienz" },
  { value: "stenose", labelDe: "auffällig — V.a. Stenose" },
  { value: "insuffizienz", labelDe: "auffällig — V.a. Insuffizienz" },
]

export const ECHO_TRICUSPID_OPTIONS: readonly { value: EchoTricuspidValue; labelDe: string }[] = [
  { value: "unauffaellig", labelDe: "unauffällig — keine relevante Insuffizienz" },
  { value: "insuffizienz", labelDe: "auffällig — V.a. Insuffizienz" },
]

export const ECHO_AORTA_OPTIONS: readonly { value: EchoAortaValue; labelDe: string }[] = [
  { value: "unauffaellig", labelDe: "unauffällig" },
  { value: "dilatiert", labelDe: "dilatiert/ektatisch" },
]

export const ECHO_MAIN_ROWS: readonly { id: EchoMainRowId; categoryDe: string }[] = [
  { id: "lv_function", categoryDe: "LV-Funktion" },
  { id: "wall_motion", categoryDe: "Wandbewegung" },
  { id: "aortic_valve", categoryDe: "Aortenklappe" },
  { id: "mitral_valve", categoryDe: "Mitralklappe" },
  { id: "tricuspid_valve", categoryDe: "Trikuspidalklappe" },
  { id: "ascending_aorta", categoryDe: "Aorta ascendens" },
]

export const ECHO_OPTIONAL_IDS = ["pericardial_effusion", "rv_enlargement", "atrial_enlargement"] as const

export type EchoOptionalId = (typeof ECHO_OPTIONAL_IDS)[number]

export const ECHO_OPTIONAL_ITEMS: readonly { id: EchoOptionalId; labelDe: string }[] = [
  { id: "pericardial_effusion", labelDe: "Perikarderguss" },
  { id: "rv_enlargement", labelDe: "RV-Vergrößerung" },
  { id: "atrial_enlargement", labelDe: "Vorhofvergrößerung" },
]

export type EchoOverall = "unremarkable" | "needs_followup"

export const ECHO_OVERALL: readonly { id: EchoOverall; labelDe: string }[] = [
  { id: "unremarkable", labelDe: "unauffälliges Echo-Screening" },
  { id: "needs_followup", labelDe: "kontrollbedürftiger/pathologischer Befund" },
]

export type EchoScreeningPayload = {
  main: EchoMainValues
  optional: Record<EchoOptionalId, boolean>
  comment?: string
  overall: EchoOverall
}

export function validEchoScreeningFixture(): EchoScreeningPayload {
  return {
    main: {
      lv_function: "unauffaellig",
      wall_motion: "unauffaellig",
      aortic_valve: "unauffaellig",
      mitral_valve: "unauffaellig",
      tricuspid_valve: "unauffaellig",
      ascending_aorta: "unauffaellig",
    },
    optional: {
      pericardial_effusion: false,
      rv_enlargement: false,
      atrial_enlargement: false,
    },
    overall: "unremarkable",
  }
}

export function getEchoRowOptions(id: EchoMainRowId): readonly { value: string; labelDe: string }[] {
  if (id === "lv_function") {
    return [
      { value: "unauffaellig", labelDe: `unauffällig — ${ECHO_BINARY_LABELS.lv_function.unauffaellig}` },
      { value: "auffaellig", labelDe: `auffällig — ${ECHO_BINARY_LABELS.lv_function.auffaellig}` },
    ]
  }
  if (id === "wall_motion") {
    return [
      { value: "unauffaellig", labelDe: `unauffällig — ${ECHO_BINARY_LABELS.wall_motion.unauffaellig}` },
      { value: "auffaellig", labelDe: `auffällig — ${ECHO_BINARY_LABELS.wall_motion.auffaellig}` },
    ]
  }
  if (id === "aortic_valve" || id === "mitral_valve") return ECHO_VALVE_OPTIONS
  if (id === "tricuspid_valve") return ECHO_TRICUSPID_OPTIONS
  return ECHO_AORTA_OPTIONS
}

export function formatEchoMainValue(id: EchoMainRowId, value: string): string {
  const opt = getEchoRowOptions(id).find((o) => o.value === value)
  return opt?.labelDe ?? value
}
