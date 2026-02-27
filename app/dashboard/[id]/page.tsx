"use client"

import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, Calendar, User, Mail, FileText, CheckCircle2, FileDown } from 'lucide-react'

// Mock data - same as dashboard
const mockResponses = [
  {
    _id: "1",
    surveyTitle: "Patient Satisfaction Survey 2024",
    interviewerName: "Dr. Sarah Schmidt",
    interviewerEmail: "sarah.schmidt@ukbonn.de",
    intervieweeName: "Anna Mueller",
    intervieweeEmail: "anna.m@example.com",
    intervieweePhone: "+49 228 123 4567",
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T11:45:00Z",
    hasSignature: true,
    responses: [
      { question: "How satisfied are you with your treatment?", answer: "Very satisfied" },
      { question: "Would you recommend our facility?", answer: "Yes, definitely" },
      { question: "Additional comments", answer: "The staff was very professional and caring." }
    ]
  },
  {
    _id: "2",
    surveyTitle: "Clinical Trial Feedback",
    interviewerName: "Dr. Michael Weber",
    interviewerEmail: "michael.weber@ukbonn.de",
    intervieweeName: "Thomas Becker",
    intervieweeEmail: "t.becker@example.com",
    intervieweePhone: "+49 228 234 5678",
    status: "draft",
    createdAt: "2024-01-16T09:15:00Z",
    completedAt: null,
    hasSignature: false,
    responses: []
  },
  {
    _id: "3",
    surveyTitle: "Patient Satisfaction Survey 2024",
    interviewerName: "Dr. Sarah Schmidt",
    interviewerEmail: "sarah.schmidt@ukbonn.de",
    intervieweeName: "Maria Fischer",
    intervieweeEmail: "m.fischer@example.com",
    intervieweePhone: "+49 228 345 6789",
    status: "completed",
    createdAt: "2024-01-16T14:20:00Z",
    completedAt: "2024-01-16T15:10:00Z",
    hasSignature: true,
    responses: [
      { question: "How satisfied are you with your treatment?", answer: "Satisfied" },
      { question: "Would you recommend our facility?", answer: "Yes" },
      { question: "Additional comments", answer: "Good experience overall." }
    ]
  },
  {
    _id: "4",
    surveyTitle: "Treatment Outcome Assessment",
    interviewerName: "Dr. Klaus Hoffmann",
    interviewerEmail: "klaus.hoffmann@ukbonn.de",
    intervieweeName: "Peter Wagner",
    intervieweeEmail: "p.wagner@example.com",
    intervieweePhone: "+49 228 456 7890",
    status: "completed",
    createdAt: "2024-01-17T08:00:00Z",
    completedAt: "2024-01-17T09:30:00Z",
    hasSignature: true,
    responses: [
      { question: "How effective was the treatment?", answer: "Very effective" },
      { question: "Any side effects?", answer: "Minor side effects, manageable" },
      { question: "Overall satisfaction", answer: "Highly satisfied" }
    ]
  },
  {
    _id: "5",
    surveyTitle: "Clinical Trial Feedback",
    interviewerName: "Dr. Michael Weber",
    interviewerEmail: "michael.weber@ukbonn.de",
    intervieweeName: "Sabine Schulz",
    intervieweeEmail: "s.schulz@example.com",
    intervieweePhone: "+49 228 567 8901",
    status: "draft",
    createdAt: "2024-01-17T13:45:00Z",
    completedAt: null,
    hasSignature: false,
    responses: []
  }
]

export default function ResponseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const response = mockResponses.find(r => r._id === id)

  const handlePrintPDF = () => {
    window.print()
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto py-6 px-4">
          <Card className="p-12">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Response not found</p>
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

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
              <p className="text-muted-foreground">ID: {response._id}</p>
            </div>
            <Badge variant={response.status === "completed" ? "default" : "secondary"}>
              {response.status}
            </Badge>
            <Button 
              onClick={handlePrintPDF}
              variant="outline"
              className="print:hidden"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF
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
                    <p>{formatDate(response.completedAt)}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signature Status</p>
                  <Badge variant="outline" className="mt-1">
                    {response.hasSignature ? "Signed" : "Not Signed"}
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
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{response.interviewerEmail}</p>
                </div>
              </div>
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
          {response.responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Survey Responses</CardTitle>
                <CardDescription>Answers provided by the interviewee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {response.responses.map((item, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="space-y-2">
                      <p className="font-medium">{item.question}</p>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {response.hasSignature && (
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
                      <span>Date: {formatDate(response.completedAt)}</span>
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
