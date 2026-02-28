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

type SurveyData = {
  // Section 1: General Information
  name: string
  birthDate: string
  date: string

  // Section 2: Current Complaints
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

  // Section 3: Accompanying Symptoms
  accompanyingSymptoms: string[]

  // Section 4: Heart Valve Symptoms
  breathlessnessOnExertion: string
  breathlessnessSince: string
  breathlessnessLying: string
  swollenLegs: string
  pulsingChest: string
  earNoise: string
  dizzinessSyncope: string
  reducedCapacity: string
  nightCough: string
  palpitations: string
  valveDisease: string
  valveTypes: string[]

  // Section 5: Pre-existing Conditions
  heartDiseases: string[]
  riskFactors: string[]

  // Section 6: Previous Examinations
  previousExams: string[]

  // Signature
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
    date: new Date().toISOString().split("T")[0],
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
    breathlessnessOnExertion: "",
    breathlessnessSince: "",
    breathlessnessLying: "",
    swollenLegs: "",
    pulsingChest: "",
    earNoise: "",
    dizzinessSyncope: "",
    reducedCapacity: "",
    nightCough: "",
    palpitations: "",
    valveDisease: "",
    valveTypes: [],
    heartDiseases: [],
    riskFactors: [],
    previousExams: [],
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

  /** Build answers for API: skip empty strings/arrays so optional fields don't fail validation */
  const buildAnswers = (data: SurveyData, includeSignature = false) =>
    Object.entries(data)
      .filter(([key, value]) => {
        if (key === "signature") return includeSignature && value !== ""
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
        surveyId: "temp-id",
        surveyTitle: "Cardiac Health Survey",
        interviewerName: "Current User",
        intervieweeName: data.name,
        intervieweeEmail: "",
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
        surveyId: "survey-id",
        surveyTitle: "Cardiac Health Survey",
        interviewerName: "Current User",
        intervieweeName: formData.name,
        intervieweeEmail: "",
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
        surveyId: "survey-id",
        surveyTitle: "Cardiac Health Survey",
        interviewerName: "Current User",
        intervieweeName: formData.name,
        intervieweeEmail: "",
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
                <CardDescription>Accompanying Symptoms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Luftnot / Atemnot (Dyspnoe)",
                  "Herzklopfen / Herzrasen (Palpitationen)",
                  "Unregelmäßiger Puls",
                  "Schwindel oder Benommenheit",
                  "Bewusstlosigkeit (Synkope)",
                  "Wassereinlagerungen (Beine, Knöchel, Bauch)",
                  "Müdigkeit / Leistungsschwäche",
                  "Nachtschweiß",
                  "Übelkeit / Erbrechen",
                  "Husten oder Atemnot im Liegen",
                ].map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={`symptom-${symptom}`}
                      checked={formData.accompanyingSymptoms.includes(symptom)}
                      onCheckedChange={() => handleCheckboxChange("accompanyingSymptoms", symptom)}
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Heart Valve Symptoms */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Symptome, die auf Herzklappenfehler hinweisen können</CardTitle>
                <CardDescription>Symptoms indicating heart valve defects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Haben Sie Atemnot bei körperlicher Belastung?</Label>
                  <RadioGroup
                    value={formData.breathlessnessOnExertion}
                    onValueChange={(value) => setFormData({ ...formData, breathlessnessOnExertion: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="breath-exertion-yes" />
                      <Label htmlFor="breath-exertion-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="breath-exertion-no" />
                      <Label htmlFor="breath-exertion-no">Nein</Label>
                    </div>
                  </RadioGroup>
                  {formData.breathlessnessOnExertion === "yes" && (
                    <Input
                      placeholder="Seit wann? (Since when?)"
                      value={formData.breathlessnessSince}
                      onChange={(e) => setFormData({ ...formData, breathlessnessSince: e.target.value })}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie Atemnot im Liegen?</Label>
                  <RadioGroup
                    value={formData.breathlessnessLying}
                    onValueChange={(value) => setFormData({ ...formData, breathlessnessLying: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="breath-lying-yes" />
                      <Label htmlFor="breath-lying-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="breath-lying-no" />
                      <Label htmlFor="breath-lying-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie geschwollene Füße oder Beine bemerkt?</Label>
                  <RadioGroup
                    value={formData.swollenLegs}
                    onValueChange={(value) => setFormData({ ...formData, swollenLegs: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="swollen-yes" />
                      <Label htmlFor="swollen-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="swollen-no" />
                      <Label htmlFor="swollen-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Spüren Sie ein Pochen oder Klopfen im Brustkorb?</Label>
                  <RadioGroup
                    value={formData.pulsingChest}
                    onValueChange={(value) => setFormData({ ...formData, pulsingChest: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="pulsing-yes" />
                      <Label htmlFor="pulsing-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="pulsing-no" />
                      <Label htmlFor="pulsing-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Hören Sie ein Rauschen oder Pochen im Ohr?</Label>
                  <RadioGroup
                    value={formData.earNoise}
                    onValueChange={(value) => setFormData({ ...formData, earNoise: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="ear-yes" />
                      <Label htmlFor="ear-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="ear-no" />
                      <Label htmlFor="ear-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie Schwindel oder Bewusstseinsverluste?</Label>
                  <RadioGroup
                    value={formData.dizzinessSyncope}
                    onValueChange={(value) => setFormData({ ...formData, dizzinessSyncope: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="dizzy-yes" />
                      <Label htmlFor="dizzy-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="dizzy-no" />
                      <Label htmlFor="dizzy-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie verminderte körperliche Belastbarkeit bemerkt?</Label>
                  <RadioGroup
                    value={formData.reducedCapacity}
                    onValueChange={(value) => setFormData({ ...formData, reducedCapacity: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="capacity-yes" />
                      <Label htmlFor="capacity-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="capacity-no" />
                      <Label htmlFor="capacity-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Leiden Sie unter nächtlichem Husten?</Label>
                  <RadioGroup
                    value={formData.nightCough}
                    onValueChange={(value) => setFormData({ ...formData, nightCough: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="cough-yes" />
                      <Label htmlFor="cough-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="cough-no" />
                      <Label htmlFor="cough-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Haben Sie Herzklopfen oder Herzstolpern?</Label>
                  <RadioGroup
                    value={formData.palpitations}
                    onValueChange={(value) => setFormData({ ...formData, palpitations: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="palp-yes" />
                      <Label htmlFor="palp-yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="palp-no" />
                      <Label htmlFor="palp-no">Nein</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Wurde bei Ihnen bereits eine Herzklappenerkrankung festgestellt?</Label>
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
                    <div className="space-y-2 pl-6">
                      {[
                        "Aortenklappenstenose",
                        "Aortenklappeninsuffizienz",
                        "Mitralklappenstenose",
                        "Mitralklappeninsuffizienz",
                        "Trikuspidalklappeninsuffizienz",
                      ].map((valve) => (
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
              <CardContent className="space-y-2">
                {[
                  "EKG",
                  "Belastungs-EKG",
                  "Herzultraschall (Echo)",
                  "Herzkatheter",
                  "Langzeit-EKG",
                  "Blutuntersuchungen",
                ].map((exam) => (
                  <div key={exam} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exam-${exam}`}
                      checked={formData.previousExams.includes(exam)}
                      onCheckedChange={() => handleCheckboxChange("previousExams", exam)}
                    />
                    <Label htmlFor={`exam-${exam}`}>{exam}</Label>
                  </div>
                ))}
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
