"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { 
  Search, Filter, X, Truck, CreditCard, User, MapPin, 
  FileText, Save, CheckCircle, Clock, AlertCircle, Calendar, ExternalLink, Copy
} from "lucide-react";
import { toast } from "sonner";
import { format, isWithinInterval, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Order (for Side Panel)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingInput, setTrackingInput] = useState({ courier: "", id: "" });
  const [adminNote, setAdminNote] = useState("");

  // 1. Fetch Orders Real-time
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalize date for filtering
        date: doc.data().createdAt?.toDate() || new Date()
      }));
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Filter Logic
  useEffect(() => {
    let result = orders;

    // A. Text Search (ID, Name, Email, Payment ID)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.payment?.orderId?.toLowerCase().includes(q) ||
        o.payment?.transactionId?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.address?.name?.toLowerCase().includes(q)
      );
    }

    // B. Date Filter
    const now = new Date();
    if (dateFilter !== "all") {
      let start = subDays(now, 30);
      let end = endOfDay(now);

      switch (dateFilter) {
        case "today": start = startOfDay(now); break;
        case "yesterday": start = startOfDay(subDays(now, 1)); end = endOfDay(subDays(now, 1)); break;
        case "7days": start = subDays(now, 7); break;
        case "month": start = startOfMonth(now); end = endOfMonth(now); break;
        case "year": start = startOfYear(now); end = endOfYear(now); break;
      }
      
      result = result.filter(o => isWithinInterval(o.date, { start, end }));
    }

    // C. Status Filter
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [search, dateFilter, statusFilter, orders]);

  // 3. Actions
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), { 
        tracking: {
          courier: trackingInput.courier,
          id: trackingInput.id,
          updatedAt: new Date()
        },
        status: "shipped" // Auto-move to shipped
      });
      toast.success("Tracking info updated & marked Shipped");
      setSelectedOrder({ 
        ...selectedOrder, 
        status: "shipped",
        tracking: { ...trackingInput, updatedAt: new Date() }
      });
    } catch (e) {
      toast.error("Failed to update tracking");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), { adminNote });
      toast.success("Admin note saved");
    } catch (e) {
      toast.error("Failed to save note");
    }
  };

  // Helper: Open Panel
  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setTrackingInput({ 
      courier: order.tracking?.courier || "", 
      id: order.tracking?.id || "" 
    });
    setAdminNote(order.adminNote || "");
  };

  // Helper: Styles
  const getStatusBadge = (status: string) => {
    const styles: any = {
      placed: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-yellow-100 text-yellow-800 border-yellow-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative bg-gray-50">
      
      {/* LEFT: Order List */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${selectedOrder ? "w-2/3" : "w-full"}`}>
        
        {/* Header & Filters */}
        <div className="bg-white border-b px-6 py-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {filteredOrders.length} found
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search ID, email, customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Date Filter */}
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Order</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => openOrderDetails(order)}
                      className={`cursor-pointer transition hover:bg-blue-50 ${selectedOrder?.id === order.id ? "bg-blue-50 ring-1 ring-inset ring-blue-500" : ""}`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        #{order.payment?.orderId?.slice(-6).toUpperCase() || "ID"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(order.date, "MMM dd, yyyy")}
                        <div className="text-xs text-gray-400">{format(order.date, "p")}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.user?.displayName || "Guest"}</div>
                        <div className="text-xs text-gray-500">{order.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">₹{order.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4">
                        {order.status === "shipped" || order.status === "delivered" ? (
                           <span className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                             <Truck className="h-3 w-3" /> Fulfilled
                           </span>
                        ) : (
                           <span className="flex items-center gap-1 text-orange-500 text-xs font-bold uppercase">
                             <AlertCircle className="h-3 w-3" /> Unfulfilled
                           </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: Order Detail Slider (Shopify Style) */}
      {selectedOrder && (
        <div className="w-[450px] bg-white border-l shadow-xl h-full overflow-y-auto absolute right-0 top-0 bottom-0 z-10 flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 sticky top-0 z-20">
             <div>
                <h2 className="font-bold text-lg text-gray-900">#{selectedOrder.payment?.orderId?.slice(-8).toUpperCase()}</h2>
                <p className="text-xs text-gray-500">
                  {format(selectedOrder.date, "PPpp")}
                </p>
             </div>
             <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full">
               <X className="h-5 w-5 text-gray-500" />
             </button>
          </div>

          <div className="p-6 space-y-8">
            
            {/* 1. Products */}
            <section>
               <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Items</h3>
               <div className="space-y-3">
                 {selectedOrder.items.map((item: any, i: number) => (
                   <div key={i} className="flex gap-4 border-b pb-3 last:border-0">
                      <div className="relative h-12 w-12 bg-gray-100 rounded border overflow-hidden shrink-0">
                         {/* Fallback image if needed */}
                         {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                      </div>
                      <div className="flex-1">
                         <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                         <p className="text-xs text-gray-500">{item.variant || "Standard"} • Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                   </div>
                 ))}
               </div>
               <div className="flex justify-between border-t pt-3 mt-2 font-bold text-gray-900">
                  <span>Total Paid</span>
                  <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
               </div>
            </section>

            {/* 2. Admin Actions (Status) */}
            <section className="bg-gray-50 p-4 rounded-lg border">
               <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Manage Order</h3>
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => handleUpdateStatus("shipped")} className="px-3 py-1.5 bg-white border shadow-sm rounded text-sm hover:bg-gray-50 font-medium">Mark Shipped</button>
                 <button onClick={() => handleUpdateStatus("delivered")} className="px-3 py-1.5 bg-white border shadow-sm rounded text-sm hover:bg-gray-50 font-medium">Mark Delivered</button>
                 <button onClick={() => handleUpdateStatus("cancelled")} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 shadow-sm rounded text-sm hover:bg-red-50 font-medium">Cancel Order</button>
               </div>
            </section>

            {/* 3. Fulfillment / Shipping */}
            <section>
               <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                 <Truck className="h-4 w-4" /> Shipping
               </h3>
               <div className="bg-white border rounded-lg p-4 space-y-3">
                  {selectedOrder.tracking?.id ? (
                    <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm">
                       <p className="font-bold">Shipped via {selectedOrder.tracking.courier}</p>
                       <p className="font-mono mt-1">Tracking #: {selectedOrder.tracking.id}</p>
                       <a href={`https://www.google.com/search?q=${selectedOrder.tracking.id}`} target="_blank" className="text-green-600 underline text-xs mt-2 inline-block">Track Package</a>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                         <input 
                           placeholder="Courier (e.g. BlueDart)" 
                           value={trackingInput.courier}
                           onChange={(e) => setTrackingInput({...trackingInput, courier: e.target.value})}
                           className="border p-2 rounded text-sm w-full"
                         />
                         <input 
                           placeholder="Tracking ID" 
                           value={trackingInput.id}
                           onChange={(e) => setTrackingInput({...trackingInput, id: e.target.value})}
                           className="border p-2 rounded text-sm w-full"
                         />
                      </div>
                      <button 
                        onClick={handleUpdateTracking}
                        disabled={!trackingInput.id}
                        className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                      >
                        Update Tracking
                      </button>
                    </>
                  )}
               </div>
            </section>

            {/* 4. Customer & Payment Info */}
            <section className="grid grid-cols-1 gap-6">
               <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer
                  </h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                     <p className="font-medium text-gray-900 mb-1">{selectedOrder.user?.displayName || "Guest User"}</p>
                     <p className="flex items-center gap-2"><FileText className="h-3 w-3"/> {selectedOrder.user?.email}</p>
                     <div className="mt-2 border-t pt-2">
                        <p className="font-medium text-gray-900 text-xs uppercase mb-1">Shipping Address</p>
                        {/* Fallback if address wasn't captured in checkout phase */}
                        <p className="italic text-gray-500">
                          {selectedOrder.address ? (
                             <>
                               {selectedOrder.address.line1}<br/>
                               {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.zip}
                             </>
                          ) : "No address captured during checkout."}
                        </p>
                     </div>
                  </div>
               </div>

               <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment
                  </h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border space-y-1">
                     <p><span className="font-medium">Method:</span> Razorpay (Online)</p>
                     <p><span className="font-medium">Txn ID:</span> <span className="font-mono text-xs">{selectedOrder.payment?.transactionId}</span></p>
                     <p><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{selectedOrder.payment?.orderId}</span></p>
                     <p className="text-green-600 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3"/> Paid via Gateway
                     </p>
                  </div>
               </div>
            </section>

            {/* 5. Internal Remarks */}
            <section>
               <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Internal Notes</h3>
               <textarea 
                 rows={3}
                 className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="Add private notes (e.g. Customer called about size)..."
                 value={adminNote}
                 onChange={(e) => setAdminNote(e.target.value)}
                 onBlur={handleSaveNote} // Auto-save on click away
               ></textarea>
               <p className="text-xs text-gray-400 mt-1 text-right">Auto-saves when you click outside</p>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}