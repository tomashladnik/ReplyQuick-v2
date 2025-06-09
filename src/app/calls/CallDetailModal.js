"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, FileText, Phone, User, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

export default function CallDetailModal({ callId, onClose }) {
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (callId) {
      fetchCallDetails()
    }
  }, [callId])

  const fetchCallDetails = async () => {
    try {
      const response = await fetch(`/api/calls/${callId}`)
      const data = await response.json()
      if (response.ok) {
        setCall(data)
      } else {
        console.error("Error fetching call details:", data.error)
      }
    } catch (error) {
      console.error("Error fetching call details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!callId) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <Dialog open={!!callId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : call ? (
          <div className="py-4">
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{call.contactName}</h3>
                  <p className="text-sm text-muted-foreground">{call.phoneNumber}</p>
                  {call.email && (
                    <p className="text-sm text-muted-foreground">{call.email}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(call.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Duration: {call.duration || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Status:</h4>
                <Badge
                  variant="outline"
                  className={
                    call.status === "completed"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : call.status === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  }
                >
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </Badge>
              </div>

              {call.qualification && (
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Qualification:</h4>
                  <Badge variant="outline">
                    {call.qualification}
                  </Badge>
                </div>
              )}

              {call.userSentiment && (
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Sentiment:</h4>
                  <Badge
                    variant="outline"
                    className={
                      call.userSentiment === "Positive"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : call.userSentiment === "Negative"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                    }
                  >
                    {call.userSentiment}
                  </Badge>
                </div>
              )}

              {call.cost && (
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Cost:</h4>
                  <span>${call.cost.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Tabs defaultValue="transcript">
              <TabsList className="mb-4">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="transcript">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {call.transcriptText ? (
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {call.transcriptText}
                    </pre>
                  ) : (
                    <p className="text-center text-muted-foreground">No transcript available</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <h4 className="font-medium">Call Summary:</h4>
                  </div>
                  <p className="text-sm">{call.summary || "No summary available"}</p>
                  
                  {call.disconnectionReason && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-1">Disconnection Reason:</h4>
                      <p className="text-sm text-muted-foreground">{call.disconnectionReason}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resources">
                <div className="space-y-4">
                  {(call.recordingUrl || call.publicLogUrl) && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3">External Resources:</h4>
                      <div className="space-y-2">
                        {call.recordingUrl && (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => window.open(call.recordingUrl, '_blank')}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Recording
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                        {call.publicLogUrl && (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => window.open(call.publicLogUrl, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Call Log
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Failed to load call details
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
