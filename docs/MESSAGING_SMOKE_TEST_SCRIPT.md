# Messaging Smoke Test Script (Operator Quick Version)

## Setup
- Open two browsers (or normal + incognito)
- Sign in as User A and User B
- Navigate both to `/messages`

## Script
1. **A → B message test**
   - A sends: `smoke test from A <timestamp>`
   - Expected: B sees message quickly in active thread or after opening thread

2. **B reply test**
   - B replies: `reply from B <timestamp>`
   - Expected: A receives reply and thread updates

3. **Unread state test**
   - Leave thread unopened on one side, send a message from the other
   - Expected: unread indicator appears in conversation list
   - Open thread
   - Expected: unread indicator clears

4. **Search/filter test**
   - Search for target username in conversation list
   - Toggle unread-only
   - Expected: list filters correctly and restores properly

5. **Pagination test**
   - Open a conversation with older history
   - Click `Load older messages`
   - Expected: older messages prepend above existing list

6. **Presence test**
   - Keep one account active and focused
   - Expected: status shows Online
   - Leave one account inactive for >3 minutes
   - Expected: status flips to Last seen

7. **Attachment guardrail test**
   - Attach allowed file under 2MB (e.g. `.txt`)
   - Expected: accepted and shown in composer label
   - Try blocked type/oversize file
   - Expected: clear error shown, file rejected

## Pass Criteria
- No blocking errors
- Core DM flow works end-to-end
- No obvious UI break on mobile viewport

## Fail Criteria
- Message send fails repeatedly
- Thread fails to load
- Unread/read state broken
- Presence never updates

If fail: stop release and use rollback plan in `MESSAGING_RELEASE_RUNBOOK.md`.
