import { auth } from "@/lib/auth";

/**
 * Retrieve the current session on the server.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Require an authenticated session. Throws if not authenticated.
 * Use in API route handlers and server components that need auth.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require admin role. Throws if not admin.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (!session.user.roles?.includes("admin")) {
    throw new Error("Forbidden");
  }
  return session;
}
