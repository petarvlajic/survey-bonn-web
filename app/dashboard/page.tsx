"use client"

import { useState, useMemo } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Search, LayoutGrid, TableIcon, BarChart3, FileText, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardHeader } from "@/components/dashboard-header"
import { useResponses } from "@/lib/hooks/use-responses"
import { useSurveys } from "@/lib/hooks/use-survey"
import { responsesAPI } from "@/lib/api/responses"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

export default function DashboardPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"table" | "list">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [surveyFilter, setSurveyFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<"createdAt" | "completedAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const apiFilters = useMemo(() => ({
    page,
    sortBy,
    sortOrder,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(dateFrom && { completedAtFrom: dateFrom }),
    ...(dateTo && { completedAtTo: dateTo }),
  }), [page, sortBy, sortOrder, statusFilter, dateFrom, dateTo])

  const { responses, total, page: currentPage, limit, loading, error, refetch } = useResponses(apiFilters)
  const { surveys } = useSurveys()

  const surveyTitles = useMemo(() => {
    const fromResponses = [...new Set(responses.map(r => r.surveyTitle).filter(Boolean))] as string[]
    const surveyList = Array.isArray(surveys) ? surveys : []
    const fromSurveys = surveyList.map((s: { title?: string }) => s.title).filter((t): t is string => Boolean(t))
    const combined = [...new Set([...fromResponses, ...fromSurveys])].sort()
    return combined
  }, [responses, surveys])

  const filteredData = useMemo(() => {
    return responses.filter(item => {
      const matchesSearch = !searchQuery.trim() ||
        item.intervieweeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.intervieweeEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesSurvey = surveyFilter === "all" || item.surveyTitle === surveyFilter || item.surveyId === surveyFilter
      return matchesSearch && matchesStatus && matchesSurvey
    })
  }, [responses, searchQuery, statusFilter, surveyFilter])

  const completedAt = (item: typeof filteredData[0]) => item.submittedAt ?? (item as any).completedAt ?? null
  const hasSignature = (item: typeof filteredData[0]) => !!(item.signature || item.signedAt)

  const analytics = useMemo(() => {
    const completed = filteredData.filter(r => r.status === "completed").length
    const draft = filteredData.filter(r => r.status === "draft").length
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last7 = filteredData.filter(r => {
      const d = r.createdAt ? new Date(r.createdAt) : null
      return d && d >= sevenDaysAgo
    }).length
    const withSig = filteredData.filter(r => hasSignature(r)).length
    return { completed, draft, last7, withSig }
  }, [filteredData])

  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      byDay[d.toISOString().slice(0, 10)] = 0
    }
    filteredData.forEach(r => {
      if (!r.createdAt) return
      const key = new Date(r.createdAt).toISOString().slice(0, 10)
      if (byDay[key] !== undefined) byDay[key]++
    })
    return Object.entries(byDay).map(([day, count]) => ({ day: day.slice(5), full: day, count }))
  }, [filteredData])

  const pageStart = (currentPage - 1) * limit + 1
  const pageEnd = Math.min(currentPage * limit, total)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function escapeCsvCell(value: unknown): string {
    const s = value == null ? "" : String(value)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const handleExportClient = () => {
    const headers = ["ID", "Interviewer", "Interviewee", "Email", "Survey", "Status", "Created", "Completed", "Signature"]
    const rows = filteredData.map(item => [
      item._id,
      item.interviewerName,
      item.intervieweeName,
      item.intervieweeEmail,
      item.surveyTitle,
      item.status,
      item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      completedAt(item) ? new Date(completedAt(item)!).toLocaleString() : "-",
      hasSignature(item) ? "Yes" : "No"
    ])
    const csv = [headers.map(escapeCsvCell), ...rows.map(r => r.map(escapeCsvCell))].map(row => row.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportServer = async () => {
    setExporting(true)
    try {
      const params: { draft?: boolean; completedAtFrom?: string; completedAtTo?: string } = {}
      if (statusFilter === "draft") params.draft = true
      if (statusFilter === "completed") params.draft = false
      if (dateFrom) params.completedAtFrom = dateFrom
      if (dateTo) params.completedAtTo = dateTo
      const blob = await responsesAPI.exportCSV(Object.keys(params).length ? params : undefined)
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
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
              <Button onClick={handleExportClient} variant="outline" title="Export current filtered list">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportServer} variant="outline" disabled={exporting} title="Export from server (respects status & date filters)">
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting…" : "Export CSV (server)"}
              </Button>
            </div>
          </div>

          {/* Analytics cards */}
          {!loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total (filtered)</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{total}</div>
                  <p className="text-xs text-muted-foreground">responses match current filters</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completed}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.draft}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last 7 days</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.last7}</div>
                  <p className="text-xs text-muted-foreground">created (this page)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">With signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.withSig}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart */}
          {!loading && chartData.some(d => d.count > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Responses by day</CardTitle>
                <CardDescription>Last 14 days (from current page)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { label: "Responses" } }} className="h-[200px] w-full">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tickLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={surveyFilter} onValueChange={(v) => { setSurveyFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by survey" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Surveys</SelectItem>
                  {surveyTitles.map((title) => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="min-w-0"
              />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="min-w-0"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                const [s, o] = v.split("-") as ["createdAt" | "completedAt", "asc" | "desc"]
                setSortBy(s)
                setSortOrder(o)
                setPage(1)
              }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest first</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                  <SelectItem value="completedAt-desc">Completed (newest)</SelectItem>
                  <SelectItem value="completedAt-asc">Completed (oldest)</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : pageStart}–{pageEnd} of {total}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-4 border-destructive/50 bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Retry</Button>
            </Card>
          )}

          {loading && (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">Loading responses...</div>
            </Card>
          )}

          {/* Table View */}
          {!loading && viewMode === "table" && (
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
                        <TableCell className="text-sm">{formatDate(item.createdAt ?? null)}</TableCell>
                        <TableCell className="text-sm">{formatDate(completedAt(item))}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {hasSignature(item) ? "Yes" : "No"}
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
          {!loading && viewMode === "list" && (
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
                    <span>{formatDate(item.createdAt ?? null)}</span>
                    {hasSignature(item) && (
                      <Badge variant="outline" className="text-xs">Signed</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && filteredData.length === 0 && (
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
