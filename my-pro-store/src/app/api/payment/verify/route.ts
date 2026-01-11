import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Use Client SDK
import { collection, addDoc } from "firebase/firestore";



export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      cartItems,
      userId,
      couponCode, 
      discountAmount
    } = await req.json();

    // 1. Verify Signature using Web Crypto API (Edge Compatible)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Razorpay Secret is missing");
    }

    const enc = new TextEncoder();
    const algorithm = { name: "HMAC", hash: "SHA-256" };

    const key = await crypto.subtle.importKey(
      "raw", 
      enc.encode(secret), 
      algorithm, 
      false, 
      ["sign", "verify"]
    );

    const signature = await crypto.subtle.sign(
      algorithm.name, 
      key, 
      enc.encode(body)
    );

    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 2. Calculate Order Totals
    const subtotal = cartItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 999 ? 0 : 50;
    const totalPaid = subtotal + shipping - (discountAmount || 0);

    // 3. Save Order to Firestore (Using Client SDK)
    const orderData = {
      userId,
      items: cartItems,
      amount: {
        subtotal,
        shipping,
        discount: discountAmount || 0,
        total: totalPaid
      },
      couponApplied: couponCode || null,
      status: "placed",
      payment: {
        method: "razorpay",
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        isPaid: true,
      },
      createdAt: new Date().toISOString(), // Storing as ISO String for consistency
    };

    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, orderData);

    return NextResponse.json({ 
      success: true, 
      message: "Order Placed",
      orderId: docRef.id 
    });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}