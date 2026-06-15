"use client"

import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, Calendar, User, Mail, FileText, CheckCircle2, FileDown } from 'lucide-react'
import { useState } from "react"
import { useResponse } from "@/lib/hooks/use-responses"
import { responsesAPI } from "@/lib/api/responses"
import type { ResponseAnswer, SurveyResponse } from "@/lib/api/responses"
import { getSurveyFieldLabel } from "@/lib/survey-field-labels"
import { ShkFollowUpForm } from "@/components/shk-follow-up-form"
import { CopyableText } from "@/components/copyable-text"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatGenderLabel } from "@/lib/gender"
import {
  ECHO_MAIN_ROWS,
  ECHO_OPTIONAL_ITEMS,
  ECHO_OVERALL,
  formatEchoMainValue,
} from "@/lib/shk-echo-screening"

function lockedByUserId(lockedBy: SurveyResponse["lockedBy"]): string | undefined {
  if (lockedBy == null || lockedBy === "") return undefined
  if (typeof lockedBy === "object" && lockedBy !== null && "_id" in lockedBy && lockedBy._id != null) {
    return String(lockedBy._id)
  }
  if (typeof lockedBy === "string") return lockedBy
  return undefined
}

function formatBirthDateDisplay(iso: string | undefined): string {
  if (!iso?.trim()) return "—"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  return iso
}

function formatAnswer(value: string | string[] | number | boolean): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object" && value !== null) return JSON.stringify(value)
  return String(value ?? "")
}

