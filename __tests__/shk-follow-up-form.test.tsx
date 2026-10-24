import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShkFollowUpForm } from "@/components/shk-follow-up-form"
import { getEchoRowOptions, ECHO_MAIN_ROWS } from "@/lib/shk-echo-screening"
import { responsesAPI } from "@/lib/api/responses"

vi.mock("@/lib/api/responses", () => ({
  responsesAPI: { completeFollowUp: vi.fn(async () => ({})) },
}))

const response = { _id: "r1" } as never

describe("ShkFollowUpForm — multi-select rows", () => {
  beforeEach(() => vi.mocked(responsesAPI.completeFollowUp).mockClear())

  it("renders checkboxes (not radios) for every main row", () => {
    render(<ShkFollowUpForm response={response} />)
    const mainOptionCount = ECHO_MAIN_ROWS.reduce((n, r) => n + getEchoRowOptions(r.id).length, 0)
    // main rows + 3 optional items + "pathological finding" box; overall stays a radio group
    expect(screen.getAllByRole("checkbox")).toHaveLength(mainOptionCount + 4)
    expect(screen.getAllByRole("radio")).toHaveLength(2)
  })

  it("submits Stenose + Insuffizienz together as an array", async () => {
    const user = userEvent.setup()
    render(<ShkFollowUpForm response={response} />)

    for (const row of ECHO_MAIN_ROWS) {
      if (row.id === "aortic_valve") continue
      await user.click(document.getElementById(`${row.id}-unauffaellig`)!)
    }
    await user.click(document.getElementById("aortic_valve-stenose")!)
    await user.click(document.getElementById("aortic_valve-insuffizienz")!)
    await user.click(screen.getByLabelText("unauffälliges Echo-Screening"))
    await user.click(screen.getByRole("button", { name: "Follow-up abschließen" }))

    await waitFor(() => expect(responsesAPI.completeFollowUp).toHaveBeenCalled())
    const payload = vi.mocked(responsesAPI.completeFollowUp).mock.calls[0][1] as never as {
      echoScreening: { main: Record<string, string[]> }
    }
    expect(payload.echoScreening.main.aortic_valve).toEqual(["stenose", "insuffizienz"])
    expect(payload.echoScreening.main.lv_function).toEqual(["unauffaellig"])
  })

  it("unauffällig unticks other picks in the same row", async () => {
    const user = userEvent.setup()
    render(<ShkFollowUpForm response={response} />)
    await user.click(document.getElementById("mitral_valve-stenose")!)
    await user.click(document.getElementById("mitral_valve-unauffaellig")!)
    expect(document.getElementById("mitral_valve-stenose")).toHaveAttribute("aria-checked", "false")
    expect(document.getElementById("mitral_valve-unauffaellig")).toHaveAttribute("aria-checked", "true")
  })

  it("keeps submit disabled until every row has a selection", () => {
    render(<ShkFollowUpForm response={response} />)
    expect(screen.getByRole("button", { name: "Follow-up abschließen" })).toBeDisabled()
  })
})
