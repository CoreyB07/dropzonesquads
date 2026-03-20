#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';

const BASE_URL = process.env.MESSAGING_BASE_URL || 'https://www.dropzonesquads.com';
const PROFILE_A_DIR = process.env.DZS_PROFILE_A || path.join(os.homedir(), 'browser-profiles', 'dzs-account-a');
const PROFILE_B_DIR = process.env.DZS_PROFILE_B || path.join(os.homedir(), 'browser-profiles', 'dzs-account-b');
const CHROME_EXECUTABLE = process.env.CHROME_EXECUTABLE || '/usr/bin/google-chrome-stable';
const HEADLESS = process.env.HEADLESS === '1';
const TARGET_USERNAME_A_SEES = process.env.ACCOUNT_B_USERNAME || '';
const TARGET_USERNAME_B_SEES = process.env.ACCOUNT_A_USERNAME || '';
const PROFILE_URL_A_SEES_B = process.env.PROFILE_URL_A_SEES_B || '';
const PROFILE_URL_B_SEES_A = process.env.PROFILE_URL_B_SEES_A || '';

const stamp = Date.now();
const msgA = `A->B sync test ${stamp}`;
const msgB = `B->A ack ${stamp}`;

const results = [];

function step(name) {
  const state = { name, ok: false, detail: '' };
  results.push(state);
  return {
    pass(detail = 'ok') {
      state.ok = true;
      state.detail = detail;
      console.log(`✅ ${name}: ${detail}`);
    },
    fail(detail) {
      state.ok = false;
      state.detail = detail;
      console.log(`❌ ${name}: ${detail}`);
      throw new Error(`${name} failed: ${detail}`);
    }
  };
}

async function launchProfile(profileDir) {
  return chromium.launchPersistentContext(profileDir, {
    executablePath: CHROME_EXECUTABLE,
    headless: HEADLESS,
    viewport: { width: 1400, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check']
  });
}

async function getFirstPage(context) {
  const page = context.pages()[0] ?? await context.newPage();
  page.setDefaultTimeout(15000);
  return page;
}

async function openMessages(page) {
  await page.goto(`${BASE_URL}/messages`, { waitUntil: 'domcontentloaded' });
}

async function assertLoggedIn(page, label) {
  const locked = page.getByText(/sign in to access messages/i);
  if (await locked.first().isVisible().catch(() => false)) {
    throw new Error(`${label} is not logged in. Run: npm run test:messaging-setup`);
  }
}

async function openConversation(page, username, label) {
  if (!username) throw new Error(`${label}: missing target username env`);

  const search = page.getByPlaceholder(/search conversations/i);
  await search.fill('');
  await search.fill(username);

  const button = page.getByRole('button', { name: new RegExp(`open conversation with ${username}`, 'i') });
  if (!(await button.first().isVisible().catch(() => false))) {
    throw new Error(`${label}: conversation with ${username} not found`);
  }
  await button.first().click();
}

async function ensureFriendConnected(page, label, profileUrl) {
  if (!profileUrl) {
    return { attempted: false, changed: false };
  }

  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });

  const addBtn = page.getByRole('button', { name: /add friend/i });
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    return { attempted: true, changed: true };
  }

  const friendsLabel = page.getByText(/friends/i);
  if (await friendsLabel.first().isVisible().catch(() => false)) {
    return { attempted: true, changed: false };
  }

  const acceptBtn = page.getByRole('button', { name: /accept friend request/i });
  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click();
    return { attempted: true, changed: true };
  }

  return { attempted: true, changed: false };
}

async function sendMessage(page, text) {
  const input = page.getByPlaceholder(/type a message/i).first();
  await input.click();
  await input.fill(text);
  await page.getByRole('button', { name: /^send$/i }).first().click();
}

async function waitForText(page, text, timeout = 15000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

async function getLocalUserId(page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('warzone_hub_current_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || null;
    } catch {
      return null;
    }
  });
}

async function main() {
  let contextA;
  let contextB;
  try {
    const s1 = step('Launch Account A profile');
    contextA = await launchProfile(PROFILE_A_DIR);
    const pageA = await getFirstPage(contextA);
    await openMessages(pageA);
    await assertLoggedIn(pageA, 'Account A');
    s1.pass(PROFILE_A_DIR);

    const s2 = step('Launch Account B profile');
    contextB = await launchProfile(PROFILE_B_DIR);
    const pageB = await getFirstPage(contextB);
    await openMessages(pageB);
    await assertLoggedIn(pageB, 'Account B');
    s2.pass(PROFILE_B_DIR);

    const s3 = step('Pre-check connectivity (friend/squad path)');
    const aFriend = await ensureFriendConnected(pageA, 'Account A', PROFILE_URL_A_SEES_B);
    const bFriend = await ensureFriendConnected(pageB, 'Account B', PROFILE_URL_B_SEES_A);
    await openMessages(pageA);
    await openMessages(pageB);
    s3.pass(`A:${aFriend.attempted ? 'checked' : 'skipped'} B:${bFriend.attempted ? 'checked' : 'skipped'}`);

    const s4 = step('A sends message to B');
    await openConversation(pageA, TARGET_USERNAME_A_SEES, 'Account A');
    await sendMessage(pageA, msgA);
    await waitForText(pageA, msgA, 12000);
    s4.pass(msgA);

    const s5 = step('B receives A message');
    await openConversation(pageB, TARGET_USERNAME_B_SEES, 'Account B');
    await waitForText(pageB, msgA, 20000);
    s5.pass('message visible in B thread');

    const s6 = step('B replies to A');
    await sendMessage(pageB, msgB);
    await waitForText(pageB, msgB, 12000);
    s6.pass(msgB);

    const s7 = step('A receives B reply');
    await openConversation(pageA, TARGET_USERNAME_A_SEES, 'Account A');
    await waitForText(pageA, msgB, 20000);
    s7.pass('reply visible in A thread');

    const s8 = step('Session independence check');
    const idA = await getLocalUserId(pageA);
    const idB = await getLocalUserId(pageB);
    if (!idA || !idB) {
      s8.fail('Could not read local user IDs from localStorage');
    }
    if (idA === idB) {
      s8.fail(`Profiles not isolated (same user id: ${idA})`);
    }
    s8.pass(`isolated ids (${idA.slice(0, 8)} != ${idB.slice(0, 8)})`);

    console.log('\n=== Messaging Sync Test: PASS ===');
  } catch (error) {
    console.log(`\n=== Messaging Sync Test: FAIL ===\n${error.message}`);
    process.exitCode = 1;
  } finally {
    await contextA?.close().catch(() => {});
    await contextB?.close().catch(() => {});

    console.log('\nStep Summary:');
    for (const r of results) {
      console.log(`- ${r.ok ? 'PASS' : 'FAIL'} :: ${r.name} :: ${r.detail}`);
    }
  }
}

await main();
