"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import toast from "react-hot-toast";

function OTPComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // Get user data from URL params
  const userData = {
    fullName: searchParams.get("name"),
    email: searchParams.get("email"),
    phone: searchParams.get("phone"),
    password: searchParams.get("password"),
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const verifyOTP = async () => {
    const enteredOTP = otp.join("");
    const storedOTP = sessionStorage.getItem("verificationOTP");

    if (enteredOTP === storedOTP) {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to create user");

        sessionStorage.removeItem("verificationOTP");
        toast.success("Account created successfully!");
        router.push("/success");
      } catch (error) {
        toast.error(error.message || "Failed to create account. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const resendOTP = async () => {
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to resend OTP");

      sessionStorage.setItem("verificationOTP", data.otp);
      toast.success("OTP resent successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="bg-[#242328] text-white p-6 md:p-8 md:w-1/3 flex flex-col relative">
        <div className="mb-12 md:mb-16">
          <div className="inline-flex items-center px-3 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <Image src="/logo.svg" alt="ReplyQuick.AI Logo" width={24} height={24} className="mr-2" />
            <span className="text-[#242328] font-bold">ReplyQuick.AI</span>
          </div>
        </div>

        <div className="mt-auto mb-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Verify your phone</h1>
          <p className="text-gray-300 text-lg">Enter the code we sent to your phone</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 lg:p-12 md:w-2/3 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Enter verification code</h2>
            <p className="text-gray-600 text-lg">
              We sent a code to {userData.phone}. Enter it here to verify your phone number.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex justify-center gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  className="w-12 h-12 text-center text-2xl font-semibold border rounded-lg focus:ring-2 focus:ring-black/5 text-black"
                />
              ))}
            </div>

            <Button className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] transition-all duration-200" disabled={loading} onClick={verifyOTP}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <button type="button" onClick={resendOTP} className="mt-4 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200">
              Didn't receive OTP? Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTP() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPComponent />
    </Suspense>
  );
}
