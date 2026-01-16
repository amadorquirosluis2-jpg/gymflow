import { EXERCISES } from '../data/exercises';

function splitForDays(daysPerWeek) {
  if (daysPerWeek >= 6) {
    return [
      { name: 'Legs (Quad) + Shoulders', focus: ['quadriceps', 'shoulders'] },
      { name: 'Back + Triceps', focus: ['back', 'triceps'] },
      { name: 'Chest + Biceps', focus: ['chest', 'biceps'] },
      {
        name: 'Legs (Posterior) + Shoulders',
        focus: ['hamstrings', 'glutes', 'shoulders'],
      },
      { name: 'Back + Triceps', focus: ['back', 'triceps'] },
      { name: 'Chest + Biceps', focus: ['chest', 'biceps'] },
    ];
  }
  if (daysPerWeek === 5) {
    return [
      { name: 'Upper (Push)', focus: ['chest', 'shoulders', 'triceps'] },
      { name: 'Lower (Quad)', focus: ['quadriceps'] },
      { name: 'Upper (Pull)', focus: ['back', 'biceps'] },
      { name: 'Lower (Posterior)', focus: ['hamstrings', 'glutes'] },
      { name: 'Upper (Mixed)', focus: ['chest', 'back', 'shoulders'] },
    ];
  }
  if (daysPerWeek === 4) {
    return [
      { name: 'Upper', focus: ['chest', 'back', 'shoulders', 'arms'] },
      { name: 'Lower (Quad)', focus: ['quadriceps'] },
      { name: 'Upper (Alt)', focus: ['back', 'chest', 'shoulders', 'arms'] },
      { name: 'Lower (Posterior)', focus: ['hamstrings', 'glutes'] },
    ];
  }
  return [
    { name: 'Full Body A', focus: ['chest', 'back', 'quadriceps'] },
    { name: 'Full Body B', focus: ['back', 'shoulders', 'hamstrings'] },
    { name: 'Full Body C', focus: ['chest', 'quadriceps', 'glutes', 'arms'] },
  ];
}

function hasEquipment(exercise, userEquipment) {
  return exercise.equipment.every((req) => userEquipment.includes(req));
}

function expandFocus(focus) {
  return focus.flatMap((f) => (f === 'arms' ? ['biceps', 'triceps'] : [f]));
}

function prescriptionForGoal(goal, kind) {
  if (goal === 'strength') {
    if (kind === 'compound')
      return { sets: 5, repMin: 3, repMax: 6, rest: 180 };
    if (kind === 'accessory')
      return { sets: 3, repMin: 8, repMax: 12, rest: 90 };
    return { sets: 3, repMin: 10, repMax: 15, rest: 75 };
  }
  if (goal === 'fat_loss') {
    if (kind === 'compound')
      return { sets: 4, repMin: 6, repMax: 10, rest: 120 };
    if (kind === 'accessory')
      return { sets: 3, repMin: 10, repMax: 15, rest: 75 };
    return { sets: 3, repMin: 12, repMax: 20, rest: 60 };
  }
  // hypertrophy default
  if (kind === 'compound') return { sets: 4, repMin: 6, repMax: 10, rest: 120 };
  if (kind === 'accessory') return { sets: 3, repMin: 8, repMax: 12, rest: 90 };
  return { sets: 3, repMin: 10, repMax: 15, rest: 75 };
}

function maxExercisesForMinutes(minutes) {
  if (minutes <= 30) return 4;
  if (minutes <= 45) return 5;
  if (minutes <= 60) return 6;
  return 7;
}

function estimateSecondsForOneSet(ex, restSeconds) {
  const transition = 20; // caminar/cambiar peso, promedio
  return (ex.secondsPerSet || 40) + restSeconds + transition;
}

function choosePool(focus, equipment) {
  const f = expandFocus(focus);

  // Si NO hay equipo, solo usamos ejercicios con equipment: []
  if (!equipment || equipment.length === 0) {
    return EXERCISES.filter(
      (e) => f.includes(e.main) && (!e.equipment || e.equipment.length === 0)
    );
  }

  // Si hay equipo, usamos los que calcen con el set del usuario
  const pool = EXERCISES.filter((e) => f.includes(e.main));
  return pool.filter((e) => hasEquipment(e, equipment));
}

function sortPool(pool) {
  const rank = { compound: 1, accessory: 2, isolation: 3 };
  return [...pool].sort((a, b) => (rank[a.kind] || 9) - (rank[b.kind] || 9));
}

function upsertExercise(items, ex, addSets, repMin, repMax, rest) {
  const existing = items.find(
    (x) =>
      x.id === ex.id &&
      x.repMin === repMin &&
      x.repMax === repMax &&
      x.rest === rest
  );
  if (existing) {
    existing.sets += addSets;
    return items;
  }
  items.push({ ...ex, sets: addSets, repMin, repMax, rest });
  return items;
}

export function generateWeeklyPlan({
  goal,
  daysPerWeek,
  sessionMinutes,
  equipment,
}) {
  const split = splitForDays(daysPerWeek);
  const maxExercises = maxExercisesForMinutes(sessionMinutes);
  const maxSeconds = sessionMinutes * 60;

  return split.map((day, idx) => {
    const pool = sortPool(choosePool(day.focus, equipment));

    // Si no hay pool, devolvemos vacío (más adelante metemos bodyweight)
    if (pool.length === 0) {
      return { dayIndex: idx, name: day.name, totalSeconds: 0, items: [] };
    }

    const items = [];
    let secondsUsed = 0;

    // Seed: 2 compuestos si existen
    const compounds = pool.filter((x) => x.kind === 'compound').slice(0, 2);
    for (const ex of compounds) {
      const p = prescriptionForGoal(goal, ex.kind);
      // Añadimos sets 1 a 1 hasta que no quepa
      for (let s = 0; s < p.sets; s++) {
        const one = estimateSecondsForOneSet(ex, p.rest);
        if (secondsUsed + one > maxSeconds) break;
        upsertExercise(items, ex, 1, p.repMin, p.repMax, p.rest);
        secondsUsed += one;
      }
    }

    // Fill: alternar accesorios/aislamientos/otros hasta tiempo o máximo ejercicios
    let cursor = 0;
    while (secondsUsed < maxSeconds) {
      const ex = pool[cursor % pool.length];
      cursor += 1;

      const p = prescriptionForGoal(goal, ex.kind);
      const one = estimateSecondsForOneSet(ex, p.rest);

      if (secondsUsed + one > maxSeconds) break;

      // Respetar máximo de ejercicios, pero permitir sumar sets a los ya existentes
      const alreadyIn = items.some((x) => x.id === ex.id);
      if (!alreadyIn && items.length >= maxExercises) {
        // Si ya alcanzamos max ejercicios, solo sumamos sets a existentes
        continue;
      }

      upsertExercise(items, ex, 1, p.repMin, p.repMax, p.rest);
      secondsUsed += one;

      // Safety
      if (items.length > 12) break;
    }

    return {
      dayIndex: idx,
      name: day.name,
      totalSeconds: secondsUsed,
      items,
    };
  });
}
