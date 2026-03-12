# DropZoneSquads Component Inventory

_Last updated: 2026-03-12_

Purpose: track reusable UI pieces, where they are used, and what to reuse before creating new components.

---

## 1) Core Layout Components

### `Navbar.jsx`
**Purpose:** Global top navigation and primary app routing entry points.  
**Used in:** `App.jsx`

---

## 2) Squad Discovery & Application Components

### `SquadCard.jsx`
**Purpose:** Main squad listing card (supports standard/featured styling patterns).  
**Used in:** `pages/Home.jsx`, `pages/FindSquad.jsx`

### `SkeletonCard.jsx`
**Purpose:** Loading placeholder for squad list/card surfaces.  
**Used in:** `pages/Home.jsx`, `pages/FindSquad.jsx`

### `FilterDrawer.jsx`
**Purpose:** Filter controls for squad discovery/listing views.  
**Used in:** `pages/Home.jsx`, `pages/FindSquad.jsx`

### `ApplyModal.jsx`
**Purpose:** Modal flow for applying to join a squad.  
**Used in:** `pages/Home.jsx`, `pages/FindSquad.jsx`, `pages/SquadProfile.jsx`

---

## 3) Identity / Badge Components

### `SupporterBadge.jsx`
**Purpose:** Visual badge for supporter users in chat/profile/inbox contexts.  
**Used in:**
- `pages/UserProfile.jsx`
- `pages/DirectMessage.jsx`
- `pages/SquadProfile.jsx`
- `pages/SquadChat.jsx`
- `pages/Inbox.jsx`
- `pages/MySquads.jsx`

### `SquadNameText.jsx`
**Purpose:** Consistent styled squad name rendering (including accent treatment).  
**Used in:**
- `pages/UserProfile.jsx`
- `pages/SquadProfile.jsx`
- `pages/SquadChat.jsx`
- `pages/Profile.jsx`
- `pages/Inbox.jsx`
- `pages/MySquads.jsx`

---

## 4) Context Providers / Shared State

### `context/AuthContext.jsx`
**Purpose:** Auth session/user state + app-level auth actions + squad application state/actions.

### `context/MySquadsContext.jsx`
**Purpose:** Current user squad memberships, role visibility, squad-related derived state.

### `context/ToastContext.jsx` + `context/useToast.js`
**Purpose:** Unified success/error toast messaging.

---

## 5) Shared Utility Modules (UI-impacting)

### `utils/squadsApi.js`
**Purpose:** Squad CRUD, normalization, and creation/update behavior.

### `utils/squadMembersApi.js`
**Purpose:** Squad membership querying/updating and user-squad association helpers.

### `utils/mailState.js`
**Purpose:** Local read-state tracking helpers for inbox/direct/squad message unread logic.

### `utils/supabase.js`
**Purpose:** Supabase client setup and resilience behavior for API calls.

---

## 6) Reuse Rules (Before You Add a New Component)

Before creating a new component:

1. Check this file for an existing fit.
2. If similar UI exists, extend that component first.
3. Keep naming aligned with existing conventions (`*Card`, `*Modal`, `*Badge`, `*Drawer`).
4. Update this inventory in the same PR whenever:
   - a component is added,
   - a component is removed,
   - usage locations change materially.

---

## 7) Maintenance Notes

- Run a quick import scan periodically to catch unused components.
- Keep this in sync with `docs/UI_STYLE_GUIDE.md`.
- If a component becomes page-specific and single-use, consider inlining it to reduce abstraction noise.
- 2026-03-12: Removed unused `JoinModal.jsx` after inventory audit.
