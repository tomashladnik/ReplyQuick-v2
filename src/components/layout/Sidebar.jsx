"use client"

import { cn } from "@/lib/utils"
import { BarChart2, HelpCircle, Home, LogOut, MessageSquare, Phone, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "AI Calls", href: "/calls", icon: Phone },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold">CallAI</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-500 dark:text-gray-400")} />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          Help & Support
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          Logout
        </div>
      </div>
    </div>
  )
}

