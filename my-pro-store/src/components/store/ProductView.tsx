"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useStore } from "@/lib/store";
import { 
  ShoppingCart, Heart, Share2, Check, 
  Truck, ShieldCheck, RefreshCcw, MapPin, Star, Zap, X as XIcon 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation"; // 1. Import useRouter

interface ProductViewProps {
  product: Product;
}

export default function ProductView({ product }: ProductViewProps) {
  const router = useRouter(); // 2. Initialize Router
  const { addToCart } = useStore();
  
  // States
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [pincode, setPincode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [isPincodeChecking, setIsPincodeChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [copied, setCopied] = useState(false);

  // Zoom State
  const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Handle Mouse Move for Zoom Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomStyle({ opacity: 1, x, y });
  };

  const handleMouseLeave = () => {
    setZoomStyle(prev => ({ ...prev, opacity: 0 }));
  };

  // Handle Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Validate Selection Helper
  const validateSelection = () => {
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants && (!selectedSize || !selectedColor)) {
      toast.error("Please select both Size and Color");
      return false;
    }
    return true;
  };

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!validateSelection()) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      quantity: 1,
      variant: (product.variants?.length ?? 0) > 0 ? `${selectedSize} / ${selectedColor}` : undefined
    });
    toast.success("Added to Cart");
  };

  // 3. Handle Buy Now
  const handleBuyNow = () => {
    if (!validateSelection()) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      quantity: 1,
      variant: (product.variants?.length ?? 0) > 0 ? `${selectedSize} / ${selectedColor}` : undefined
    });
    
    router.push("/checkout"); // Redirect to checkout immediately
  };

  // Handle Pincode Check (Random 5-15 days gap)
  const checkPincode = () => {
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setIsPincodeChecking(true);
    
    setTimeout(() => {
      const today = new Date();
      const minDays = 5;
      const maxDays = 15;
      const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1) + minDays);
      
      const delivery = new Date(today);
      delivery.setDate(today.getDate() + randomDays);
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
      setDeliveryDate(delivery.toLocaleDateString('en-US', options));
      setIsPincodeChecking(false);
    }, 1000);
  };

  const sizes = Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean)));
  const colors = Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean)));
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const hasStock = (product.stockCount || 0) > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      
      {/* LEFT: Image Gallery & Zoom */}
      <div className="space-y-4">
        <div 
          ref={imageContainerRef}
          className="relative aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden cursor-crosshair group border"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Image
            src={selectedImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200"
            style={{
                transformOrigin: `${zoomStyle.x}% ${zoomStyle.y}%`,
                transform: zoomStyle.opacity ? "scale(2)" : "scale(1)"
            }}
          />
          {!hasStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
               <span className="text-white font-bold text-xl px-6 py-2 border-2 border-white rounded-lg">OUT OF STOCK</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                selectedImage === img ? "border-black ring-1 ring-black" : "border-transparent hover:border-gray-300"
              )}
            >
              <Image src={img} alt="thumb" fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Product Details */}
      <div className="flex flex-col h-full">
        <div className="mb-6 border-b pb-6">
           <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600 flex items-center gap-2"
                title="Share Product"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
              </button>
           </div>

           <div className="mt-4 flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through mb-1">₹{product.mrp.toLocaleString()}</span>
                  <span className="text-sm font-bold text-green-600 mb-2 bg-green-50 px-2 py-1 rounded-full">{discount}% OFF</span>
                </>
              )}
           </div>
           <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes</p>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="grid grid-cols-2 gap-8 mb-8">
            {sizes.length > 0 && (
                <div>
                    <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-500">Select Size</h3>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={cn(
                                    "px-4 py-2 border rounded-lg text-sm font-medium transition-all min-w-[3rem]",
                                    selectedSize === size 
                                        ? "border-black bg-black text-white shadow-md" 
                                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {colors.length > 0 && (
                <div>
                    <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-500">Select Color</h3>
                    <div className="flex flex-wrap gap-2">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "px-4 py-2 border rounded-lg text-sm font-medium transition-all capitalize",
                                    selectedColor === color
                                        ? "border-black bg-black text-white shadow-md" 
                                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                                )}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}

        {/* 4. Action Buttons (Updated with Buy Now) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button 
                onClick={handleAddToCart}
                disabled={!hasStock}
                className={cn(
                    "flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md",
                    hasStock 
                        ? "bg-gray-900 text-white hover:bg-gray-800" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
            >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
            </button>
            
            <button 
                onClick={handleBuyNow}
                disabled={!hasStock}
                className={cn(
                    "flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md border-2",
                    hasStock 
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                )}
            >
                <Zap className="h-5 w-5 fill-current" />
                Buy Now
            </button>

            <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 sm:w-auto w-full flex justify-center">
                <Heart className="h-6 w-6" />
            </button>
        </div>

        {/* Delivery & Badges */}
        <div className="bg-gray-50 p-5 rounded-xl space-y-4 mb-8">
            <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Check Delivery
                </h3>
                <div className="flex gap-2">
                    <input 
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="Enter Pincode"
                        className="flex-1 border p-2 rounded-lg bg-white focus:ring-2 focus:ring-black outline-none"
                    />
                    <button 
                        onClick={checkPincode}
                        disabled={isPincodeChecking}
                        className="text-sm font-bold text-blue-600 hover:underline px-2"
                    >
                        {isPincodeChecking ? "Checking..." : "Check"}
                    </button>
                </div>
                {deliveryDate && (
                    <p className="text-sm text-green-700 mt-2 font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Estimated Delivery by {deliveryDate}
                    </p>
                )}
            </div>

            <div className="border-t border-gray-200 my-2"></div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    {product.returnPolicy === 'no_refund' ? (
                        <>
                            <div className="p-2 bg-gray-200 rounded-full text-gray-500"><ShieldCheck className="h-5 w-5" /></div>
                            <span className="text-sm font-medium text-gray-500">No Return Available</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600"><RefreshCcw className="h-5 w-5" /></div>
                            <span className="text-sm font-medium text-gray-900">
                                {product.returnPolicy === 'replacement' ? 'Replacement Only' : '7 Days Return'}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {product.isCodAvailable ? (
                        <>
                             <div className="p-2 bg-green-100 rounded-full text-green-600"><Check className="h-5 w-5" /></div>
                             <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                        </>
                    ) : (
                        <>
                             <div className="p-2 bg-red-100 rounded-full text-red-600"><XIcon className="h-5 w-5" /></div>
                             <span className="text-sm font-medium text-gray-500">COD Not Available</span>
                        </>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500 pt-2">
                * Shipping calculated at checkout based on location.
            </p>
        </div>

        {/* Tabs */}
        <div className="mt-auto">
            <div className="flex border-b mb-4">
                <button 
                    onClick={() => setActiveTab('desc')}
                    className={cn("pb-3 px-4 font-medium transition-all relative", activeTab === 'desc' ? "text-black" : "text-gray-500")}
                >
                    Description
                    {activeTab === 'desc' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={cn("pb-3 px-4 font-medium transition-all relative", activeTab === 'reviews' ? "text-black" : "text-gray-500")}
                >
                    Reviews (0)
                    {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></span>}
                </button>
            </div>
            
            <div className="text-gray-700 text-sm leading-relaxed min-h-[100px]">
                {activeTab === 'desc' ? (
                    <div className="whitespace-pre-line">{product.description}</div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed">
                        <Star className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500">No reviews yet.</p>
                        <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">Be the first to write a review</button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}