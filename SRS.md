# Generative & Community‑Driven Storytelling Platform — Software Requirements Specification (SRS)

**Document status:** Engineering‑ready (MVP blueprint)  
**Version:** 1.0  
**Last updated:** 2026‑02‑07  
**Primary stack constraint:** Next.js 16 (App Router) + Tailwind CSS + MongoDB Atlas + Framer Motion + free OAuth authentication

---

## 0. Executive Summary

This document specifies a **public web platform** where users can **create, generate, publish, and discover stories**. The differentiator is **procedural uniqueness + optional AI assistance** combined with community discovery (likes, bookmarks, trending, tags).

The SRS is designed to be:

- **Production‑grade**: security, abuse prevention, moderation, and failure handling are defined.
- **Solo‑developer executable**: a clear MVP, build order, and tradeoffs are called out.
- **Investor/recruiter ready**: crisp scope, measurable outcomes, and realistic constraints.

---

## 1. Purpose, Goals, and Non‑Goals

### 1.1 Purpose

Define requirements and implementation constraints for building a community storytelling platform that supports:

- Hand‑written story publishing
- Generated stories using **procedural** and/or **AI‑assisted** pipelines
- Thumbnails (upload and procedural; AI image generation later)
- Public reading and discovery
- Engagement actions (likes, bookmarks)

### 1.2 Product Goals (What success looks like)

**MVP success metrics (initial targets):**

- **Activation:** ≥ 20% of new sign‑ups publish at least one story
- **Engagement:** ≥ 10% of readers like or bookmark a story
- **Retention:** ≥ 15% weekly returning users after 4 weeks of launch
- **Performance:** LCP < 2.5s on median mobile; INP < 200ms on key flows

### 1.3 Non‑Goals (Explicitly out of scope for MVP)

To keep the MVP buildable for one strong full‑stack developer:

- Payments, subscriptions, or paywalls
- Real‑time collaboration / Google‑Docs style editing
- Native mobile apps
- Fully automated moderation at scale (MVP uses a lightweight human‑in‑the‑loop approach)
- Complex “choose‑your‑own‑adventure” branching UI (procedural output can be multi‑chapter; interactive branching is Phase 3)

### 1.4 Assumptions and Constraints

- **Deployment:** Vercel free tier for MVP
- **Database:** MongoDB Atlas free tier (M0)
- **Auth:** Free OAuth providers (Google + GitHub)
- **OTP:** Phone OTP is specified in the product vision, but **SMS OTP is not reliably ₹0**. MVP will ship with OAuth; OTP is Phase 2 unless a genuinely free provider exists.
- **AI:** AI generation is optional; must degrade gracefully when not configured.

---

## 2. Definitions and Terminology

- **Story:** A published or draft work with metadata (title, tags, thumbnail, visibility) and content (single body or chapters).
- **Draft:** Unpublished story state; autosaved.
- **Generated story:** Story created via procedural rules and/or AI assistance.
- **Procedural generation:** Deterministic generation given a seed and parameters.
- **AI provider:** External API (optional) used for text or image generation.
- **Visibility:** `public` or `private` (MVP). A future `unlisted` mode is Phase 2.

---

## 3. Users, Roles, and Permissions

### 3.1 User Roles

- **Guest**
   - Browse public stories
   - Read story pages
   - Search and filter discovery

- **Registered User**
   - Everything Guest can do
   - Create drafts
   - Publish stories
   - Like / bookmark stories
   - Report stories

- **Admin** (single operator for MVP)
   - Moderate content (hide/restore stories)
   - Review reports
   - Ban users (soft ban)
   - Manage featured picks (Phase 2)

### 3.2 Permission Principles

- **Least privilege:** Only admins can access moderation endpoints.
- **Server authoritative:** All mutations occur server‑side with session validation.
- **Public by default only on explicit publish:** Drafts and private stories must never be accessible via public routes.

---

## 4. Scope by Phase (MVP vs Future)

### 4.1 MVP (Must‑Build)

**Core value:** publish + discover + procedural/AI‑optional generation.

