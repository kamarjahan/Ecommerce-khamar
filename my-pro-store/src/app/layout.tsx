import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rah By Rabanda",
  description: "Best E-commerce Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased font-sans text-gray-900 bg-white`}>
        <AuthProvider>
          {/* Navbar and Footer are REMOVED from here to avoid showing on Admin pages */}
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}