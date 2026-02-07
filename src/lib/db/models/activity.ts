import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type ActivityType =
  | "story_published"
  | "story_liked"
  | "story_read"
  | "story_bookmarked"
  | "comment_posted"
  | "follow"
  | "login";

export interface IActivity extends Document {
  userId: Types.ObjectId;
  type: ActivityType;
  date: string; // YYYY-MM-DD for grouping
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "story_published",
        "story_liked",
        "story_read",
        "story_bookmarked",
        "comment_posted",
        "follow",
        "login",
      ],
      required: true,
    },
    date: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivitySchema.index({ userId: 1, date: -1 }, { name: "user_activity_dates" });

export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

/** Record an activity and return the entry */
export async function recordActivity(
  userId: string | Types.ObjectId,
  type: ActivityType,
  metadata?: Record<string, unknown>
) {
  const date = new Date().toISOString().split("T")[0];
  return Activity.create({ userId, type, date, metadata });
}

/** Calculate current streak for a user (consecutive days with activity) */
export async function calculateStreak(
  userId: string | Types.ObjectId
): Promise<{ currentStreak: number; longestStreak: number }> {
  const activities = await Activity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
    { $group: { _id: "$date" } },
    { $sort: { _id: -1 } },
    { $limit: 365 },
  ]);

  const dates = activities.map((a) => a._id).sort().reverse();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Check if streak is active (today or yesterday)
  const isActive = dates[0] === today || dates[0] === yesterday;

  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i]).getTime();
    const next = new Date(dates[i + 1]).getTime();
    const diffDays = (curr - next) / 86400000;

    if (diffDays === 1) {
      tempStreak++;
    } else {
      if (i === 0 || currentStreak === 0) {
        currentStreak = isActive ? tempStreak : 0;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  if (currentStreak === 0 && isActive) {
    currentStreak = tempStreak;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
