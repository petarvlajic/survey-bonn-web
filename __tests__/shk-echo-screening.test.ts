import { describe, expect, it } from "vitest"
import {
  echoValues,
  formatEchoMainValue,
  toggleEchoValue,
  validEchoScreeningFixture,
} from "@/lib/shk-echo-screening"

describe("echo multi-select helpers", () => {
  it("echoValues normalises arrays, legacy strings and empties", () => {
    expect(echoValues(["stenose", "insuffizienz"])).toEqual(["stenose", "insuffizienz"])
    expect(echoValues("stenose")).toEqual(["stenose"])
    expect(echoValues(undefined)).toEqual([])
    expect(echoValues("")).toEqual([])
  })

  it("toggleEchoValue adds, removes and treats unauffaellig as exclusive", () => {
    expect(toggleEchoValue([], "stenose")).toEqual(["stenose"])
    expect(toggleEchoValue(["stenose"], "insuffizienz")).toEqual(["stenose", "insuffizienz"])
    expect(toggleEchoValue(["stenose", "insuffizienz"], "stenose")).toEqual(["insuffizienz"])
    expect(toggleEchoValue(["stenose"], "unauffaellig")).toEqual(["unauffaellig"])
    expect(toggleEchoValue(["unauffaellig"], "stenose")).toEqual(["stenose"])
  })

  it("formatEchoMainValue lists every selected value and still reads legacy strings", () => {
    const both = formatEchoMainValue("aortic_valve", ["stenose", "insuffizienz"])
    expect(both).toContain("V.a. Stenose")
    expect(both).toContain("V.a. Insuffizienz")
    expect(formatEchoMainValue("aortic_valve", "stenose")).toBe("auffällig — V.a. Stenose")
  })

  it("fixture is all unauffaellig arrays", () => {
    for (const v of Object.values(validEchoScreeningFixture().main)) {
      expect(v).toEqual(["unauffaellig"])
    }
  })
})
