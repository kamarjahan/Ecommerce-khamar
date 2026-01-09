// src/lib/services/product-service.ts
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Product } from "@/types";

// 1. Upload Image to Firebase Storage
export async function uploadProductImage(file: File) {
  const cloudName = "dboikgfsn"; // Replace with your actual Cloud Name
  const uploadPreset = "ecommerce"; // Replace with your Unsigned Preset Name

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "my-store-products"); // Optional: Organize in folders

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.secure_url; // This is the URL you save to Firestore
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
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