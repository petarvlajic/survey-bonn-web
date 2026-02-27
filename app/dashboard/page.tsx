"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Download, Search, LayoutGrid, TableIcon } from 'lucide-react'
import { DashboardHeader } from "@/components/dashboard-header"

// Mock data matching backend schema
const mockResponses = [
  {
    _id: "1",
    surveyTitle: "Patient Satisfaction Survey 2024",
    interviewerName: "Dr. Sarah Schmidt",
    intervieweeName: "Anna Mueller",
    intervieweeEmail: "anna.m@example.com",
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T11:45:00Z",
    hasSignature: true
  },
  {
    _id: "2",
    surveyTitle: "Clinical Trial Feedback",
    interviewerName: "Dr. Michael Weber",
    intervieweeName: "Thomas Becker",
    intervieweeEmail: "t.becker@example.com",
    status: "draft",
    createdAt: "2024-01-16T09:15:00Z",
    completedAt: null,
    hasSignature: false
  },
  {
    _id: "3",
    surveyTitle: "Patient Satisfaction Survey 2024",
    interviewerName: "Dr. Sarah Schmidt",
    intervieweeName: "Maria Fischer",
    intervieweeEmail: "m.fischer@example.com",
    status: "completed",
    createdAt: "2024-01-16T14:20:00Z",
    completedAt: "2024-01-16T15:10:00Z",
    hasSignature: true
  },
  {
    _id: "4",
    surveyTitle: "Treatment Outcome Assessment",
    interviewerName: "Dr. Klaus Hoffmann",
    intervieweeName: "Peter Wagner",
    intervieweeEmail: "p.wagner@example.com",
    status: "completed",
    createdAt: "2024-01-17T08:00:00Z",
    completedAt: "2024-01-17T09:30:00Z",
    hasSignature: true
  },
  {
    _id: "5",
    surveyTitle: "Clinical Trial Feedback",
    interviewerName: "Dr. Michael Weber",
    intervieweeName: "Sabine Schulz",
    intervieweeEmail: "s.schulz@example.com",
    status: "draft",
    createdAt: "2024-01-17T13:45:00Z",
    completedAt: null,
    hasSignature: false
  }
]

export default function DashboardPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"table" | "list">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [surveyFilter, setSurveyFilter] = useState("all")

  // Filter data
  const filteredData = mockResponses.filter(item => {
    const matchesSearch = item.intervieweeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.intervieweeEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesSurvey = surveyFilter === "all" || item.surveyTitle === surveyFilter
    
    return matchesSearch && matchesStatus && matchesSurvey
  })

  // Export to CSV
  const handleExport = () => {
    const headers = ["ID", "Interviewer", "Interviewee", "Email", "Survey", "Status", "Created", "Completed", "Signature"]
    const csvData = filteredData.map(item => [
      item._id,
      item.interviewerName,
      item.intervieweeName,
      item.intervieweeEmail,
      item.surveyTitle,
      item.status,
      new Date(item.createdAt).toLocaleString(),
      item.completedAt ? new Date(item.completedAt).toLocaleString() : "-",
      item.hasSignature ? "Yes" : "No"
    ])

    const csv = [headers, ...csvData].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "survey-responses.csv"
    a.click()
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
      
      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Survey Responses</h1>
              <p className="text-muted-foreground">Manage and view all survey records</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/dashboard/survey/new")}>
                New Survey
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={surveyFilter} onValueChange={setSurveyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by survey" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Surveys</SelectItem>
                  <SelectItem value="Patient Satisfaction Survey 2024">Patient Satisfaction Survey</SelectItem>
                  <SelectItem value="Clinical Trial Feedback">Clinical Trial Feedback</SelectItem>
                  <SelectItem value="Treatment Outcome Assessment">Treatment Outcome Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table View */}
          {viewMode === "table" && (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Interviewer</TableHead>
                      <TableHead>Interviewee</TableHead>
                      <TableHead>Survey</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow 
                        key={item._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/${item._id}`)}
                      >
                        <TableCell className="font-mono text-sm">{item._id}</TableCell>
                        <TableCell>{item.interviewerName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.intervieweeName}</div>
                            <div className="text-sm text-muted-foreground">{item.intervieweeEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.surveyTitle}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                        <TableCell className="text-sm">{formatDate(item.completedAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.hasSignature ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((item) => (
                <Card 
                  key={item._id} 
                  className="p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/${item._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-muted-foreground">#{item._id}</p>
                      <h3 className="font-semibold">{item.intervieweeName}</h3>
                      <p className="text-sm text-muted-foreground">{item.intervieweeEmail}</p>
                    </div>
                    <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Survey</p>
                    <p className="text-sm">{item.surveyTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Interviewer</p>
                    <p className="text-sm">{item.interviewerName}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{formatDate(item.createdAt)}</span>
                    {item.hasSignature && (
                      <Badge variant="outline" className="text-xs">Signed</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No results */}
          {filteredData.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">No responses found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
