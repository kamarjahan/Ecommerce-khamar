// src/app/layout.tsx
import LoginModal from "@/components/auth/LoginModal";
import { AuthProvider } from "@/components/providers/AuthProvider"; // Import this
import { Toaster } from "sonner";
import "./globals.css"; // Ensure your CSS is imported

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        <AuthProvider> {/* <--- Add this Wrapper */}
          {children}
          <LoginModal />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}