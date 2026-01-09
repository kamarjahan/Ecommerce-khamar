"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  User, Package, MapPin, LogOut, Loader2, 
  ShoppingBag, Clock, ChevronRight, Settings, Edit2 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch User Data & Orders
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setNewName(user.displayName || "");

        // Fetch Orders
        const q = query(
          collection(db, "orders"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName });
      // Update in Firestore 'users' collection too for Admin sync
      await updateDoc(doc(db, "users", user.uid), { displayName: newName });
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (authLoading || (!user && loadingOrders)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;
  }

  if (!user) return null; // Handled by useEffect redirect

  // Calculate Stats
  const totalSpend = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  const lastAddress = orders[0]?.address; // Get address from most recent order

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR: User Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
               {user.photoURL ? (
                 <Image src={user.photoURL} alt="Profile" fill className="object-cover rounded-full border-4 border-gray-50" />
               ) : (
                 <div className="w-full h-full bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                   <User className="h-10 w-10" />
                 </div>
               )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2">
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border p-1 rounded text-center text-sm"
                />
                <button onClick={handleUpdateProfile} className="bg-black text-white p-1 rounded"><Settings className="h-3 w-3"/></button>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                {user.displayName || "Valued Customer"}
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4"/></button>
              </h2>
            )}
            
            <p className="text-sm text-gray-500 mb-6">{user.email}</p>
            
            <div className="grid grid-cols-2 gap-4 border-t pt-6">
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Orders</p>
                  <p className="font-bold text-lg">{orders.length}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Spent</p>
                  <p className="font-bold text-lg">₹{totalSpend.toLocaleString()}</p>
               </div>
            </div>
          </div>

          {/* Address Card (From Last Order) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-400" /> Default Address
            </h3>
            {lastAddress ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{lastAddress.name}</p>
                <p>{lastAddress.line1}</p>
                <p>{lastAddress.city}, {lastAddress.state} - {lastAddress.zip}</p>
                <p className="text-xs text-blue-600 mt-2">Based on your last order</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No address saved yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT: Orders */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
             <Package className="h-6 w-6" /> Order History
          </h2>

          {loadingOrders ? (
             <div className="text-center py-12 bg-white rounded-2xl"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></div>
          ) : orders.length === 0 ? (
             <div className="bg-white p-12 rounded-2xl shadow-sm border text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                   <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't made your first purchase.</p>
                <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                  Start Shopping
                </Link>
             </div>
          ) : (
             <div className="space-y-4">
               {orders.map((order) => (
                 <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b pb-4">
                       <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Order #{order.payment?.orderId?.slice(-6) || order.id.slice(0,8)}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                             <Clock className="h-3 w-3" /> 
                             {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "Date N/A"}
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                             ${order.status === 'placed' ? 'bg-blue-100 text-blue-700' : 
                               order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                               order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`
                          }>
                             {order.status}
                          </span>
                          <span className="font-bold text-lg">₹{order.totalAmount?.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       {order.items.slice(0, 2).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-4">
                             <div className="relative h-12 w-12 bg-gray-100 rounded-lg overflow-hidden border">
                                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                             </div>
                             <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.variant ? `${item.variant} • ` : ""}Qty: {item.quantity}</p>
                             </div>
                          </div>
                       ))}
                       {order.items.length > 2 && (
                          <p className="text-xs text-gray-500 pl-16">+ {order.items.length - 2} more items</p>
                       )}
                    </div>

                    {/* Pro Feature: Tracking Info */}
                    {order.tracking?.id && (
                       <div className="mt-4 bg-green-50 p-3 rounded-lg flex items-center justify-between">
                          <div className="text-sm text-green-800">
                             <span className="font-bold block">Shipped via {order.tracking.courier}</span>
                             <span className="font-mono text-xs">Ref: {order.tracking.id}</span>
                          </div>
                          <a 
                            href={`https://www.google.com/search?q=${order.tracking.id}`} 
                            target="_blank" 
                            className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-md font-bold hover:bg-green-100"
                          >
                            Track Package
                          </a>
                       </div>
                    )}
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}