"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Review } from "@/types";
import { useStore } from "@/lib/store";
import { 
  Star, ShoppingCart, Share2, Truck, 
  ShieldCheck, Zap, RefreshCw, Box, Heart // Added Heart
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  similarProducts: Product[];
  reviews: Review[];
};

export default function ProductView({ product, similarProducts, reviews }: Props) {
  const router = useRouter();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useStore(); // Added wishlist methods
  
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || "/placeholder.png");
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [activeTab, setActiveTab] = useState("desc");
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<null | string>(null);

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const isWishlisted = wishlist.some(item => item.id === product.id);

  // Reviews Calc
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  const handleAddToCart = () => {
    if (product.variants?.length && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      variant: selectedVariant ? `${selectedVariant.color}-${selectedVariant.size}` : undefined,
      quantity: 1,
      isCodAvailable: product.isCodAvailable
    });
    toast.success("Added to Cart!");
  };

  const handleBuyNow = () => {
    if (product.variants?.length && !selectedVariant) {
        toast.error("Please select a variant");
        return;
    }
    handleAddToCart();
    router.push("/checkout");
  };

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.info("Removed from Wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0]
      });
      toast.success("Added to Wishlist");
    }
  };

  const checkPincode = () => {
    if (pincode.length !== 6) return setDeliveryStatus("Invalid Pincode");
    setDeliveryStatus(["110001", "400001"].includes(pincode) ? "Delivered by Tomorrow" : "Delivery in 3-5 Days");
  };

  return (
    <div className="space-y-16">
      
      {/* 1. HERO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery */}
        <div className="space-y-4 sticky top-24 h-fit">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border">
            <Image src={selectedImage} alt={product.name} fill className="object-cover" />
            <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white shadow-sm transition">
              <Share2 className="h-5 w-5 text-gray-700" />
            </button>
            {/* Wishlist Button Overlay (Optional, can also use the main button below) */}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images?.map((img, i) => (
              <button key={i} onClick={() => setSelectedImage(img)} className={cn("relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition", selectedImage === img ? "border-black" : "border-transparent")}>
                <Image src={img} alt="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">{product.category}</span>
            {averageRating && (
               <div className="flex items-center gap-1 bg-black text-white px-2 py-1 rounded text-xs font-bold">
                 <span>{averageRating}</span> <Star className="h-3 w-3 fill-current" />
               </div>
            )}
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          
          {/* Price Block */}
          <div className="flex items-end gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through mb-1">₹{product.mrp.toLocaleString()}</span>
                <span className="text-sm font-bold text-green-600 mb-2 bg-green-100 px-2 py-0.5 rounded-full">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <span className="block text-sm font-medium text-gray-900 mb-3">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedVariant(v)} 
                    className={cn("px-4 py-3 rounded-lg border text-sm font-medium transition-all min-w-[4rem]", selectedVariant === v ? "border-black bg-black text-white shadow-lg" : "border-gray-200 hover:border-black")}
                  >
                    {v.size} {v.color && `• ${v.color}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
             <button onClick={handleBuyNow} className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200">
                <Zap className="h-5 w-5 fill-current" /> Buy Now
             </button>
             <button onClick={handleAddToCart} className="flex-1 border-2 border-black text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Add to Cart
             </button>
             {/* Wishlist Button */}
             <button 
                onClick={handleWishlistToggle}
                className={cn("p-4 border-2 rounded-xl transition flex items-center justify-center", isWishlisted ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 hover:border-gray-300 text-gray-400")}
             >
                <Heart className={cn("h-6 w-6", isWishlisted && "fill-current")} />
             </button>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <RefreshCw className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{product.isReturnable ? "7 Day Returns" : "No Returns"}</span>
             </div>
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Authentic Product</span>
             </div>
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Box className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{product.isCodAvailable ? "COD Available" : "Online Payment"}</span>
             </div>
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Free Shipping {'>'} ₹999</span>
             </div>
          </div>

          {/* Delivery Checker */}
          <div className="border-t pt-6">
             <p className="text-sm font-bold text-gray-900 mb-2">Check Delivery</p>
             <div className="flex gap-2 max-w-sm">
                <input 
                  placeholder="Enter Pincode" 
                  className="border rounded-lg px-4 py-2 w-full text-sm outline-none focus:ring-2 focus:ring-black"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                />
                <button onClick={checkPincode} className="bg-gray-900 text-white px-5 rounded-lg text-sm font-bold hover:bg-gray-800">Check</button>
             </div>
             {deliveryStatus && <p className="text-sm text-green-700 mt-2 font-medium flex items-center gap-1"><Truck className="h-4 w-4"/> {deliveryStatus}</p>}
          </div>
        </div>
      </div>

      {/* 2. TABS: Description, Shipping, Reviews */}
      <div>
         <div className="flex border-b mb-6 overflow-x-auto">
            {["Description", "Reviews", "Shipping & Policies"].map(tab => (
               <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={cn("px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition whitespace-nowrap", activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600")}
               >
                 {tab === "Reviews" ? `Reviews (${reviews.length})` : tab}
               </button>
            ))}
         </div>

         <div className="min-h-[200px]">
            {activeTab === "Description" && (
                <div className="prose max-w-none text-gray-600 leading-relaxed">
                   <p>{product.description}</p>
                   {/* Add dummy specs */}
                   <ul className="mt-4 list-disc pl-5 space-y-2">
                      <li>Premium quality material</li>
                      <li>Designed for comfort and durability</li>
                      <li>Easy to maintain and wash</li>
                   </ul>
                </div>
            )}
            
            {activeTab === "Reviews" && (
                <div className="space-y-8">
                   {reviews.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl">
                         <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                      </div>
                   ) : (
                      <div className="grid gap-6">
                         {reviews.map((review) => (
                            <div key={review.id} className="bg-white border-b pb-6 last:border-0">
                               <div className="flex items-center gap-2 mb-2">
                                  <div className="flex text-yellow-400">
                                     {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200")} />
                                     ))}
                                  </div>
                                  <span className="font-bold text-sm">{review.userName}</span>
                                  {review.verifiedPurchase && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Verified</span>}
                               </div>
                               <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                               <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
            )}

            {activeTab === "Shipping & Policies" && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                     <h3 className="font-bold mb-2">Shipping Information</h3>
                     <p className="text-sm text-gray-600 mb-2">Standard delivery generally takes 3-7 business days depending on your location.</p>
                     <p className="text-sm text-gray-600">Free shipping is available on all orders above ₹999.</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                     <h3 className="font-bold mb-2">Return Policy</h3>
                     <p className="text-sm text-gray-600">You can return this item within 7 days of delivery. The item must be unused and in original packaging.</p>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* 3. SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
         <div className="pt-12 border-t">
            <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {similarProducts.map(p => (
                  <Link href={`/product/${p.id}`} key={p.id} className="group block">
                     <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                     </div>
                     <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">{p.name}</h3>
                     <p className="text-gray-500 text-sm">₹{p.price.toLocaleString()}</p>
                  </Link>
               ))}
            </div>
         </div>
      )}

    </div>
  );
}