- Authentication: **Google OAuth + GitHub OAuth**
- Profiles: username, bio, avatar, join date
- Story creation (hand‑written): Markdown editor, autosave drafts, preview
- Story generation (text):
   - Procedural generation (deterministic seed)
   - Optional AI‑assisted generation if API key configured
- Publish & visibility: `public` / `private`
- Thumbnails:
   - Procedural thumbnail generation (local algorithm)
   - User‑provided thumbnail via URL OR upload (see cost section)
- Reading experience: responsive story page, chapter navigation if multi‑chapter
- Discovery:
   - Latest feed
   - Trending feed (simple score)
   - Tag/genre browsing
   - Basic search using MongoDB text indexes
- Engagement: likes, bookmarks
- Moderation:
   - Report story
   - Admin hide/unhide story
   - Basic anti‑abuse controls (rate limiting, input validation)

### 4.2 Phase 2 (After MVP)

- Phone number + OTP sign‑in (subject to provider cost)
- Unlisted stories + share links
- Richer editor (WYSIWYG) or MDX enhancements
- Editor picks / featured carousel
- Better analytics dashboard for admins
- More sophisticated trending (time decay + engagement quality)
- Notifications (email) for basic events (optional)

### 4.3 Phase 3 / Future

- Interactive branching story UI
- Following authors + personalized feed
- AI image thumbnails (cost‑aware)
- Collaboration / co‑authoring
- Mobile app

---

## 5. Functional Requirements (Detailed)

### 5.1 Authentication & Accounts

#### FR‑AUTH‑01 OAuth providers

- The system **must** support Google OAuth and GitHub OAuth.
- OAuth must use a widely adopted library compatible with Next.js App Router (Auth.js / NextAuth).

#### FR‑AUTH‑02 Session management

- Sessions must be **HTTP‑only** and protected against CSRF.
- Session expiry and refresh behavior must be defined by the auth library defaults, with a configurable max age.

#### FR‑AUTH‑03 Account linking (MVP‑optional)

- If a user signs in with multiple providers using the same verified email, the system should link them to a single user record where possible.

#### FR‑AUTH‑04 Phone OTP (Phase 2)

- Sign‑in with phone number + OTP.
- Abuse controls: rate limit OTP sends/verifications and block enumerations.
- **Cost warning:** SMS is almost never ₹0; see Section 12.

---

### 5.2 User Profiles

#### FR‑USER‑01 Public profile

- Profile includes: `username`, `bio`, `avatar`, `joinedAt`.
- Public profile page lists public stories by the user.

#### FR‑USER‑02 Profile editing

- Logged‑in users can edit username, bio, avatar.
- Username must be unique and URL‑safe.

---

### 5.3 Story Authoring (Hand‑Written)

#### FR‑STORY‑01 Draft lifecycle

- Users can create a draft, update content, and save.
- Autosave should occur (client‑side) with a debounce (e.g., 1–2 seconds) and persist to server.

#### FR‑STORY‑02 Markdown editor

- MVP editor stores Markdown; rendering must sanitize output to prevent XSS.

#### FR‑STORY‑03 Preview

- Users can preview rendered story content prior to publishing.

#### FR‑STORY‑04 Publish

- Publishing requires: title, at least one tag/genre, visibility.
- Publish action creates a **published snapshot**. Editing a published story in MVP is allowed but should preserve history minimally (Phase 2 adds revisions).

---

### 5.4 Story Generation (Procedural + Optional AI)

#### FR‑GEN‑01 Inputs

- Required inputs: `genre`, `mood`, `length` (enum), `keywords` (array)
- Optional: freeform `prompt`, `seed`

#### FR‑GEN‑02 Procedural generation (MVP)

- Must support a deterministic output when `seed` is provided.
- Output format supports either:
   - single content body, or
   - multi‑chapter structure

#### FR‑GEN‑03 AI‑assisted generation (MVP‑optional)

- AI generation is optional and only enabled when an API key is configured.
- Must enforce:
   - per‑user rate limits
   - max tokens/length caps
   - content safety pass (basic)
