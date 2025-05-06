"use client"
import { Sidebar } from "@/components/layout/Sidebar"
import axiosInstance from "@/lib/axios"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // const checkAuth = async () => {
    //   try {
    //     const token = localStorage.getItem("token")
    //     if (!token) {
    //       router.replace("/login")
    //       return
    //     }

    //     // Verify token by making a request to a protected endpoint
    //     await axiosInstance.get("/api/auth/user")
    //     setLoading(false)
    //   } catch (error) {
    //     console.error("Authentication error:", error)
    //     localStorage.removeItem("token")
    //     setError("Your session has expired. Please log in again.")
    //     setTimeout(() => {
    //       router.replace("/login")
    //     }, 2000)
    //   }
    // }

    // checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
