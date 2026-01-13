import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Use Google Font instead of local
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// 2. Configure the font
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
      {/* 3. Apply the font class here */}
      <body className={`${inter.className} antialiased font-sans text-gray-900 bg-white`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}