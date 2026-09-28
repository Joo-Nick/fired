import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('hit feedback has squash, shockwave, speed-line, and hit-stop primitives', () => {
  for (const marker of [
    '.boss-impact-s',
    '.boss-impact-m',
    '.boss-impact-l',
    '.impact-ring',
    '.impact-rays',
    'function hitStop(',
    'function impactFx(',
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('every hit tier runs the shared impact feedback before damage registration', () => {
  const onHit = html.slice(html.indexOf('function onHit('), html.indexOf('// 볼펜이 얼굴에'));

  assert.match(onHit, /impactFx\(hx, hy, tier, heavy\);/);
  assert.ok(onHit.indexOf('impactFx(hx, hy, tier, heavy);') < onHit.indexOf('registerHit(dmg);'));
});

test('reduced-motion users keep impact feedback without full-screen shake', () => {
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /\.shake-s, \.shake-m, \.shake-l/);
});

test('the shop and projectile use the same custom weapon assets', () => {
  assert.match(html, /asset: 'image\/weapons\/resignation-paper\.png'/);
  assert.match(html, /asset: 'image\/weapons\/dismissal-stamp\.png'/);
  assert.match(html, /<img class="weapon-icon" src="\$\{w\.asset\}"/);
  assert.match(html, /\$\('#weaponProjectile'\)\.src = w\.asset/);
});

test('boss victory routes through a three-choice run augment screen', () => {
  assert.match(html, /id="augmentChoices"/);
  assert.match(html, /sampleAugments\(\).*slice\(0, 3\)/s);
  assert.match(html, /openAugment\(nextBoss\)/);
  assert.match(html, /runBonuses = applyAugment\(runBonuses, augment\.id\)/);
});

test('the final company chairman routes to a persistent ending and new game plus', () => {
  assert.match(html, /id="endingOverlay"/);
  assert.match(html, /if \(isEnding\) setTimeout\(openEnding, 1900\)/);
  assert.match(html, /localStorage\.setItem\('gameClears', gameClears\)/);
  assert.match(html, /id="newGamePlus"/);
  assert.match(html, /목표 \$\{progress\.current\} \/ \$\{progress\.total\}/);
});

test('an unbeaten timed boss forces a rewarding permanent rebirth', () => {
  assert.match(html, /const BOSS_TIME_MS = 25_000/);
  assert.match(html, /remaining <= 0 && !rebirthTriggered\) failRebirth\(\)/);
  assert.match(html, /id="rebirthOverlay"/);
  assert.match(html, /localStorage\.setItem\('rebirthPower', rebirthPower\)/);
  assert.match(html, /runLevel = gainRunXp\(runLevel/);
});
