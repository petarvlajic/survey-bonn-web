"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Section, Question } from "@/lib/api/surveys"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SurveyBuilderProps {
  sections: Section[]
  onChange: (sections: Section[]) => void
}

export function SurveyBuilder({ sections, onChange }: SurveyBuilderProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  const addSection = () => {
    onChange([
      ...sections,
      {
        title: "",
        description: "",
        questions: [],
      },
    ])
    setExpandedSections(new Set([...expandedSections, sections.length]))
  }

  const updateSection = (index: number, updates: Partial<Section>) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], ...updates }
    onChange(newSections)
  }

  const deleteSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index))
    const newExpanded = new Set(expandedSections)
    newExpanded.delete(index)
    setExpandedSections(newExpanded)
  }

  const addQuestion = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].questions.push({
      type: "text",
      question: "",
      required: false,
    })
    onChange(newSections)
  }

  const updateQuestion = (sectionIndex: number, questionIndex: number, updates: Partial<Question>) => {
    const newSections = [...sections]
    newSections[sectionIndex].questions[questionIndex] = {
      ...newSections[sectionIndex].questions[questionIndex],
      ...updates,
    }
    onChange(newSections)
  }

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].questions = newSections[sectionIndex].questions.filter((_, i) => i !== questionIndex)
    onChange(newSections)
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Survey Sections</h2>
        <Button onClick={addSection} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No sections yet</p>
              <Button onClick={addSection} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Section
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <Collapsible open={expandedSections.has(sectionIndex)} onOpenChange={() => toggleSection(sectionIndex)}>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection(sectionIndex)}>
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <CardTitle className="text-lg">{section.title || `Section ${sectionIndex + 1}`}</CardTitle>
                  {section.description && <CardDescription className="mt-1">{section.description}</CardDescription>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {expandedSections.has(sectionIndex) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSection(sectionIndex)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      placeholder="e.g., General Information"
                      value={section.title}
                      onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Description (Optional)</Label>
                    <Textarea
                      placeholder="Brief description of this section..."
                      value={section.description || ""}
                      onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Questions</h4>
                    <Button variant="outline" size="sm" onClick={() => addQuestion(sectionIndex)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <Card key={questionIndex} className="bg-muted/30">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                            <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <Label>Question</Label>
                                <Input
                                  placeholder="Enter your question..."
                                  value={question.question}
                                  onChange={(e) =>
                                    updateQuestion(sectionIndex, questionIndex, {
                                      question: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Question Type</Label>
                                  <Select
                                    value={question.type}
                                    onValueChange={(value: any) =>
                                      updateQuestion(sectionIndex, questionIndex, { type: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Short Text</SelectItem>
                                      <SelectItem value="textarea">Long Text</SelectItem>
                                      <SelectItem value="radio">Single Choice</SelectItem>
                                      <SelectItem value="checkbox">Multiple Choice</SelectItem>
                                      <SelectItem value="select">Dropdown</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="tel">Phone</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                      <SelectItem value="image">Image Upload</SelectItem>
                                      <SelectItem value="geolocation">Geolocation</SelectItem>
                                      <SelectItem value="signature">Signature</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center space-x-2 pt-8">
                                  <Switch
                                    checked={question.required}
                                    onCheckedChange={(checked) =>
                                      updateQuestion(sectionIndex, questionIndex, {
                                        required: checked,
                                      })
                                    }
                                  />
                                  <Label>Required</Label>
                                </div>
                              </div>

                              {(question.type === "radio" ||
                                question.type === "checkbox" ||
                                question.type === "select") && (
                                <div className="space-y-2">
                                  <Label>Options (one per line)</Label>
                                  <Textarea
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    value={question.options?.join("\n") || ""}
                                    onChange={(e) =>
                                      updateQuestion(sectionIndex, questionIndex, {
                                        options: e.target.value.split("\n").filter((o) => o.trim()),
                                      })
                                    }
                                    rows={4}
                                  />
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {section.questions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No questions yet. Click "Add Question" to get started.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}
