"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log(data)
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      localStorage.setItem("token", data.token)
      toast.success("Login successful!")
      router.push("../dashboard")
    } catch (error) {
      toast.error(error.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left side - Dark panel */}
      <div className="bg-[#242328] text-white p-6 md:p-8 md:w-1/3 flex flex-col relative">
        <div className="mb-12 md:mb-16">
          <div className="inline-flex items-center px-3 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <Image
              src="/logo.svg"
              alt="ReplyQuick.AI Logo"
              width={24}
              height={24}
              className="mr-2"
            />
            <span className="text-[#242328] font-bold">ReplyQuick.AI</span>
          </div>
        </div>

        <div className="mt-auto mb-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Welcome to ReplyQuick.AI</h1>
          <p className="text-gray-300 text-lg">Your Sales Assistant that works 24/7</p>
        </div>

        {/* Decorative dots pattern */}
        <div className="absolute bottom-0 left-0 right-0 p-8 opacity-20">
          <div className="grid grid-cols-4 gap-4">
            {Array(16).fill(null).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-gray-500" />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="bg-white p-6 md:p-8 lg:p-12 md:w-2/3 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Welcome back!</h2>
            <p className="text-gray-600 text-lg">Please login to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">
                Email or Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="ex. email@domain.com"
                className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                value={formData.emailOrPhone}
                onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/reset-password"
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Forgot Password? Reset Now
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base bg-[#242328] hover:bg-[#333238] text-white transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
