import { EXERCISES } from '../data/exercises';

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function preset(goal) {
  if (goal === 'strength') return { sets: 4, repMin: 4, repMax: 6, rest: 150 };
  if (goal === 'fat_loss') return { sets: 3, repMin: 10, repMax: 15, rest: 60 };
  return { sets: 3, repMin: 8, repMax: 12, rest: 90 };
}

function normalizeTraining({ goal, trainingDefaults }) {
  const p = preset(goal);

  const td =
    trainingDefaults && typeof trainingDefaults === 'object'
      ? trainingDefaults
      : null;

  const sets = td?.sets != null ? clampInt(td.sets, 1, 10) : p.sets;
  const repMin = td?.repMin != null ? clampInt(td.repMin, 1, 50) : p.repMin;
  const repMax =
    td?.repMax != null ? clampInt(td.repMax, repMin, 60) : p.repMax;
  const rest = td?.rest != null ? clampInt(td.rest, 0, 600) : p.rest;

  return { sets, repMin, repMax, rest };
}

function estimate(items) {
  let total = 0;
  for (const it of safeArray(items)) {
    total += (it.sets || 3) * ((it.repMax || 10) * 3 + (it.rest || 60));
  }
  return total;
}

function hasEquipment(ex, userEq) {
  const req = safeArray(ex?.equipment);
  if (req.length === 0) return true;
  return req.every((r) => userEq.includes(r));
}

function pickUnique(source, count, usedIds) {
  const out = [];
  for (const ex of safeArray(source)) {
    if (!ex?.id) continue;
    if (usedIds.has(ex.id)) continue;
    out.push(ex);
    usedIds.add(ex.id);
    if (out.length >= count) break;
  }
  return out;
}

export function buildWeeklyPlan({
  goal,
  daysPerWeek,
  sessionMinutes,
  equipmentProfile,
  equipment,
  trainingDefaults,
}) {
  const n = Math.max(1, Math.min(7, Number(daysPerWeek) || 3));
  const target = Math.max(20, Number(sessionMinutes) || 45) * 60;

  const noEq =
    equipmentProfile === 'none' || equipmentProfile === 'no_equipment';
  const userEq = noEq ? [] : safeArray(equipment);

  const all = safeArray(EXERCISES);

  const available =
    userEq.length === 0
      ? all.filter((e) => safeArray(e.equipment).length === 0)
      : all.filter((e) => hasEquipment(e, userEq));

  const t = normalizeTraining({ goal, trainingDefaults });

  const splits = [
    { name: 'Pecho + Tríceps', mains: ['chest', 'triceps'] },
    { name: 'Espalda + Bíceps', mains: ['back', 'biceps'] },
    { name: 'Pierna', mains: ['quadriceps', 'hamstrings', 'glutes'] },
    { name: 'Hombros', mains: ['shoulders'] },
    { name: 'Full body', mains: ['full'] },
  ];

  const plan = [];

  for (let d = 0; d < n; d++) {
    const split = splits[d % splits.length];
    const used = new Set();
    let chosen = [];

    for (const m of safeArray(split.mains)) {
      const pool = available.filter((e) => e?.main === m);
      chosen = chosen.concat(pickUnique(pool, 2, used));
      if (chosen.length >= 6) break;
    }

    if (chosen.length === 0) chosen = available.slice(0, 6);
    if (chosen.length === 0) chosen = all.slice(0, 6);

    let items = chosen.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: t.sets,
      repMin: t.repMin,
      repMax: t.repMax,
      rest: t.rest,
    }));

    while (estimate(items) > target && items.length > 4) items.pop();

    plan.push({
      name: split.name,
      items,
      totalSeconds: estimate(items),
      isCustom: false,
    });
  }

  return plan;
}
