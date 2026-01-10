import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb } from "@/lib/firebase-admin"; // FIXED: Changed 'db' to 'adminDb'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { cartItems, couponCode } = await req.json();

    // 1. Calculate Base Total
    let totalAmount = 0;
    cartItems.forEach((item: any) => {
      totalAmount += item.price * item.quantity;
    });

    // 2. Server-Side Coupon Validation
    let discountAmount = 0;
    if (couponCode) {
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

    // 3. Final Calculation
    const shipping = totalAmount > 999 ? 0 : 50;
    const finalAmount = Math.max(1, Math.round(totalAmount + shipping - discountAmount));

    // 4. Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // in paisa
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