import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb } from "@/lib/firebase-admin";

// REMOVE the top-level initialization
// const razorpay = new Razorpay({ ... }); <--- DELETE THIS

export async function POST(req: Request) {
  try {
    // 1. Initialize Razorpay INSIDE the function (Lazy Initialization)
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys are missing");
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { cartItems, couponCode } = await req.json();

    // ... Rest of your existing code ...
    // Calculate Base Total
    let totalAmount = 0;
    cartItems.forEach((item: any) => {
      totalAmount += item.price * item.quantity;
    });

    // ... Coupon Logic ...
    let discountAmount = 0;
    if (couponCode && adminDb) { // Check adminDb exists before using
      const couponsRef = adminDb.collection("coupons");
      const snapshot = await couponsRef.where("code", "==", couponCode).where("status", "==", "active").get();

      if (!snapshot.empty) {
        const coupon = snapshot.docs[0].data();
        if (coupon.type === "percentage") {
          discountAmount = (totalAmount * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
      }
    }

    // ... Final Calculation ...
    const shipping = totalAmount > 999 ? 0 : 50;
    const finalAmount = Math.max(1, Math.round(totalAmount + shipping - discountAmount));

    // ... Create Razorpay Order ...
    const order = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

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