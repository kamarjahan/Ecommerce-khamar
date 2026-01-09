// src/lib/services/product-service.ts
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Product } from "@/types";

// 1. Upload Image to Firebase Storage
export async function uploadProductImage(file: File) {
  const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// 2. Add Product to Firestore
export async function createProduct(data: Partial<Product>) {
  try {
    // Generate a clean slug from the name (e.g., "Nike Shoes" -> "nike-shoes")
    const slug = data.name!.toLowerCase().replace(/ /g, "-") + "-" + Date.now();
    
    // Create the search keywords array automatically
    const keywords = [
      ...data.name!.toLowerCase().split(" "),
      data.category!.toLowerCase(),
      data.sku!.toLowerCase()
    ];

    const productData = {
      ...data,
      slug,
      keywords,
      createdAt: new Date(),
      inStock: (data.stockCount || 0) > 0,
    };

    // Add to 'products' collection
    const docRef = await addDoc(collection(db, "products"), productData);
    
    // Update the doc with its own ID
    await setDoc(doc(db, "products", docRef.id), { id: docRef.id }, { merge: true });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}