import "server-only";
import { admin, adminDb } from "@/lib/firebase-admin";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function ensureAdminSdkReady() {
  if (!admin.apps.length || !adminDb) {
    throw new Error("Firebase Admin SDK is not configured");
  }
}

export async function requireUser(req: Request) {
  ensureAdminSdkReady();
  const token = getBearerToken(req);
  if (!token) throw new Error("Unauthorized");
  return admin.auth().verifyIdToken(token);
}

export async function requireAdmin(req: Request) {
  const decoded = await requireUser(req);
  const email = decoded.email?.toLowerCase();
  if (!email || !adminDb) throw new Error("Forbidden");

  const snapshot = await adminDb
    .collection("admin_users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) throw new Error("Forbidden");

  const data = snapshot.docs[0].data() as { role?: string; permissions?: string[] };
  const permissions = data.role === "admin" ? [
    "view_dashboard",
    "manage_products",
    "manage_orders",
    "manage_customers",
    "manage_coupons",
    "manage_support",
    "manage_team",
    "manage_settings",
  ] : (data.permissions || []);

  return { decoded, permissions };
}
