"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Check, CircleHelp, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryCode: "+234",
  })
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requirements, setRequirements] = useState({
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
    length: false,
  })

  const checkPasswordRequirements = (value) => {
    setPassword(value)
    setRequirements({
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      length: value.length >= 8,
    })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !password) {
      toast.error("Please fill in all required fields")
      setLoading(false)
      return
    }

    // Validate password requirements
    if (!Object.values(requirements).every(Boolean)) {
      toast.error("Please meet all password requirements")
      setLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      setLoading(false)
      return
    }

    try {
      // Send OTP
      const phoneNumber = formData.countryCode + formData.phone
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Store OTP in session storage (in production, this should be handled differently)
      sessionStorage.setItem('verificationOTP', data.otp);

      // Redirect to OTP verification page
      const params = new URLSearchParams({
        name: formData.fullName,
        email: formData.email,
        phone: phoneNumber,
        password: password,
      })

      toast.success("OTP sent successfully!");
      router.push(`/verify-otp?${params.toString()}`)
    } catch (error) {
      toast.error(error.message || "Failed to send OTP. Please try again.")
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

      {/* Right side - Sign up form */}
      <div className="bg-white p-6 md:p-8 lg:p-12 md:w-2/3 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Sign up</h2>
            <p className="text-gray-600 text-lg">Empower your experience, sign up today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="ex. John Doe" 
                className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">
                Email <span className="text-red-500">*</span>
              </label>
              <Input 
                type="email" 
                placeholder="ex. email@domain.com" 
                className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-black">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <button type="button" className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Why <CircleHelp className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="flex gap-3">
                <div className="relative w-28">
                  <select 
                    className="w-full h-12 px-4 rounded-md border border-input bg-transparent text-base appearance-none focus:ring-2 focus:ring-black/5 text-black"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  >
                    <option>+234</option>
                    <option>+1</option>
                    <option>+44</option>
                    <option>+91</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <Input 
                    type="tel" 
                    placeholder="Enter phone number" 
                    className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password" 
                  className="h-12 px-4 text-base focus:ring-2 focus:ring-black/5 placeholder:text-black/60 text-black"
                  value={password}
                  onChange={(e) => checkPasswordRequirements(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${requirements.lowercase ? 'bg-black' : 'bg-gray-100'} transition-colors`}>
                    {requirements.lowercase ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span>One lowercase character</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${requirements.number ? 'bg-black' : 'bg-gray-100'} transition-colors`}>
                    {requirements.number ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span>One number</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${requirements.uppercase ? 'bg-black' : 'bg-gray-100'} transition-colors`}>
                    {requirements.uppercase ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span>One uppercase character</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${requirements.special ? 'bg-black' : 'bg-gray-100'} transition-colors`}>
                    {requirements.special ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span>One special character</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full ${requirements.length ? 'bg-black' : 'bg-gray-100'} transition-colors`}>
                    {requirements.length ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span>8 characters minimum</span>
                </div>
              </div>
            </div>

            {/* Marketing opt-out */}
            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
              <Checkbox id="marketing" className="mt-1 data-[state=checked]:bg-black data-[state=checked]:border-black" />
              <label htmlFor="marketing" className="text-sm text-gray-600">
                Please exclude me from any future emails regarding Feedback App and related Intuit product and feature updates, marketing best practices, and promotions.
              </label>
            </div>

            {/* Terms of service */}
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              By registering for an account, you are consenting to our{" "}
              <Link href="#" className="text-blue-600 hover:text-blue-700 underline font-medium">
                Terms of Service
              </Link>{" "}
              and confirming that you have reviewed and accepted the Global Privacy Statement.
            </div>

            {/* Submit button */}
            <Button 
              type="submit"
              disabled={loading} 
              className="w-full h-12 text-base bg-[#242328] hover:bg-[#333238] text-white transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Get started free"}
            </Button>

            {/* Login link */}
            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

