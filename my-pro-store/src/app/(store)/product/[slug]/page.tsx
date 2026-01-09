import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Product } from "@/types";
import ProductView from "@/components/store/ProductView";
import ProductCard from "@/components/store/ProductCard";
import { Metadata } from "next";

// 1. Generate Metadata (FIXED: Await params)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; // <--- Await the promise here first
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} | MyStore` : "Product Not Found",
    description: product?.description?.slice(0, 160),
  };
}

// 2. Fetch Helper
async function getProductBySlug(slug: string) {
  if (!slug) return null;
  
  const q = query(collection(db, "products"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const data = snapshot.docs[0].data();
  return { 
    id: snapshot.docs[0].id, 
    ...data,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
  } as Product;
}

async function getSimilarProducts(category: string, currentId: string) {
  if (!category) return [];

  try {
    const q = query(
      collection(db, "products"), 
      where("category", "==", category),
      limit(4)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => {
         const data = doc.data();
         return { 
             id: doc.id, 
             ...data,
             createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
         } as Product;
      })
      .filter(p => p.id !== currentId); 
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
}

// 3. The Page Component (FIXED: Await params)
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // <--- Await the promise here first

  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-500">Product Not Found</h1>
      </div>
    );
  }

  const similarProducts = await getSimilarProducts(product.category || "", product.id);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container px-4 py-8">
        <ProductView product={product} />

        {similarProducts.length > 0 && (
          <div className="mt-20 border-t pt-12">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}