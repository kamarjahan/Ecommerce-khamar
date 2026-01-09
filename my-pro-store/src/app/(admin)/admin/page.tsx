"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { 
  DollarSign, ShoppingBag, Users, Package, 
  ArrowUpRight, AlertTriangle, TrendingUp, Clock 
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Orders (for Revenue & Count)
        const ordersSnap = await getDocs(collection(db, "orders"));
        const ordersData = ordersSnap.docs.map(doc => doc.data());
        
        const totalRevenue = ordersData.reduce((acc, order: any) => acc + (order.totalAmount || 0), 0);
        
        // 2. Fetch Customers Count
        const usersSnap = await getDocs(collection(db, "users"));
        
        // 3. Fetch Products (for Count & Low Stock)
        const productsSnap = await getDocs(collection(db, "products"));
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter Low Stock (Less than 5 items)
        const lowStockItems = productsData.filter((p: any) => p.stockCount < 5);

        // 4. Fetch Recent 5 Orders
        const recentOrdersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
        const recentOrdersSnap = await getDocs(recentOrdersQuery);
        const recentOrdersData = recentOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setStats({
          revenue: totalRevenue,
          orders: ordersSnap.size,
          customers: usersSnap.size,
          products: productsSnap.size
        });
        setRecentOrders(recentOrdersData);
        setLowStock(lowStockItems);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500">Calculating analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your store's performance</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.revenue.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.orders}</h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Customers</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.customers}</h3>
          </div>
          <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.products}</h3>
          </div>
          <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Recent Orders
            </h3>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          
          <div className="divide-y">
            {recentOrders.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No orders yet.</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                      {order.payment?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.items.length} item(s) for <span className="font-bold">₹{order.totalAmount}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
                    ${order.status === 'placed' ? 'bg-blue-100 text-blue-700' : 
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`
                  }>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="p-6 border-b bg-red-50">
            <h3 className="font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Low Stock Alert
            </h3>
          </div>
          
          <div className="divide-y">
            {lowStock.length === 0 ? (
              <div className="p-8 text-center text-green-600 flex flex-col items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                <p>Inventory looks healthy!</p>
              </div>
            ) : (
              lowStock.map((product: any) => (
                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-bold text-sm">{product.stockCount} left</span>
                    <Link href={`/admin/products/${product.id}`} className="block text-xs text-blue-600 hover:underline mt-1">
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}