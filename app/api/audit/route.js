import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { requireModule } from "@/lib/moduleGuard";

export async function GET(request) {
  try {
    const auth = await requireModule(request, "auditLog");
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    const sorgu = {};
    if (entityType) sorgu.entityType = entityType;
    if (entityId) sorgu.entityId = entityId;

    const kayitlar = await AuditLog.find(sorgu)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: kayitlar, toplam: kayitlar.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
