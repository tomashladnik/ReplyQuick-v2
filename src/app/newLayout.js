"use client";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "react-hot-toast";

export default function ClientRootLayout({ children, interClass }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/success");

  return (
    <body className={interClass}>
      {isAuthRoute ? (
        <>
          {children}
          <Toaster position="top-right" />
        </>
      ) : (
        <DashboardLayout>
          {children}
          <Toaster position="top-right" />
        </DashboardLayout>
      )}
    </body>
  );
}