"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Loader2, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Query Orders for this specific user
    // Note: We sort inside the callback to avoid Firestore Index errors for now
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    // 2. Real-time Listener (Live Updates)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by Date Descending (Newest first)
      ordersData.sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Helper: Status Badge Logic
  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed": return "bg-blue-100 text-blue-700";
      case "shipped": return "bg-yellow-100 text-yellow-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed": return <Package className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Please Login</h2>
        <p className="text-gray-500 mb-4">You need to be logged in to view orders.</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container px-4 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
            <Link href="/" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Order ID</p>
                    <p className="font-mono text-sm font-medium text-gray-700">#{order.payment.orderId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                    <p className="text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 mb-4 last:mb-0">
                      <div className="relative h-16 w-16 bg-gray-100 rounded-md overflow-hidden border">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} {item.variant && `| ${item.variant}`}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                  {order.status === "placed" && (
                     <button className="text-sm text-red-600 hover:underline font-medium">
                        Request Cancellation
                     </button>
                  )}
                  <button className="text-sm text-blue-600 hover:underline font-medium">
                    View Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}