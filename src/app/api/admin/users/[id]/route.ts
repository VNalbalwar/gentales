import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id — get single user details.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  await connectDB();

  const user = await User.findById(id).lean();
  if (!user) return errorResponse("User not found", 404);

  return NextResponse.json({ ...user, _id: String(user._id) });
}

/**
 * PATCH /api/admin/users/:id — update user role or status.
 * Body: { action: "ban" | "suspend" | "activate" | "promote-admin" | "demote-admin" | "promote-moderator" | "demote-moderator" }
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { action, note } = body as { action: string; note?: string };

  if (!action) return errorResponse("Action is required", 400);

  await connectDB();

  const user = await User.findById(id);
  if (!user) return errorResponse("User not found", 404);

  // Prevent admin from modifying themselves
  if (String(user._id) === session.user.id) {
    return errorResponse("Cannot modify your own account", 400);
  }

  let moderationAction: string | null = null;

  switch (action) {
    case "ban":
      user.status = "banned";
      moderationAction = "ban";
      break;
    case "suspend":
      user.status = "suspended";
      moderationAction = "ban"; // using existing enum
      break;
    case "activate":
      user.status = "active";
      moderationAction = "unban";
      break;
    case "promote-admin":
      if (!user.roles.includes("admin")) {
        user.roles.push("admin");
      }
      break;
    case "demote-admin":
      user.roles = user.roles.filter((r: string) => r !== "admin");
      break;
    case "promote-moderator":
      if (!user.roles.includes("moderator")) {
        user.roles.push("moderator");
      }
      break;
    case "demote-moderator":
      user.roles = user.roles.filter((r: string) => r !== "moderator");
      break;
    default:
      return errorResponse("Invalid action", 400);
  }

  await user.save();

  // Log moderation action
  if (moderationAction) {
    await ModerationAction.create({
      adminId: session.user.id,
      targetType: "user",
      targetId: id,
      action: moderationAction,
      note: note || `Admin ${action} on user @${user.username}`,
    });
  }

  return NextResponse.json({
    success: true,
    user: {
      _id: String(user._id),
      name: user.name,
      username: user.username,
      roles: user.roles,
      status: user.status,
    },
  });
}
