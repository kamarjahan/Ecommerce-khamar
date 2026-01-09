// src/app/(admin)/layout.tsx
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Store Admin</h1>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 px-4 py-3 bg-slate-800 rounded-lg">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/products" className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition">
            <ShoppingBag className="h-5 w-5" />
            <span>Orders</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition">
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}