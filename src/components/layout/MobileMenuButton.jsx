import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function MobileMenuButton({ onClick }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onClick}
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
} 