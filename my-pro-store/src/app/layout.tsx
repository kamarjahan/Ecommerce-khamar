// src/app/layout.tsx
import LoginModal from "@/components/auth/LoginModal";
import { Toaster } from "sonner";
import "./globals.css"; // Ensure your CSS is imported

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        {children}
        <LoginModal /> {/* Global Modal */}
        <Toaster position="top-center" /> {/* Toast Notifications */}
      </body>
    </html>
  );
}