export default function ResponseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ""

  const { response, loading, error, refetch } = useResponse(id)
  const { user } = useAuth()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [workflowActionLoading, setWorkflowActionLoading] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  const handlePrintPDF = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!id) return
    setPdfLoading(true)
    try {
      const blob = await responsesAPI.exportPDF(id) as Blob
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `response-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF export failed", e)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleLock = async () => {
    if (!id) return
    setWorkflowActionLoading(true)
    try {
      await responsesAPI.lock(id)
      await refetch()
    } catch (e) {
      console.error("Lock failed", e)
    } finally {
      setWorkflowActionLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!id) return
    setWorkflowActionLoading(true)
    try {
      await responsesAPI.unlock(id)
      await refetch()
    } catch (e) {
      console.error("Unlock failed", e)
    } finally {
      setWorkflowActionLoading(false)
    }
  }

  const handleClose = async () => {
    if (!id) return
    setCloseError(null)
    setWorkflowActionLoading(true)
    try {
      await responsesAPI.close(id)
      await refetch()
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setCloseError(msg ?? "Close failed")
    } finally {
      setWorkflowActionLoading(false)
    }
  }

  const completedAt = response?.submittedAt ?? (response as { completedAt?: string })?.completedAt ?? null
  const hasSignature = !!(response?.signature || response?.signedAt)
  const rawAnswers = response?.answers ?? []
  const answersList: { question: string; answer: string; imageUri?: string }[] = rawAnswers.map((a: ResponseAnswer) => {
    const label = getSurveyFieldLabel(a.questionId ?? "")
    const val = a.answer !== undefined ? a.answer : a.value
    return {
      question: label,
      answer: formatAnswer(val as string | string[] | number | boolean),
      imageUri: (a as any).imageUri,
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto py-6 px-4">
          <Card className="p-12">
            <div className="text-center text-muted-foreground">Loading response...</div>
          </Card>
        </main>
      </div>
    )
  }

  if (error || !response) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto py-6 px-4">
          <Card className="p-12">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">{error || "Response not found"}</p>
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const interviewerEmail = (response as { interviewerEmail?: string }).interviewerEmail
  const workflowStatus = response.workflowStatus ?? "patient_completed"
  const changeLog = response.changeLog ?? []
  const needsFollowUp =
    !!response.patientBoundedSubmit &&
    workflowStatus !== "closed" &&
    !response.shkFollowUp?.completedAt
  const lockOwnerId = lockedByUserId(response.lockedBy)
  const isLockOwner = Boolean(user?.id && lockOwnerId && user.id === lockOwnerId)
  const allowCloseWithoutFollowUp = workflowStatus !== "closed" && !needsFollowUp

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="print:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Response Details</h1>
              <p className="text-muted-foreground text-sm">
                {response.pid ? (
                  <CopyableText value={response.pid} prefix="PID" />
                ) : (
                  <>Response: {response._id ?? id}</>
                )}
              </p>
            </div>
            <Badge variant={response.status === "completed" ? "default" : "secondary"}>
              {response.status}
            </Badge>
            <Badge variant="outline">{workflowStatus}</Badge>
            <Button 
              onClick={handleDownloadPDF}
              variant="outline"
              disabled={pdfLoading}
              className="print:hidden"
              title="Download PDF from server"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {pdfLoading ? "Downloading…" : "Download PDF"}
            </Button>
            <Button 
              onClick={handlePrintPDF}
              variant="ghost"
              size="sm"
              className="print:hidden"
              title="Print current page"
            >
              Print
            </Button>
            {workflowStatus !== "closed" && !response.lockedBy && (
              <Button
                onClick={handleLock}
                variant="outline"
                size="sm"
                disabled={workflowActionLoading}
                className="print:hidden"
              >
                Lock
              </Button>
            )}
            {!!response.lockedBy && workflowStatus !== "closed" && (
              <Button
                onClick={handleUnlock}
                variant="outline"
                size="sm"
                disabled={workflowActionLoading}
                className="print:hidden"
              >
                Unlock
              </Button>
            )}
            {allowCloseWithoutFollowUp && (
              <Button
                onClick={handleClose}
                variant="default"
                size="sm"
                disabled={workflowActionLoading}
                className="print:hidden"
              >
                Close
              </Button>
            )}
          </div>
          {closeError && (
            <p className="text-sm text-destructive print:hidden">{closeError}</p>
          )}

          {needsFollowUp && !lockOwnerId && (
            <Card className="print:hidden border-dashed bg-muted/30">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Dieser Datensatz wartet auf den SHK-Follow-up. Bitte mit <strong>Sperren</strong> durch die Prüfperson reservieren, anschließend die Checkliste abschließen.
              </CardContent>
            </Card>
          )}
          {needsFollowUp && !!lockOwnerId && !isLockOwner && (
            <Card className="print:hidden border-dashed bg-muted/30">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Der Eintrag ist von einer anderen Prüfperson gesperrt. Follow-up kann nur von der Person abgeschlossen werden, die die Sperre hält.
              </CardContent>
            </Card>
          )}
          {needsFollowUp && isLockOwner && (
            <div className="print:hidden">
              <ShkFollowUpForm response={response} disabled={workflowActionLoading} onComplete={() => void refetch()} />
            </div>
          )}

          {/* Survey Information */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Survey Title</p>
                  <p className="font-medium">{response.surveyTitle}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p>{formatDate(response.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p>{formatDate(completedAt)}</p>
                  </div>
                </div>
              </div>
              {response.pid && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Patient ID (PID)</p>
                      <CopyableText value={response.pid} />
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signature Status</p>
                  <Badge variant="outline" className="mt-1">
                    {hasSignature ? "Signed" : "Not Signed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interviewer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Interviewer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{response.interviewerName}</p>
                </div>
              </div>
              {interviewerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{interviewerEmail}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviewee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Interviewee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  {response.intervieweeName?.trim() ? (
                    <CopyableText
                      value={response.intervieweeName}
                      valueClassName="font-medium font-sans"
                    />
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{response.intervieweeEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{response.intervieweePhone || "—"}</p>
                </div>
              </div>
              {response.intervieweeAddress?.trim() ? (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="whitespace-pre-wrap">{response.intervieweeAddress}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Geburtsdatum (Birth Date)</p>
                  {response.birthDate?.trim() ? (
                    <CopyableText
                      value={formatBirthDateDisplay(response.birthDate)}
                      valueClassName="font-medium font-sans"
                    />
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Geschlecht (Gender)</p>
                  {response.gender?.trim() ? (
                    <CopyableText
                      value={formatGenderLabel(response.gender)}
                      valueClassName="font-medium font-sans"
                    />
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Survey Responses */}
          {answersList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Survey Responses</CardTitle>
                <CardDescription>Answers provided by the interviewee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {answersList.map((item, index) => (
                  <div key={index} className="mb-0">
                    {index > 0 && <Separator className="my-3" />}
                    <div className="space-y-2 py-0">
                      <p className="font-medium">{item.question}</p>
                      <p className="text-muted-foreground">{item.answer}</p>
                      {item.imageUri && (
                        <img src={item.imageUri} alt="attachment" className="mt-2 max-h-52 rounded border object-contain" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {response.shkFollowUp?.echoScreening?.main ? (
            <Card>
              <CardHeader>
                <CardTitle>SHK Echo-Screening</CardTitle>
                <CardDescription>Nachgespräch — Echokardiographie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ECHO_MAIN_ROWS.map((row) => (
                  <div key={row.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <span className="font-medium min-w-[10rem]">{row.categoryDe}</span>
                    <span className="text-muted-foreground">
                      {formatEchoMainValue(row.id, response.shkFollowUp!.echoScreening!.main[row.id])}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <p className="font-medium">Optional (Kurzcheck)</p>
                {ECHO_OPTIONAL_ITEMS.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span>{item.labelDe}</span>
                    <span className="text-muted-foreground">
                      {response.shkFollowUp!.echoScreening!.optional[item.id] ? "ja" : "nein"}
                    </span>
                  </div>
                ))}
                {response.shkFollowUp.echoScreening.comment?.trim() ? (
                  <>
                    <Separator className="my-2" />
                    <p className="font-medium">Freitext / Kommentar</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {response.shkFollowUp.echoScreening.comment}
                    </p>
                  </>
                ) : null}
                <Separator className="my-2" />
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <span className="font-medium">Gesamtbeurteilung</span>
                  <span className="text-muted-foreground">
                    {ECHO_OVERALL.find((o) => o.id === response.shkFollowUp!.echoScreening!.overall)?.labelDe ??
                      response.shkFollowUp.echoScreening.overall}
                  </span>
                </div>
                {response.pathologicalFindingReport ? (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-orange-600 w-fit">
                    Nachverfolgung ausgelöst
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {hasSignature && (
            <Card>
              <CardHeader>
                <CardTitle>Signature</CardTitle>
                <CardDescription>Interviewee's digital signature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-muted/20">
                  <div className="space-y-4">
                    <div className="h-32 flex items-center justify-center border-b border-dashed border-muted-foreground/30">
                      <div className="text-4xl font-signature text-primary/80" style={{ fontFamily: 'cursive' }}>
                        {response.intervieweeName}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Signed by: {response.intervieweeName}</span>
                      <span>Date: {formatDate(completedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {response.status === "draft" && (
            <Card className="bg-muted/50 print:hidden">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  This response is still in draft status. Survey responses will appear once completed.
                </p>
              </CardContent>
            </Card>
          )}

          {changeLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Change Log</CardTitle>
                <CardDescription>Field-level modifications for this response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {changeLog.map((entry, idx) => (
                  <div key={idx} className="rounded-md border p-3">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {entry.source} · {formatDate(entry.changedAt)}
                    </div>
                    {entry.reason && <div className="mb-2 text-sm">Reason: {entry.reason}</div>}
                    <div className="space-y-1">
                      {entry.changes.map((c, cIdx) => (
                        <div key={`${idx}-${cIdx}`} className="text-sm">
                          <span className="font-medium">{c.field}:</span> "{c.previousValue}" → "{c.nextValue}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
