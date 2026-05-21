import { render, screen } from "@testing-library/react"
import ResponseDetailsPage from "@/app/dashboard/[id]/page"
import type { SurveyResponse } from "@/lib/api/responses"

const baseResponse: SurveyResponse = {
  _id: "1",
  pid: "PID-777",
  surveyId: "s1",
  surveyTitle: "Cardiac Health Survey",
  interviewerName: "Doc 1",
  intervieweeName: "Alice",
  intervieweeEmail: "alice@example.com",
  answers: [],
  status: "completed",
  workflowStatus: "patient_completed",
  createdAt: new Date().toISOString(),
  signature: "sig",
  changeLog: [
    {
      changedBy: "u1",
      changedAt: new Date().toISOString(),
      source: "SHK",
      reason: "Correction",
      changes: [{ field: "intervieweeName", previousValue: "Alice", nextValue: "Alice P." }],
    },
  ],
}

let mockResponse: SurveyResponse = { ...baseResponse }

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/lib/hooks/use-responses", () => ({
  useResponse: () => ({
    response: mockResponse,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

describe("ResponseDetailsPage", () => {
  beforeEach(() => {
    mockResponse = { ...baseResponse, changeLog: [...(baseResponse.changeLog ?? [])] }
  })

  it("shows PID meta information when pid is present", () => {
    render(<ResponseDetailsPage />)

    expect(screen.getByText("Patient ID (PID)")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /PID-777/i }).length).toBeGreaterThanOrEqual(1)
  })

  it("indicates signed status based on signature fields", () => {
    render(<ResponseDetailsPage />)

    expect(screen.getByText("Signature Status")).toBeInTheDocument()
    expect(screen.getByText("Signed")).toBeInTheDocument()
  })

  it("renders workflow and change log information", () => {
    render(<ResponseDetailsPage />)

    expect(screen.getByText("patient_completed")).toBeInTheDocument()
    expect(screen.getByText("Change Log")).toBeInTheDocument()
    expect(screen.getByText(/intervieweeName/i)).toBeInTheDocument()
  })

  it("shows Lock and Close buttons when response is open and unlocked", () => {
    mockResponse = { ...baseResponse, workflowStatus: "patient_completed", lockedBy: undefined }
    render(<ResponseDetailsPage />)

    expect(screen.getByText("Lock")).toBeInTheDocument()
    expect(screen.getByText("Close")).toBeInTheDocument()
    expect(screen.queryByText("Unlock")).not.toBeInTheDocument()
  })

  it("shows Unlock and hides actions when locked/closed states change", () => {
    mockResponse = { ...baseResponse, workflowStatus: "shk_in_progress", lockedBy: "shk-1" }
    const { rerender } = render(<ResponseDetailsPage />)
    expect(screen.getByText("Unlock")).toBeInTheDocument()
    expect(screen.getByText("Close")).toBeInTheDocument()
    expect(screen.queryByText("Lock")).not.toBeInTheDocument()

    mockResponse = { ...baseResponse, workflowStatus: "closed", lockedBy: undefined }
    rerender(<ResponseDetailsPage />)
    expect(screen.queryByText("Lock")).not.toBeInTheDocument()
    expect(screen.queryByText("Unlock")).not.toBeInTheDocument()
    expect(screen.queryByText("Close")).not.toBeInTheDocument()
  })
})

