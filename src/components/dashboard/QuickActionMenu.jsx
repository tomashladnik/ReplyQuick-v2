import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Phone, Mail, Calendar, MessageSquare, Plus } from "lucide-react"

export function QuickActionMenu({ lead, onAction }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 p-0"
          variant="ghost"
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction("call", lead)}>
          <Phone className="mr-2 h-4 w-4" />
          <span>Start Call</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("email", lead)}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Send Email</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("schedule", lead)}>
          <Calendar className="mr-2 h-4 w-4" />
          <span>Schedule Meeting</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("message", lead)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Send Message</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 