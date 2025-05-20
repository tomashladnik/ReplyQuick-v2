"use client"

import { useState } from "react"
import { MobileMenuButton } from "./MobileMenuButton"
import { Sidebar } from "./Sidebar"

export function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="h-full px-4 flex items-center">
              <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 