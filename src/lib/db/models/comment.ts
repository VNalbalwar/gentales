import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IComment extends Document {
  storyId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  parentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

CommentSchema.index(
  { storyId: 1, createdAt: -1 },
  { name: "story_comments" }
);

export const Comment: Model<IComment> =
  mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
