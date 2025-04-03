"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login") // Redirect if not authenticated
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <p className="text-center text-xl">Loading...</p> // Show while checking auth
  }

  return <div>{children}</div> // This must be a valid JSX element
}
