import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";

/**
 * Unified auth helper. Wraps Clerk's auth() and auto-syncs the user
 * to our MongoDB User collection. Returns same shape the rest of the
 * codebase expects: `{ user: { id, username, roles, ... } } | null`.
 */
export async function auth() {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  await connectDB();

  let dbUser = await User.findOne({ clerkId: userId }).lean();

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "Anonymous";
    const username = generateUsername(name);

    dbUser = await User.create({
      clerkId: userId,
      email,
      name,
      username,
      avatarUrl: clerkUser.imageUrl || "",
    });
  }

  return {
    user: {
      id: dbUser._id.toString(),
      clerkId: userId,
      username: dbUser.username,
      roles: dbUser.roles as string[],
      name: dbUser.name,
      image: dbUser.avatarUrl,
    },
  };
}

function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "user"}-${suffix}`;
}
