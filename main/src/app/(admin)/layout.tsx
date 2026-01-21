"use client";

import Link from "next/link";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, 
  MessageSquare, AlertCircle, Tag, Menu, X 
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// 🔒 SUPER ADMIN EMAIL (Master Key) - Case Insensitive
const SUPER_ADMIN_EMAIL = "ztenkammu@gmail.com";

// --- PERMISSION MAPPING ---
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
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu automatically when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

      // 3. Super Admin Bypass
      if (userEmail === adminEmail) {
        setIsAuthorized(true);
        setUserPermissions(MENU_ITEMS.map(i => i.permission));
        setCheckingPermission(false);
        return;
      }

      // 4. Check 'admin_users' collection
      try {
        const q = query(collection(db, "admin_users"), where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
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

  // 5. URL Protection
  useEffect(() => {
    if (!checkingPermission && isAuthorized) {
      const currentItem = MENU_ITEMS.find(item => pathname.startsWith(item.href));
      if (currentItem && !userPermissions.includes(currentItem.permission)) {
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
    <div className="flex min-h-screen bg-slate-50 relative">
      
      {/* 1. MOBILE TOP HEADER (Visible only on mobile) */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40 shadow-md h-16">
         <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">Store Admin</h1>
         </div>
         {/* Hamburger / Close Button */}
         <button 
           onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
           className="p-2 hover:bg-slate-800 rounded-lg transition"
         >
           {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
         </button>
      </div>

      {/* 2. MOBILE OVERLAY (Dark background when menu is open) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 3. RESPONSIVE SIDEBAR */}
      {/* - Mobile: Fixed position, slides in from left (-translate-x-full to translate-x-0)
         - Desktop: Always visible (translate-x-0), relative positioning handled by flex container
      */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-full transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} 
        md:translate-x-0 md:shadow-none
      `}>
        <div className="p-6 h-16 md:h-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight hidden md:block">Store Admin</h1>
            <span className="md:hidden text-lg font-bold">Menu</span>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1 hidden md:block" title={user?.email || ""}>
              {user?.email}
            </p>
          </div>
          
          {/* Close button inside drawer for mobile */}
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
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

      {/* 4. MAIN CONTENT */}
      {/* Added pt-20 on mobile to account for the fixed header */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 bg-slate-50 min-h-screen transition-all pt-20 md:pt-8">
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