import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Report } from "@/lib/db/models/report";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/admin/reports — list reports with filtering and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";
  const reason = searchParams.get("reason") || "";
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10) || 20);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (reason) filter.reason = reason;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("storyId", "title slug status")
      .populate("reporterId", "name username")
      .lean(),
    Report.countDocuments(filter),
  ]);

  const formatted = reports.map((r) => ({
    ...r,
    _id: String(r._id),
  }));

  return NextResponse.json({ reports: formatted, total, hasMore: skip + limit < total });
}
