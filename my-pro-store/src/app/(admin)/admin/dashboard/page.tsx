"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  DollarSign, ShoppingBag, CreditCard, XCircle, 
  Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, Package, MoreHorizontal
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie 
} from "recharts";
import { 
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, isWithinInterval, format, parseISO, sub 
} from "date-fns";

 import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Import this

// --- COLORS FOR CHARTS ---
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']; // Green, Blue, Amber, Red

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("30days");
  
  // Dashboard State
  const [stats, setStats] = useState({
    revenue: { current: 0, previous: 0, change: 0 },
    orders: { current: 0, previous: 0, change: 0 },
    aov: { current: 0, previous: 0, change: 0 },
    cancelled: { current: 0, previous: 0, change: 0 },
  });

  const [graphData, setGraphData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // 1. Fetch All Data Once
  useEffect(() => {
  const fetchData = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        
        // --- SAFE DATE PARSING START ---
        let date = new Date();
        if (d.createdAt) {
          // Case A: It's a real Firestore Timestamp (has .toDate)
          if (typeof d.createdAt.toDate === 'function') {
            date = d.createdAt.toDate();
          }
          // Case B: It's a serialized Timestamp object (has seconds but no methods)
          else if (d.createdAt.seconds) {
            date = new Date(d.createdAt.seconds * 1000);
          }
          // Case C: It's a Date string or raw number
          else {
            date = new Date(d.createdAt);
          }
        }
        // --- SAFE DATE PARSING END ---

        return {
          id: doc.id,
          ...d,
          date: date,
          amount: d.totalAmount || 0,
          items: d.items || []
        };
      });
      
      setAllOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };
  fetchData();
}, []);
  // 2. Process Data when Filter Changes
  useEffect(() => {
    if (loading || allOrders.length === 0) return;

    // --- A. Define Time Ranges ---
    const now = new Date();
    let currentStart = subDays(now, 30);
    let currentEnd = endOfDay(now);
    let prevStart = subDays(now, 60);
    let prevEnd = subDays(now, 30);

    switch (dateRange) {
      case "today":
        currentStart = startOfDay(now);
        prevStart = startOfDay(subDays(now, 1));
        prevEnd = endOfDay(subDays(now, 1));
        break;
      case "yesterday":
        currentStart = startOfDay(subDays(now, 1));
        currentEnd = endOfDay(subDays(now, 1));
        prevStart = startOfDay(subDays(now, 2));
        prevEnd = endOfDay(subDays(now, 2));
        break;
      case "7days":
        currentStart = subDays(now, 7);
        prevStart = subDays(now, 14);
        prevEnd = subDays(now, 7);
        break;
      case "30days":
        currentStart = subDays(now, 30);
        prevStart = subDays(now, 60);
        prevEnd = subDays(now, 30);
        break;
      case "month":
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        prevStart = startOfMonth(subDays(now, 30)); // Rough approx for prev month
        prevEnd = endOfMonth(subDays(now, 30));
        break;
      case "year":
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);
        prevStart = startOfYear(subDays(now, 365));
        prevEnd = endOfYear(subDays(now, 365));
        break;
    }

    // --- B. Filter Data Buckets ---
    const currentOrders = allOrders.filter(o => isWithinInterval(o.date, { start: currentStart, end: currentEnd }));
    const prevOrders = allOrders.filter(o => isWithinInterval(o.date, { start: prevStart, end: prevEnd }));

    // --- C. Helper to Calculate Metrics ---
    const calcMetrics = (orders: any[]) => {
      let revenue = 0;
      let count = 0;
      let cancelled = 0;

      orders.forEach(o => {
        if (o.status === 'cancelled') {
          cancelled++;
        } else {
          revenue += o.amount;
          count++;
        }
      });

      return {
        revenue,
        count,
        cancelled,
        aov: count > 0 ? revenue / count : 0
      };
    };

    const curr = calcMetrics(currentOrders);
    const prev = calcMetrics(prevOrders);

    // Calculate % Changes
    const getChange = (c: number, p: number) => {
      if (p === 0) return c > 0 ? 100 : 0;
      return ((c - p) / p) * 100;
    };

    setStats({
      revenue: { current: curr.revenue, previous: prev.revenue, change: getChange(curr.revenue, prev.revenue) },
      orders: { current: curr.count, previous: prev.count, change: getChange(curr.count, prev.count) },
      aov: { current: curr.aov, previous: prev.aov, change: getChange(curr.aov, prev.aov) },
      cancelled: { current: curr.cancelled, previous: prev.cancelled, change: getChange(curr.cancelled, prev.cancelled) }
    });

    // --- D. Prepare Main Chart Data (Sales vs Orders) ---
    // Group by Day
    const groupedData: Record<string, { date: string, sales: number, orders: number }> = {};
    
    // Initialize map with dates if needed (skipping for brevity, auto-fill by data)
    currentOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        const key = format(order.date, "MMM dd");
        if (!groupedData[key]) groupedData[key] = { date: key, sales: 0, orders: 0 };
        groupedData[key].sales += order.amount;
        groupedData[key].orders += 1;
      }
    });

    // Convert to Array & Reverse (Oldest to Newest)
    const chartArray = Object.values(groupedData).reverse();
    setGraphData(chartArray);

    // --- E. Top Selling Products Logic ---
    const productStats: Record<string, { name: string, sales: number, count: number, image: string }> = {};

    currentOrders.forEach(order => {
      if (order.status !== 'cancelled' && order.items) {
        order.items.forEach((item: any) => {
          const id = item.id || item.name; // Fallback to name if ID missing
          if (!productStats[id]) {
            productStats[id] = { 
              name: item.name, 
              sales: 0, 
              count: 0, 
              image: item.image || "" 
            };
          }
          productStats[id].count += item.quantity || 1;
          productStats[id].sales += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    // Sort by Sales Amount
    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5
    
    setTopProducts(sortedProducts);

    // --- F. Status Distribution ---
    const statusCounts: Record<string, number> = {};
    currentOrders.forEach(o => {
      const s = o.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const pieData = Object.keys(statusCounts).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: statusCounts[key]
    }));
    setStatusData(pieData);

  }, [allOrders, dateRange, loading]);

  if (loading) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 font-medium animate-pulse">Crunching the numbers...</p>
           </div>
        </div>
      );
    }
  

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* 1. Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your store's performance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <Calendar className="h-4 w-4 ml-2 text-gray-500" />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 outline-none text-gray-700"
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

      {/* 2. Stats Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Sales" 
          value={`₹${stats.revenue.current.toLocaleString()}`} 
          trend={stats.revenue.change} 
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-blue-600"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders.current.toString()} 
          trend={stats.orders.change} 
          icon={<ShoppingBag className="h-5 w-5 text-white" />}
          color="bg-purple-600"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`₹${Math.round(stats.aov.current).toLocaleString()}`} 
          trend={stats.aov.change} 
          icon={<CreditCard className="h-5 w-5 text-white" />}
          color="bg-emerald-600"
        />
        <StatCard 
          title="Cancelled Orders" 
          value={stats.cancelled.current.toString()} 
          trend={stats.cancelled.change} 
          inverse // Red if went up
          icon={<XCircle className="h-5 w-5 text-white" />}
          color="bg-red-600"
        />
      </div>

      {/* 3. Main Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Add min-w-0 to the className below */}
  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-w-0">
     <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-900">Sales Analytics</h3>
                <p className="text-xs text-gray-500">Revenue and order volume over time</p>
              </div>
           </div>
           
           <div className="h-[350px] w-full">
              {graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 12}} 
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      hide
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563EB" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                      name="Sales (₹)"
                    />
                    {/* Optional: Add a line for orders count if desired */}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No sales data for this period
                </div>
              )}
           </div>
        </div>

        {/* 4. Order Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-w-0">
     <h3 className="font-bold text-gray-900 mb-2">Order Status</h3>
           <p className="text-xs text-gray-500 mb-6">Distribution of current orders</p>
           
           <div className="h-[250px] w-full relative">
             {statusData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
             )}
             {/* Center Text for Pie Chart */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                   <span className="block text-2xl font-bold text-gray-900">{stats.orders.current}</span>
                   <span className="text-xs text-gray-500">Orders</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* 5. Top Products */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Top Selling Products</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50/50 text-gray-500">
                  <tr>
                     <th className="px-6 py-4 font-medium">Product</th>
                     <th className="px-6 py-4 font-medium text-right">Units Sold</th>
                     <th className="px-6 py-4 font-medium text-right">Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {topProducts.length === 0 ? (
                     <tr><td colSpan={3} className="p-6 text-center text-gray-500">No product data available</td></tr>
                  ) : (
                    topProducts.map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-lg bg-gray-100 border overflow-hidden relative flex-shrink-0">
                                  {product.image ? (
                                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-4 w-4"/></div>
                                  )}
                               </div>
                               <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right text-gray-600">{product.count}</td>
                         <td className="px-6 py-4 text-right font-medium text-gray-900">₹{product.sales.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, trend, icon, color, inverse = false }: any) {
  const isPositive = trend >= 0;
  // If inverse is true (like Cancelled orders), Positive trend is BAD (Red)
  const trendColor = inverse 
    ? (isPositive ? "text-red-600" : "text-green-600")
    : (isPositive ? "text-green-600" : "text-red-600");
    
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="flex justify-between items-start z-10">
         <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
         </div>
         <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg ${color}`}>
            {icon}
         </div>
      </div>
      
      <div className="flex items-center gap-1 z-10">
         <span className={`flex items-center text-xs font-bold ${trendColor} bg-gray-50 px-1.5 py-0.5 rounded`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {Math.abs(trend).toFixed(1)}%
         </span>
         <span className="text-xs text-gray-400 ml-1">vs prev. period</span>
      </div>

      {/* Decorative bg blob */}
      <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-5 ${color} group-hover:scale-110 transition-transform duration-500`}></div>
    </div>
  );
}