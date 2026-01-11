"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { productService } from "@/lib/services/product-service";
import { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";
import { 
  Loader2, Search, SlidersHorizontal, X, 
  ArrowUpDown, Filter, Tag 
} from "lucide-react";
import { cn } from "@/lib/utils";

export const runtime = "edge";

// Filter Categories
const CATEGORIES = ["All", "Fashion", "Electronics", "Mobiles", "Home", "Beauty"];

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Best Discounts", value: "discount" },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);

  // 1. Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      // Ensure productService.getAll exists (see step 2 below if missing)
      const data = await productService.getAll();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // 2. Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.keywords?.some(k => k.toLowerCase().includes(q))
      );
    }

    // Category
    if (category !== "All") {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Price Range
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // On Sale Only
    if (showOnSaleOnly) {
      result = result.filter(p => p.mrp > p.price);
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        result.sort((a, b) => {
          const discA = ((a.mrp - a.price) / a.mrp);
          const discB = ((b.mrp - b.price) / b.mrp);
          return discB - discA;
        });
        break;
      case "newest":
      default:
        // Sort by createdAt (string comparison works for ISO dates)
        result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    return result;
  }, [products, search, category, sort, priceRange, showOnSaleOnly]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "All") params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [search, category, sort, router]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
           <h1 className="text-2xl font-bold hidden md:block">Shop All</h1>
           
           <div className="flex gap-2 w-full md:max-w-md">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full bg-gray-100 border-none rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-black transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="md:hidden p-2 bg-gray-100 rounded-lg"
             >
                <SlidersHorizontal className="h-5 w-5" />
             </button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex items-start gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="w-64 flex-shrink-0 space-y-8 bg-white p-6 rounded-xl border sticky top-36 hidden md:block">
           <div>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Filter className="h-4 w-4"/> Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                     <input type="radio" name="category" className="accent-black" checked={category === cat} onChange={() => setCategory(cat)} />
                     <span className={cn("text-sm transition", category === cat ? "font-bold text-black" : "text-gray-600")}>{cat}</span>
                  </label>
                ))}
              </div>
           </div>

           <div>
              <h3 className="font-bold mb-4">Price Range</h3>
              <div className="flex items-center gap-2 text-sm mb-4">
                 <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-20 border rounded px-2 py-1" />
                 <span>to</span>
                 <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-20 border rounded px-2 py-1" />
              </div>
           </div>

           <div>
              <h3 className="font-bold mb-4">Special</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="accent-black w-4 h-4" checked={showOnSaleOnly} onChange={(e) => setShowOnSaleOnly(e.target.checked)} />
                 <span className="text-sm text-gray-700">On Sale Only</span>
              </label>
           </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {showFilters && (
           <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end">
              <div className="w-[80%] bg-white h-full p-6 overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <button onClick={() => setShowFilters(false)}><X className="h-6 w-6" /></button>
                 </div>
                 <div className="space-y-8">
                    <div>
                        <h3 className="font-bold mb-4">Categories</h3>
                        <div className="space-y-2">
                            {CATEGORIES.map(cat => (
                            <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="mobile_cat" className="accent-black" checked={category === cat} onChange={() => setCategory(cat)} />
                                <span className={category === cat ? "font-bold" : "text-gray-600"}>{cat}</span>
                            </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">Sort By</h3>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border p-2 rounded-lg">
                            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <button onClick={() => {setCategory("All"); setSearch(""); setSort("newest"); setShowFilters(false);}} className="w-full border border-black py-3 rounded-lg font-bold mt-8">Clear All</button>
                 </div>
              </div>
           </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
           <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 text-sm">Showing <strong>{filteredProducts.length}</strong> products</p>
              <div className="hidden md:flex items-center gap-2">
                 <span className="text-sm text-gray-500">Sort by:</span>
                 <div className="relative">
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-white border rounded-lg pl-4 pr-8 py-2 text-sm font-medium focus:ring-2 focus:ring-black cursor-pointer">
                        {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ArrowUpDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                 </div>
              </div>
           </div>

           {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-gray-200 rounded-xl animate-pulse"></div>)}
             </div>
           ) : filteredProducts.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                   <ProductCard key={product.id} product={product} />
                ))}
             </div>
           ) : (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search query.</p>
                <button onClick={() => {setCategory("All"); setSearch(""); setSort("newest");}} className="text-blue-600 font-medium hover:underline">Clear all filters</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// FIX: Default Export with Suspense Wrapper
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}