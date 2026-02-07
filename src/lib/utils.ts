import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export API utilities from utils/ directory
export { rateLimit, rateLimitExceeded } from "./utils/rate-limit";
export { createSlug } from "./utils/slugify";
export { errorResponse, successResponse, clamp } from "./utils/api-helpers";
