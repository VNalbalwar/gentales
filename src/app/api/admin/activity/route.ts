import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/admin/activity — list moderation audit log with pagination.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const actionType = searchParams.get("action") || "";
  const targetType = searchParams.get("targetType") || "";
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10) || 20);

  const filter: Record<string, unknown> = {};
  if (actionType) filter.action = actionType;
  if (targetType) filter.targetType = targetType;

  const [actions, total] = await Promise.all([
    ModerationAction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "name username")
      .lean(),
    ModerationAction.countDocuments(filter),
  ]);

  const formatted = actions.map((a) => ({
    ...a,
    _id: String(a._id),
    targetId: String(a.targetId),
  }));

  return NextResponse.json({ actions: formatted, total, hasMore: skip + limit < total });
}
