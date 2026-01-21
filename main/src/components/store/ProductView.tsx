"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Review } from "@/types";
import { useStore } from "@/lib/store";
import { 
  Star, ShoppingCart, Share2, Truck, 
  ShieldCheck, Zap, RefreshCw, Box, Heart, Copy, Check 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  similarProducts?: Product[];
  reviews?: Review[];
};

export default function ProductView({ product, similarProducts = [], reviews = [] }: Props) {
  const router = useRouter();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useStore();
  
  // --- STATE ---
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || "/placeholder.png");
  const [activeTab, setActiveTab] = useState("desc");
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // --- VARIANT LOGIC (Amazon Style) ---
  // Extract unique colors and sizes
  const uniqueColors = useMemo(() => 
    Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean) as string[])), 
  [product.variants]);

  const uniqueSizes = useMemo(() => 
    Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean) as string[])), 
  [product.variants]);

  // Initial selection (try to pick first available)
  const [selectedColor, setSelectedColor] = useState<string | null>(uniqueColors[0] || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(uniqueSizes[0] || null);

  // Find the exact variant based on current selection
  const currentVariant = useMemo(() => {
    return product.variants?.find(v => 
      (v.color === selectedColor || (!v.color && !selectedColor)) && 
      (v.size === selectedSize || (!v.size && !selectedSize))
    );
  }, [product.variants, selectedColor, selectedSize]);

  // Helper to check if a combination exists
  const isCombinationAvailable = (color: string | null, size: string | null) => {
    return product.variants?.some(v => 
      (v.color === color || (!v.color && !color)) && 
      (v.size === size || (!v.size && !size))
    );
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // If current size isn't available with new color, try to switch to first available size
    if (selectedSize && !isCombinationAvailable(color, selectedSize)) {
      const firstValidSize = product.variants?.find(v => v.color === color)?.size;
      if (firstValidSize) setSelectedSize(firstValidSize);
      else setSelectedSize(null);
    }
  };

  // --- ACTIONS ---
  const handleAddToCart = () => {
    if (product.variants?.length && !currentVariant) {
      toast.error("Please select a valid Color and Size");
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      variant: currentVariant ? `${currentVariant.color}-${currentVariant.size}` : undefined,
      quantity: 1,
      isCodAvailable: product.isCodAvailable
    });
    toast.success("Added to Cart!");
  };

  const handleBuyNow = () => {
    if (product.variants?.length && !currentVariant) {
        toast.error("Please select a valid Color and Size");
        return;
    }
    handleAddToCart();
    router.push("/checkout");
  };

  const isWishlisted = wishlist.some(item => item.id === product.id);
  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.info("Removed from Wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "/placeholder.png"
      });
      toast.success("Added to Wishlist");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- PINCODE LOGIC ---
  const checkPincode = () => {
    if (pincode.length !== 6) {
      setDeliveryMessage("Please enter a valid 6-digit pincode");
      return;
    }
    // Generate dates 5 to 15 days from now
    const today = new Date();
    const minDate = new Date(today); minDate.setDate(today.getDate() + 5);
    const maxDate = new Date(today); maxDate.setDate(today.getDate() + 15);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    setDeliveryMessage(`Estimated Delivery: ${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`);
  };

  // --- ZOOM LOGIC ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Calculations
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      
      {/* 1. HERO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* --- IMAGE GALLERY WITH ZOOM --- */}
        <div className="space-y-4 sticky top-24 h-fit z-10">
          <div 
            className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 group cursor-crosshair"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Main Image */}
            <Image 
              src={selectedImage} 
              alt={product.name} 
              fill 
              className="object-contain p-4" 
              priority
            />
            
            {/* Zoom Lens / Overlay */}
            {showZoom && (
              <div 
                className="absolute inset-0 pointer-events-none bg-white hidden md:block"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: '200%', // 2x Zoom
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}

            {/* Floating Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button 
                onClick={handleShare} 
                className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-sm border transition text-gray-700 hover:text-black"
                title="Copy Link"
              >
                {isCopied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={cn("p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-sm border transition", isWishlisted ? "text-red-500" : "text-gray-700")}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.images?.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedImage(img)} 
                className={cn(
                  "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-white", 
                  selectedImage === img ? "border-black ring-1 ring-black" : "border-gray-100 hover:border-gray-300"
                )}
              >
                <Image src={img} alt="thumb" fill className="object-contain p-1" />
              </button>
            ))}
          </div>
        </div>

        {/* --- PRODUCT DETAILS --- */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">{product.category}</span>
            {averageRating && (
               <div className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                 <span>{averageRating}</span> 
                 <Star className="h-4 w-4 fill-current" />
                 <span className="text-gray-400 text-xs ml-1">({reviews.length} reviews)</span>
               </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          
          {/* Price Block */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through mb-1">₹{product.mrp.toLocaleString()}</span>
                  <span className="text-sm font-bold text-green-600 mb-2">-{discount}%</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">Shipping calculated at checkout</p>
          </div>

          {/* Variants (Amazon Style) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-6 mb-8">
              
              {/* 1. Colors */}
              {uniqueColors.length > 0 && (
                <div>
                  <span className="block text-sm font-bold text-gray-900 mb-3">
                    Color: <span className="text-gray-600 font-normal">{selectedColor}</span>
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {uniqueColors.map((color, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleColorSelect(color)} 
                        className={cn(
                          "px-4 py-2 rounded-full border text-sm font-medium transition-all min-w-[3rem]", 
                          selectedColor === color 
                            ? "border-black bg-black text-white shadow-md ring-2 ring-offset-1 ring-black" 
                            : "border-gray-200 hover:border-black text-gray-700 bg-white"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Sizes */}
              {uniqueSizes.length > 0 && (
                <div>
                  <span className="block text-sm font-bold text-gray-900 mb-3">
                    Size: <span className="text-gray-600 font-normal">{selectedSize}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size, i) => {
                      const isAvailable = isCombinationAvailable(selectedColor, size);
                      return (
                        <button 
                          key={i} 
                          onClick={() => isAvailable && setSelectedSize(size)} 
                          disabled={!isAvailable}
                          className={cn(
                            "px-4 py-3 rounded-lg border text-sm font-medium transition-all min-w-[3.5rem]",
                            selectedSize === size 
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600" 
                              : isAvailable 
                                ? "border-gray-200 hover:border-black text-gray-700 bg-white"
                                : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice opacity-60 dashed"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
             <button 
               onClick={handleAddToCart} 
               className="col-span-1 bg-yellow-400 text-black py-3 rounded-full font-bold hover:bg-yellow-500 transition shadow-sm flex items-center justify-center gap-2"
             >
                <ShoppingCart className="h-5 w-5" /> Add to Cart
             </button>
             <button 
               onClick={handleBuyNow} 
               className="col-span-1 bg-orange-600 text-white py-3 rounded-full font-bold hover:bg-orange-700 transition shadow-sm flex items-center justify-center gap-2"
             >
                <Zap className="h-5 w-5 fill-current" /> Buy Now
             </button>
          </div>

          {/* Quick Info / Policies */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
             <div className="flex items-start gap-3">
                <RefreshCw className={cn("h-5 w-5 mt-0.5", product.isReturnable ? "text-green-600" : "text-red-500")} />
                <div>
                  <p className={cn("font-bold", product.isReturnable ? "text-green-700" : "text-red-600")}>
                    {product.isReturnable ? "Return Available" : "No Returns"}
                  </p>
                  <p className="text-xs text-gray-500">{product.isReturnable ? "7 Day easy returns" : "Policy applies"}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <Box className={cn("h-5 w-5 mt-0.5", product.isCodAvailable ? "text-green-600" : "text-red-500")} />
                <div>
                  <p className={cn("font-bold", product.isCodAvailable ? "text-green-700" : "text-red-600")}>
                    {product.isCodAvailable ? "COD Available" : "COD Unavailable"}
                  </p>
                  <p className="text-xs text-gray-500">{product.isCodAvailable ? "Pay on delivery" : "Prepaid only"}</p>
                </div>
             </div>
          </div>

          {/* Pincode Checker */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-8">
             <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
               <Truck className="h-4 w-4" /> Check Delivery
             </p>
             <div className="flex gap-2 mb-2">
                <input 
                  placeholder="Enter Pincode" 
                  className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g,''))}
                  maxLength={6}
                />
                <button 
                  onClick={checkPincode} 
                  className="bg-gray-900 text-white px-6 rounded-lg text-sm font-bold hover:bg-gray-800"
                >
                  Check
                </button>
             </div>
             {deliveryMessage && (
               <p className="text-sm text-green-700 font-medium animate-in slide-in-from-top-2 fade-in">
                 {deliveryMessage}
               </p>
             )}
          </div>
        </div>
      </div>

      {/* 2. TABS: Description, Reviews, Policies */}
      <div className="border-t pt-10">
         <div className="flex gap-8 border-b mb-8 overflow-x-auto pb-1">
            {["Description", "Reviews", "Shipping & Policies"].map(tab => (
               <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 font-bold text-sm uppercase tracking-wide transition whitespace-nowrap border-b-2", 
                  activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"
                )}
               >
                 {tab === "Reviews" ? `Reviews (${reviews.length})` : tab}
               </button>
            ))}
         </div>

         <div className="min-h-[200px]">
            {activeTab === "Description" && (
                <div className="prose max-w-none text-gray-600 leading-relaxed">
                   <p>{product.description}</p>
                   <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                     <h4 className="font-bold text-gray-900 mb-2">Key Features</h4>
                     <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Premium quality materials ensuring durability.</li>
                        <li>Modern design suitable for various occasions.</li>
                        <li>Designed for maximum comfort and style.</li>
                     </ul>
                   </div>
                </div>
            )}
            
            {activeTab === "Reviews" && (
                <div className="space-y-6">
                   {reviews.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                         <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                         <p className="text-gray-500 font-medium">No reviews yet.</p>
                         <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
                      </div>
                   ) : (
                      <div className="grid gap-4">
                         {reviews.map((review) => (
                            <div key={review.id} className="bg-white border rounded-xl p-6 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs text-gray-600">
                                      {review.userName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-sm">{review.userName}</span>
                                 </div>
                                 <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                               </div>
                               
                               <div className="flex text-yellow-400 mb-3">
                                  {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200")} />
                                  ))}
                               </div>
                               
                               <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                               
                               {review.verifiedPurchase && (
                                 <div className="mt-3 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                   <ShieldCheck className="h-3 w-3"/> Verified Purchase
                                 </div>
                               )}
                            </div>
                         ))}
                      </div>
                   )}
                </div>
            )}

            {activeTab === "Shipping & Policies" && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                     <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-900"><Truck className="h-4 w-4"/> Shipping Information</h3>
                     <p className="text-sm text-blue-800 mb-2">Standard delivery generally takes 5-15 business days depending on your location.</p>
                     <p className="text-sm text-blue-800">Free shipping is available on all orders above ₹999.</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                     <h3 className="font-bold mb-2 flex items-center gap-2 text-gray-900"><RefreshCw className="h-4 w-4"/> Return Policy</h3>
                     <p className="text-sm text-gray-600">You can return this item within 7 days of delivery. The item must be unused and in original packaging.</p>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* 3. SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
         <div className="pt-12 border-t">
            <h2 className="text-2xl font-bold mb-6">Suggested Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {similarProducts.map(p => (
                  <Link href={`/product/${p.id}`} key={p.id} className="group block bg-white rounded-xl overflow-hidden border hover:shadow-lg transition">
                     <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                     </div>
                     <div className="p-4">
                        <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition mb-1">{p.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">₹{p.price.toLocaleString()}</span>
                          {p.mrp > p.price && (
                             <span className="text-xs text-gray-400 line-through">₹{p.mrp.toLocaleString()}</span>
                          )}
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      )}

    </div>
  );
}