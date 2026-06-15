/**
 * Map survey questionId (API field name) → display label for Response Details.
 * Matches Cardiac Health Survey form labels (Vollversion 260601).
 */
export const SURVEY_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  birthDate: "Geburtsdatum (Birth Date)",
  gender: "Geschlecht (Gender)",
  date: "Datum (Date)",
  intervieweePhone: "Handy / Telefon",
  intervieweeAddress: "Adresse",
  hasChestComplaints: "Beschwerden im Brustbereich?",
  painType: "Art der Schmerzen (Type of pain)",
  painTypeOther: "Sonstige Schmerzen (Other)",
  complaintsSince: "Seit wann bestehen die Beschwerden?",
  painIntensity: "Schmerzstärke (0–10)",
  complaintsOccur: "Beschwerden treten auf bei",
  complaintsDuration: "Dauer der Beschwerden",
  painRadiation: "Schmerzausstrahlung",
  whatHelps: "Was bessert die Beschwerden?",
  whatWorsens: "Was verschlechtert die Beschwerden?",
  accompanyingSymptoms:
    "Begleitsymptome — Hinweise auf Herzerkrankungen",
  valveDisease: "Sind Herzklappenerkrankungen bekannt?",
  valveTypes: "Art der Herzklappenerkrankung",
  valveFreeText: "Herzklappenerkrankungen — Freitext",
  heartDiseases: "Bekannte Herzerkrankungen",
  heartDiseasesFreeText: "Herzerkrankungen — Freitext",
  riskFactors: "Erkrankungen / Risikofaktoren",
  previousExams: "Vorangegangene Untersuchungen / Eingriffe",
  previousExamsFreeText: "Untersuchungen / Eingriffe — Freitext",
  medicationFreeText: "Dauermedikation",
  echoFreeText: "Freitext",
  signature: "Unterschrift (Signature)",
}

export function getSurveyFieldLabel(questionId: string): string {
  return SURVEY_FIELD_LABELS[questionId] ?? questionId
}
