import { render, screen, fireEvent } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"
import type { SurveyResponse } from "@/lib/api/responses"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/lib/hooks/use-survey", () => ({
  useSurveys: () => ({ surveys: [], loading: false, error: null, refetch: vi.fn() }),
}))

const mockResponses: SurveyResponse[] = [
  {
    _id: "1",
    pid: "PID-123",
    surveyId: "s1",
    surveyTitle: "Cardiac Health Survey",
    interviewerName: "Doc 1",
    intervieweeName: "Alice",
    intervieweeEmail: "alice@example.com",
    answers: [],
    status: "completed",
    signature: "sig",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    pid: "PID-999",
    surveyId: "s1",
    surveyTitle: "Cardiac Health Survey",
    interviewerName: "Doc 2",
    intervieweeName: "Bob",
    intervieweeEmail: "bob@example.com",
    answers: [],
    status: "draft",
    createdAt: new Date().toISOString(),
  },
] as SurveyResponse[]

vi.mock("@/lib/hooks/use-responses", () => ({
  useResponses: () => ({
    responses: mockResponses,
    total: mockResponses.length,
    page: 1,
    limit: 50,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

describe("DashboardPage analytics and filters", () => {
  it("renders PID column and values in table view", () => {
    render(<DashboardPage />)

    expect(screen.getByText("PID")).toBeInTheDocument()
    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.getByText("PID-999")).toBeInTheDocument()
  })

  it("filters responses by PID", () => {
    render(<DashboardPage />)

    const pidInput = screen.getByPlaceholderText("Filter by PID...")
    fireEvent.change(pidInput, { target: { value: "PID-123" } })

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("filters responses by signature status", () => {
    render(<DashboardPage />)

    const signatureSelect = screen.getByText("All signatures")
    fireEvent.click(signatureSelect)
    fireEvent.click(screen.getByText("Only signed"))

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("exports CSV with PID column and values", () => {
    const blobMock = vi.fn()
    ;(global as any).Blob = blobMock as any

    render(<DashboardPage />)

    fireEvent.click(screen.getByTitle("Export current filtered list"))

    expect(blobMock).toHaveBeenCalled()
    const [parts] = blobMock.mock.calls[0] as unknown[]
    const csv = String((parts as unknown[])[0])

    expect(csv).toContain("ID,PID,Interviewer,Interviewee,Email,Survey,Status,Created,Completed,Signature")
    expect(csv).toContain("PID-123")
    expect(csv).toContain("PID-999")
  })
})

