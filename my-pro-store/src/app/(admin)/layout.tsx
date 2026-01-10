"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Store Admin</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
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
            className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition w-full"
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