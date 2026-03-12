# DropZoneSquads UI Style Guide

_Last updated: 2026-03-12_

This is the source-of-truth for visual + copy consistency.
When shipping UI work, update this file in the same PR.

---

## 1) Core Design Tokens

### Brand Colors

Defined in `client/src/index.css` (`@theme`):

- `--color-charcoal-dark`: `#050505` (main app background)
- `--color-charcoal-light`: `#141414` (cards, panels)
- `--color-military-gray`: `#2A2A2A` (borders, dividers)
- `--color-tactical-yellow`: `#d97706` (primary action)
- `--color-tactical-yellow-hover`: `#e48a12` (primary hover)
- `--color-accent-gold`: `#b45309` (secondary accent)

Premium/supporter accents:

- `--color-premium-gold`: `#b7791f`
- `--color-premium-gold-muted`: `#8b5a18`
- `--color-premium-gold-bright`: `#d4a14a`
- `--color-premium-gold-soft`: `#f3d89a`

### Typography

- Primary font: `Inter` (`--font-tactical`)
- Tone: tactical/uppercase-heavy for labels, readable sentence case for body copy

### Radius / Borders / Shadow Pattern

- Standard radius: `rounded-lg` / `rounded-xl`
- Border baseline: `border-military-gray`
- Primary elevation: subtle dark shadow, avoid bright drop shadows except premium cards

---

## 2) Shared Component Rules

### Buttons

Primary (`.btn-tactical`):
- Background: tactical yellow
- Text: high-contrast
- Uppercase, bold, tracked
- Hover: `tactical-yellow-hover`

Secondary:
- `bg-charcoal-dark` + `border-military-gray`
- Use for cancel/back/navigation

Danger:
- red tint + red border
- Use only for destructive actions (delete, reject)

Disabled:
- `disabled:opacity-40..50`
- No hover effects that imply clickability

### Inputs / Select / Textarea

- Background: `charcoal-dark`
- Border: `military-gray`
- Focus border: `tactical-yellow`
- Text: white, placeholder gray

### Cards / Panels

- Use `.card-tactical` for default panels
- Keep spacing predictable (`p-4`/`p-6`, `space-y-*`)
- Use specialized card styles only for standard/featured squad cards

### Badges / Status

- Supporter visuals use `text-premium-glow`
- Squad name special style uses `text-squad-name`
- Unread indicators use red dot + optional count pill
- Reusable alert/status utility classes:
  - `alert-error`, `alert-error-title`, `alert-error-body`
  - `alert-success`
  - `status-pill`

---

## 3) Messaging & Copy Style

### Voice

- Clear, direct, action-oriented
- Tactical flavor is okay; never at expense of clarity
- Prefer short labels over novelty text in critical flows

### UI Text Conventions

- Section headers: concise + uppercase style acceptable
- Buttons: verb-first (`Accept`, `Reject`, `Review and Confirm`)
- Errors: `Could not <action>.` + debug code when available

### Notification Copy

Use actor + action + target pattern:
- `kristencopeland07 requested to join FDG`
- `Your join request was accepted for FDG`

---

## 4) Page Pattern Notes

### Inbox

- Sections: Squad Comms, Notifications, Direct Messages
- Notification cards are actionable and should route to relevant screen
- Unread state must be visually obvious

### Direct Message / Squad Chat

- Header with context + back navigation
- Message bubbles: own messages = tactical yellow; others = dark bubble
- Timestamp + sender line above bubble
- On failure: show debug payload panel in non-prod-safe format (no secrets)

### Manage Squad

- Two concern zones:
  1. Join Requests (accept/reject)
  2. Member Roles (staged updates)
- Changes should confirm before save
- Destructive actions isolated and visually distinct

### Diagnostics

- Deterministic check blocks
- Export-friendly markdown report
- Mark expected noise clearly (e.g. unauth 401 reachability)

---

## 5) Implementation Safety Rules (Current Backend Reality)

Because schema-cache relationship resolution has been flaky, **prefer two-step fetches over relational embeds**:

1. Query primary table rows
2. Collect IDs
3. Query related table
4. Join in client

Do this especially for:
- `messages -> profiles`
- `squad_members -> profiles`
- `squad_members -> squads`
- `squad_applications -> profiles`

---

## 6) Small-Step Consistency Plan (Execution Order)

1. **Token lock** (this file + `index.css`) ✅
2. **Button audit** (ensure primary/secondary/danger consistency)
3. **Form audit** (focus, errors, disabled behavior)
4. **Message surfaces audit** (Inbox/DM/Squad Chat wording + states)
5. **Error surface standardization** (toast + optional debug panel format)
6. **Component extraction pass** (if repeated blocks >2 places)
7. **Pre-ship checklist adoption** (below)

---

## 7) Pre-Ship UI Checklist

Before merging UI changes:

- [ ] Uses existing tokens (no random one-off colors)
- [ ] Button hierarchy is clear (primary vs secondary vs danger)
- [ ] Empty/loading/error states exist
- [ ] Error copy is human-readable and specific
- [ ] Mobile layout still usable
- [ ] New wording matches app voice
- [ ] This style guide updated if a pattern changed

---

## 8) Change Log

- **2026-03-12**: Initial guide created from live app styles and current architecture constraints.
