import { Inter } from "next/font/google";
import "./globals.css";
import ClientRootLayout from "./newLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ReplyQuick.AI",
  description: "Your Sales Assistant that works 24/7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ClientRootLayout interClass={inter.className}>
        {children}
      </ClientRootLayout>
    </html>
  );
}