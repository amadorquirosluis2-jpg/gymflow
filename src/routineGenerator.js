import { EXERCISES } from './data/exercises';

function hasEquipment(ex, userEq) {
  const req = ex.equipment || [];
  if (req.length === 0) return true;
  return req.every((r) => userEq.includes(r));
}

function preset(goal) {
  if (goal === 'strength') return { sets: 4, repMin: 4, repMax: 6, rest: 150 };
  if (goal === 'fat_loss') return { sets: 3, repMin: 10, repMax: 15, rest: 60 };
  return { sets: 3, repMin: 8, repMax: 12, rest: 90 };
}

function estimate(items) {
  let total = 0;
  for (const it of items) {
    total += (it.sets || 3) * ((it.repMax || 10) * 3 + (it.rest || 60));
  }
  return total;
}

function pickUnique(source, count, usedIds) {
  const out = [];
  for (const ex of source) {
    if (usedIds.has(ex.id)) continue;
    out.push(ex);
    usedIds.add(ex.id);
    if (out.length >= count) break;
  }
  return out;
}

export function generateWeeklyPlan({
  goal,
  daysPerWeek,
  sessionMinutes,
  equipmentProfile,
  equipment,
}) {
  const userEq =
    equipmentProfile === 'no_equipment' || equipmentProfile === 'none'
      ? []
      : equipment || [];
  const all = Array.isArray(EXERCISES) ? EXERCISES : [];

  const available =
    userEq.length === 0
      ? all.filter((e) => (e.equipment || []).length === 0)
      : all.filter((e) => hasEquipment(e, userEq));

  const p = preset(goal);
  const target = Math.max(20, sessionMinutes || 45) * 60;

  const splits = [
    { name: 'Pecho + Tríceps', mains: ['chest', 'triceps'] },
    { name: 'Espalda + Bíceps', mains: ['back', 'biceps'] },
    { name: 'Pierna', mains: ['quadriceps', 'hamstrings', 'glutes'] },
    { name: 'Hombros', mains: ['shoulders'] },
    { name: 'Full body', mains: ['full'] },
  ];

  const n = Math.max(1, Math.min(7, daysPerWeek || 3));
  const plan = [];

  for (let d = 0; d < n; d++) {
    const split = splits[d % splits.length];

    const used = new Set();
    let chosen = [];

    // intentamos 2 por grupo (hasta ~6)
    for (const m of split.mains) {
      const pool = available.filter((e) => e.main === m);
      chosen = chosen.concat(pickUnique(pool, 2, used));
      if (chosen.length >= 6) break;
    }

    // fallback si quedó vacío
    if (chosen.length === 0) chosen = available.slice(0, 6);
    if (chosen.length === 0) chosen = all.slice(0, 6);

    // items con sets/reps/rest
    let items = chosen.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: p.sets,
      repMin: p.repMin,
      repMax: p.repMax,
      rest: p.rest,
    }));

    // recortar si nos pasamos del target
    while (estimate(items) > target && items.length > 4) {
      items.pop();
    }

    plan.push({
      name: split.name,
      items,
      totalSeconds: estimate(items),
      isCustom: false,
    });
  }

  return plan;
}
