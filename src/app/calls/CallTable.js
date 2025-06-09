"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Clock,
} from "lucide-react"
import CallDetailModal from "./CallDetailModal"

export default function CallTable() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCallId, setSelectedCallId] = useState(null)
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await fetch("/api/calls/dashboard/stats")
      const data = await response.json()
      if (response.ok && data.recentCalls) {
        setCalls(data.recentCalls)
      }
    } catch (error) {
      console.error("Error fetching calls:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    let className = ""
    switch (status) {
      case "completed":
        className = "bg-green-50 text-green-700 border-green-200"
        break
      case "failed":
        className = "bg-red-50 text-red-700 border-red-200"
        break
      case "in-progress":
        className = "bg-blue-50 text-blue-700 border-blue-200"
        break
      default:
        className = "bg-gray-50 text-gray-700 border-gray-200"
    }

    return (
      <Badge variant="outline" className={className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : calls.length > 0 ? (
              calls.slice((page - 1) * perPage, page * perPage).map((call) => (
                <TableRow key={call.callSid}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{call.contactName}</div>
                      <div className="text-sm text-muted-foreground">{call.contactPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(call.startTime)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatDuration(call.duration)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {call.qualification || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCallId(call.id)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No calls found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {calls.length > perPage && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(calls.length / perPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(Math.ceil(calls.length / perPage), p + 1))}
            disabled={page === Math.ceil(calls.length / perPage)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.ceil(calls.length / perPage))}
            disabled={page === Math.ceil(calls.length / perPage)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CallDetailModal
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />
    </div>
  )
}

