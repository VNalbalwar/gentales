import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email?: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  roles: string[];
  status: "active" | "suspended" | "banned";
  preferences: {
    favoriteGenres: string[];
    emailNotifications: boolean;
  };
  stats: {
    storiesPublished: number;
    totalLikes: number;
    totalReads: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    roles: {
      type: [String],
      enum: ["user", "admin", "moderator"],
      default: ["user"],
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    preferences: {
      favoriteGenres: { type: [String], default: [] },
      emailNotifications: { type: Boolean, default: true },
    },
    stats: {
      storiesPublished: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalReads: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
