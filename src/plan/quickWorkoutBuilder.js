import { EXERCISES } from '../data/exercises';

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function clampInt(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback ?? min;
  const r = Math.round(x);
  return Math.max(min, Math.min(max, r));
}

function normalizeDefaults(goal, defaults) {
  // Si vienen defaults del usuario, los respetamos (clamp + orden)
  if (defaults && typeof defaults === 'object') {
    const sets = clampInt(defaults.sets, 1, 12, 3);
    let repMin = clampInt(defaults.repMin, 1, 100, 8);
    let repMax = clampInt(defaults.repMax, 1, 100, 12);
    const rest = clampInt(defaults.rest, 0, 600, 90);

    if (repMin > repMax) {
      const tmp = repMin;
      repMin = repMax;
      repMax = tmp;
    }

    return { sets, repMin, repMax, rest };
  }

  // Si NO vienen defaults, usamos preset por goal
  if (goal === 'strength') return { sets: 4, repMin: 4, repMax: 6, rest: 150 };
  if (goal === 'fat_loss') return { sets: 3, repMin: 10, repMax: 15, rest: 60 };
  return { sets: 3, repMin: 8, repMax: 12, rest: 90 };
}

function hasEquipment(ex, userEq) {
  const req = safeArray(ex?.equipment);
  if (req.length === 0) return true;
  return req.every((r) => userEq.includes(r));
}

function estimateExerciseSeconds(item) {
  const sets = Number(item?.sets) || 3;
  const repMax = Number(item?.repMax) || 10;
  const rest = Number(item?.rest) || 60;
  return sets * (repMax * 3 + rest);
}

function estimateTotalSeconds(items) {
  return safeArray(items).reduce(
    (acc, it) => acc + estimateExerciseSeconds(it),
    0
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const x of safeArray(arr)) {
    const v = String(x || '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

export function buildQuickWorkout({
  goal,
  sessionMinutes,
  equipmentProfile,
  equipment,
  mains, // array de músculos elegidos (multi)
  defaults, // { sets, repMin, repMax, rest } opcional
}) {
  const all = safeArray(EXERCISES);

  const minutes = clampInt(sessionMinutes, 15, 180, 30);
  const targetSeconds = minutes * 60;

  const userEq =
    equipmentProfile === 'none' || equipmentProfile === 'no_equipment'
      ? []
      : safeArray(equipment);

  // Filtrar por equipo
  const available =
    userEq.length === 0
      ? all.filter((e) => safeArray(e.equipment).length === 0)
      : all.filter((e) => hasEquipment(e, userEq));

  // Mains elegidos
  const chosenMains = uniqStrings(mains);
  const pools =
    chosenMains.length > 0
      ? chosenMains.map((m) => ({
          main: m,
          list:
            m === 'full' ? available : available.filter((e) => e.main === m),
        }))
      : [{ main: 'full', list: available }];

  // Defaults finales (usuario o preset por goal)
  const d = normalizeDefaults(goal || 'hypertrophy', defaults);

  // Targets de cantidad
  const MIN_EX = 4;
  const MAX_EX = 12;

  const used = new Set();
  const chosen = [];

  // 1) Intento balanceado: 2 ejercicios por cada main seleccionado
  for (const p of pools) {
    const pool = shuffle(p.list);
    let taken = 0;

    for (const ex of pool) {
      if (!ex?.id) continue;
      if (used.has(ex.id)) continue;

      chosen.push(ex);
      used.add(ex.id);
      taken += 1;

      if (taken >= 2) break;
      if (chosen.length >= MAX_EX) break;
    }

    if (chosen.length >= MAX_EX) break;
  }

  // 2) Completar si faltan mínimos
  if (chosen.length < MIN_EX) {
    const fallback = shuffle(available);
    for (const ex of fallback) {
      if (!ex?.id) continue;
      if (used.has(ex.id)) continue;

      chosen.push(ex);
      used.add(ex.id);

      if (chosen.length >= MIN_EX) break;
      if (chosen.length >= MAX_EX) break;
    }
  }

  // 3) Ultra-fallback si el catálogo/equipo deja vacío
  const finalChosen = chosen.length ? chosen : all.slice(0, MIN_EX);

  // Construir items
  let items = finalChosen.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets: d.sets,
    repMin: d.repMin,
    repMax: d.repMax,
    rest: d.rest,
  }));

  // Ajustar por tiempo: recortar si nos pasamos
  while (estimateTotalSeconds(items) > targetSeconds && items.length > MIN_EX) {
    items.pop();
  }

  // Rellenar si queda corto (hasta ~115% del target)
  if (estimateTotalSeconds(items) < targetSeconds * 0.75) {
    const extras = shuffle(available).filter((e) => e?.id && !used.has(e.id));

    for (const ex of extras) {
      if (items.length >= MAX_EX) break;

      const next = [
        ...items,
        {
          id: ex.id,
          name: ex.name,
          sets: d.sets,
          repMin: d.repMin,
          repMax: d.repMax,
          rest: d.rest,
        },
      ];

      if (estimateTotalSeconds(next) <= targetSeconds * 1.15) {
        items = next;
        used.add(ex.id);
      }

      if (estimateTotalSeconds(items) >= targetSeconds * 0.9) break;
    }
  }

  return {
    name: 'Entreno rápido',
    items,
    totalSeconds: estimateTotalSeconds(items),
    isCustom: true,
  };
}
