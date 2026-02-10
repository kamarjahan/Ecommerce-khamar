import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

interface IncomingCartItem {
  id: string;
  quantity: number;
  variant?: string;
}

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
    }
    const decoded = await requireUser(req);
    const { cartItems, couponCode } = (await req.json()) as {
      cartItems: IncomingCartItem[];
      couponCode?: string;
    };

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const normalizedItems: any[] = [];
    let subtotal = 0;

    for (const item of cartItems) {
      if (!item?.id || !item?.quantity || item.quantity < 1) continue;
      const productSnap = await adminDb!.collection("products").doc(item.id).get();
      if (!productSnap.exists) continue;
      const product = productSnap.data() as any;
      const unitPrice = Number(product.price || 0);
      const quantity = Number(item.quantity);

      normalizedItems.push({
        id: item.id,
        productId: item.id,
        name: product.name || "Product",
        image: product.images?.[0] || "",
        price: unitPrice,
        quantity,
        variant: item.variant || "",
        isCodAvailable: product.isCodAvailable !== false,
      });

      subtotal += unitPrice * quantity;
    }

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "No valid cart items" }, { status: 400 });
    }

    let discountAmount = 0;
    const normalizedCoupon = couponCode?.toUpperCase()?.trim();

    if (normalizedCoupon) {
      const couponSnap = await adminDb
        .collection("coupons")
        .where("code", "==", normalizedCoupon)
        .where("status", "==", "active")
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data() as any;
        discountAmount = coupon.type === "percentage"
          ? (subtotal * Number(coupon.value || 0)) / 100
          : Number(coupon.value || 0);
      }
    }

    const shipping = subtotal > 999 ? 0 : 50;
    const finalAmount = Math.max(1, Math.round(subtotal + shipping - discountAmount));

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys are missing" }, { status: 500 });
    }

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: finalAmount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay Error:", errorData);
      return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
    }

    const order = await razorpayResponse.json();

    await adminDb!.collection("order_intents").doc(order.id).set({
      uid: decoded.uid,
      items: normalizedItems,
      amount: {
        subtotal,
        shipping,
        discount: discountAmount,
        total: finalAmount,
      },
      couponApplied: normalizedCoupon || null,
      status: "created",
      createdAt: new Date().toISOString(),
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
