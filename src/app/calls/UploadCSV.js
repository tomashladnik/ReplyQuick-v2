"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react"
import { useState } from "react"

export default function UploadCSV() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile)
      setUploadStatus(null)
      setErrorMessage("")
    } else {
      setFile(null)
      setUploadStatus("error")
      setErrorMessage("Please select a valid CSV file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Read and parse the CSV file
      const text = await file.text()
      const contacts = parseCSV(text)

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      // Send the parsed contacts to the API
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts }),
        credentials: "include", // Include cookies (for auth_token)
      })

      clearInterval(interval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      setUploadProgress(100)
      setUploadStatus("success")

      // Reset after success
      setTimeout(() => {
        setFile(null)
        setUploading(false)
        setUploadProgress(0)
      }, 2000)
    } catch (error) {
      setUploadStatus("error")
      setErrorMessage(error.message || "Upload failed. Please try again.")
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploading(false)
    setUploadProgress(0)
    setUploadStatus(null)
    setErrorMessage("")
  }

  // Simple CSV parser (assumes headers: fullName, email, phone, category)
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())
    const contacts = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((value) => value.trim())
      const contact = {}
      headers.forEach((header, index) => {
        contact[header] = values[index] || ""
      })
      contacts.push(contact)
    }

    return contacts
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {!file ? (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => document.getElementById("csv-upload").click()}
          >
            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">Upload Contact CSV</h3>
            <p className="text-sm text-muted-foreground mb-2">Drag and drop your CSV file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Your CSV should include name, phone number, and any additional contact information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploading && (
                    <div className="w-24">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  {uploadStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {uploadStatus === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                  <Button variant="ghost" size="icon" onClick={resetUpload} disabled={uploading} className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>

              {uploadStatus === "error" && <div className="mt-2 text-sm text-destructive">{errorMessage}</div>}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleUpload} disabled={uploading || uploadStatus === "success"}>
                {uploading ? "Uploading..." : "Upload Contacts"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}