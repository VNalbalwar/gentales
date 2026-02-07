import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * /profile — redirects the signed-in user to their public profile page.
 */
export default async function ProfileRedirect() {
  const session = await auth();
  if (!session?.user?.username) redirect("/signin");
  redirect(`/u/${session.user.username}`);
}
