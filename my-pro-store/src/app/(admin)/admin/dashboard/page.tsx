"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  DollarSign, ShoppingBag, RotateCcw, XCircle, 
  Calendar, ArrowUpRight, ArrowDownRight, TrendingUp 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, isWithinInterval, format, parseISO 
} from "date-fns";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("30days"); // Default filter
  
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalReturns: 0,
    totalCancelled: 0,
    aov: 0, // Average Order Value
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  // 1. Fetch All Orders Initially
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date object immediately
          date: doc.data().createdAt?.toDate() || new Date() 
        }));
        setAllOrders(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Filter & Calculate Stats whenever Date Range or Orders change
  useEffect(() => {
    if (loading || allOrders.length === 0) return;

    // A. Determine Date Interval
    const now = new Date();
    let start = subDays(now, 30);
    let end = endOfDay(now);

    switch (dateRange) {
      case "today":
        start = startOfDay(now);
        break;
      case "yesterday":
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case "7days":
        start = subDays(now, 7);
        break;
      case "30days":
        start = subDays(now, 30);
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    // B. Filter Orders by Date
    const filtered = allOrders.filter(order => 
      isWithinInterval(order.date, { start, end })
    );

    // C. Calculate Metrics
    let sales = 0;
    let returns = 0;
    let cancelled = 0;
    let validOrdersCount = 0;

    filtered.forEach(order => {
      if (order.status === "cancelled") {
        cancelled++;
      } else if (order.status === "returned") {
        returns++; // Assuming you have logic for returns later
        // Usually returns are subtracted from sales, depends on your preference
      } else {
        sales += order.totalAmount || 0;
        validOrdersCount++;
      }
    });

    setStats({
      totalSales: sales,
      totalOrders: filtered.length,
      totalReturns: returns,
      totalCancelled: cancelled,
      aov: validOrdersCount > 0 ? sales / validOrdersCount : 0
    });

    // D. Prepare Chart Data (Group by Day)
    const groupedData: any = {};
    
    // Initialize map with empty values for range if needed, 
    // but for simplicity we map existing data
    filtered.forEach(order => {
      if (order.status !== "cancelled") {
        const dayKey = format(order.date, "MMM dd"); // e.g., "Jan 01"
        if (!groupedData[dayKey]) groupedData[dayKey] = 0;
        groupedData[dayKey] += order.totalAmount;
      }
    });

    // Convert to Array & Sort
    const chartArray = Object.keys(groupedData).map(key => ({
      name: key,
      sales: groupedData[key]
    })).reverse(); // Re-reverse if needed depending on sort order

    setChartData(chartArray);

  }, [allOrders, dateRange, loading]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header & Date Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Real-time overview of your store performance</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <Calendar className="h-4 w-4 ml-2 text-gray-400" />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer py-2 pl-2 pr-8 outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Sales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{stats.totalSales.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOrders}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{Math.round(stats.aov).toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Returns */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Returns</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalReturns}</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cancelled</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCancelled}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sales Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Sales Over Time</h3>
          
          <div className="h-[350px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value?: number) => [`₹${value?.toLocaleString() || '0'}`, "Sales"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>No sales data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}