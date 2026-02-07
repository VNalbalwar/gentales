import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ModerationTargetType = "story" | "user";
export type ModerationActionType = "hide" | "restore" | "ban" | "unban";

export interface IModerationAction extends Document {
  adminId: Types.ObjectId;
  targetType: ModerationTargetType;
  targetId: Types.ObjectId;
  action: ModerationActionType;
  note: string;
  createdAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const ModerationActionSchema = new Schema<IModerationAction>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["story", "user"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["hide", "restore", "ban", "unban"],
      required: true,
    },
    note: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ------------------------------------------------------------------ */
/*  Model                                                              */
/* ------------------------------------------------------------------ */

export const ModerationAction: Model<IModerationAction> =
  mongoose.models.ModerationAction ||
  mongoose.model<IModerationAction>(
    "ModerationAction",
    ModerationActionSchema
  );
