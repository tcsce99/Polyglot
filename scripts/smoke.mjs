#!/usr/bin/env node
// Browser smoke test: builds must exist (npm run build). Starts `vite preview`, drives the real app
// in headless Chromium through onboarding → lesson → placement → exam → reader, and checks RTL rendering.
//   npm run build && npm run smoke
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

// `playwright` may be installed globally (CI images) or locally (`npm i -D playwright`).
const { chromium } = createRequire(import.meta.url)('playwright');
const LANGS = (process.env.SMOKE_LANGS || 'spa,mlt,urd,pes').split(',');
const MIN_UNITS = Number(process.env.SMOKE_MIN_UNITS || 40);

const PORT = 4317, BASE = `http://localhost:${PORT}/#`;
const SHOTS = '.cache/shots';
mkdirSync(SHOTS, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const fail = (m) => { throw new Error(m); };
let browser, errors = [];

/** Answer whatever exercise is on screen (not necessarily correctly) until `done` text appears. */
async function playThrough(page, doneText, max = 200) {
  for (let i = 0; i < max; i++) {
    if (await page.getByText(doneText).first().isVisible().catch(() => false)) return i;
    const clicked = await page.evaluate(() => {
      const vis = (el) => el && el.offsetParent !== null && !el.disabled;
      const btn = (t) => [...document.querySelectorAll('button')].find((b) => vis(b) && b.textContent.trim() === t);
      for (const t of ['Continue', 'Good', 'Show answer', 'Can’t speak now', 'Skip task']) { const b = btn(t); if (b) { b.click(); return t; } }
      const opt = [...document.querySelectorAll('button.opt')].find(vis);
      if (opt) { opt.click(); return 'opt'; }
      const check = btn('Check');
      const input = document.querySelector('main input.input');
      if (input && vis(input)) return 'type';
      const tiles = [...document.querySelectorAll('main .flex.flex-wrap:not(.card) > button')].filter(vis);
      if (tiles.length) { tiles[0].click(); return 'tile'; }
      if (check) { check.click(); return 'check'; }
      return null;
    });
    if (clicked === 'type') { await page.locator('main input.input').fill('x'); await page.getByRole('button', { name: 'Check' }).click(); }
    await page.waitForTimeout(clicked ? 30 : 150);
  }
  fail(`never reached "${doneText}"`);
}

try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 200)); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));

  await page.goto(BASE + '/');
  for (const name of ['Maltese', 'Urdu', 'Persian', 'Spanish']) await page.getByText(name, { exact: false }).first().waitFor();
  await page.screenshot({ path: `${SHOTS}/home.png` });
  console.log('✓ home lists the four languages');

  for (const lang of LANGS) {
    await page.goto(`${BASE}/${lang}`);
    await page.getByRole('button', { name: /complete beginner/ }).click();
    await page.getByText('Working at').waitFor();
    const units = await page.locator('main [data-unit]').count();
    if (units < MIN_UNITS) fail(`${lang}: only ${units} lessons on the path (need ≥ ${MIN_UNITS})`);
    const locked = await page.getByText('Locked', { exact: true }).count();
    if (locked !== units - 1) fail(`${lang}: expected all but the first lesson locked, got ${locked}/${units}`);
    console.log(`✓ ${lang}: ${units} lessons, gated by mastery (${locked} locked)`);

    // lesson page + full lesson run
    await page.locator('main [data-unit]').first().click();
    await page.getByText('How it works').waitFor();
    await page.screenshot({ path: `${SHOTS}/${lang}-unit.png`, fullPage: true });
    await page.getByRole('link', { name: 'Start lesson' }).click();
    await playThrough(page, 'right on the first try');
    console.log(`✓ ${lang}: lesson runs to a score screen`);

    // quiet mode removes audio exercises from a session
    await page.goto(`${BASE}/${lang}`);
    await page.getByRole('switch').click();
    await page.getByRole('button', { name: 'Today’s session' }).click();
    await page.locator('main').getByText(/review ·/).waitFor();
    if (await page.getByText(/Say it aloud|Listen and choose/).count()) fail(`${lang}: audio exercise shown in quiet mode`);
    await playThrough(page, 'right on the first try');
    console.log(`✓ ${lang}: adaptive session completes in quiet mode`);
    await page.goto(`${BASE}/${lang}`);
    await page.getByRole('switch').click();

    // progress + reader + exams hub
    await page.goto(`${BASE}/${lang}/progress`);
    await page.getByText('Review forecast').waitFor();
    await page.screenshot({ path: `${SHOTS}/${lang}-progress.png`, fullPage: true });
    await page.goto(`${BASE}/${lang}/read`);
    await page.getByText('Sentence reading').waitFor();
    await page.goto(`${BASE}/${lang}/run/sentences`);
    await playThrough(page, 'right on the first try');
    await page.goto(`${BASE}/${lang}/tutor`);
    await page.getByText('Role-plays').waitFor();
    console.log(`✓ ${lang}: progress, reader and tutor screens render`);
  }

  // RTL: Urdu and Persian content must be right-to-left in the right font
  for (const [lang, font] of [['urd', 'Noto Nastaliq Urdu'], ['pes', 'Noto Naskh Arabic']].filter(([l]) => LANGS.includes(l))) {
    await page.goto(`${BASE}/${lang}`);
    await page.locator('main [data-unit]').first().click();
    const el = page.locator(`.tl-${lang}`).first();
    await el.waitFor();
    const info = await el.evaluate((e) => ({ dir: getComputedStyle(e).direction, font: getComputedStyle(e).fontFamily }));
    if (info.dir !== 'rtl' || !info.font.includes(font)) fail(`${lang}: RTL/font check failed ${JSON.stringify(info)}`);
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate((f) => document.fonts.check(`16px "${f}"`), font))) fail(`${lang}: font ${font} did not load`);
    console.log(`✓ ${lang}: right-to-left in ${font}`);
  }

  // placement test (fresh profile) and a level exam
  const fresh = await browser.newContext({ viewport: { width: 420, height: 860 } });
  const page2 = await fresh.newPage();
  page2.on('pageerror', (e) => errors.push(e.message)); page2.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page2.goto(`${BASE}/spa/placement`);
  await page2.getByRole('button', { name: 'I know the basics' }).click();
  await playThrough(page2, 'You place at');
  await page2.screenshot({ path: `${SHOTS}/placement.png` });
  console.log('✓ placement test reaches a result');
  await page2.goto(`${BASE}/spa/exam/A1`);
  await page2.getByRole('button', { name: 'Begin exam' }).click();
  await playThrough(page2, /Passed A1|Not passed yet/, 400);
  await page2.screenshot({ path: `${SHOTS}/exam.png`, fullPage: true });
  console.log('✓ level exam runs through all sections to a result');

  if (errors.length) fail('console errors:\n' + [...new Set(errors)].join('\n'));
  console.log('\nSmoke test passed.');
} catch (e) {
  console.error('\n✗ ' + e.message);
  if (typeof errors !== 'undefined') console.error(errors.join('\n'));
  try { const p = browser?.contexts().at(-1)?.pages()[0]; await p?.screenshot({ path: `${SHOTS}/failure.png` }); console.error((await p?.locator('body').innerText())?.slice(0, 600)); } catch { /* ignore */ }
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
