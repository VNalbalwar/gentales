import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Report } from "@/lib/db/models/report";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/reports/:id — update report status.
 * Body: { status: "reviewed" | "actioned" }
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status } = body as { status: string };

  if (!["reviewed", "actioned"].includes(status)) {
    return errorResponse("Invalid status. Use 'reviewed' or 'actioned'.", 400);
  }

  await connectDB();

  const report = await Report.findById(id);
  if (!report) return errorResponse("Report not found", 404);

  report.status = status as "reviewed" | "actioned";
  await report.save();

  return NextResponse.json({ success: true, status: report.status });
}
