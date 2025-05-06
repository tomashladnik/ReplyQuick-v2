"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react"
import { useState } from "react"
import * as XLSX from 'xlsx'

export default function UploadCSV() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.name.endsWith(".csv") || 
                        selectedFile.name.endsWith(".xlsx") || 
                        selectedFile.name.endsWith(".xls"))) {
      setFile(selectedFile)
      setUploadStatus(null)
      setErrorMessage("")
    } else {
      setFile(null)
      setUploadStatus("error")
      setErrorMessage("Please select a valid CSV, XLSX, or XLS file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      let contacts = []
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        contacts = parseCSV(text)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
        
        contacts = data.map(row => {
          // Find the columns that contain name, email, and phone
          const nameKey = Object.keys(row).find(key => 
            key.toLowerCase().includes('name')
          )
          const emailKey = Object.keys(row).find(key => 
            key.toLowerCase().includes('email')
          )
          const phoneKey = Object.keys(row).find(key => 
            key.toLowerCase().includes('phone')
          )

          return {
            Name: nameKey ? row[nameKey] : '',
            email: emailKey ? row[emailKey] : '',
            phone: phoneKey ? row[phoneKey] : '',
            source: "csv_import"
          }
        })
      }

      if (contacts.length === 0) {
        throw new Error("No valid contacts found in the file")
      }

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

  // Simple CSV parser (handles both header and non-header cases)
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split("\n")
    const firstRow = lines[0].split(",").map(header => header.trim())
    
    // Check if first row contains headers
    const hasHeaders = firstRow.some(header => 
      header && typeof header === 'string' && 
      (header.toLowerCase().includes('name') || 
       header.toLowerCase().includes('email') || 
       header.toLowerCase().includes('phone'))
    )

    const contacts = []
    const startIndex = hasHeaders ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(",").map(value => value.trim())
      const contact = {}

      if (hasHeaders) {
        // Map based on header names
        contact.Name = values[firstRow.findIndex(h => h.toLowerCase().includes('name'))] || ''
        contact.email = values[firstRow.findIndex(h => h.toLowerCase().includes('email'))] || ''
        contact.phone = values[firstRow.findIndex(h => h.toLowerCase().includes('phone'))] || ''
      } else {
        // Assume fixed order: name, email, phone
        contact.Name = values[0] || ''
        contact.email = values[1] || ''
        contact.phone = values[2] || ''
      }

      contact.source = "csv_import"
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
            <input id="csv-upload" type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">Upload Contact CSV xlsx xls</h3>
            <p className="text-sm text-muted-foreground mb-2">Drag and drop your CSV file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Your CSV should include name, phone number, and any additional contact informations
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