"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// 🔒 SUPER ADMIN EMAIL (Master Key)
const SUPER_ADMIN_EMAIL = "ztenkammu@gmail.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return; // Wait for auth to initialize

      if (!user) {
        // 1. Not logged in -> Go to Login
        router.push("/login");
        return;
      }

      // 2. Check if Super Admin (Always allow)
      if (user.email === SUPER_ADMIN_EMAIL) {
        setIsAuthorized(true);
        setCheckingPermission(false);
        return;
      }

      // 3. Check if they exist in the 'Team' collection
      try {
        const q = query(collection(db, "admin_users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // User is in the team list -> Allow Access
          setIsAuthorized(true);
        } else {
          // User is NOT in the team list -> Kick out
          console.warn("Unauthorized access attempt by:", user.email);
          router.push("/");
        }
      } catch (error) {
        console.error("Error verifying admin:", error);
        router.push("/");
      } finally {
        setCheckingPermission(false);
      }
    };

    checkAccess();
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Show loading state while checking permissions (Protects the UI)
  if (loading || checkingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="text-sm text-gray-500">Verifying Permissions...</p>
      </div>
    );
  }

  // Double check authorization before rendering content
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Store Admin</h1>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={user?.email || ""}>
            {user?.email}
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <NavItem href="/admin/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem href="/admin/products" icon={<Package />} label="Products" />
          <NavItem href="/admin/orders" icon={<ShoppingBag />} label="Orders" />
          <NavItem href="/admin/customers" icon={<Users />} label="Customers" />
          <NavItem href="/admin/coupons" icon={<Users />} label="Coupons" />
          <NavItem href="/admin/support" icon={<MessageSquare />} label="Support Tickets" />
          <NavItem href="/admin/team" icon={<Users />} label="Team & Roles" />
          <NavItem href="/admin/settings" icon={<Settings />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition w-full hover:bg-slate-800 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64 bg-slate-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition">
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}