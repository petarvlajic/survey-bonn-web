/**
 * Map survey questionId (API field name) → display label for Response Details.
 * Matches Cardiac Health Survey form labels.
 */
export const SURVEY_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  birthDate: "Geburtsdatum (Birth Date)",
  date: "Datum (Date)",
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
  accompanyingSymptoms: "Begleitsymptome",
  breathlessnessOnExertion: "Atemnot bei Belastung?",
  breathlessnessSince: "Atemnot seit wann?",
  breathlessnessLying: "Atemnot im Liegen?",
  swollenLegs: "Geschwollene Füße/Beine?",
  pulsingChest: "Pochen/Klopfen im Brustkorb?",
  earNoise: "Rauschen/Pochen im Ohr?",
  dizzinessSyncope: "Schwindel oder Bewusstseinsverluste?",
  reducedCapacity: "Verminderte Belastbarkeit?",
  nightCough: "Nächtlicher Husten?",
  palpitations: "Herzklopfen oder Herzstolpern?",
  valveDisease: "Herzklappenerkrankung festgestellt?",
  valveTypes: "Art der Herzklappenerkrankung",
  heartDiseases: "Bekannte Herzerkrankungen",
  riskFactors: "Erkrankungen / Risikofaktoren",
  previousExams: "Vorangegangene Untersuchungen",
  signature: "Unterschrift (Signature)",
}

export function getSurveyFieldLabel(questionId: string): string {
  return SURVEY_FIELD_LABELS[questionId] ?? questionId
}
