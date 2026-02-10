import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const { permissions } = await requireAdmin(req);
    return NextResponse.json({ authorized: true, permissions });
  } catch {
    return NextResponse.json({ authorized: false, permissions: [] }, { status: 403 });
  }
}
