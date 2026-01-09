import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";
import CategorySection from "@/components/store/CategorySection";

// 1. Server Action to Fetch Products
async function getFeaturedProducts() {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"), limit(8));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // THIS LINE FIXES THE ERROR:
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(), 
      };
    }) as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Category Circles */}
      <CategorySection />

      {/* 2. Hero Banner (Static for now, Dynamic later) */}
      <section className="container px-4 mt-6">
        <div className="relative w-full h-[200px] md:h-[400px] bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center px-8 md:px-16 overflow-hidden">
          <div className="relative z-10 text-white max-w-lg">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Summer Sale is Live</h1>
            <p className="text-blue-100 mb-6">Get up to 50% off on premium brands. Limited time offer.</p>
            <button className="bg-white text-blue-700 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition">
              Shop Now
            </button>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="container px-4 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          <a href="/search" className="text-blue-600 font-medium text-sm hover:underline">View All</a>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>No products found. Add some from the Admin Panel!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}