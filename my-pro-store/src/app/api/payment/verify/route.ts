import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      cartItems,
      userId 
    } = await req.json();

    // 1. Verify Signature (Security Check)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 2. Signature Valid! Save Order to Firestore
    const orderData = {
      userId,
      items: cartItems,
      totalAmount: cartItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0),
      status: "placed", // Initial status
      payment: {
        method: "razorpay",
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        isPaid: true,
      },
      createdAt: new Date(), // Server Timestamp
    };

    // Save to 'orders' collection
    await adminDb.collection("orders").add(orderData);

    return NextResponse.json({ success: true, message: "Order Placed" });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}