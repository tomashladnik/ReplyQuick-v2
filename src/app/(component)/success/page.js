"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function SuccessPage() {
  const router = useRouter()
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

      {/* Right side - Success message */}
      <div className="bg-white p-6 md:p-8 lg:p-12 md:w-2/3 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
              CONGRATULATIONS!
            </h2>
            <p className="text-gray-600 text-lg">
              Your account has been created successfully.
            </p>
          </div>

          <Button
            className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] transition-all duration-200 h-12 text-base"
            onClick={() => router.push('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      </div>
    </div>
  )
} 