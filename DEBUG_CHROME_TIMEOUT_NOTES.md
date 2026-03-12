# Chrome Timeout Debug Notes

## Current reproducible symptom

In Chrome (regular/incognito at different times), user can appear signed in, but DB reads from Supabase PostgREST time out in diagnostics.

Sample diagnostics output provided by user:

- AUTH checks pass (context user present)
- PROFILE_S1 -> TIMEOUT (profiles lookup)
- INBOX_S1 -> TIMEOUT (conversation_participants lookup)
- INBOX_S3 -> TIMEOUT (notifications lookup)
- SQUAD_S1 -> TIMEOUT (squads read preflight)

This pattern strongly suggests browser-level connectivity/session handling issue to Supabase REST in Chrome context (not a single table/RLS error), because multiple unrelated table reads all timeout.

## Confirmed backend fix already made

Squad creation FK failure root cause was fixed by changing `ensure_squad_conversation` trigger to AFTER INSERT in Supabase SQL (user confirmed this resolved FK violation for listing creation).

## Tooling added

- `/diag` page now includes deterministic checks with per-step timeouts.
- `/diag` now includes:
  - `NET_S1` Supabase REST probe
  - auth context checks
  - table read checks
- `/diag` can now export diagnostics to markdown:
  - Copy Report (.md)
  - Download Report (.md)

## Next debugging move (if timeouts persist)

1. Run `/diag` in Firefox and Chrome back-to-back.
2. Compare `NET_S1` between browsers:
   - if NET_S1 fails in Chrome but passes in Firefox => network/extension/privacy setting issue in Chrome.
3. If NET_S1 passes but table checks timeout only in Chrome:
   - inspect Chrome extensions/privacy settings
   - test with fresh Chrome profile
   - verify no service worker/cache interference
4. Keep this doc updated with exact step outputs.
