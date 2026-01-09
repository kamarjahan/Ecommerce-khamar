"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { Loader2, Package, Truck, CheckCircle, XCircle, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // 1. Listen to ALL Orders in Real-time
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching admin orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Function to Update Status
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    
    // Optional: Ask for Tracking ID if shipping
    let trackingInfo = {};
    if (newStatus === "shipped") {
      const courier = prompt("Enter Courier Name (e.g. Delhivery):") || "Standard";
      const trackingId = prompt("Enter Tracking ID:");
      if (!trackingId) {
        toast.error("Tracking ID is required to mark as shipped");
        setUpdating(null);
        return;
      }
      trackingInfo = {
        "tracking.courier": courier,
        "tracking.id": trackingId,
        "tracking.url": `https://google.com/search?q=${trackingId}` // Mock URL
      };
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        ...trackingInfo
      });
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "shipped": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "cancellation_requested": return "bg-orange-100 text-orange-800 border-orange-200 animate-pulse";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-medium">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Top Bar: Order Info */}
            <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-gray-600">
                  #{order.payment?.orderId?.slice(-8).toUpperCase() || order.id.slice(0, 8)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                  {order.status.replace("_", " ")}
                </span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                </div>
                <div className="font-bold text-gray-900">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Middle: Customer & Items */}
            <div className="p-6 grid md:grid-cols-3 gap-8">
              
              {/* Col 1: Customer Details */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Customer</h4>
                {/* Note: In a real app, you'd fetch the user profile. For now we use auth data if saved or just ID */}
                <p className="font-medium text-gray-900">User ID: {order.userId.slice(0, 10)}...</p>
                <p className="text-sm text-gray-500 mt-1">Payment: {order.payment?.method?.toUpperCase()}</p>
                <p className="text-sm text-gray-500">Txn ID: {order.payment?.transactionId}</p>
              </div>

              {/* Col 2: Items */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items Ordered</h4>
                <div className="space-y-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{item.quantity}x</span>
                        <span className="text-gray-700">{item.name}</span>
                        {item.variant && <span className="text-gray-400">({item.variant})</span>}
                      </div>
                      <span className="text-gray-600">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap items-center justify-between gap-4">
              
              {/* Current Tracking Info */}
              <div className="text-sm">
                {order.tracking?.id ? (
                  <span className="flex items-center gap-2 text-green-700">
                    <Truck className="h-4 w-4" />
                    {order.tracking.courier}: {order.tracking.id}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">No tracking info yet</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {order.status === "placed" && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, "shipped")}
                    disabled={updating === order.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Mark Shipped
                  </button>
                )}

                {order.status === "shipped" && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, "delivered")}
                    disabled={updating === order.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Delivered
                  </button>
                )}

                {order.status === "cancellation_requested" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(order.id, "cancelled")} // Add Refund Logic here later
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                    >
                      Approve Cancel
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, "shipped")} // Reject cancel
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}