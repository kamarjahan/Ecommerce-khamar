"use client";

import { use, useEffect, useState, Suspense } from "react";
import { productService } from "@/lib/services/product-service";
import { Product } from "@/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProductView from "@/components/store/ProductView";
import RelatedProducts from "@/components/store/RelatedProducts"; // Import the new component

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Main Product
        const data = await productService.getById(resolvedParams.id);
        if (!data) {
          router.push("/404");
          return;
        }
        setProduct(data);

        // 2. Fetch Related Products (using the category we just got)
        if (data.category) {
            const related = await productService.getRelated(data.category, data.id);
            setRelatedProducts(related);
        }

      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
       <Suspense fallback={<div>Loading view...</div>}>
          <ProductView product={product} />
       </Suspense>
       
       {/* New Related Products Section */}
       <RelatedProducts products={relatedProducts} />
    </div>
  );
}