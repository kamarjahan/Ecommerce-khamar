import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
    }
    const { decoded } = await requireAdmin(req);
    const { uid } = await params;

    await admin.auth().deleteUser(uid);
    await adminDb!.collection("users").doc(uid).delete();
    await adminDb!.collection("admin_audit_logs").add({
      action: "delete_user",
      targetUid: uid,
      actorUid: decoded.uid,
      actorEmail: decoded.email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to deprovision user:", error);
    return NextResponse.json({ error: "Failed to deprovision user" }, { status: 500 });
  }
}