- If AI fails, system must fall back to procedural generation.

#### FR‑GEN‑04 Generated metadata

- The generator should produce metadata:
   - title suggestions (optional)
   - tags suggestions (optional)
   - an **emotion vector** (e.g., hope, fear, chaos) as normalized scores 0–1

---

### 5.5 Thumbnails

#### FR‑THUMB‑01 Procedural thumbnails (MVP)

- System must generate a deterministic thumbnail from seed (SVG or PNG).

#### FR‑THUMB‑02 User thumbnail

MVP options (choose one at implementation time):

- **Option A (₹0‑friendly):** allow only a remote image URL (validated allowlist or basic validation)
- **Option B:** upload image to a free image storage provider (may require account)

#### FR‑THUMB‑03 Image constraints

- Enforce aspect ratio (e.g., 16:9 or 1.91:1) and max file size.
- Render via Next.js Image where possible.

---

### 5.6 Reading Experience

#### FR‑READ‑01 Public story page

- Story pages must be accessible by slug/id.
- Must display: title, author, published date, tags, thumbnail, content.

#### FR‑READ‑02 Read count tracking

- Read count increments with abuse controls:
   - Only one increment per story per session per time window (e.g., 1 hour)
   - Do not increment on admin/bot signals where possible

#### FR‑READ‑03 Sharing

- Public stories have shareable URLs.

---

### 5.7 Discovery & Search

#### FR‑DISC‑01 Latest feed

- Paginated feed of newest public stories.

#### FR‑DISC‑02 Trending feed (MVP)

- Trending score uses a simple formula with time decay, e.g.

$$
score = (likes \times 3 + bookmarks \times 5 + reads) \times decay(ageHours)
$$

Where `decay(ageHours)` can be `1 / (1 + ageHours/24)` for MVP.

#### FR‑DISC‑03 Tag/genre browsing

- Filter stories by tag/genre.

#### FR‑DISC‑04 Search

- MVP uses MongoDB text index on title + content + tags.
- Must support query + optional tag filter.

---

### 5.8 Engagement (Likes & Bookmarks)

#### FR‑ENG‑01 Like

- Authenticated users can like/unlike a story.
- Like count displayed on story cards and story page.

#### FR‑ENG‑02 Bookmark

- Authenticated users can bookmark/unbookmark a story.
- Bookmarks list is accessible from profile.

---

### 5.9 Moderation & Abuse Handling

#### FR‑MOD‑01 Reporting

- Users can report a story with a reason and optional comment.

#### FR‑MOD‑02 Admin moderation actions

- Admin can:
   - hide a story (removes from feeds, shows “unavailable” to public)
   - restore a story
   - ban a user (prevents new content + engagement)

#### FR‑MOD‑03 Safety defaults

- New accounts have stricter rate limits.
- Generated content must be flagged as “AI‑assisted” (if applicable) for transparency.

---

## 6. System Architecture

### 6.1 High‑Level Components

- **Web App:** Next.js 16 App Router
- **Auth:** Auth.js/NextAuth with OAuth providers
- **API Layer:** Next.js Route Handlers under `app/api/*`
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Media:** Procedural thumbnails (local). Optional external storage for uploads.
- **Optional AI:** external LLM API (text) and later image model

### 6.2 Frontend Architecture (Next.js 16 App Router)

**Routing & pages (recommended):**

- `app/(marketing)/` — landing, about (optional)
- `app/(auth)/signin` — sign in
- `app/(feed)/` — home feed, trending, tags
- `app/story/[slugOrId]/` — story reader page
- `app/u/[username]/` — profile page
- `app/editor/` — create/edit draft
- `app/admin/` — admin moderation (protected)

**Rendering strategy:**

- Feeds: SSR with caching (short revalidate window) or server components with pagination
- Story pages: SSR for freshness; consider ISR for popular stories later
- Editor: client component for rich interactions

**State management:**

- Prefer server components for data fetch.
- Client state limited to editor draft, UI preferences, and optimistic likes/bookmarks.

**Styling + motion:**

