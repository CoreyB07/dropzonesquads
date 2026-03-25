# DropZoneSquads Whole-Site Coherence Audit

_Date: 2026-03-25_

## Goal

Review the entire website as one product and decide what should be kept, simplified, removed, moved, or upgraded.

This audit is not just about visual polish. It is about making sure the website actually makes sense.

---

# 1. Homepage

## Overall read
The homepage is much better than it was, but it still contains a few elements that feel like remnants of earlier product directions rather than the cleanest version of the current one.

The good news: the homepage now feels more product-focused and less split between “marketing page” and “app.”

The next step is to remove anything that does not clearly help users browse squads faster.

## Keep
- Hero image and tightened hero structure
- Two main CTAs: **Find a Squad** and **Post a Squad**
- Filters near the top
- Unified squad list structure
- Short value block near the bottom

## Simplify
- Quick start section
- Filter presentation
- Section framing around browse/results
- Footer action links if needed

## Remove / reconsider
### Active filters stat in hero
**Recommendation: Remove**

Why:
- This is not a meaningful hero stat
- It changes based on local filter state, not product value
- It gives the top of the page a slightly artificial dashboard feel
- It does not help new users understand the product

### Featured picks stat in hero
**Recommendation: Remove**

Why:
- Featured concept has already been removed from the browsing experience
- Leaving “Featured picks” in the hero creates conceptual mismatch
- It refers to a product idea you have already decided against

### Open squads stat in hero
**Recommendation: Maybe keep, but only if real and useful**

Why:
- This can be a valid signal if it reflects real live availability
- If it becomes noisy or unreliable, remove hero stats entirely

### “How it works” text button inside hero
**Recommendation: Reconsider**

Why:
- Right now it routes to `/find`, not an actual “how it works” explanation
- That makes the label slightly misleading
- Better options:
  - rename it
  - remove it
  - or make it scroll to a simple explanation section

## Upgrade
### Quick start block
**Recommendation: Keep for now, but shrink further or collapse**

Why:
- It is useful for new users
- But it still adds homepage weight
- Better long-term versions:
  - collapsible
  - dismissible and hidden by default after first use
  - or shown only when profile/squad setup is incomplete

### Filters section
**Recommendation: simplify and integrate more tightly with results**

Why:
- The filter drawer itself is useful
- The extra framed filter section may still be slightly heavier than needed
- The active filter chips are useful only when actually filtering, but they should feel like part of browse results rather than their own major block

## Homepage action list
- [ ] Remove “Featured picks” hero stat
- [ ] Remove “Active filters” hero stat
- [ ] Decide whether to keep any hero stats at all
- [ ] Revisit the “How it works” CTA label/behavior
- [ ] Tighten quick start further or collapse it
- [ ] Consider reducing the visual weight of the filter shell

---

# 2. Navigation / Global Structure

## Overall read
Navigation is functional, but it still feels a little crowded and slightly over-instrumented.

There are too many app destinations competing at once, especially for a product that should feel quick and focused.

## Keep
- Brand identity at left
- Admin link for admins only
- Profile access
- Messages / Inbox access

## Simplify
### Messages + Inbox split
**Recommendation: Re-evaluate**

Why:
- Having both **Messages** and **Inbox** in nav may create confusion
- The distinction may make sense internally, but not necessarily for users
- If both remain, they need crystal-clear purpose separation

### Privacy link in main nav
**Recommendation: likely move out of primary nav**

Why:
- Privacy is important, but not a primary user workflow
- It probably belongs in footer or profile/settings area more than in top-level product nav

### My Squads
**Recommendation: keep, but verify necessity as a primary nav item**

Why:
- This is product-relevant
- But we should test whether it belongs in top nav or a profile/dashboard area

## Upgrade
### Mobile menu hierarchy
**Recommendation: simplify the mobile nav stack**

Why:
- Mobile nav should prioritize the most-used actions only
- Messages / profile / my squads / admin may be enough
- Privacy and secondary destinations can be demoted

## Global structure action list
- [ ] Decide whether Messages and Inbox should stay separate
- [ ] Move Privacy out of primary nav unless there is a strong reason to keep it
- [ ] Simplify mobile menu destination priority
- [ ] Recheck nav wording against actual user tasks

