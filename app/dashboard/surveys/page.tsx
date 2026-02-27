"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { Plus, Search, Edit, Trash2, Power, PowerOff } from "lucide-react"
import { useSurveys } from "@/lib/hooks/use-survey"
import { surveysAPI } from "@/lib/api/surveys"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SurveysPage() {
  const { surveys, loading, error, refetch } = useSurveys()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleToggleActive = async (id: string) => {
    try {
      await surveysAPI.toggleActive(id)
      refetch()
    } catch (err) {
      console.error("[v0] Failed to toggle survey status:", err)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await surveysAPI.delete(deleteId)
      refetch()
      setDeleteId(null)
    } catch (err) {
      console.error("[v0] Failed to delete survey:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Survey Management</h1>
              <p className="text-muted-foreground">Create and manage your surveys</p>
            </div>
            <Link href="/dashboard/surveys/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </Link>
          </div>

          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </Card>

          {loading && (
            <Card className="p-12">
              <p className="text-center text-muted-foreground">Loading surveys...</p>
            </Card>
          )}

          {error && (
            <Card className="p-12">
              <p className="text-center text-destructive">{error}</p>
            </Card>
          )}

          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSurveys.map((survey) => (
                <Card key={survey._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{survey.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1.5">{survey.description}</CardDescription>
                      </div>
                      <Badge variant={survey.isActive ? "default" : "secondary"}>
                        {survey.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      <p>{survey.sections?.length || 0} sections</p>
                      <p className="text-xs mt-1">
                        Created {survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/surveys/edit/${survey._id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-transparent" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(survey._id!)}>
                        {survey.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(survey._id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && filteredSurveys.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">No surveys found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Get started by creating your first survey"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the survey and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