- Tailwind for layout.
- Framer Motion for page transitions and micro‑interactions; avoid heavy animations on low‑end devices.

### 6.3 Backend/API Structure

**Principles:**

- Use **Route Handlers** for API endpoints (`app/api/**/route.ts`).
- Validate all inputs with a schema validator (e.g., Zod).
- Authenticate via server session retrieval.

**Suggested API routes (MVP):**

- `POST /api/stories` — create draft
- `PATCH /api/stories/:id` — update draft or story
- `POST /api/stories/:id/publish` — publish
- `GET /api/stories` — list feed (`sort=latest|trending`, `tag=`, `q=`)
- `GET /api/stories/:id` — read story
- `POST /api/stories/:id/like` — toggle like
- `POST /api/stories/:id/bookmark` — toggle bookmark
- `POST /api/stories/:id/report` — report
- `POST /api/generate/story` — generate story text (procedural/AI)
- `POST /api/generate/thumbnail` — generate procedural thumbnail

### 6.4 Data Access Layer

- Use a single Mongo connection helper with connection caching for serverless.
- Mongoose models defined in a dedicated folder (e.g., `src/db/models`).
- Enforce schema validation at both:
   - API boundary (Zod)
   - DB schema (Mongoose)

### 6.5 Caching & Revalidation

- Feed queries should use cursor pagination and indexed sorting.
- Where safe, use Next.js caching + `revalidateTag` on story publish/update.

### 6.6 Observability (MVP)

- Use Vercel logs for request tracing.
- Add structured logging around generation failures and moderation actions.
- Optional: Sentry free tier for error reporting (Phase 2).

---

## 7. Data Model (MongoDB)

### 7.1 Collections

#### 7.1.1 `users`

Fields (suggested):

- `_id: ObjectId`
- `email: string` (unique, nullable if provider lacks email)
- `providers: [{ provider: 'google'|'github'|'phone', providerAccountId: string }]`
- `username: string` (unique, indexed)
- `bio: string`
- `avatarUrl: string`
- `roles: string[]` (e.g., `['user']`, `['admin']`)
- `status: 'active'|'banned'`
- `createdAt`, `updatedAt`

**Indexes:**

- `username` unique
- `email` sparse unique

#### 7.1.2 `stories`

Fields:

- `_id: ObjectId`
- `authorId: ObjectId` (indexed)
- `title: string` (indexed)
- `slug: string` (unique, indexed)
- `summary: string` (optional)
- `contentMarkdown: string` OR `chapters: [{ title, contentMarkdown, order }]` (see note below)
- `generation: { type: 'handwritten'|'procedural'|'ai-assisted', seed?: string, params?: object, provider?: string }`
- `emotion: { hope: number, fear: number, chaos: number, ... }` (optional)
- `tags: string[]` (indexed)
- `genre: string` (indexed)
- `mood: string` (indexed)
- `visibility: 'public'|'private'`
- `status: 'draft'|'published'|'hidden'`
- `thumbnail: { type: 'procedural'|'url', url?: string, seed?: string }`
- `counts: { reads: number, likes: number, bookmarks: number }`
- `publishedAt?: Date`
- `createdAt`, `updatedAt`

**Indexes:**

- `{ status: 1, visibility: 1, publishedAt: -1 }` for latest feed
- `{ tags: 1, publishedAt: -1 }` for tag browsing
- Text index: `title`, `contentMarkdown`, `tags` (MVP)

**Chapter storage note:**

- MVP can embed chapters if typical stories are small.
- If chapters become large, store chapters in a separate `storyChapters` collection to avoid MongoDB 16MB doc limit.

#### 7.1.3 `reactions`

- `_id`
- `storyId` (indexed)
- `userId` (indexed)
- `type: 'like'|'bookmark'`
- `createdAt`

**Indexes:**

- unique compound: `{ storyId: 1, userId: 1, type: 1 }` to prevent duplicates

#### 7.1.4 `reads` (MVP‑lightweight)

Two MVP approaches:

