"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DashboardHeader } from "@/components/dashboard-header"
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { responsesAPI } from "@/lib/api/responses"
import { useAutoSave } from "@/lib/hooks/use-auto-save"
import { handleApiError } from "@/lib/utils/error-handler"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { GENDER_VALUES, formatGenderLabel } from "@/lib/gender"

const ACCOMPANYING_SYMPTOM_NONE = "keine/nein"

const ACCOMPANYING_SYMPTOMS = [
  "Luftnot / Atemnot (Dyspnoe)",
  "verminderte körperliche Belastbarkeit",
  "Herzklopfen / Herzrasen (Palpitationen)",
  "Unregelmäßiger Puls",
  "Schwindel oder Benommenheit",
  "Bewusstlosigkeit (Synkope)",
  "Wassereinlagerungen (Beine, Knöchel, Bauch)",
  "Müdigkeit / Leistungsschwäche",
  "Nachtschweiß",
  "Übelkeit / Erbrechen",
  "Husten oder Atemnot im Liegen",
]

const VALVE_TYPES = [
  "Aortenklappenstenose",
  "Aortenklappeninsuffizienz",
  "Mitralklappenstenose",
  "Mitralklappeninsuffizienz",
  "Trikuspidalklappeninsuffizienz",
]

const PROCEDURES = [
  "Herzklappen-OP",
  "Koronare Bypass-OP",
  "Herzkatheter ohne/mit Stentimplantation",
  "Herzklappeneingriff über die Leiste",
]

type SurveyData = {
  name: string
  birthDate: string
  gender: string
  date: string
  email: string
  intervieweePhone: string
  intervieweeAddress: string

  hasChestComplaints: string
  painType: string[]
  painTypeOther: string
  complaintsSince: string
  painIntensity: string
  complaintsOccur: string[]
  complaintsDuration: string[]
  painRadiation: string[]
  whatHelps: string[]
  whatWorsens: string[]

  accompanyingSymptoms: string[]

  valveDisease: string
  valveTypes: string[]
  valveFreeText: string

  heartDiseases: string[]
  heartDiseasesFreeText: string
  riskFactors: string[]

  previousExams: string[]
  previousExamsFreeText: string
  medicationFreeText: string

  signature: string
}

