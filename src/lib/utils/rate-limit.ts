import { NextResponse } from "next/server";

/**
 * Simple in‑memory rate limiter for serverless (Vercel).
 *
 * Caveats:
 * - Each Vercel function instance has its own memory → this is "best effort."
 * - For production at scale, replace with Upstash Redis or Vercel KV.
 *
 * The default window is 60 seconds and the default max requests is 60.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries (every 5 min)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Unique namespace to separate limits (e.g. "generate", "like") */
  namespace: string;
  /** Window size in seconds. Default 60. */
  windowSeconds?: number;
  /** Max requests per window. Default 60. */
  maxRequests?: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number } {
  cleanup();

  const { namespace, windowSeconds = 60, maxRequests = 60 } = config;
  const key = `${namespace}:${identifier}`;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  existing.count += 1;
  return { success: true, remaining: maxRequests - existing.count };
}

/**
 * Helper to return a 429 response.
 */
export function rateLimitExceeded() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
