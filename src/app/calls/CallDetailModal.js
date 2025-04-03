"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Clock, Calendar, User, FileText } from "lucide-react"

export default function CallDetailModal({ call, onClose }) {
  if (!call) return null

  return (
    <Dialog open={!!call} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{call.contactName}</h3>
                <p className="text-sm text-muted-foreground">{call.phoneNumber}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{call.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {call.time} ({call.duration})
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
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
          </div>

          <Tabs defaultValue="transcript">
            <TabsList className="mb-4">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-sm">
                      Hello, this is an AI assistant calling from [Company Name]. Am I speaking with {call.contactName}?
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary/10 rounded-lg p-3 text-sm">
                      Yes, this is {call.contactName}. What's this regarding?
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-sm">
                      I'm calling to follow up on your recent inquiry about our services. Do you have a few minutes to
                      discuss your needs?
                    </div>
                  </div>

                  {/* Add more transcript items as needed */}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <h4 className="font-medium">Call Notes:</h4>
                </div>
                <p className="text-sm">{call.notes}</p>
              </div>
            </TabsContent>

            <TabsContent value="actions">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Follow-up Actions:</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" id="action1" className="rounded" />
                      <label htmlFor="action1">Send follow-up email with pricing information</label>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" id="action2" className="rounded" />
                      <label htmlFor="action2">Schedule demo call for next week</label>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" id="action3" className="rounded" />
                      <label htmlFor="action3">Update CRM with call details</label>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Schedule Follow-up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