- **Approach A (simpler):** store only aggregated `counts.reads` and track dedupe in a signed cookie/session.
- **Approach B (more accurate):** collection:
   - `storyId`, `viewerHash`, `createdAt`
   - TTL index (e.g., 24h) to dedupe reads without storing PII.

#### 7.1.5 `reports`

- `_id`
- `storyId` (indexed)
- `reporterId` (indexed)
- `reason: string` (enum)
- `details: string` (optional)
- `status: 'open'|'reviewed'|'actioned'`
- `createdAt`, `updatedAt`

#### 7.1.6 `moderationActions`

- `_id`
- `adminId`
- `targetType: 'story'|'user'`
- `targetId`
- `action: 'hide'|'restore'|'ban'|'unban'`
- `note` (optional)
- `createdAt`

---

## 8. API Contracts (MVP)

> Exact request/response shapes are implementation details, but the following contracts must hold.

### 8.1 Authentication

Handled by Auth.js/NextAuth routes.

### 8.2 Stories

- `POST /api/stories`
   - Auth: required
   - Creates a draft story skeleton

- `PATCH /api/stories/:id`
   - Auth: required (author only)
   - Updates draft fields/content

- `POST /api/stories/:id/publish`
   - Auth: required (author only)
   - Validates required fields, sets `status=published`, sets `publishedAt`

- `GET /api/stories`
   - Auth: optional
   - Query: `sort`, `cursor`, `limit`, `tag`, `q`

- `GET /api/stories/:id`
   - Auth: optional
   - If private/hidden and not author/admin → 404

### 8.3 Engagement

- `POST /api/stories/:id/like`
   - Auth: required
   - Toggles like

- `POST /api/stories/:id/bookmark`
   - Auth: required
   - Toggles bookmark

### 8.4 Generation

- `POST /api/generate/story`
   - Auth: required
   - Rate limited
   - Returns generated draft content + metadata

- `POST /api/generate/thumbnail`
   - Auth: required
   - Returns procedural thumbnail data (SVG/URL)

### 8.5 Moderation

- `POST /api/stories/:id/report`
   - Auth: required

- `POST /api/admin/stories/:id/hide`
   - Auth: admin only

---

## 9. Security, Privacy, and Abuse Prevention

### 9.1 Input Validation and XSS Prevention

- Validate all API inputs via schema validation.
- Sanitize Markdown rendering; forbid raw HTML by default.

### 9.2 CSRF and Session Security

- Use secure cookies, HTTP‑only cookies, same‑site protection.
- Ensure OAuth callback URLs are strict and environment‑specific.

### 9.3 Rate Limiting

**MVP implementation:**

- IP‑based rate limiting for unauthenticated endpoints.
- User‑based rate limiting for generation and story mutations.

**Suggested limits (starting point):**

- Generate story: 5 requests / hour / user
- Publish/update: 60 requests / hour / user
- Like/bookmark: 120 requests / hour / user

### 9.4 Anti‑Spam and Abuse

- New users have stricter limits until they have a verified OAuth email.
- Soft banning a user prevents new content creation and engagement.
- Reports create a moderation queue.

### 9.5 Data Privacy

- Avoid storing raw IP addresses long‑term.
- If read‑dedupe uses hashes, hash must be non‑reversible and rotated (salt).
- Provide a path to delete a user account and anonymize stories later (Phase 2).

---

## 10. Performance and Scalability Requirements

### 10.1 Performance Targets

- Median mobile LCP < 2.5s
- Avoid heavy client bundles; keep editor isolated
- Use pagination and indexed queries

### 10.2 Scalability Assumptions (MVP)

- Traffic spikes during launches.
- System must remain functional with increased reads even if generation is rate limited.

### 10.3 Database Query Patterns

- Feeds: indexed sort by `publishedAt` and filters by `tags`.
- Search: MongoDB text search (not Atlas Search) for free tier compatibility.

---

## 11. Reliability and Failure Handling

### 11.1 AI provider downtime

- If AI API errors/timeouts:
   - fallback to procedural generator
   - show user messaging: “AI assist temporarily unavailable; generated via procedural mode.”

