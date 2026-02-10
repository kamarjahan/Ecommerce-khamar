import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
    }
    const decoded = await requireUser(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const intentRef = adminDb!.collection("order_intents").doc(razorpay_order_id);
    const intentSnap = await intentRef.get();

    if (!intentSnap.exists) {
      return NextResponse.json({ error: "Order intent not found" }, { status: 404 });
    }

    const intent = intentSnap.data() as any;

    if (intent.uid !== decoded.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay Secret is missing" }, { status: 500 });
    }

    const enc = new TextEncoder();
    const algorithm = { name: "HMAC", hash: "SHA-256" };

    const key = await crypto.subtle.importKey("raw", enc.encode(secret), algorithm, false, ["sign", "verify"]);
    const signature = await crypto.subtle.sign(algorithm.name, key, enc.encode(body));

    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    const orderData = {
      userId: decoded.uid,
      items: intent.items,
      amount: intent.amount,
      couponApplied: intent.couponApplied || null,
      status: "placed",
      payment: {
        method: "razorpay",
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        isPaid: true,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb!.collection("orders").add(orderData);
    await intentRef.update({ status: "completed", completedAt: new Date().toISOString(), orderDocId: docRef.id });

    return NextResponse.json({ success: true, message: "Order Placed", orderId: docRef.id });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
