"use client"

import { useState } from "react"
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
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

// Mock data for demonstration
const mockCalls = [
  {
    id: 1,
    contactName: "John Smith",
    phoneNumber: "+1 (555) 123-4567",
    date: "2023-06-15",
    time: "10:30 AM",
    duration: "3:24",
    status: "completed",
    notes: "Interested in the product, requested follow-up next week",
  },
  {
    id: 2,
    contactName: "Sarah Johnson",
    phoneNumber: "+1 (555) 987-6543",
    date: "2023-06-15",
    time: "11:45 AM",
    duration: "2:10",
    status: "completed",
    notes: "Asked for pricing information, sent email",
  },
  {
    id: 3,
    contactName: "Michael Brown",
    phoneNumber: "+1 (555) 456-7890",
    date: "2023-06-15",
    time: "1:15 PM",
    duration: "0:45",
    status: "failed",
    notes: "No answer, left voicemail",
  },
  {
    id: 4,
    contactName: "Emily Davis",
    phoneNumber: "+1 (555) 789-0123",
    date: "2023-06-15",
    time: "2:30 PM",
    duration: "4:12",
    status: "completed",
    notes: "Very interested, scheduled demo for tomorrow",
  },
  {
    id: 5,
    contactName: "David Wilson",
    phoneNumber: "+1 (555) 234-5678",
    date: "2023-06-15",
    time: "3:45 PM",
    duration: "1:30",
    status: "in-progress",
    notes: "Currently on call",
  },
]

export default function CallTable({ setSelectedCall }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  const totalPages = Math.ceil(mockCalls.length / perPage)

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </Badge>
        )
    }
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCalls.slice((page - 1) * perPage, page * perPage).map((call) => (
              <TableRow key={call.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{call.contactName}</div>
                    <div className="text-sm text-muted-foreground">{call.phoneNumber}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">{call.date}</div>
                    <div className="text-sm text-muted-foreground">{call.time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{call.duration}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(call.status)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCall(call)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{" "}
          <span className="font-medium">{Math.min(page * perPage, mockCalls.length)}</span> of{" "}
          <span className="font-medium">{mockCalls.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

