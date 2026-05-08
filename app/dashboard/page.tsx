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
  const [pidFilter, setPidFilter] = useState("")
  const [hasSignatureFilter, setHasSignatureFilter] = useState<"all" | "signed" | "unsigned">("all")
  const [workflowFilter, setWorkflowFilter] = useState("all")
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<"createdAt" | "completedAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const apiFilters = useMemo(
    () => ({
      page,
      sortBy,
      sortOrder,
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateFrom && { completedAtFrom: dateFrom }),
      ...(dateTo && { completedAtTo: dateTo }),
      ...(pidFilter.trim() && { pid: pidFilter.trim() }),
      ...(searchQuery.trim() && { search: searchQuery.trim() }),
      ...(workflowFilter !== "all" && { workflowStatus: workflowFilter }),
    }),
    [page, sortBy, sortOrder, statusFilter, dateFrom, dateTo, pidFilter, searchQuery, workflowFilter],
  )

  const { responses, total, page: currentPage, limit, loading, error, refetch } = useResponses(apiFilters)
  const { surveys } = useSurveys()

  const hasSignature = (item: (typeof responses)[number]) => !!(item.signature || item.signedAt)

  const surveyTitles = useMemo(() => {
    const fromResponses = [...new Set(responses.map(r => r.surveyTitle).filter(Boolean))] as string[]
    const surveyList = Array.isArray(surveys) ? surveys : []
    const fromSurveys = surveyList.map((s: { title?: string }) => s.title).filter((t): t is string => Boolean(t))
    const combined = [...new Set([...fromResponses, ...fromSurveys])].sort()
    return combined
  }, [responses, surveys])

  /** Status / PID / workflow / text search are applied on the server; here we only narrow by survey title and signature. */
  const filteredData = useMemo(() => {
    return responses.filter(item => {
      const matchesSurvey = surveyFilter === "all" || item.surveyTitle === surveyFilter || item.surveyId === surveyFilter
      const matchesSignature =
        hasSignatureFilter === "all" ||
        (hasSignatureFilter === "signed" && hasSignature(item)) ||
        (hasSignatureFilter === "unsigned" && !hasSignature(item))
      return matchesSurvey && matchesSignature
    })
  }, [responses, surveyFilter, hasSignatureFilter])

  const completedAt = (item: (typeof responses)[number]) => item.submittedAt ?? (item as any).completedAt ?? null

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
    const headers = [
      "ID",
      "PID",
      "Workflow",
      "Locked",
      "Interviewer",
      "Interviewee",
      "Email",
      "Survey",
      "Status",
      "Created",
      "Completed",
      "Signature",
    ]
    const rows = filteredData.map(item => [
      item._id,
      item.pid ?? "",
      item.workflowStatus ?? "patient_completed",
      item.lockedBy ? "Yes" : "No",
      item.interviewerName,
      item.intervieweeName,
      item.intervieweeEmail,
      item.surveyTitle,
      item.status,
      item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      completedAt(item) ? new Date(completedAt(item)!).toLocaleString() : "-",
      hasSignature(item) ? "Yes" : "No",
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
      const params: {
        draft?: boolean
        completedAtFrom?: string
        completedAtTo?: string
        workflowStatus?: string
        pid?: string
        search?: string
      } = {}
      if (statusFilter === "draft") params.draft = true
      if (statusFilter === "completed") params.draft = false
      if (dateFrom) params.completedAtFrom = dateFrom
      if (dateTo) params.completedAtTo = dateTo
      if (workflowFilter !== "all") params.workflowStatus = workflowFilter
      if (pidFilter.trim()) params.pid = pidFilter.trim()
      if (searchQuery.trim()) params.search = searchQuery.trim()
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

  const surfaceCard =
    "border-border/50 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-border hover:shadow-md"

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,hsl(var(--primary)/0.09),transparent_55%)]"
      />
      <DashboardHeader />

      <main className="container relative mx-auto px-4 py-8 lg:py-10">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Survey responses
              </h1>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                Filter by workflow status, PID, and dates — open a row for full detail,
                signatures, and SHK follow-up.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="font-medium shadow-sm"
                onClick={() => router.push("/dashboard/survey/new")}
              >
                New survey
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                className="border-border/60 shadow-none"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="border-border/60 shadow-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleExportClient}
                variant="outline"
                className="border-border/60 shadow-none"
                title="Export current filtered list"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportServer}
                variant="outline"
                className="border-border/60 shadow-none"
                disabled={exporting}
                title="Export from server (respects status & date filters)"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting…" : "Export CSV (server)"}
              </Button>
            </div>
          </div>

          {/* Analytics cards */}
          {!loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total (filtered)</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{total}</div>
                  <p className="text-xs text-muted-foreground">server filters (status, dates, PID, search, workflow)</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completed}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.draft}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last 7 days</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.last7}</div>
                  <p className="text-xs text-muted-foreground">created (this page)</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
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
            <Card className={surfaceCard}>
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
          <Card className={`p-4 ${surfaceCard}`}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
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
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Filter by PID..."
                value={pidFilter}
                onChange={(e) => {
                  setPidFilter(e.target.value)
                  setPage(1)
                }}
              />
              <Select
                value={hasSignatureFilter}
                onValueChange={v => {
                  setHasSignatureFilter(v as typeof hasSignatureFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Signature filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All signatures</SelectItem>
                  <SelectItem value="signed">Only signed</SelectItem>
                  <SelectItem value="unsigned">Only unsigned</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={workflowFilter}
                onValueChange={v => {
                  setWorkflowFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Workflow filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All workflow states</SelectItem>
                  <SelectItem value="patient_in_progress">Patient in progress</SelectItem>
                  <SelectItem value="patient_completed">Patient completed</SelectItem>
                  <SelectItem value="shk_in_progress">SHK in progress</SelectItem>
                  <SelectItem value="pending_shk_followup">Pending SHK follow-up</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
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
            <Card className="border-destructive/40 bg-destructive/10 p-4 shadow-sm">
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
            <Card className={`overflow-hidden ${surfaceCard}`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>PID</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Lock</TableHead>
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
                        <TableCell className="font-mono text-sm">{item.pid}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.workflowStatus ?? "patient_completed"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.lockedBy ? "default" : "secondary"}>
                            {item.lockedBy ? "Locked" : "Open"}
                          </Badge>
                        </TableCell>
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
                  className={`cursor-pointer space-y-3 p-4 transition-[box-shadow,border-color,background-color] duration-200 hover:border-primary/25 hover:bg-muted/40 hover:shadow-md ${surfaceCard}`}
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.workflowStatus ?? "patient_completed"}</Badge>
                    <Badge variant={item.lockedBy ? "default" : "secondary"}>
                      {item.lockedBy ? "Locked" : "Open"}
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
