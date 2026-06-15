import { describe, expect, it } from "vitest"
import {
  CARDIAC_CHECKBOX_GROUPS,
  checkboxKeysToAnswerFilters,
  listCheckedFilterItems,
} from "@/lib/cardiac-checkbox-filters"

describe("cardiac-checkbox-filters", () => {
  it("maps boolean checkboxes to eq yes", () => {
    const filters = checkboxKeysToAnswerFilters(["bool:hasChestComplaints"])
    expect(filters).toEqual([
      { questionId: "hasChestComplaints", op: "eq", value: "yes" },
    ])
  })

  it("maps multiselect options to contains", () => {
    const filters = checkboxKeysToAnswerFilters(["opt:riskFactors:Bluthochdruck"])
    expect(filters).toEqual([
      { questionId: "riskFactors", op: "contains", value: "Bluthochdruck" },
    ])
  })

  it("AND-combines multiple checked keys", () => {
    const filters = checkboxKeysToAnswerFilters([
      "bool:valveDisease",
      "opt:heartDiseases:Herzinfarkt",
    ])
    expect(filters).toHaveLength(2)
  })

  it("lists checked items with labels", () => {
    const items = listCheckedFilterItems(new Set(["bool:valveDisease"]))
    expect(items).toHaveLength(1)
    expect(items[0].label).toMatch(/Herzklapp/)
  })

  it("defines cardiac symptom groups", () => {
    expect(CARDIAC_CHECKBOX_GROUPS.some((g) => g.id === "riskFactors")).toBe(true)
    const risks = CARDIAC_CHECKBOX_GROUPS.find((g) => g.id === "riskFactors")
    expect(risks?.items.some((i) => i.label === "Bluthochdruck")).toBe(true)
  })
})
