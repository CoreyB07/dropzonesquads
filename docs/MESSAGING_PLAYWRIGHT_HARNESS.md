# Messaging Playwright Harness (One-Click)

This harness runs an end-to-end two-account messaging sync test using **Playwright** with **persistent browser profiles**.

## Added commands

From `client/`:

- One-time profile login setup:
  - `npm run test:messaging-setup`
- Full sync test:
  - `npm run test:messaging-sync`

## One-time setup

1. Run:
   - `npm run test:messaging-setup`
2. Two browser windows open with isolated profiles:
   - Account A profile: `~/browser-profiles/dzs-account-a`
   - Account B profile: `~/browser-profiles/dzs-account-b`
3. Log in manually:
   - A in first window
   - B in second window
4. Press Enter in terminal when both are logged in.

After this, both profiles remain logged in for future runs.

## Required env vars for sync test

Set these before running `npm run test:messaging-sync`:

- `ACCOUNT_A_USERNAME` → username of Account A (as seen by Account B)
- `ACCOUNT_B_USERNAME` → username of Account B (as seen by Account A)

Example:

```bash
export ACCOUNT_A_USERNAME="CoreyA"
export ACCOUNT_B_USERNAME="CoreyB"
npm run test:messaging-sync
```

## Optional env vars

- `MESSAGING_BASE_URL` (default: `https://www.dropzonesquads.com`)
- `DZS_PROFILE_A` (default: `~/browser-profiles/dzs-account-a`)
- `DZS_PROFILE_B` (default: `~/browser-profiles/dzs-account-b`)
- `CHROME_EXECUTABLE` (default: `/usr/bin/google-chrome-stable`)
- `HEADLESS=1` to run headless (default is headed)

### Optional auto-friend-check profile URLs
If you want the harness to attempt friend-request actions automatically before messaging:

- `PROFILE_URL_A_SEES_B` (Account A view of Account B profile URL)
- `PROFILE_URL_B_SEES_A` (Account B view of Account A profile URL)

If these are not set, friend/squad connectivity check is skipped and the test expects the conversation to already exist.

## What the test validates

1. Launch Account A and B with isolated profiles
2. Open `/messages` for both
3. Optional friend check (if profile URLs configured)
4. A sends message to B
5. B receives
6. B replies to A
7. A receives
8. Session independence (A/B local user IDs are different)

## Terminal output

Each step prints explicit PASS/FAIL plus a final summary block.
