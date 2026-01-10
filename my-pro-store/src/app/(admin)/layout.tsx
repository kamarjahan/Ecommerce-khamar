"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, MessageSquare, AlertCircle, Tag } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// 🔒 SUPER ADMIN EMAIL (Master Key) - Case Insensitive
const SUPER_ADMIN_EMAIL = "ztenkammu@gmail.com";

// --- PERMISSION MAPPING ---
// Defines which permission is needed for each route
const MENU_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "manage_products" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "manage_orders" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "manage_customers" },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, permission: "manage_coupons" },
  { href: "/admin/support", label: "Support", icon: MessageSquare, permission: "manage_support" },
  { href: "/admin/team", label: "Team & Roles", icon: Users, permission: "manage_team" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "manage_settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Wait for Auth to load
      if (loading) return;

      // 2. No User? -> Login
      if (!user) {
        router.push("/login");
        return;
      }

      const userEmail = user.email?.toLowerCase() || "";
      const adminEmail = SUPER_ADMIN_EMAIL.toLowerCase();

      // 3. Super Admin Bypass (Always Allow ALL)
      if (userEmail === adminEmail) {
        setIsAuthorized(true);
        // Give super admin all permissions
        setUserPermissions(MENU_ITEMS.map(i => i.permission));
        setCheckingPermission(false);
        return;
      }

      // 4. Check 'admin_users' collection for Team Members
      try {
        const q = query(collection(db, "admin_users"), where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          
          // Use stored permissions OR default to empty
          // If role is 'admin', give all. Else use specific list.
          const perms = userData.role === 'admin' 
            ? MENU_ITEMS.map(i => i.permission) 
            : (userData.permissions || []);
            
          setUserPermissions(perms);
          setIsAuthorized(true);
        } else {
          console.warn("⛔ User not found in admin_users collection");
          setErrorMsg("You are not listed in the Team database.");
        }
      } catch (error: any) {
        console.error("🔥 Error checking permissions:", error);
        setErrorMsg("System Error: " + error.message);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkAccess();
  }, [user, loading, router]);

  // 5. URL Protection: Check if user is on a page they shouldn't be
  useEffect(() => {
    if (!checkingPermission && isAuthorized) {
      // Find which menu item corresponds to current path
      const currentItem = MENU_ITEMS.find(item => pathname.startsWith(item.href));
      
      // If found, check if user has permission
      if (currentItem && !userPermissions.includes(currentItem.permission)) {
        // Redirect to dashboard (or first available page)
        router.push("/admin/dashboard");
      }
    }
  }, [pathname, checkingPermission, isAuthorized, userPermissions, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // --- LOADING STATE ---
  if (loading || checkingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="text-sm text-gray-500">Verifying Permissions...</p>
      </div>
    );
  }

  // --- ACCESS DENIED STATE ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="bg-red-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
             <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500">
            You do not have permission to view the admin panel.
          </p>
          {errorMsg && (
            <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-left text-red-600 overflow-x-auto">
              Error: {errorMsg}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button onClick={handleLogout} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition">Logout</button>
            <Link href="/" className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHORIZED LAYOUT ---
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10 transition-all">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Store Admin</h1>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={user?.email || ""}>
            {user?.email}
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            // ONLY RENDER IF USER HAS PERMISSION
            if (!userPermissions.includes(item.permission)) return null;

            return (
              <NavItem 
                key={item.href} 
                href={item.href} 
                icon={<item.icon />} 
                label={item.label} 
                isActive={pathname.startsWith(item.href)}
              />
            );
          })}
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
      <main className="flex-1 p-8 md:ml-64 bg-slate-50 min-h-screen transition-all">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, isActive }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
        isActive 
          ? "bg-blue-600 text-white shadow-lg" 
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}