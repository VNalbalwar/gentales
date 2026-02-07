import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate-speech"
  | "violence"
  | "misinformation"
  | "other";

export type ReportStatus = "open" | "reviewed" | "actioned";

export interface IReport extends Document {
  storyId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const ReportSchema = new Schema<IReport>(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate-speech",
        "violence",
        "misinformation",
        "other",
      ],
      required: true,
    },
    details: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: ["open", "reviewed", "actioned"],
      default: "open",
    },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/*  Model                                                              */
/* ------------------------------------------------------------------ */

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
