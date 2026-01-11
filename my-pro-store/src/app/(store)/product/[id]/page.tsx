import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { notFound } from "next/navigation";
import { Product, Review } from "@/types";
import ProductView from "@/components/store/ProductView";

 

// Helper: Convert Firestore Object to Plain JSON
const serializeProduct = (doc: any): Product => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert Firestore Timestamp to String
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    // Ensure variants are safe
    variants: data.variants || [],
    images: data.images || []
  } as Product;
};

// 1. Fetch Main Product
async function getProduct(id: string) {
  try {
    const docRef = doc(db, "products", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return serializeProduct(snap);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 2. Fetch Similar Products
async function getSimilarProducts(category: string, currentId: string) {
  try {
    const q = query(
      collection(db, "products"), 
      where("category", "==", category), 
      limit(5)
    );
    const snap = await getDocs(q);
    
    return snap.docs
      .map(doc => serializeProduct(doc))
      .filter(p => p.id !== currentId)
      .slice(0, 4);
  } catch (error) {
    console.error("Error fetching similar:", error);
    return [];
  }
}

// 3. Fetch Reviews
async function getReviews(productId: string) {
  try {
    const q = query(collection(db, "reviews"), where("productId", "==", productId));
    const snap = await getDocs(q);
    
    // Reviews might also have Timestamps, so we handle them safely
    return snap.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // Handle createdAt if it's a Timestamp or Number
        createdAt: typeof data.createdAt === 'object' ? data.createdAt.toMillis() : data.createdAt 
      } as Review;
    });
  } catch (error) {
    return [];
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return notFound();
  }

  // Parallel Fetching
  const [similarProducts, reviews] = await Promise.all([
    getSimilarProducts(product.category, product.id),
    getReviews(product.id)
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <ProductView 
        product={product} 
        similarProducts={similarProducts} 
        reviews={reviews} 
      />
    </div>
  );
}