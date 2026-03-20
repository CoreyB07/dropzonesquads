#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const BASE_URL = process.env.MESSAGING_BASE_URL || 'https://www.dropzonesquads.com';
const PROFILE_A_DIR = process.env.DZS_PROFILE_A || path.join(os.homedir(), 'browser-profiles', 'dzs-account-a');
const PROFILE_B_DIR = process.env.DZS_PROFILE_B || path.join(os.homedir(), 'browser-profiles', 'dzs-account-b');
const CHROME_EXECUTABLE = process.env.CHROME_EXECUTABLE || '/usr/bin/google-chrome-stable';

async function launch(profileDir) {
  return chromium.launchPersistentContext(profileDir, {
    executablePath: CHROME_EXECUTABLE,
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check']
  });
}

let ctxA;
let ctxB;

try {
  console.log('Opening two persistent browser profiles for one-time login...');
  console.log(`A profile: ${PROFILE_A_DIR}`);
  console.log(`B profile: ${PROFILE_B_DIR}`);

  ctxA = await launch(PROFILE_A_DIR);
  ctxB = await launch(PROFILE_B_DIR);

  const pageA = ctxA.pages()[0] ?? await ctxA.newPage();
  const pageB = ctxB.pages()[0] ?? await ctxB.newPage();

  await Promise.all([
    pageA.goto(`${BASE_URL}/messages`, { waitUntil: 'domcontentloaded' }),
    pageB.goto(`${BASE_URL}/messages`, { waitUntil: 'domcontentloaded' })
  ]);

  console.log('\nManual step now:');
  console.log('- Log into Account A in the A profile window');
  console.log('- Log into Account B in the B profile window');
  console.log('- Make sure each reaches /messages');

  const rl = readline.createInterface({ input, output });
  await rl.question('\nPress Enter here when both profiles are logged in... ');
  rl.close();

  console.log('Saved. You can now run: npm run test:messaging-sync');
} finally {
  await ctxA?.close().catch(() => {});
  await ctxB?.close().catch(() => {});
}