### 11.2 Auth provider downtime

- If OAuth provider fails:
   - show error page with retry
   - do not partially create accounts without completing callback

### 11.3 Database failures

- Fail safe with user‑friendly error messages.
- Log correlation IDs for debugging.

---

## 12. Cost & Feasibility (₹0 MVP Audit)

### 12.1 Vercel Free Tier

**Generally feasible** for MVP, but watch for:

- Bandwidth / function execution limits (varies by plan; can change)
- Image optimization usage (may have limits)
- Background cron jobs (often not available on free tiers)

**Guidance:**

- Avoid scheduled jobs in MVP.
- Keep generation behind strict rate limits.

### 12.2 MongoDB Atlas Free Tier (M0)

Feasible with constraints:

- Storage and connection limits
- No Atlas Search on free tier (use text indexes)

### 12.3 OAuth Providers (Google/GitHub)

Typically ₹0.

### 12.4 Phone OTP (SMS) — Cost Risk

**High risk to ₹0 claim.** SMS OTP almost always incurs cost after trials.

**Recommendation:**

- MVP ships with Google/GitHub OAuth.
- Phone OTP is Phase 2 once a provider choice and budget are confirmed.

### 12.5 File uploads / image hosting

Uploads usually require object storage or a third‑party.

**₹0‑friendly MVP options:**

- Allow only thumbnail URLs (no uploads)
- Use procedural thumbnails as default

If uploads are required in MVP, choose a provider with a free tier and explicitly cap file sizes and usage.

### 12.6 AI APIs

AI text/image APIs can quickly become paid.

**MVP safeguards:**

- AI features disabled unless a key is configured
- strict rate limits
- hard caps on output size

---

## 13. Developer Execution Plan (Solo‑Dev Milestones)

### 13.1 Milestone 0 — Repo + baseline (1–2 days)

- Next.js 16 app scaffold
- Tailwind setup
- Auth.js/NextAuth wired with Google/GitHub
- MongoDB connection + Mongoose models

### 13.2 Milestone 1 — Story CRUD + publishing (3–5 days)

- Draft create/edit/autosave
- Publish flow + visibility controls
- Story reading page + basic feed

### 13.3 Milestone 2 — Discovery + engagement (3–5 days)

- Latest + trending feeds
- Tags + search
- Likes + bookmarks

### 13.4 Milestone 3 — Generation (procedural first) (3–6 days)

- Procedural generator module with seed determinism
- `/api/generate/story` endpoint
- Optional AI adapter behind feature flag

### 13.5 Milestone 4 — Moderation + abuse controls (2–4 days)

- Reporting UI + reports collection
- Admin hide/unhide
- Rate limiting for sensitive endpoints

### 13.6 Launch checklist

- Environment variables set
- Basic SEO metadata
- Robots/sitemap (optional)
- Backup/export plan (manual for MVP)

---

## 14. Risks, Tradeoffs, and Open Decisions

### 14.1 Key Risks

- **₹0 claim risk:** phone OTP and uploads can incur costs.
- **Moderation overhead:** even small platforms attract spam.
- **AI safety:** generated content can be low quality or unsafe.

### 14.2 Tradeoffs (Intentional)

- MVP uses simple trending and search to stay free‑tier compatible.
- Procedural thumbnails reduce dependency on external storage.
- AI is optional and rate limited.

### 14.3 Open Decisions (To finalize during implementation)

- Thumbnail approach: URL‑only vs uploads
- Read tracking: cookie‑dedupe vs hashed TTL collection
- Story model: embedded chapters vs separate collection

---

## 15. Appendix: Environment Variables (Suggested)

- `MONGODB_URI`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AI_PROVIDER_API_KEY` (optional)

---

## 16. Conclusion

This SRS defines a realistic, production‑minded MVP that preserves the core product idea: a community platform for hand‑written and generated stories with discovery and engagement. It explicitly scopes costs, operational risk, and a solo‑developer execution path while leaving room to expand into phone OTP, richer discovery, interactive branching stories, and AI image generation in later phases.
