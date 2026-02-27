"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { SurveyBuilder } from "@/components/survey-builder"
import { surveysAPI, type Section } from "@/lib/api/surveys"
import { useSurvey } from "@/lib/hooks/use-survey"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditSurveyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { survey, loading: loadingSurvey } = useSurvey(params.id)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (survey) {
      setTitle(survey.title)
      setDescription(survey.description)
      setSections(survey.sections || [])
    }
  }, [survey])

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Survey title is required")
      return
    }

    try {
      setLoading(true)
      setError("")
      await surveysAPI.update(params.id, {
        title,
        description,
        sections,
      })
      router.push("/dashboard/surveys")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update survey")
    } finally {
      setLoading(false)
    }
  }

  if (loadingSurvey) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto py-6 px-4">
          <Card className="p-12">
            <p className="text-center text-muted-foreground">Loading survey...</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/surveys">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Edit Survey</h1>
              <p className="text-muted-foreground">Update your survey sections and questions</p>
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Survey Information</CardTitle>
              <CardDescription>Basic details about your survey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Patient Satisfaction Survey 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your survey..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <SurveyBuilder sections={sections} onChange={setSections} />
        </div>
      </main>
    </div>
  )
}
