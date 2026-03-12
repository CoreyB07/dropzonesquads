# DropZoneSquads Project Memory

_Last updated: 2026-03-12_

Purpose: persistent handoff/context file so future sessions can recover fast.

---

## 1) Core Stack & Runtime

- Frontend: React + Vite
- Styling: Tailwind v4-style `@theme`/`@layer` in `client/src/index.css`
- Backend: Supabase (`imdkaqhnnmgzgiykmxnz.supabase.co`)
- Hosting: GitHub Pages + custom domain (`www.dropzonesquads.com`)

---

## 2) Environment Conventions

Primary env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Backward-compatible aliases currently supported in code:
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_SUPABASE_ANON_KEY`

Supabase URL fallback is hardcoded to:
- `https://imdkaqhnnmgzgiykmxnz.supabase.co`

---

## 3) Important Known Behaviors (Not Bugs)

- Direct `GET /diag` may log `404` in console on GitHub Pages SPA routing.
- Diagnostics `NET_S1` can show `401` and still be PASS (expected unauth reachability probe).

---

## 4) Major Fixes Already Implemented

### Auth/Transport Stability
- Split Supabase usage into auth-safe and data-safe flows to reduce Chrome auth/session hangs.
- Added resilient fetch wrapper (timeout + retry for network/abort classes).

### Schema-Cache / Relation Embed Hardening
- Replaced fragile PostgREST relation embeds with two-step fetch joins in client code where needed:
  - squad applications
  - squad members
  - direct messages
  - squad chat
  - user squads membership flow

### Squad Management Flow
- Manage Squad now includes join request handling UI (Accept/Reject).
- Accept flow upserts accepted applicant into `squad_members`.

### Diagnostics UX
- Added markdown export and copy reliability improvements.
- Added authenticated ping (`NET_S2`) for clearer auth-vs-query diagnosis.
- Added clearer labels for expected 401/404 noise.

---

## 5) Design System Docs

- `docs/UI_STYLE_GUIDE.md` (tokens, copy rules, consistency process)
- `docs/COMPONENT_INVENTORY.md` (component map, usage references)

Reusable utility classes added:
- `alert-error`, `alert-error-title`, `alert-error-body`
- `alert-success`
- `status-pill`

---

## 6) Current Architecture Rule (Critical)

When data relationships are needed, prefer:
1. Primary table query
2. Collect IDs
3. Secondary query for related records
4. Client-side map/join

Avoid relying on relation embed paths unless FK schema-cache behavior is confirmed stable.

---

## 7) Useful Debug Signals

- `PGRST200`: usually relation/embed path mismatch in schema cache
- `401` on app table reads: often missing/invalid auth token at request time
- Repeating 400 spam on `messages?...profiles:sender_id(...)`: indicates stale build or leftover embed path

---

## 8) What Future Sessions Should Ask Before Big Changes

1. Which branch/environment is currently production?
2. Any pending Supabase migrations not yet documented?
3. Any intentional relation embeds you want kept (for performance simplicity)?
4. Preferred copy tone changes (if evolving from tactical style)?
5. Do you want strict design-token enforcement (lint/checklist in CI)?

---

## 9) Open Follow-Ups (Optional)

- Add automated grep/lint check preventing reintroduction of risky relation embeds.
- Add `docs/ERROR_CODES.md` mapping common Supabase/PostgREST errors to actions.
- Add a small release checklist for cache bust + post-deploy smoke test paths (`/`, `/inbox`, `/diag`, `/squad/:id/manage`).
