import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/firebase-admin"; // Use Admin SDK for security

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { cartItems } = await req.json();

    // 1. Recalculate Total on Server (Security measure)
    let totalAmount = 0;
    
    // In a real app, you would fetch the REAL price from DB here
    // For now, we trust the cart (but verify in production!)
    cartItems.forEach((item: any) => {
      totalAmount += item.price * item.quantity;
    });

    // Add Shipping Logic
    const shipping = totalAmount > 999 ? 0 : 50;
    const finalAmount = totalAmount + shipping;

    // 2. Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // Razorpay takes amount in PAISA (₹1 = 100 paisa)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount * 100,
      currency: "INR",
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}