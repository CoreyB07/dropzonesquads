# Drop Zone Squads — Homepage Cleanup + UX Polish Plan

## Rules for this work
- [ ] Keep dark tactical identity (no full rebrand)
- [ ] Prioritize squad-finding flow over everything else
- [ ] Remove prominent supporter/pricing sales framing from homepage
- [ ] Make changes in small phases (ship, verify, then continue)
- [ ] Review before each new phase starts

---

## Phase 0 — Baseline + safety (no visual changes)
- [ ] Snapshot current homepage sections/components (what exists now)
- [ ] Identify all homepage blocks to keep / reduce / remove / relocate
- [ ] Create branch + backup checkpoints
- [ ] Define acceptance checklist for desktop + mobile

**Done when:**
- We have a clear inventory and agreed scope before touching layout.

---

## Phase 1 — Information architecture cleanup (order + priorities)
- [x] Reorder homepage to target flow:
  1) Hero  
  2) Lightweight onboarding  
  3) Filters toolbar  
  4) Featured squads  
  5) All squads  
  6) Compact value/trust  
  7) Footer
- [x] Remove duplicate explanatory sections
- [x] Mark non-core sections for relocation (contact/support/long explainers)

**Done when:**
- Homepage follows the exact priority flow with no repeated sections.

---

## Phase 2 — Remove monetization-heavy framing (homepage only)
- [x] Remove supporter pricing cards/upgrade-heavy language from homepage
- [x] Remove large donation/support sales blocks
- [x] Keep only subtle support presence in footer (single link or one-liner)

**Footer support line (candidate):**
- “Drop Zone Squads is free to use. Optional donations help cover hosting and development.”

**Done when:**
- Homepage no longer feels sales-first.

---

## Phase 3 — Hero polish (keep what works, tighten copy/layout)
- [x] Keep dramatic hero image + dark overlay + 2 CTAs
- [x] Primary CTAs: **Find a Squad** / **Post a Squad**
- [x] Optional small text link: **How it works**
- [x] Tighten headline/subheadline for clarity and confidence
- [x] Reduce visual noise around hero text block

**Copy direction candidate:**
- Headline: **Find Your Warzone Squad**
- Subheadline: **Stop dropping with randoms. Find Warzone teammates that match your mode, vibe, and playstyle.**

**Done when:**
- Hero is cleaner, clearer, and still high-impact.

---

## Phase 4 — Onboarding redesign (lighter first-run experience)
- [x] Replace bulky checklist block with compact quick-start UI
- [x] Use either 3 mini cards or horizontal progress strip
- [x] Keep tasks:
  - Complete profile
  - Find a squad
  - Post your squad
- [x] Optional progress text: “Getting started: X of 3 complete”

**Done when:**
- Onboarding is helpful but no longer dominates the page.

---

## Phase 5 — Filters toolbar refinement
- [x] Move filters into a clean toolbar above squad browsing
- [x] Ensure compact desktop layout + clean mobile collapse
- [x] Validate key filters:
  - Mode
  - Playstyle
  - Platform
  - Mic/comms
  - Privacy/open status
  - Open spots
  - Sort
- [x] Improve scanability + reduce heavy container style

**Done when:**
- Filters feel integrated into browsing, not like a separate admin block.

---

## Phase 6 — Squad card hierarchy + featured polish
- [ ] Tone down always-on featured glow
- [ ] Keep featured “special” via subtle tint/border, stronger hover only
- [ ] Improve card information hierarchy:
  - Squad name
  - Mode/playstyle
  - Key tags
  - Member count
  - CTA row
- [ ] Reduce tag clutter (show essentials first, hide extras)
- [ ] Normalize CTA row spacing/alignment

**Done when:**
- Cards are faster to scan and feel more premium.

---

## Phase 7 — Value/trust consolidation + footer cleanup
- [ ] Replace repeated long explainers with one concise value/trust block
- [ ] Add 3–5 short benefits (no repetition, no defensive tone)
- [ ] Move contact to footer link or dedicated page
- [ ] Keep footer links clean: Contact / Privacy / Terms / Support

**Done when:**
- One concise trust section replaces multiple repetitive blocks.

---

## Phase 8 — Visual system polish pass
- [ ] Reduce heavy borders/boxed stacking
- [ ] Reduce persistent glow intensity globally
- [ ] Improve spacing rhythm (section gaps, card padding, text/button spacing)
- [ ] Improve typography hierarchy:
  - less all-caps for major headings
  - clearer title case hierarchy
  - softer helper text
- [ ] Keep palette disciplined (charcoal + white + muted gray + selective gold)

**Done when:**
- UI feels calmer, cleaner, and intentional without losing tactical identity.

---

## Phase 9 — Mobile QA + final cleanup
- [ ] Mobile hero readability + CTA tap comfort
- [ ] Onboarding remains compact on small screens
- [ ] Filters collapse cleanly
- [ ] Squad cards stack cleanly and remain scannable
- [ ] Remove leftover obsolete components/styles

**Done when:**
- Mobile remains clean, usable, and not overly tall.

---

## Ship strategy (to avoid doing too much at once)
- [ ] Ship in small PR-style chunks by phase
- [ ] After each phase:
  - [ ] quick visual check
  - [ ] responsiveness check
  - [ ] copy check
  - [ ] commit with clear message
- [ ] Pause for approval before next phase

---

## Suggested execution order (first 3 passes)
1. Phase 1 + 2 (structure + monetization cleanup)
2. Phase 3 + 4 + 5 (hero/onboarding/filters)
3. Phase 6 + 7 + 8 + 9 (cards/value/footer/polish/mobile)
