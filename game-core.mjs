const HIT_METER = [8, 15, 26];
const RUSH_DURATION_MS = 8_000;

export function advanceCombatFlow(state, hit) {
  const comboBonus = Math.min(Math.max(hit.combo, 0), 20) * 0.8;
  const heavyBonus = hit.heavy ? 4 : 0;
  const gain = (HIT_METER[hit.tier] + comboBonus + heavyBonus) * (hit.gainMultiplier ?? 1);
  const baseMeter = state.rushUntil > 0 && state.rushUntil <= hit.now ? 0 : state.meter;
  const meter = Math.min(100, Math.round(baseMeter + gain));
  const activated = meter >= 100 && state.rushUntil <= hit.now;

  return {
    meter,
    rushUntil: activated ? hit.now + RUSH_DURATION_MS + (hit.durationBonusMs ?? 0) : state.rushUntil,
    activated,
    active: activated || state.rushUntil > hit.now,
  };
}

export function readCombatFlow(state, now) {
  if (state.rushUntil > now) {
    const remainingMs = state.rushUntil - now;
    return {
      meter: Math.round((remainingMs / RUSH_DURATION_MS) * 100),
      active: true,
      remainingMs,
    };
  }

  return {
    meter: state.rushUntil > 0 ? 0 : state.meter,
    active: false,
    remainingMs: 0,
  };
}

export function getImpactProfile({ tier, heavy, rush }) {
  const level = tier === 2 ? 'l' : tier === 1 || heavy ? 'm' : 's';
  const profiles = {
    s: { freezeMs: 26, rays: 6, ringScale: 2.8 },
    m: { freezeMs: 44, rays: 10, ringScale: 3.6 },
    l: { freezeMs: 68, rays: 14, ringScale: 4.2 },
  };
  const profile = profiles[level];

  return {
    level,
    freezeMs: profile.freezeMs + (rush ? 10 : 0),
    rays: profile.rays + (rush ? 2 : 0),
    ringScale: profile.ringScale + (rush ? 0.2 : 0),
    chromatic: tier === 2 || rush,
  };
}

export function getRunBonuses() {
  return {
    damage: 1,
    critChance: 0,
    critDamage: 0,
    rushGain: 1,
    rushDurationMs: 0,
    reward: 1,
  };
}

const AUGMENT_CHANGES = {
  wrist: { damage: 0.2 },
  rage: { critChance: 0.06 },
  focus: { critDamage: 0.25 },
  overcharge: { rushGain: 0.25 },
  'fast-exit': { rushDurationMs: 2_000 },
  bonus: { reward: 0.5 },
};

export function applyAugment(bonuses, augmentId) {
  const changes = AUGMENT_CHANGES[augmentId];
  if (!changes) return { ...bonuses };

  const next = { ...bonuses };
  for (const [key, value] of Object.entries(changes)) {
    next[key] = Math.round((next[key] + value) * 100) / 100;
  }
  return next;
}

export function getCareerProgress({ company, rank, companyCount, rankCount, bossDefeated = false }) {
  const total = companyCount * rankCount;
  const current = company * rankCount + rank;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
    cleared: bossDefeated && company === companyCount - 1 && rank === rankCount,
  };
}

export function gainRunXp(state, amount) {
  let level = state.level;
  let xp = state.xp + amount;
  let levelsGained = 0;
  let nextXp = 25 + (level - 1) * 15;

  while (xp >= nextXp) {
    xp -= nextXp;
    level++;
    levelsGained++;
    nextXp = 25 + (level - 1) * 15;
  }

  return { level, xp, nextXp, levelsGained };
}

export function getRebirthReward({ company, rank }) {
  return Math.round((0.08 + rank * 0.02 + company * 0.05) * 100) / 100;
}
