import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceCombatFlow,
  applyAugment,
  getImpactProfile,
  getCareerProgress,
  gainRunXp,
  getRebirthReward,
  getRunBonuses,
  readCombatFlow,
} from '../game-core.mjs';

test('a solid fifth combo hit meaningfully builds the rush meter', () => {
  const next = advanceCombatFlow(
    { meter: 20, rushUntil: 0 },
    { now: 1_000, tier: 1, combo: 5, heavy: false },
  );

  assert.deepEqual(next, {
    meter: 39,
    rushUntil: 0,
    activated: false,
    active: false,
  });
});

test('filling the meter activates an eight-second rush window', () => {
  const next = advanceCombatFlow(
    { meter: 91, rushUntil: 0 },
    { now: 5_000, tier: 2, combo: 8, heavy: true },
  );

  assert.deepEqual(next, {
    meter: 100,
    rushUntil: 13_000,
    activated: true,
    active: true,
  });
});

test('rush progress drains with time and resets when the window ends', () => {
  const state = { meter: 100, rushUntil: 13_000 };

  assert.deepEqual(readCombatFlow(state, 9_000), {
    meter: 50,
    active: true,
    remainingMs: 4_000,
  });
  assert.deepEqual(readCombatFlow(state, 13_001), {
    meter: 0,
    active: false,
    remainingMs: 0,
  });
});

test('a critical heavy weapon gets the strongest readable impact profile', () => {
  assert.deepEqual(getImpactProfile({ tier: 2, heavy: true, rush: true }), {
    level: 'l',
    freezeMs: 78,
    rays: 16,
    ringScale: 4.4,
    chromatic: true,
  });
});

test('run augments stack into visible damage and reward growth', () => {
  let bonuses = getRunBonuses();
  bonuses = applyAugment(bonuses, 'wrist');
  bonuses = applyAugment(bonuses, 'wrist');
  bonuses = applyAugment(bonuses, 'bonus');

  assert.deepEqual(bonuses, {
    damage: 1.4,
    critChance: 0,
    critDamage: 0,
    rushGain: 1,
    rushDurationMs: 0,
    reward: 1.5,
  });
});

test('rush augments improve both meter gain and active duration', () => {
  let bonuses = getRunBonuses();
  bonuses = applyAugment(bonuses, 'overcharge');
  bonuses = applyAugment(bonuses, 'fast-exit');

  assert.equal(bonuses.rushGain, 1.25);
  assert.equal(bonuses.rushDurationMs, 2_000);
});

test('combat flow consumes augment modifiers when the rush starts', () => {
  const result = advanceCombatFlow(
    { meter: 80, rushUntil: 0 },
    { tier: 1, combo: 4, heavy: true, now: 5_000, gainMultiplier: 1.25, durationBonusMs: 2_000 },
  );

  assert.equal(result.activated, true);
  assert.equal(result.rushUntil, 15_000);
});

test('the first hit after an expired rush starts a fresh meter', () => {
  const result = advanceCombatFlow(
    { meter: 100, rushUntil: 9_000 },
    { tier: 0, combo: 1, heavy: false, now: 10_000 },
  );

  assert.equal(result.activated, false);
  assert.equal(result.meter, 9);
});

test('career progress exposes a finite 65-boss goal and ending', () => {
  assert.deepEqual(getCareerProgress({ company: 0, rank: 1, companyCount: 5, rankCount: 13 }), {
    current: 1,
    total: 65,
    percent: 2,
    cleared: false,
  });

  assert.equal(getCareerProgress({
    company: 4,
    rank: 13,
    companyCount: 5,
    rankCount: 13,
    bossDefeated: true,
  }).cleared, true);
});

test('combat xp levels the current run and carries overflow xp', () => {
  assert.deepEqual(gainRunXp({ level: 1, xp: 22 }, 8), {
    level: 2,
    xp: 5,
    nextXp: 40,
    levelsGained: 1,
  });
});

test('a failed boss grants a meaningful permanent rebirth boost', () => {
  assert.equal(getRebirthReward({ company: 0, rank: 1 }), 0.1);
  assert.equal(getRebirthReward({ company: 2, rank: 8 }), 0.34);
});
