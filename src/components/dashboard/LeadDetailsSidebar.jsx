import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Mail, Calendar, MessageSquare, FileText, ExternalLink, X } from "lucide-react"

export function LeadDetailsSidebar({ isOpen, onClose, leadId }) {
  const [lead, setLead] = useState(null)
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (leadId && isOpen) {
      fetchLeadDetails()
    }
  }, [leadId, isOpen])

  const fetchLeadDetails = async () => {
    try {
      setLoading(true)
      // Fetch lead details
      const leadResponse = await fetch(`/api/contacts/getContact/${leadId}`)
      const leadData = await leadResponse.json()
      setLead(leadData)

      // Fetch call history for this lead
      const callsResponse = await fetch(`/api/calls/contact/${leadId}`)
      const callsData = await callsResponse.json()
      setCalls(callsData)
    } catch (error) {
      console.error("Error fetching lead details:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Lead Details</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : lead ? (
          <div className="space-y-6 mt-6">
            {/* Lead Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {lead.Name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{lead.Name}</h2>
                  <p className="text-sm text-muted-foreground">{lead.company || "No company"}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="calls" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="calls" className="flex-1">Calls</TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="mt-4">
                <ScrollArea className="h-[500px] pr-4">
                  {calls.length > 0 ? (
                    <div className="space-y-4">
                      {calls.map((call) => (
                        <div key={call.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={
                              call.status === "completed" ? "bg-green-50 text-green-700" :
                              call.status === "failed" ? "bg-red-50 text-red-700" :
                              "bg-blue-50 text-blue-700"
                            }>
                              {call.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(call.startTime)}
                            </span>
                          </div>

                          {/* Call Summary */}
                          {call.summary && (
                            <div className="text-sm">
                              <p className="font-medium mb-1">Summary:</p>
                              <p className="text-muted-foreground">{call.summary}</p>
                            </div>
                          )}

                          {/* Transcript */}
                          {call.transcriptText && (
                            <div className="text-sm">
                              <p className="font-medium mb-1">Transcript:</p>
                              <div className="bg-muted/50 rounded-md p-2 max-h-40 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                  {call.transcriptText}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {(call.recordingUrl || call.publicLogUrl) && (
                            <div className="flex gap-2">
                              {call.recordingUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(call.recordingUrl, '_blank')}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Recording
                                </Button>
                              )}
                              {call.publicLogUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(call.publicLogUrl, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Log
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No calls found for this lead
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="notes">
                <div className="py-4 text-center text-muted-foreground">
                  Notes feature coming soon
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="py-4 text-center text-muted-foreground">
                  Activity log feature coming soon
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Failed to load lead details
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
} 