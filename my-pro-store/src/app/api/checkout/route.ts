import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Use Client SDK (Edge Compatible)
import { collection, query, where, getDocs } from "firebase/firestore";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { cartItems, couponCode } = await req.json();

    // 1. Calculate Base Total
    let totalAmount = 0;
    cartItems.forEach((item: any) => {
      totalAmount += item.price * item.quantity;
    });

    // 2. Coupon Validation (Using Client SDK instead of Admin)
    let discountAmount = 0;
    if (couponCode) {
      const couponsRef = collection(db, "coupons");
      const q = query(
        couponsRef, 
        where("code", "==", couponCode), 
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const coupon = snapshot.docs[0].data();
        if (coupon.type === "percentage") {
          discountAmount = (totalAmount * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
      }
    }

    // 3. Final Calculation
    const shipping = totalAmount > 999 ? 0 : 50;
    const finalAmount = Math.max(1, Math.round(totalAmount + shipping - discountAmount));

    // 4. Create Razorpay Order using 'fetch' (The 'razorpay' package is not Edge compatible)
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay keys are missing");
    }

    // Basic Auth for Razorpay
    const auth = btoa(`${keyId}:${keySecret}`);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: finalAmount * 100, // in paisa
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      }),
    });

    if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.json();
        console.error("Razorpay Error:", errorData);
        throw new Error("Failed to create Razorpay order");
    }

    const order = await razorpayResponse.json();

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount * 100,
      currency: "INR",
      discountAmount
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}