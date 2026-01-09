import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, limit, query, orderBy, where } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";

// 1. Fetch Store Settings (Hero, Offers, etc.)
async function getStoreSettings() {
  try {
    const docRef = doc(db, "settings", "layout");
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data();
    }
    
    // Default Fallback if no settings exist yet
    return {
      hero: {
        title: "Welcome to our Store",
        subtitle: "The best products at the best prices.",
        buttonText: "Shop Now",
        buttonLink: "/products",
        image: ""
      },
      offers: [],
      announcement: "",
      showAnnouncement: false
    };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

// 2. Fetch Featured Products (Latest 8)
async function getFeaturedProducts() {
  try {
    const q = query(
      collection(db, "products"), 
      orderBy("createdAt", "desc"), 
      limit(8)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
}

export default async function HomePage() {
  const settings = await getStoreSettings();
  const products = await getFeaturedProducts();

  // If DB fails completely, show safe fallback
  if (!settings) return <div className="p-10 text-center">Loading Store...</div>;

  return (
    <div className="min-h-screen bg-white">
      
      {/* 1. Dynamic Announcement Bar */}
      {settings.showAnnouncement && settings.announcement && (
        <div className="bg-black text-white text-center text-xs py-2 font-medium tracking-wide">
          {settings.announcement}
        </div>
      )}

      {/* 2. Dynamic Hero Section */}
      <section className="relative w-full h-[500px] md:h-[600px] bg-gray-900 flex items-center overflow-hidden">
        {/* Background Image */}
        {settings.hero.image ? (
          <Image 
            src={settings.hero.image} 
            alt="Hero Banner" 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
        )}

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center md:text-left">
           <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
             {settings.hero.title}
           </h1>
           <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl drop-shadow-md">
             {settings.hero.subtitle}
           </p>
           <Link 
             href={settings.hero.buttonLink || "/products"}
             className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-xl"
           >
             {settings.hero.buttonText} <ArrowRight className="h-5 w-5" />
           </Link>
        </div>
      </section>

      {/* 3. Dynamic Offer Cards */}
      {settings.offers && settings.offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.offers.map((offer: any, index: number) => (
              <Link 
                href={offer.link || "#"} 
                key={index}
                className="group relative h-64 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                {/* Card Image */}
                {offer.image ? (
                  <Image 
                    src={offer.image} 
                    alt={offer.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Text */}
                <div className="absolute bottom-0 left-0 p-6 text-white">
                   <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">{offer.subtitle}</p>
                   <h3 className="text-xl font-bold">{offer.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Featured Products Grid (Always shows latest products) */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t">
        <div className="flex justify-between items-end mb-8">
           <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
           <Link href="/products" className="text-sm font-medium text-blue-600 hover:underline">
             View All
           </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <p className="col-span-4 text-center text-gray-500 py-10">No products added yet.</p>
          ) : (
            products.map((product: any) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group block">
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {product.images?.[0] ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition duration-300" 
                    />
                  ) : (
                     <div className="flex items-center justify-center h-full text-gray-300">No Image</div>
                  )}
                  {/* Stock Badge */}
                  {product.stockCount <= 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      SOLD OUT
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-gray-900">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-sm text-gray-500 line-through">₹{product.mrp}</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

    </div>
  );
}