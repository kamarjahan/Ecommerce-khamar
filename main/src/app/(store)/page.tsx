import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, orderBy, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, Shirt, User, Smile, Headphones, Scissors, Watch, 
  Truck, Shield, Star, CheckCircle, Mail, Lock, ShoppingBag 
} from "lucide-react";

 

// --- TYPES ---
interface StoreSettings {
  storeName: string;
  maintenanceMode: boolean;
  showAnnouncement: boolean;
  announcement: string;
  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    image: string;
    alignment: "left" | "center";
    overlayOpacity: number;
  };
  perks: Array<{ id: number; title: string; subtitle: string; icon: string }>;
  offers: Array<{ id: number; title: string; subtitle: string; image: string; link: string }>;
}

// --- ICON MAPPING (For Dynamic Perks) ---
const ICON_MAP: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  star: Star,
  check: CheckCircle,
  default: Star
};

// --- DATA FETCHING ---
async function getSettings(): Promise<StoreSettings> {
  try {
    const ref = doc(db, "settings", "layout");
    const snap = await getDoc(ref);
    // Return with defaults to prevent crashes
    return {
      storeName: "My Store",
      maintenanceMode: false,
      showAnnouncement: false,
      announcement: "",
      hero: {
        title: "Welcome", subtitle: "Best products", buttonText: "Shop", buttonLink: "/products", 
        image: "", alignment: "left", overlayOpacity: 40
      },
      perks: [],
      offers: [],
      ...snap.data()
    } as StoreSettings;
  } catch (e) {
    return {} as StoreSettings; // Fallback
  }
}

async function getProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
}

// --- COMPONENTS ---

// 1. Maintenance View
function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">We are currently closed</h1>
        <p className="text-gray-500 mb-6">Our store is undergoing scheduled maintenance. Please check back later.</p>
        <button disabled className="bg-gray-200 text-gray-500 px-6 py-2 rounded-full font-bold cursor-not-allowed">
          Store Locked
        </button>
      </div>
    </div>
  );
}

// 2. Updated Category Bar (Fashion Focused)
const CATEGORIES = [
  { name: "Mens", icon: User, slug: "mens" },
  { name: "Womens", icon: User, slug: "womens" },
  { name: "Kids", icon: Smile, slug: "kids" },
  { name: "Teens", icon: Headphones, slug: "teens" },
  { name: "Shirts", icon: Shirt, slug: "shirts" },
  { name: "Pants", icon: Scissors, slug: "pants" }, // Scissors as generic tailoring icon
  { name: "Watches", icon: Watch, slug: "watches" },
  { name: "Accessories", icon: ShoppingBag, slug: "accessories" },
];

export default async function HomePage() {
  const settings = await getSettings();
  const products = await getProducts();

  // If Maintenance Mode is Active
  if (settings.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  // Helper for Perks Icons
  const getIcon = (name: string) => {
    const Icon = ICON_MAP[name.toLowerCase()] || ICON_MAP.default;
    return <Icon className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* 1. Dynamic Announcement Bar */}
      {settings.showAnnouncement && settings.announcement && (
        <div className="bg-black text-white text-xs font-bold text-center py-2.5 px-4 tracking-wide uppercase">
          {settings.announcement}
        </div>
      )}

      {/* 2. Category Navigation */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm overflow-x-auto no-scrollbar">
        <div className="container mx-auto flex gap-6 md:gap-8 p-4 min-w-max">
          {CATEGORIES.map((cat) => (
            // FIX: Changed from /search to /products
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 group cursor-pointer min-w-[60px]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition duration-300 border border-gray-100">
                <cat.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-white transition" />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide group-hover:text-black">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Dynamic Hero Section */}
      <section className="relative w-full h-[500px] md:h-[600px] bg-gray-900 overflow-hidden">
        {settings.hero.image ? (
          <Image src={settings.hero.image} alt="Hero" fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
        )}
        
        {/* Dynamic Overlay */}
        <div className="absolute inset-0 bg-black transition-opacity duration-500" style={{ opacity: settings.hero.overlayOpacity / 100 }} />

        <div className={`relative z-20 container mx-auto h-full flex flex-col justify-center px-6 md:px-12 text-white ${settings.hero.alignment === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
           <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             New Collection
           </span>
           <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight max-w-3xl drop-shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
             {settings.hero.title}
           </h1>
           <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-lg leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
             {settings.hero.subtitle}
           </p>
           {/* FIX: Default button link to products */}
           <Link 
             href={settings.hero.buttonLink || "/products"} 
             className="group bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-xl hover:shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-500 delay-300"
           >
             {settings.hero.buttonText} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      </section>

      {/* 4. Store Perks (Dynamic) */}
      {settings.perks.length > 0 && (
        <section className="container mx-auto px-4 -mt-10 relative z-20">
          <div className="bg-white rounded-xl shadow-xl border p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {settings.perks.map((perk) => (
              <div key={perk.id} className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-black">
                  {getIcon(perk.icon)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{perk.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{perk.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Promotional Cards (Dynamic) */}
      {settings.offers.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings.offers.map((offer) => (
              <Link key={offer.id} href={offer.link} className="relative h-64 md:h-80 rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition">
                {offer.image ? (
                   <Image src={offer.image} alt={offer.title} fill className="object-cover group-hover:scale-105 transition duration-700" />
                ) : (
                   <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                   <h3 className="text-2xl font-bold mb-1 transform translate-y-2 group-hover:translate-y-0 transition duration-300">{offer.title}</h3>
                   <p className="text-gray-200 text-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 delay-75">{offer.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Latest Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
             <p className="text-gray-500 mt-2">Check out the latest additions to our collection</p>
           </div>
           {/* FIX: Link to /products */}
           <Link href="/products" className="text-sm font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition">
             View All
           </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product: any) => (
             <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer">
                <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-transparent group-hover:border-gray-200 transition">
                  <Image 
                    src={product.images?.[0] || "/placeholder.png"} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition duration-700" 
                  />
                  {product.stockCount === 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                       <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
                    </div>
                  )}
                  {/* Quick Action Overlay */}
                  <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                     <button className="w-full bg-white/90 backdrop-blur text-black text-sm font-bold py-3 rounded-xl shadow-lg hover:bg-black hover:text-white transition">
                        View Product
                     </button>
                  </div>
                </div>
                <div>
                   <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">{product.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-gray-900">₹{product.price.toLocaleString()}</span>
                      {product.mrp > product.price && (
                        <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
                      )}
                      {product.mrp > product.price && (
                        <span className="text-xs text-green-600 font-bold ml-1">
                          {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                        </span>
                      )}
                   </div>
                </div>
             </Link>
          ))}
        </div>
      </section>

      {/* 7. Newsletter */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
           <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur">
                 <Mail className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Subscribe to our Newsletter</h2>
              <p className="text-gray-400">Get the latest updates on new products and upcoming sales directly to your inbox.</p>
              
              <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto mt-8">
                 <input 
                   type="email" 
                   placeholder="Enter your email" 
                   className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                 />
                 <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition">
                    Subscribe
                 </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">No spam, unsubscribe at any time.</p>
           </div>
        </div>
      </section>

    </div>
  );
}