---

# 3. Squad Cards

## Overall read
The cards are in a much better place now.

They feel cleaner, more premium, and more scannable than before.

## Keep
- Unified card style
- Description-line approach instead of many pills
- Status pill focused on open/invite/closed
- Stronger action hierarchy

## Simplify
- Metadata line could still possibly be trimmed further with real data
- Some cards may not need both descriptor and secondary meta in all cases

## Remove / reconsider
- Any metadata that does not change decision-making
- Any repeated data that already appears elsewhere

## Upgrade
- Real-content audit once more live squads exist
- Decide whether some cards should show a short description from the actual post instead of only structured metadata

## Card action list
- [ ] Re-review cards once more real content exists
- [ ] Decide if the secondary meta line is always needed
- [ ] Test whether actual post descriptions should appear in card previews

---

# 4. Messaging

## Overall read
Messaging is cleaner now and much less panel-heavy.

It still needs one more round of product-level thinking, but it is moving in the right direction.

## Keep
- Cleaner thread/list structure
- Softer headers and states
- Better mobile thread height

## Simplify
- Make sure the page has one clear mental model
- Reduce any remaining duplicated concepts between messages/inbox if both stay

## Upgrade
- Re-test with live data and multiple conversations
- Confirm whether unread handling feels obvious
- Improve personality and warmth without losing clarity

## Messaging action list
- [ ] Re-test with live message data
- [ ] Audit whether Messages and Inbox should merge or stay separate
- [ ] Improve final polish on unread and empty states

---

# 5. Profile

## Overall read
The top profile section is now much better, but the lower profile sections still feel more dashboard-like than product-like.

## Keep
- Cleaner top summary area
- Compact stat row
- Better grouping of top profile identity

## Simplify
- Joined squads and account access panels can probably be softened further
- Some copy still sounds a little more system-oriented than user-oriented

## Upgrade
- Make profile feel more like “your identity in the product” and less like a settings report
- Re-group details into fewer major sections

## Profile action list
- [ ] Continue simplifying lower profile sections
- [ ] Reword system-heavy labels where needed
- [ ] Recheck how much detail is truly useful on first view

---

# 6. Admin

## Overall read
Admin is now useful, which is a big step forward.

It still needs refinement, but it has crossed the line from “concept” to “real tool.”

## Keep
- Squad moderation list
- Search
- Delete action
- Picture moderation queue
- Basic stats

## Simplify
- Admin wording can be less loud and more practical
- Some sections may need clearer hierarchy

## Upgrade
- Add quick filters for likely junk/demo/test squads
- Add sort controls
- Improve moderation feedback and perhaps bulk actions later

## Admin action list
- [ ] Add quick filters for junk/demo/test content
- [ ] Add sort options
- [ ] Improve moderation workflow speed
- [ ] Consider hide/archive later

---

# Highest-Priority Recommendations

## Immediate removes / changes
- [ ] Remove hero “Featured picks” stat
- [ ] Remove hero “Active filters” stat
- [ ] Reconsider hero “How it works” link label/behavior
- [ ] Reconsider whether Privacy belongs in top nav
- [ ] Re-evaluate Messages vs Inbox split

## Immediate simplifications
- [ ] Tighten or collapse quick start further
- [ ] Make filter presentation feel more directly tied to results
- [ ] Continue simplifying lower profile sections

## Immediate product questions
- [ ] What are the primary top-nav actions this product truly needs?
- [ ] Should the site have one messaging destination or two?
- [ ] Which homepage sections are essential versus legacy leftovers?

---

# Recommended Next Implementation Order

1. Homepage cleanup pass based on this audit
2. Navigation / information architecture cleanup
3. Profile lower-section cleanup
4. Messaging structure decision (Messages vs Inbox)
5. Admin quality-of-life upgrades

---

# Standard for Every Page

Every section should answer at least one of these:
- helps users understand the product
- helps users browse faster
- helps users act faster
- helps users manage their account/squads clearly
- builds trust without getting in the way

If it does not do one of those, it should probably be removed or simplified.