export default function NewSurveyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [formData, setFormData] = useState<SurveyData>({
    name: "",
    birthDate: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
    email: "",
    intervieweePhone: "",
    intervieweeAddress: "",
    hasChestComplaints: "",
    painType: [],
    painTypeOther: "",
    complaintsSince: "",
    painIntensity: "0",
    complaintsOccur: [],
    complaintsDuration: [],
    painRadiation: [],
    whatHelps: [],
    whatWorsens: [],
    accompanyingSymptoms: [],
    valveDisease: "",
    valveTypes: [],
    valveFreeText: "",
    heartDiseases: [],
    heartDiseasesFreeText: "",
    riskFactors: [],
    previousExams: [],
    previousExamsFreeText: "",
    medicationFreeText: "",
    signature: "",
  })

  const totalSteps = 7
  const progress = (currentStep / totalSteps) * 100

  const handleCheckboxChange = (field: keyof SurveyData, value: string) => {
    const currentValues = formData[field] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    setFormData({ ...formData, [field]: newValues })
  }

  const handleAccompanyingSymptomChange = (symptom: string) => {
    const current = formData.accompanyingSymptoms
    let next: string[]
    if (symptom === ACCOMPANYING_SYMPTOM_NONE) {
      next = current.includes(ACCOMPANYING_SYMPTOM_NONE) ? [] : [ACCOMPANYING_SYMPTOM_NONE]
    } else {
      const withoutNone = current.filter((v) => v !== ACCOMPANYING_SYMPTOM_NONE)
      next = withoutNone.includes(symptom)
        ? withoutNone.filter((v) => v !== symptom)
        : [...withoutNone, symptom]
    }
    setFormData({ ...formData, accompanyingSymptoms: next })
  }

  const surveyMeta = (data: SurveyData) => ({
    surveyId: "survey-id",
    surveyTitle: "Cardiac Health Survey",
    interviewerName: "Current User",
    intervieweeName: data.name,
    intervieweeEmail: data.email,
    intervieweePhone: data.intervieweePhone,
    intervieweeAddress: data.intervieweeAddress || undefined,
    birthDate: data.birthDate || undefined,
    gender: data.gender || undefined,
  })

  /** Build answers for API: skip empty strings/arrays and top-level contact fields */
  const buildAnswers = (data: SurveyData, includeSignature = false) =>
    Object.entries(data)
      .filter(([key, value]) => {
        if (key === "signature") return includeSignature && value !== ""
        if (key === "email" || key === "intervieweePhone" || key === "intervieweeAddress") return false
        if (value === "" || value === null || value === undefined) return false
        if (Array.isArray(value) && value.length === 0) return false
        return true
      })
      .map(([key, value]) => ({
        questionId: key,
        question: key,
        answer: value,
        type: typeof value === "number" ? "NUMBER" : "TEXT",
      }))

  const handleAutoSave = useCallback(async (data: SurveyData) => {
    try {
      await responsesAPI.create({
        ...surveyMeta(data),
        answers: buildAnswers(data, false),
        status: "draft",
      })
      setLastSaved(new Date())
      console.log("[v0] Auto-saved survey data")
    } catch (err) {
      console.error("[v0] Auto-save failed:", err)
    }
  }, [])

  useAutoSave({
    data: formData,
    onSave: handleAutoSave,
    delay: 5000,
    enabled: formData.name !== "",
  })

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true)
      setError("")

      await responsesAPI.create({
        ...surveyMeta(formData),
        answers: buildAnswers(formData, false),
        status: "draft",
      })

      router.push("/dashboard")
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSaving(true)
      setError("")

      await responsesAPI.create({
        ...surveyMeta(formData),
        answers: buildAnswers(formData, true),
        status: "completed",
        signature: formData.signature,
      })

      router.push("/dashboard")
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      const phone = formData.intervieweePhone.trim()
      if (!phone || phone.replace(/\D/g, "").length < 6) {
        setError("Bitte geben Sie eine gültige Telefonnummer ein.")
        return
      }
      if (!formData.gender) {
        setError("Bitte wählen Sie das Geschlecht.")
        return
      }
      setError("")
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold">Cardiac Health Survey</h1>
              <p className="text-muted-foreground">Complete the patient questionnaire</p>
            </div>
            {lastSaved && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </Badge>
            )}
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} />
            </div>
          </Card>

          {/* Step 1: General Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. Allgemeine Angaben</CardTitle>
                <CardDescription>General Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Geburtsdatum (Birth Date)</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Geschlecht (Gender) *</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    {GENDER_VALUES.map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value} id={`gender-${value}`} />
                        <Label htmlFor={`gender-${value}`}>{formatGenderLabel(value)}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervieweePhone">Handy / Telefon *</Label>
                  <Input
                    id="intervieweePhone"
                    type="tel"
                    value={formData.intervieweePhone}
                    onChange={(e) => setFormData({ ...formData, intervieweePhone: e.target.value })}
                    placeholder="+49 …"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervieweeAddress">Adresse (optional)</Label>
                  <Textarea
                    id="intervieweeAddress"
                    value={formData.intervieweeAddress}
                    onChange={(e) => setFormData({ ...formData, intervieweeAddress: e.target.value })}
                    placeholder="Straße, PLZ Ort"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Datum (Date)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Current Complaints */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Aktuelle Beschwerden</CardTitle>
                <CardDescription>Current Complaints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Haben Sie derzeit Beschwerden im Brustbereich?</Label>
                  <RadioGroup
                    value={formData.hasChestComplaints}
                    onValueChange={(value) => setFormData({ ...formData, hasChestComplaints: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="chest-yes" />
                      <Label htmlFor="chest-yes">Ja (Yes)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="chest-no" />
                      <Label htmlFor="chest-no">Nein (No)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.hasChestComplaints === "yes" && (
                  <>
                    <div className="space-y-3">
                      <Label>Art der Schmerzen (Type of pain)</Label>
                      <div className="space-y-2">
                        {["Druck", "Brennen", "Stechen", "Engegefühl"].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`pain-${type}`}
                              checked={formData.painType.includes(type)}
                              onCheckedChange={() => handleCheckboxChange("painType", type)}
                            />
                            <Label htmlFor={`pain-${type}`}>{type}</Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pain-other"
                            checked={formData.painType.includes("andere")}
                            onCheckedChange={() => handleCheckboxChange("painType", "andere")}
                          />
                          <Label htmlFor="pain-other">Andere (Other):</Label>
                          <Input
                            value={formData.painTypeOther}
                            onChange={(e) => setFormData({ ...formData, painTypeOther: e.target.value })}
                            placeholder="Specify"
                            className="max-w-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complaintsSince">Seit wann bestehen die Beschwerden? (Since when?)</Label>
                      <Input
                        id="complaintsSince"
                        value={formData.complaintsSince}
                        onChange={(e) => setFormData({ ...formData, complaintsSince: e.target.value })}
                        placeholder="e.g., 2 weeks, 3 months"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="painIntensity">Wie stark sind die Schmerzen (0–10)?</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="painIntensity"
                          type="range"
                          min="0"
                          max="10"
                          value={formData.painIntensity}
                          onChange={(e) => setFormData({ ...formData, painIntensity: e.target.value })}
                          className="flex-1"
                        />
                        <span className="font-bold text-lg w-8">{formData.painIntensity}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Treten die Beschwerden auf bei: (Complaints occur during)</Label>
                      <div className="space-y-2">
                        {[
                          "körperlicher Belastung",
                          "in Ruhe",
                          "nach dem Essen",
                          "bei Kälte",
                          "nachts",
                          "unregelmäßig",
                        ].map((occur) => (
                          <div key={occur} className="flex items-center space-x-2">
                            <Checkbox
                              id={`occur-${occur}`}
                              checked={formData.complaintsOccur.includes(occur)}
                              onCheckedChange={() => handleCheckboxChange("complaintsOccur", occur)}
                            />
                            <Label htmlFor={`occur-${occur}`}>{occur}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Wie lange dauern die Beschwerden an? (Duration)</Label>
                      <div className="space-y-2">
                        {["Sekunden", "Minuten", "Stunden", "dauerhaft"].map((duration) => (
                          <div key={duration} className="flex items-center space-x-2">
                            <Checkbox
                              id={`duration-${duration}`}
                              checked={formData.complaintsDuration.includes(duration)}
                              onCheckedChange={() => handleCheckboxChange("complaintsDuration", duration)}
                            />
                            <Label htmlFor={`duration-${duration}`}>{duration}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Strahlen die Schmerzen aus? (Pain radiation)</Label>
                      <div className="space-y-2">
                        {["linker Arm", "rechter Arm", "Hals/Kiefer", "Rücken", "Oberbauch", "nein"].map(
                          (radiation) => (
                            <div key={radiation} className="flex items-center space-x-2">
                              <Checkbox
                                id={`radiation-${radiation}`}
                                checked={formData.painRadiation.includes(radiation)}
                                onCheckedChange={() => handleCheckboxChange("painRadiation", radiation)}
                              />
                              <Label htmlFor={`radiation-${radiation}`}>{radiation}</Label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Was bessert die Beschwerden? (What helps?)</Label>
                      <div className="space-y-2">
                        {["Ruhe", "Medikamente (z. B. Nitrospray)", "Wärme", "nichts"].map((help) => (
                          <div key={help} className="flex items-center space-x-2">
                            <Checkbox
                              id={`help-${help}`}
                              checked={formData.whatHelps.includes(help)}
                              onCheckedChange={() => handleCheckboxChange("whatHelps", help)}
                            />
                            <Label htmlFor={`help-${help}`}>{help}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Was verschlechtert die Beschwerden? (What worsens?)</Label>
                      <div className="space-y-2">
                        {["Belastung", "Stress", "Kälte", "bestimmte Körperlage"].map((worsen) => (
                          <div key={worsen} className="flex items-center space-x-2">
                            <Checkbox
                              id={`worsen-${worsen}`}
                              checked={formData.whatWorsens.includes(worsen)}
                              onCheckedChange={() => handleCheckboxChange("whatWorsens", worsen)}
                            />
                            <Label htmlFor={`worsen-${worsen}`}>{worsen}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Accompanying Symptoms */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Begleitsymptome</CardTitle>
                <CardDescription>
                  Liegen Begleitsymptome oder Beschwerden vor, die auf Herzerkrankungen hinweisen können?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symptom-none"
                    checked={formData.accompanyingSymptoms.includes(ACCOMPANYING_SYMPTOM_NONE)}
                    onCheckedChange={() => handleAccompanyingSymptomChange(ACCOMPANYING_SYMPTOM_NONE)}
                  />
                  <Label htmlFor="symptom-none">{ACCOMPANYING_SYMPTOM_NONE}</Label>
                </div>
                {ACCOMPANYING_SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={`symptom-${symptom}`}
                      checked={formData.accompanyingSymptoms.includes(symptom)}
                      onCheckedChange={() => handleAccompanyingSymptomChange(symptom)}
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Herzklappenerkrankungen */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Herzklappenerkrankungen</CardTitle>
                <CardDescription>Sind Herzklappenerkrankungen bekannt?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={formData.valveDisease}
                  onValueChange={(value) => setFormData({ ...formData, valveDisease: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="valve-yes" />
                    <Label htmlFor="valve-yes">Ja</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="valve-no" />
                    <Label htmlFor="valve-no">Nein</Label>
                  </div>
                </RadioGroup>
                {formData.valveDisease === "yes" && (
                  <div className="space-y-2 pl-2">
                    {VALVE_TYPES.map((valve) => (
                      <div key={valve} className="flex items-center space-x-2">
                        <Checkbox
                          id={`valve-${valve}`}
                          checked={formData.valveTypes.includes(valve)}
                          onCheckedChange={() => handleCheckboxChange("valveTypes", valve)}
                        />
                        <Label htmlFor={`valve-${valve}`}>{valve}</Label>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="valveFreeText">Freitext</Label>
                  <Textarea
                    id="valveFreeText"
                    value={formData.valveFreeText}
                    onChange={(e) => setFormData({ ...formData, valveFreeText: e.target.value })}
                    placeholder="Weitere Angaben zu Herzklappenerkrankungen …"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Pre-existing Conditions */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>5. Vorerkrankungen und Risikofaktoren</CardTitle>
                <CardDescription>Pre-existing conditions and risk factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Bestehen bekannte Herzerkrankungen?</Label>
                  <div className="space-y-2">
                    {[
                      "Koronare Herzkrankheit",
                      "Herzinfarkt",
                      "Herzschwäche",
                      "Herzklappenerkrankung",
                      "Herzrhythmusstörungen",
                      "nein",
                    ].map((disease) => (
                      <div key={disease} className="flex items-center space-x-2">
                        <Checkbox
                          id={`disease-${disease}`}
                          checked={formData.heartDiseases.includes(disease)}
                          onCheckedChange={() => handleCheckboxChange("heartDiseases", disease)}
                        />
                        <Label htmlFor={`disease-${disease}`}>{disease}</Label>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={formData.heartDiseasesFreeText}
                    onChange={(e) => setFormData({ ...formData, heartDiseasesFreeText: e.target.value })}
                    placeholder="Freitext — weitere Angaben zu Herzerkrankungen …"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie folgende Erkrankungen oder Risikofaktoren?</Label>
                  <div className="space-y-2">
                    {[
                      "Bluthochdruck",
                      "Diabetes",
                      "Fettstoffwechselstörung",
                      "Übergewicht",
                      "Rauchen",
                      "Bewegungsmangel",
                      "familiäre Herzkrankheiten",
                      "COPD",
                      "Vorhofflimmern",
                    ].map((risk) => (
                      <div key={risk} className="flex items-center space-x-2">
                        <Checkbox
                          id={`risk-${risk}`}
                          checked={formData.riskFactors.includes(risk)}
                          onCheckedChange={() => handleCheckboxChange("riskFactors", risk)}
                        />
                        <Label htmlFor={`risk-${risk}`}>{risk}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Previous Examinations */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>6. Vorangegangene Untersuchungen / Eingriffe</CardTitle>
                <CardDescription>Previous examinations and procedures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PROCEDURES.map((exam) => (
                  <div key={exam} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exam-${exam}`}
                      checked={formData.previousExams.includes(exam)}
                      onCheckedChange={() => handleCheckboxChange("previousExams", exam)}
                    />
                    <Label htmlFor={`exam-${exam}`}>{exam}</Label>
                  </div>
                ))}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="previousExamsFreeText">Freitext</Label>
                  <Textarea
                    id="previousExamsFreeText"
                    value={formData.previousExamsFreeText}
                    onChange={(e) => setFormData({ ...formData, previousExamsFreeText: e.target.value })}
                    placeholder="Weitere Untersuchungen / Eingriffe …"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicationFreeText">Besteht eine Dauermedikation?</Label>
                  <Textarea
                    id="medicationFreeText"
                    value={formData.medicationFreeText}
                    onChange={(e) => setFormData({ ...formData, medicationFreeText: e.target.value })}
                    placeholder="Medikamente, Dosierung …"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Signature */}
          {currentStep === 7 && (
            <Card>
              <CardHeader>
                <CardTitle>7. Unterschrift</CardTitle>
                <CardDescription>Signature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signature">Bitte geben Sie Ihren Namen ein (Please type your signature)</Label>
                  <Input
                    id="signature"
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                    placeholder="Type your full name"
                    className="text-2xl font-signature"
                    style={{ fontFamily: "Brush Script MT, cursive" }}
                  />
                  <div className="border rounded-lg p-6 bg-muted/20 mt-4">
                    <div className="h-24 flex items-center justify-center border-b border-dashed border-muted-foreground/30">
                      {formData.signature ? (
                        <div
                          className="text-4xl"
                          style={{ fontFamily: "Brush Script MT, cursive", color: "hsl(var(--primary))" }}
                        >
                          {formData.signature}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Your signature will appear here</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Survey
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
