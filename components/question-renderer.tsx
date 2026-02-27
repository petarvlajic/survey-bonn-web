"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Question } from "@/lib/api/surveys"
import { Upload, MapPin, X, ImageIcon } from "lucide-react"

interface QuestionRendererProps {
  question: Question
  value: any
  onChange: (value: any) => void
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
    }
  }

  const handleGetLocation = () => {
    setLocationError("")
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(coords)
          onChange(coords)
        },
        (error) => {
          setLocationError("Unable to get location. Please enable location services.")
          console.error("[v0] Geolocation error:", error)
        },
      )
    } else {
      setLocationError("Geolocation is not supported by your browser.")
    }
  }

  switch (question.type) {
    case "text":
    case "email":
    case "tel":
      return (
        <Input
          type={question.type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          placeholder={`Enter ${question.question.toLowerCase()}`}
        />
      )

    case "number":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          min={question.validation?.min}
          max={question.validation?.max}
        />
      )

    case "textarea":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          rows={4}
          placeholder={`Enter ${question.question.toLowerCase()}`}
        />
      )

    case "date":
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      )

    case "radio":
      return (
        <RadioGroup value={value || ""} onValueChange={onChange}>
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${question._id}-${option}`} />
              <Label htmlFor={`${question._id}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      )

    case "checkbox":
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${question._id}-${option}`}
                checked={value?.includes(option) || false}
                onCheckedChange={(checked) => {
                  const currentValues = value || []
                  const newValues = checked
                    ? [...currentValues, option]
                    : currentValues.filter((v: string) => v !== option)
                  onChange(newValues)
                }}
              />
              <Label htmlFor={`${question._id}-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      )

    case "select":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "file":
      return (
        <div className="space-y-2">
          <Label htmlFor={`file-${question._id}`} className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload file</p>
                  <p className="text-xs">or drag and drop</p>
                </div>
              </div>
            </div>
          </Label>
          <Input
            id={`file-${question._id}`}
            type="file"
            onChange={handleFileChange}
            required={question.required}
            className="hidden"
          />
          {value && (
            <Card className="p-3 flex items-center justify-between">
              <span className="text-sm truncate">{value.name || "File uploaded"}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="h-4 w-4" />
              </Button>
            </Card>
          )}
        </div>
      )

    case "image":
      return (
        <div className="space-y-2">
          <Label htmlFor={`image-${question._id}`} className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </Label>
          <Input
            id={`image-${question._id}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required={question.required}
            className="hidden"
          />
          {value && (
            <Card className="p-3">
              {typeof value === "string" ? (
                <img src={value || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover rounded" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{value.name || "Image uploaded"}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )

    case "geolocation":
      return (
        <div className="space-y-3">
          <Button type="button" onClick={handleGetLocation} variant="outline" className="w-full bg-transparent">
            <MapPin className="h-4 w-4 mr-2" />
            Get Current Location
          </Button>
          {locationError && <p className="text-sm text-destructive">{locationError}</p>}
          {location && (
            <Card className="p-3">
              <div className="text-sm space-y-1">
                <p className="font-medium">Location captured:</p>
                <p className="text-muted-foreground">Latitude: {location.lat.toFixed(6)}</p>
                <p className="text-muted-foreground">Longitude: {location.lng.toFixed(6)}</p>
              </div>
            </Card>
          )}
        </div>
      )

    case "signature":
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            placeholder="Type your signature"
            className="font-serif text-2xl italic"
          />
          {value && (
            <Card className="p-4 bg-muted/30">
              <p className="font-serif text-3xl italic text-center">{value}</p>
            </Card>
          )}
        </div>
      )

    default:
      return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} required={question.required} />
  }
}
