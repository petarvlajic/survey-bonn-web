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
import type { ResponseAnswer } from "@/lib/api/responses"
import { getSurveyFieldLabel } from "@/lib/survey-field-labels"

function formatAnswer(value: string | string[] | number | boolean): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object" && value !== null) return JSON.stringify(value)
  return String(value ?? "")
}

export default function ResponseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ""

  const { response, loading, error } = useResponse(id)
  const [pdfLoading, setPdfLoading] = useState(false)

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

  const completedAt = response?.submittedAt ?? (response as { completedAt?: string })?.completedAt ?? null
  const hasSignature = !!(response?.signature || response?.signedAt)
  const rawAnswers = response?.answers ?? []
  const answersList: { question: string; answer: string }[] = rawAnswers.map((a: ResponseAnswer) => {
    const label = getSurveyFieldLabel(a.questionId ?? "")
    const val = a.answer !== undefined ? a.answer : a.value
    return { question: label, answer: formatAnswer(val as string | string[] | number | boolean) }
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
              <p className="text-muted-foreground">ID: {response._id ?? id}</p>
            </div>
            <Badge variant={response.status === "completed" ? "default" : "secondary"}>
              {response.status}
            </Badge>
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
          </div>

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
                      <p>{response.pid}</p>
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
                  <p className="font-medium">{response.intervieweeName}</p>
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
                  <p>{response.intervieweePhone}</p>
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
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
        </div>
      </main>
    </div>
  )
}
