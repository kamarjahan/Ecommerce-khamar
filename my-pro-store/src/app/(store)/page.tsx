import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Smartphone, Shirt, Home, Watch, Monitor, Zap } from "lucide-react";

// Static Category Data (Amazon Style)
const categories = [
  { name: "Mobiles", icon: Smartphone, slug: "mobiles" },
  { name: "Fashion", icon: Shirt, slug: "fashion" },
  { name: "Home", icon: Home, slug: "home" },
  { name: "Electronics", icon: Monitor, slug: "electronics" },
  { name: "Watches", icon: Watch, slug: "watches" },
  { name: "Deals", icon: Zap, slug: "deals" },
];

async function getProducts(tag?: string) {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. Category Bar (Amazon Style) */}
      <div className="bg-white shadow-sm border-b overflow-x-auto">
        <div className="container mx-auto flex gap-8 p-4 min-w-max">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/search?category=${cat.slug}`} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition">
                <cat.icon className="w-8 h-8 text-gray-600 group-hover:text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
        <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8" alt="Hero" fill className="object-cover" />
        <div className="relative z-20 container mx-auto h-full flex flex-col justify-center px-6 text-white">
           <h1 className="text-5xl font-extrabold mb-4 leading-tight">Summer Sale <br/><span className="text-yellow-400">Flat 50% OFF</span></h1>
           <p className="text-lg text-gray-200 mb-8 max-w-lg">Discover the latest trends in fashion and electronics. Limited time offer.</p>
           <Link href="/search" className="w-fit bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition">Shop Now</Link>
        </div>
      </section>

      {/* 3. Deal of the Day */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
           <div className="mb-6 md:mb-0">
             <span className="bg-white/20 px-3 py-1 rounded text-sm font-bold uppercase tracking-widest">Deal of the Day</span>
             <h2 className="text-3xl font-bold mt-2">Apple MacBook Air M2</h2>
             <p className="text-blue-100 mt-2">Starting at ₹89,900. Ends in 04:23:12</p>
           </div>
           <Link href="/product/macbook" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">View Deal</Link>
        </div>
      </section>

      {/* 4. Product Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
           <Link href="/search" className="text-blue-600 font-medium hover:underline">See all</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product: any) => (
             <Link key={product.id} href={`/product/${product.id}`} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group">
                <div className="relative aspect-square bg-gray-100">
                  <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                  {product.stockCount === 0 && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">SOLD OUT</span>}
                </div>
                <div className="p-4">
                   <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold">₹{product.price.toLocaleString()}</span>
                      {product.mrp > product.price && <span className="text-xs text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>}
                   </div>
                </div>
             </Link>
          ))}
        </div>
      </section>
    </div>
  );
}